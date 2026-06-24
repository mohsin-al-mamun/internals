'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  NREL_TOPICS,
  NREL_TIERS,
  NREL_REDIS_COMPOSE_YML,
  NREL_MONGO_COMPOSE_YML,
  NREL_REDIS_COMMANDS,
  NREL_MONGO_COMMANDS,
  type NrelTopic,
  type Tier,
} from './data';
import NrelPlayground from './NrelPlayground';
import styles from '../relational/track.module.css';
import { markComplete, getCompleted } from '../lib/progress';
import ContentBody from '../components/ContentBody';

const TRACK_COLOR = '#38d39b';
const TRACK_DIM   = '#38d39b33';

const MOST_USED_SECTIONS = [
  {
    label: 'Redis — strings',
    commands: [
      { cmd: 'SET key value',           desc: 'set a string value' },
      { cmd: 'SET key value EX 3600',   desc: 'set with TTL (seconds)' },
      { cmd: 'GET key',                 desc: 'retrieve a value' },
      { cmd: 'INCR counter',            desc: 'atomic increment by 1' },
      { cmd: 'INCRBY counter 5',        desc: 'atomic increment by N' },
      { cmd: 'MSET k1 v1 k2 v2',       desc: 'set multiple keys at once' },
      { cmd: 'MGET k1 k2',             desc: 'get multiple keys at once' },
    ],
  },
  {
    label: 'Redis — hashes',
    commands: [
      { cmd: 'HSET user:1 name Alice age 30', desc: 'set multiple hash fields' },
      { cmd: 'HGET user:1 name',              desc: 'get one field' },
      { cmd: 'HGETALL user:1',               desc: 'get all fields and values' },
      { cmd: 'HDEL user:1 age',              desc: 'delete a field' },
      { cmd: 'HEXISTS user:1 email',         desc: 'check if field exists' },
    ],
  },
  {
    label: 'Redis — lists & sets',
    commands: [
      { cmd: 'LPUSH queue job1 job2',    desc: 'push to head of list' },
      { cmd: 'RPUSH queue job1 job2',    desc: 'push to tail of list' },
      { cmd: 'LPOP queue',              desc: 'pop from head' },
      { cmd: 'BRPOP queue 0',           desc: 'blocking pop (0 = wait forever)' },
      { cmd: 'LRANGE queue 0 -1',       desc: 'list all elements' },
      { cmd: 'SADD tags:post:1 redis nosql', desc: 'add to a set' },
      { cmd: 'SMEMBERS tags:post:1',    desc: 'all set members' },
      { cmd: 'SISMEMBER tags:post:1 redis', desc: 'check membership' },
    ],
  },
  {
    label: 'Redis — sorted sets & key ops',
    commands: [
      { cmd: 'ZADD leaderboard 1500 alice', desc: 'add member with score' },
      { cmd: 'ZREVRANGE leaderboard 0 9 WITHSCORES', desc: 'top 10 by score (desc)' },
      { cmd: 'ZRANK leaderboard alice',     desc: 'rank of a member (0-indexed)' },
      { cmd: 'EXPIRE key 60',              desc: 'set TTL in seconds' },
      { cmd: 'TTL key',                    desc: 'remaining TTL (-1 = no expiry, -2 = gone)' },
      { cmd: 'DEL key1 key2',              desc: 'delete keys' },
      { cmd: 'KEYS pattern*',              desc: 'find keys (avoid in production — use SCAN)' },
      { cmd: 'SCAN 0 MATCH user:* COUNT 100', desc: 'safe incremental key scan' },
    ],
  },
  {
    label: 'MongoDB — CRUD',
    commands: [
      { cmd: 'db.users.insertOne({ name: "Alice", age: 30 })',       desc: 'insert one document' },
      { cmd: 'db.users.insertMany([{ … }, { … }])',                  desc: 'insert multiple documents' },
      { cmd: 'db.users.find({ age: { $gt: 25 } })',                  desc: 'query with filter' },
      { cmd: 'db.users.find({}).sort({ age: -1 }).limit(10)',         desc: 'sort desc, limit 10' },
      { cmd: 'db.users.findOne({ email: "a@x.com" })',               desc: 'first matching doc' },
      { cmd: 'db.users.updateOne({ _id: id }, { $set: { age: 31 } })', desc: 'update one field' },
      { cmd: 'db.users.updateMany({ active: false }, { $unset: { token: "" } })', desc: 'bulk update' },
      { cmd: 'db.users.deleteOne({ _id: id })',                      desc: 'delete one document' },
      { cmd: 'db.users.deleteMany({ createdAt: { $lt: cutoff } })',  desc: 'bulk delete' },
    ],
  },
  {
    label: 'MongoDB — query operators',
    commands: [
      { cmd: '{ age: { $gt: 18, $lt: 65 } }',      desc: 'range (gt, lt, gte, lte)' },
      { cmd: '{ status: { $in: ["active","trial"] } }', desc: 'match any in list' },
      { cmd: '{ email: { $exists: true } }',         desc: 'field must exist' },
      { cmd: '{ tags: "admin" }',                    desc: 'array contains value' },
      { cmd: '{ $or: [ { a: 1 }, { b: 2 } ] }',    desc: 'logical OR' },
      { cmd: '{ name: /^alice/i }',                  desc: 'regex match' },
    ],
  },
  {
    label: 'MongoDB — aggregation pipeline',
    commands: [
      { cmd: 'db.orders.aggregate([ { $match: { status: "paid" } } ])', desc: '$match — filter docs' },
      { cmd: '{ $group: { _id: "$userId", total: { $sum: "$amount" } } }', desc: '$group — group and sum' },
      { cmd: '{ $sort: { total: -1 } }',                                 desc: '$sort — order results' },
      { cmd: '{ $limit: 10 }',                                           desc: '$limit — cap results' },
      { cmd: '{ $project: { name: 1, email: 1, _id: 0 } }',             desc: '$project — select fields' },
      { cmd: '{ $lookup: { from: "items", localField: "itemId", foreignField: "_id", as: "item" } }', desc: '$lookup — join another collection' },
    ],
  },
  {
    label: 'MongoDB — indexes & admin',
    commands: [
      { cmd: 'db.users.createIndex({ email: 1 }, { unique: true })',  desc: 'unique index on field' },
      { cmd: 'db.users.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })', desc: 'TTL index (auto-delete)' },
      { cmd: 'db.users.getIndexes()',                                  desc: 'list all indexes' },
      { cmd: 'db.users.explain("executionStats").find({ … })',         desc: 'query plan with timings' },
      { cmd: 'db.users.countDocuments({ active: true })',              desc: 'count matching docs' },
      { cmd: 'show dbs',                                               desc: 'list all databases (mongosh)' },
      { cmd: 'use mydb',                                               desc: 'switch database (mongosh)' },
      { cmd: 'db.dropCollection("users")',                             desc: 'delete a collection' },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState('Copy');
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setLabel('Copied!');
      setTimeout(() => setLabel('Copy'), 1500);
    });
  }
  return (
    <button className={styles.copybtn} onClick={copy}>
      {label}
    </button>
  );
}

function MostUsedView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        REFERENCE · MONGODB / REDIS
      </div>
      <h1 className={styles.contentTitle}>Most used commands</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text)' }}>
        Redis and MongoDB commands you'll reach for every session. Scan, copy, go.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {MOST_USED_SECTIONS.map(section => (
          <div key={section.label}>
            <h3 className={styles.setupSectionTitle}>{section.label}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.commands.map(({ cmd, desc }) => (
                <div
                  key={cmd}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                    gap: '8px 24px',
                    alignItems: 'baseline',
                    padding: '7px 12px',
                    borderRadius: 6,
                    background: 'var(--surface-1)',
                    borderLeft: '2px solid var(--track-color)',
                  }}
                >
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--heading)', whiteSpace: 'pre' }}>{cmd}</code>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        SETUP · MONGODB / REDIS
      </div>
      <h1 className={styles.contentTitle}>Run this for real, locally</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--text)' }}>
        Everything in this track's playgrounds runs in-browser as a simulation. These spin up the real Redis and MongoDB engines locally with Docker. Keep them separate — start whichever you're working with, not both at once.
      </p>

      <h3 className={styles.setupSectionTitle}>Redis</h3>
      <div>
        <div className={styles.setupBlockHead}>
          <span>docker-compose.yml</span>
          <CopyButton text={NREL_REDIS_COMPOSE_YML} />
        </div>
        <pre className={styles.codeblock}>{NREL_REDIS_COMPOSE_YML}</pre>
      </div>
      <div>
        <div className={styles.setupBlockHead}>
          <span>Essential commands</span>
          <CopyButton text={NREL_REDIS_COMMANDS} />
        </div>
        <pre className={styles.codeblock}>{NREL_REDIS_COMMANDS}</pre>
      </div>

      <h3 className={styles.setupSectionTitle}>MongoDB</h3>
      <div>
        <div className={styles.setupBlockHead}>
          <span>docker-compose.yml</span>
          <CopyButton text={NREL_MONGO_COMPOSE_YML} />
        </div>
        <pre className={styles.codeblock}>{NREL_MONGO_COMPOSE_YML}</pre>
      </div>
      <div>
        <div className={styles.setupBlockHead}>
          <span>Essential commands</span>
          <CopyButton text={NREL_MONGO_COMMANDS} />
        </div>
        <pre className={styles.codeblock}>{NREL_MONGO_COMMANDS}</pre>
      </div>

      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{
          __html: `<div class="callout">
            <div class="callout-label">How to use this</div>
            Save a compose file as <code>docker-compose.yml</code> in its own empty folder,
            then run the commands below it from that same folder in a terminal.
          </div>`,
        }}
      />
    </div>
  );
}

interface TopicViewProps {
  topic: NrelTopic;
  tier: Tier | undefined;
  prev: NrelTopic | null;
  next: NrelTopic | null;
  topicIndex: number;
  totalTopics: number;
  onNavigate: (id: string) => void;
  onComplete: (id: string) => void;
}

function TopicView({ topic, tier, prev, next, topicIndex, totalTopics, onNavigate, onComplete }: TopicViewProps) {
  return (
    <div key={topic.id} className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        {tier?.label.toUpperCase()} · MONGODB / REDIS
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>
          {topicIndex + 1} / {totalTopics}
        </span>
      </div>
      <h1 className={styles.contentTitle}>{topic.title}</h1>

      <ContentBody html={topic.html} className={styles.contentBody} />

      {topic.playground && (
        <NrelPlayground
          key={topic.id}
          topicId={topic.id}
          type={topic.playground.type}
          preset={topic.playground.preset}
        />
      )}

      <div className={styles.topicNav}>
        {prev ? (
          <button className={styles.navBtn} onClick={() => onNavigate(prev.id)}>
            <span className={styles.navBtnLabel}>← previous</span>
            {prev.title}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            className={`${styles.navBtn} ${styles.navBtnRight}`}
            onClick={() => { onComplete(topic.id); onNavigate(next.id); }}
          >
            <span className={styles.navBtnLabel}>next →</span>
            {next.title}
          </button>
        ) : (
          <button
            className={`${styles.navBtn} ${styles.navBtnRight}`}
            onClick={() => onComplete(topic.id)}
            style={{ color: 'var(--track-color)' }}
          >
            <span className={styles.navBtnLabel}>done</span>
            Mark complete ✓
          </button>
        )}
      </div>
    </div>
  );
}

export default function NonRelationalTrack() {
  const [currentId, setCurrentId] = useState<string>(NREL_TOPICS[0].id);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompleted(new Set(getCompleted('nonrelational')));
  }, []);

  const complete = useCallback((topicId: string) => {
    markComplete('nonrelational', topicId);
    setCompleted(c => new Set([...c, topicId]));
  }, []);

  const navigate = useCallback((id: string) => {
    setCurrentId(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSetup    = currentId === 'setup';
  const isMostUsed = currentId === 'most-used';
  const currentTopic = NREL_TOPICS.find(t => t.id === currentId) ?? null;
  const currentTier  = currentTopic ? NREL_TIERS.find(t => t.id === currentTopic.tier) : undefined;
  const idx  = NREL_TOPICS.findIndex(t => t.id === currentId);
  const prev = idx > 0 ? NREL_TOPICS[idx - 1] : null;
  const next = idx < NREL_TOPICS.length - 1 ? NREL_TOPICS[idx + 1] : null;

  return (
    <div
      className={styles.app}
      style={{ '--track-color': TRACK_COLOR, '--track-dim': TRACK_DIM } as React.CSSProperties}
    >
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar} aria-label="Track navigation">
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.homeLink}>
            ← back to Internals
          </Link>
          <div className={styles.brand}>NON-RELATIONAL</div>
          <div className={styles.sub}>documents · key-value</div>
        </div>

        <button
          className={`${styles.setupItem} ${isSetup ? styles.setupItemActive : ''}`}
          onClick={() => navigate('setup')}
        >
          <span className={styles.gear}>⚙</span> Setup
        </button>
        <button
          className={`${styles.setupItem} ${isMostUsed ? styles.setupItemActive : ''}`}
          onClick={() => navigate('most-used')}
        >
          <span className={styles.gear}>☰</span> Most used
        </button>

        <div className={styles.setupDivider} />

        {NREL_TIERS.map(tier => {
          const topicsInTier = NREL_TOPICS.filter(t => t.tier === tier.id);
          const doneInTier = topicsInTier.filter(t => completed.has(t.id)).length;
          return (
            <div
              key={tier.id}
              className={`${styles.tier} ${tier.locked ? styles.tierLocked : ''}`}
            >
              <div className={styles.tierHead}>
                <div className={styles.tierName}>{tier.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className={`${styles.tierLabel} ${tier.locked ? styles.tierLabelMuted : ''}`}>
                    {tier.label}
                  </div>
                  {!tier.locked && doneInTier > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--track-color)', opacity: 0.8 }}>
                      {doneInTier}/{topicsInTier.length}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.strata}>
                {topicsInTier.map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.strataBar} ${completed.has(topicsInTier[i].id) ? styles.strataBarFill : ''}`}
                  />
                ))}
              </div>
              {tier.locked ? (
                <div className={styles.lockedNote}>
                  Not built yet — coming after earlier tiers are reviewed.
                </div>
              ) : (
                <div className={styles.navList}>
                  {topicsInTier.map(topic => (
                    <button
                      key={topic.id}
                      className={`${styles.navItem} ${topic.id === currentId ? styles.navItemActive : ''}`}
                      onClick={() => navigate(topic.id)}
                      aria-current={topic.id === currentId ? 'page' : undefined}
                      title={topic.title}
                    >
                      {completed.has(topic.id) && (
                        <span style={{ color: 'var(--track-color)', marginRight: 5, flexShrink: 0 }}>✓</span>
                      )}
                      {topic.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* ── Content ── */}
      <main className={styles.content} aria-label="Lesson content">
        {isSetup ? (
          <SetupView />
        ) : isMostUsed ? (
          <MostUsedView />
        ) : currentTopic ? (
          <TopicView
            topic={currentTopic}
            tier={currentTier}
            prev={prev}
            next={next}
            topicIndex={idx}
            totalTopics={NREL_TOPICS.length}
            onNavigate={navigate}
            onComplete={complete}
          />
        ) : null}
      </main>
    </div>
  );
}
