'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../relational/track.module.css';

// ── KV store (Redis simulator) ────────────────────────────────
// Module-level so state persists across topic navigation (same pattern as SqlPlayground)
const kvStore: Record<string, { type: string; value: any; expiresAt: number | null }> = {};
const docStore: Record<string, any[]> = {};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLive(e: { expiresAt: number | null } | undefined): boolean {
  return !!e && !(e.expiresAt && Date.now() > e.expiresAt);
}

function ensure(key: string, type: string, init: any) {
  if (!kvStore[key]) kvStore[key] = { type, value: init, expiresAt: null };
  return kvStore[key];
}

function execOne(cmd: string, args: string[]): string {
  switch (cmd) {
    case 'SET': {
      const key = args[0], value = args[1];
      const rest = args.slice(2);
      let nx = false, xx = false, exSeconds: number | null = null;
      for (let i = 0; i < rest.length; i++) {
        const tok = rest[i].toUpperCase();
        if (tok === 'NX') nx = true;
        else if (tok === 'XX') xx = true;
        else if (tok === 'EX') { exSeconds = parseInt(rest[i + 1], 10); i++; }
      }
      const exists = isLive(kvStore[key]);
      if (nx && exists) return '(nil)';
      if (xx && !exists) return '(nil)';
      kvStore[key] = { type: 'string', value, expiresAt: exSeconds ? Date.now() + exSeconds * 1000 : null };
      return 'OK';
    }
    case 'GET': {
      const e = kvStore[args[0]];
      if (!isLive(e)) return '(nil)';
      return JSON.stringify(e.value);
    }
    case 'DEL': {
      const existed = !!kvStore[args[0]];
      delete kvStore[args[0]];
      return existed ? '(integer) 1' : '(integer) 0';
    }
    case 'EXISTS':
      return '(integer) ' + (isLive(kvStore[args[0]]) ? 1 : 0);
    case 'EXPIRE': {
      if (kvStore[args[0]]) {
        kvStore[args[0]].expiresAt = Date.now() + parseInt(args[1], 10) * 1000;
        return '(integer) 1';
      }
      return '(integer) 0';
    }
    case 'TTL': {
      const e = kvStore[args[0]];
      if (!e) return '(integer) -2';
      if (!e.expiresAt) return '(integer) -1';
      return '(integer) ' + Math.max(0, Math.round((e.expiresAt - Date.now()) / 1000));
    }
    case 'INCR': case 'INCRBY': case 'DECR': case 'DECRBY': {
      const key = args[0];
      if (!kvStore[key]) kvStore[key] = { type: 'string', value: '0', expiresAt: null };
      const cur = parseInt(kvStore[key].value, 10) || 0;
      let delta = 1;
      if (cmd === 'INCRBY') delta = parseInt(args[1], 10);
      if (cmd === 'DECR') delta = -1;
      if (cmd === 'DECRBY') delta = -parseInt(args[1], 10);
      const next = cur + delta;
      kvStore[key].value = String(next);
      return '(integer) ' + next;
    }
    case 'KEYS': {
      const pattern = args[0] || '*';
      const regex = new RegExp('^' + pattern.split('*').map(escapeRegex).join('.*') + '$');
      return JSON.stringify(Object.keys(kvStore).filter(k => regex.test(k) && isLive(kvStore[k])));
    }
    case 'HSET': {
      const e = ensure(args[0], 'hash', {});
      e.value[args[1]] = args[2];
      return '(integer) 1';
    }
    case 'HGET': {
      const e = kvStore[args[0]];
      return (e && e.value && e.value[args[1]] !== undefined) ? JSON.stringify(e.value[args[1]]) : '(nil)';
    }
    case 'HGETALL': {
      const e = kvStore[args[0]];
      return e ? JSON.stringify(e.value, null, 2) : '(nil)';
    }
    case 'LPUSH': case 'RPUSH': {
      const e = ensure(args[0], 'list', []);
      args.slice(1).forEach(v => cmd === 'LPUSH' ? e.value.unshift(v) : e.value.push(v));
      return '(integer) ' + e.value.length;
    }
    case 'LRANGE': {
      const e = kvStore[args[0]];
      if (!e) return '(empty list)';
      let start = parseInt(args[1], 10), stop = parseInt(args[2], 10);
      if (stop === -1) stop = e.value.length - 1;
      return JSON.stringify(e.value.slice(start, stop + 1));
    }
    case 'SADD': {
      const e = ensure(args[0], 'set', []);
      let added = 0;
      args.slice(1).forEach(v => { if (!e.value.includes(v)) { e.value.push(v); added++; } });
      return '(integer) ' + added;
    }
    case 'SMEMBERS': {
      const e = kvStore[args[0]];
      return e ? JSON.stringify(e.value) : '(empty set)';
    }
    case 'ZADD': {
      const e = ensure(args[0], 'zset', []);
      const score = parseFloat(args[1]), member = args[2];
      const idx = e.value.findIndex((m: any) => m.member === member);
      if (idx >= 0) e.value.splice(idx, 1);
      e.value.push({ score, member });
      e.value.sort((a: any, b: any) => a.score - b.score);
      return '(integer) 1';
    }
    case 'ZRANGE': {
      const e = kvStore[args[0]];
      if (!e) return '(empty set)';
      let start = parseInt(args[1], 10), stop = parseInt(args[2], 10);
      if (stop === -1) stop = e.value.length - 1;
      return JSON.stringify(e.value.slice(start, stop + 1).map((m: any) => m.member));
    }
    default:
      return `(error) unknown or unsupported command in this simulator: ${cmd}`;
  }
}

function runKv(commands: string): string {
  const lines = commands.split('\n').map(l => l.trim()).filter(Boolean);
  const out: string[] = [];
  let txQueue: { cmd: string; args: string[] }[] | null = null;

  lines.forEach(line => {
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = (parts[0] || '').toUpperCase();
    const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));

    if (cmd === 'MULTI') { txQueue = []; out.push('OK'); return; }
    if (cmd === 'EXEC') {
      if (txQueue === null) { out.push('(error) EXEC without MULTI'); return; }
      const results = txQueue.map(q => execOne(q.cmd, q.args));
      out.push(results.map((r, i) => `${i + 1}) ${r}`).join('\n'));
      txQueue = null;
      return;
    }
    if (txQueue !== null) { txQueue.push({ cmd, args }); out.push('QUEUED'); return; }
    out.push(execOne(cmd, args));
  });
  return out.join('\n');
}

// ── Doc store (MongoDB simulator) ─────────────────────────────
function parseObj(str: string): any {
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + str + ')')();
}

function splitTopLevelArgs(str: string): string[] {
  let depth = 0, current = '', inStr = false, strChar = '';
  const args: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inStr) {
      current += c;
      if (c === strChar && str[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strChar = c; current += c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    if (c === '}' || c === ']' || c === ')') depth--;
    if (c === ',' && depth === 0) { args.push(current); current = ''; continue; }
    current += c;
  }
  if (current.trim()) args.push(current);
  return args.map(s => s.trim());
}

function matchFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (filter.$or) return filter.$or.some((f: any) => matchFilter(doc, f));
  if (filter.$and) return filter.$and.every((f: any) => matchFilter(doc, f));
  if (filter.$nor) return !filter.$nor.some((f: any) => matchFilter(doc, f));
  return Object.keys(filter).every(key => {
    if (key === '$or' || key === '$and' || key === '$nor') return true;
    const cond = filter[key];
    const docVal = doc[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      return Object.keys(cond).every(op => {
        const opVal = cond[op];
        switch (op) {
          case '$eq':  return docVal === opVal;
          case '$ne':  return docVal !== opVal;
          case '$gt':  return docVal > opVal;
          case '$gte': return docVal >= opVal;
          case '$lt':  return docVal < opVal;
          case '$lte': return docVal <= opVal;
          case '$in':  return opVal.includes(docVal);
          case '$nin': return !opVal.includes(docVal);
          case '$exists': return opVal ? (docVal !== undefined) : (docVal === undefined);
          default: return true;
        }
      });
    }
    return docVal === cond;
  });
}

function applyUpdate(doc: any, update: any) {
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$unset) Object.keys(update.$unset).forEach(k => delete doc[k]);
  if (update.$inc) Object.keys(update.$inc).forEach(k => { doc[k] = (doc[k] || 0) + update.$inc[k]; });
  if (update.$push) Object.keys(update.$push).forEach(k => {
    doc[k] = doc[k] || [];
    const val = update.$push[k];
    if (val && val.$each) doc[k].push(...val.$each);
    else doc[k].push(val);
  });
  if (update.$pull) Object.keys(update.$pull).forEach(k => {
    doc[k] = (doc[k] || []).filter((v: any) => v !== update.$pull[k]);
  });
  if (update.$addToSet) Object.keys(update.$addToSet).forEach(k => {
    doc[k] = doc[k] || [];
    if (!doc[k].includes(update.$addToSet[k])) doc[k].push(update.$addToSet[k]);
  });
}

function runAggregate(initialData: any[], pipeline: any[]): any[] {
  let data = initialData.slice();
  pipeline.forEach(stage => {
    if (stage.$match) {
      data = data.filter(doc => matchFilter(doc, stage.$match));
    } else if (stage.$group) {
      const g = stage.$group;
      const groups: Record<string, any> = {};
      data.forEach(doc => {
        const key = typeof g._id === 'string' && g._id.startsWith('$') ? doc[g._id.slice(1)] : g._id;
        const k = JSON.stringify(key);
        if (!groups[k]) groups[k] = { _id: key, __docs: [] };
        groups[k].__docs.push(doc);
      });
      Object.keys(g).forEach(field => {
        if (field === '_id') return;
        const acc = g[field];
        Object.values(groups).forEach((grp: any) => {
          if (acc.$sum !== undefined) {
            if (acc.$sum === 1) {
              grp[field] = grp.__docs.length;
            } else {
              const f = String(acc.$sum).startsWith('$') ? acc.$sum.slice(1) : null;
              grp[field] = grp.__docs.reduce((s: number, d: any) => s + (f ? (Number(d[f]) || 0) : 0), 0);
            }
          } else if (acc.$avg !== undefined) {
            const f = String(acc.$avg).startsWith('$') ? acc.$avg.slice(1) : null;
            const vals = grp.__docs.map((d: any) => f ? Number(d[f]) || 0 : 0);
            grp[field] = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
          }
        });
      });
      data = Object.values(groups).map(({ __docs, ...rest }: any) => rest);
    } else if (stage.$sort) {
      const keys = Object.keys(stage.$sort);
      data.sort((a, b) => {
        for (const k of keys) {
          const dir = stage.$sort[k];
          if (a[k] < b[k]) return -1 * dir;
          if (a[k] > b[k]) return 1 * dir;
        }
        return 0;
      });
    } else if (stage.$limit) {
      data = data.slice(0, stage.$limit);
    }
  });
  return data;
}

function runDoc(commands: string): string {
  const lines = commands.split('\n').map(l => l.trim()).filter(Boolean);
  const out: string[] = [];
  lines.forEach(line => {
    try {
      const findChain = line.match(/^db\.(\w+)\.find\((.*?)\)(?:\s*\.sort\((.*?)\))?(?:\s*\.limit\((\d+)\))?$/);
      if (findChain && /^db\.\w+\.find\(/.test(line)) {
        const coll = findChain[1];
        const filter = findChain[2].trim() ? parseObj(findChain[2]) : {};
        let results = (docStore[coll] || []).filter(d => matchFilter(d, filter));
        if (findChain[3]) {
          const sortSpec = parseObj(findChain[3]);
          const keys = Object.keys(sortSpec);
          results = results.slice().sort((a, b) => {
            for (const k of keys) { const dir = sortSpec[k]; if (a[k] < b[k]) return -1 * dir; if (a[k] > b[k]) return 1 * dir; }
            return 0;
          });
        }
        if (findChain[4]) results = results.slice(0, parseInt(findChain[4], 10));
        out.push(JSON.stringify(results, null, 2));
        return;
      }

      const callMatch = line.match(/^db\.(\w+)\.(\w+)\((.*)\)$/);
      if (!callMatch) { out.push(`(error) unsupported in this simulator: ${line}`); return; }
      const coll = callMatch[1], method = callMatch[2], argsStr = callMatch[3];
      const args = argsStr.trim() ? splitTopLevelArgs(argsStr).map(a => parseObj(a)) : [];
      docStore[coll] = docStore[coll] || [];

      if (method === 'insertOne') {
        docStore[coll].push(args[0]);
        out.push(`Inserted 1 document into "${coll}"`);
      } else if (method === 'insertMany') {
        args[0].forEach((d: any) => docStore[coll].push(d));
        out.push(`Inserted ${args[0].length} documents into "${coll}"`);
      } else if (method === 'aggregate') {
        out.push(JSON.stringify(runAggregate(docStore[coll], args[0]), null, 2));
      } else if (method === 'updateOne' || method === 'updateMany') {
        const filter = args[0] || {}, update = args[1] || {}, options = args[2] || {};
        let matched = docStore[coll].filter((d: any) => matchFilter(d, filter));
        if (method === 'updateOne') matched = matched.slice(0, 1);
        matched.forEach((doc: any) => applyUpdate(doc, update));
        let upsertedCount = 0;
        if (matched.length === 0 && options.upsert) {
          const newDoc = Object.assign({}, filter);
          applyUpdate(newDoc, update);
          docStore[coll].push(newDoc);
          upsertedCount = 1;
        }
        out.push(JSON.stringify({ matchedCount: matched.length, modifiedCount: matched.length, upsertedCount }));
      } else if (method === 'deleteOne' || method === 'deleteMany') {
        const filter = args[0] || {};
        let toDelete = docStore[coll].filter((d: any) => matchFilter(d, filter));
        if (method === 'deleteOne') toDelete = toDelete.slice(0, 1);
        docStore[coll] = docStore[coll].filter((d: any) => !toDelete.includes(d));
        out.push(JSON.stringify({ deletedCount: toDelete.length }));
      } else {
        out.push(`(error) unsupported method in this simulator: ${method}`);
      }
    } catch (e: any) {
      out.push(`(error) ${e.message}`);
    }
  });
  return out.join('\n');
}

// ── Component ─────────────────────────────────────────────────
interface Props {
  topicId: string;
  type: 'kv' | 'doc';
  preset: string;
}

export default function NrelPlayground({ topicId, type, preset }: Props) {
  const [input, setInput] = useState(preset);
  const [output, setOutput] = useState('Output will appear here.');
  const [running, setRunning] = useState(false);
  const prevTopicRef = useRef(topicId);

  useEffect(() => {
    if (prevTopicRef.current !== topicId) {
      setInput(preset);
      setOutput('Output will appear here.');
      prevTopicRef.current = topicId;
    }
  }, [topicId, preset]);

  function run() {
    setRunning(true);
    try {
      const result = type === 'kv' ? runKv(input) : runDoc(input);
      setOutput(result || '(empty)');
    } catch (e: any) {
      setOutput('(error) ' + e.message);
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setInput(preset);
    setOutput('Output will appear here.');
  }

  const engineName = type === 'kv' ? 'kv-sim' : 'doc-sim';
  const hint = 'Simulated console — not a real Redis/Mongo instance. State persists across lessons — reload to reset all.';

  return (
    <div className={styles.playground}>
      <div className={styles.playgroundHead}>
        <div className={styles.ptitle}>
          <span className={styles.pdot} />
          {engineName}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.runbtn} onClick={reset} disabled={running} aria-label="Reset playground to preset">
            Reset
          </button>
          <button className={styles.runbtn} onClick={run} disabled={running} aria-label="Run command">
            {running ? 'running…' : 'Run ▸'}
          </button>
        </div>
      </div>
      <textarea
        className={styles.pgInput}
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={Math.max(3, input.split('\n').length + 1)}
        spellCheck={false}
      />
      <div className={styles.pgOutput}>{output}</div>
      <div className={styles.pgHint}>{hint}</div>
    </div>
  );
}
