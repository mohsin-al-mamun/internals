'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './track.module.css';

// Module-level singletons — shared across all SQL playgrounds in the session
let _SQL: any = null;
let _db: any = null;

async function ensureDb(seedSql: string): Promise<any> {
  if (_db) return _db;

  if (!_SQL) {
    if (!(window as any).initSqlJs) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load sql.js'));
        document.head.appendChild(script);
      });
    }
    _SQL = await (window as any).initSqlJs({
      locateFile: (file: string) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`,
    });
  }

  _db = new _SQL.Database();
  _db.run(seedSql);
  return _db;
}

interface Props {
  preset: string;
  seedSql: string;
  topicId: string;
}

export default function SqlPlayground({ preset, seedSql, topicId }: Props) {
  const [sql, setSql] = useState(preset);
  const [output, setOutput] = useState('Output will appear here.');
  const [running, setRunning] = useState(false);
  // Reset textarea when topic changes
  const prevTopicRef = useRef(topicId);

  useEffect(() => {
    if (prevTopicRef.current !== topicId) {
      setSql(preset);
      setOutput('Output will appear here.');
      prevTopicRef.current = topicId;
    }
  }, [topicId, preset]);

  async function run() {
    setRunning(true);
    setOutput('running…');
    try {
      const db = await ensureDb(seedSql);
      const res: any[] = db.exec(sql);
      if (res.length === 0) {
        setOutput('Query ran. (No rows returned — likely an UPDATE/INSERT/DELETE/CREATE.)');
        return;
      }
      const { columns, values } = res[res.length - 1];
      let table =
        '<table><tr>' +
        columns.map((c: string) => `<th>${c}</th>`).join('') +
        '</tr>';
      values.forEach((row: any[]) => {
        table +=
          '<tr>' +
          row.map((v: any) => `<td>${v === null ? 'NULL' : v}</td>`).join('') +
          '</tr>';
      });
      table += '</table>';
      setOutput(table);
    } catch (e: any) {
      setOutput('Error: ' + e.message);
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setSql(preset);
    setOutput('Output will appear here.');
  }

  return (
    <div className={styles.playground}>
      <div className={styles.playgroundHead}>
        <div className={styles.ptitle}>
          <span className={styles.pdot} />
          sqlite (wasm)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.runbtn} onClick={reset} disabled={running} aria-label="Reset playground to preset">
            Reset
          </button>
          <button className={styles.runbtn} onClick={run} disabled={running} aria-label="Run SQL query">
            {running ? 'running…' : 'Run ▸'}
          </button>
        </div>
      </div>
      <textarea
        className={styles.pgInput}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={Math.max(3, sql.split('\n').length + 1)}
        spellCheck={false}
      />
      <div
        className={styles.pgOutput}
        dangerouslySetInnerHTML={{ __html: output }}
      />
      <div className={styles.pgHint}>
        Runs in a real SQLite engine, seeded with a small example schema.
      </div>
    </div>
  );
}
