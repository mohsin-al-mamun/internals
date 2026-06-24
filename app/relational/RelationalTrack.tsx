'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  REL_TOPICS,
  REL_TIERS,
  REL_SEED_SQL,
  REL_DOCKER_COMPOSE_YML,
  REL_SETUP_COMMANDS,
  type Topic,
  type Tier,
} from './data';
import SqlPlayground from './SqlPlayground';
import styles from './track.module.css';
import { markComplete, getCompleted } from '../lib/progress';
import ContentBody from '../components/ContentBody';

const TRACK_COLOR = '#4DA8DA';
const TRACK_DIM   = '#4DA8DA33';

const MOST_USED_SECTIONS = [
  {
    label: 'psql meta-commands',
    commands: [
      { cmd: '\\l',              desc: 'list all databases' },
      { cmd: '\\c dbname',       desc: 'connect to a database' },
      { cmd: '\\dt',             desc: 'list tables in current schema' },
      { cmd: '\\d tablename',    desc: 'describe table (columns, types, indexes)' },
      { cmd: '\\di',             desc: 'list indexes' },
      { cmd: '\\timing',         desc: 'toggle query execution time display' },
      { cmd: '\\e',              desc: 'open last query in $EDITOR' },
      { cmd: '\\q',              desc: 'quit psql' },
    ],
  },
  {
    label: 'Querying',
    commands: [
      { cmd: 'SELECT * FROM users LIMIT 10;',                         desc: 'basic select with limit' },
      { cmd: 'SELECT col1, col2 FROM t WHERE id = $1;',               desc: 'select specific columns' },
      { cmd: 'SELECT * FROM t ORDER BY created_at DESC LIMIT 20;',    desc: 'sort and limit' },
      { cmd: 'SELECT COUNT(*), status FROM orders GROUP BY status;',  desc: 'count by group' },
      { cmd: 'SELECT * FROM t WHERE name ILIKE \'%alice%\';',         desc: 'case-insensitive search' },
    ],
  },
  {
    label: 'Filtering',
    commands: [
      { cmd: 'WHERE age BETWEEN 18 AND 65',         desc: 'range check (inclusive)' },
      { cmd: 'WHERE status IN (\'active\', \'pending\')', desc: 'match any in list' },
      { cmd: 'WHERE email IS NOT NULL',             desc: 'null check' },
      { cmd: 'WHERE tags @> ARRAY[\'admin\']',      desc: 'array contains element' },
      { cmd: 'WHERE data->>\'key\' = \'value\'',   desc: 'JSONB field match' },
    ],
  },
  {
    label: 'Joins',
    commands: [
      { cmd: 'INNER JOIN orders o ON o.user_id = u.id',       desc: 'rows with match in both tables' },
      { cmd: 'LEFT JOIN orders o ON o.user_id = u.id',        desc: 'all users, NULLs if no order' },
      { cmd: 'LEFT JOIN … WHERE o.id IS NULL',                desc: 'users with no orders' },
    ],
  },
  {
    label: 'Aggregation',
    commands: [
      { cmd: 'COUNT(*)',                        desc: 'total rows' },
      { cmd: 'COUNT(DISTINCT user_id)',         desc: 'unique values' },
      { cmd: 'SUM(amount)',                     desc: 'sum a numeric column' },
      { cmd: 'AVG(duration)',                   desc: 'average' },
      { cmd: 'MIN(created_at), MAX(created_at)', desc: 'earliest and latest' },
      { cmd: 'HAVING COUNT(*) > 5',            desc: 'filter after GROUP BY' },
    ],
  },
  {
    label: 'Modifying data',
    commands: [
      { cmd: "INSERT INTO users (name, email) VALUES ('Alice', 'a@x.com');", desc: 'insert a row' },
      { cmd: 'INSERT INTO t … RETURNING id;',                               desc: 'get generated id back' },
      { cmd: "UPDATE users SET name = 'Bob' WHERE id = 1;",                 desc: 'update a row' },
      { cmd: 'DELETE FROM users WHERE id = 1;',                             desc: 'delete a row' },
      { cmd: 'TRUNCATE users;',                                              desc: 'delete all rows fast (no rollback)' },
    ],
  },
  {
    label: 'Transactions',
    commands: [
      { cmd: 'BEGIN;',            desc: 'start a transaction' },
      { cmd: 'COMMIT;',           desc: 'persist changes' },
      { cmd: 'ROLLBACK;',         desc: 'undo all changes since BEGIN' },
      { cmd: 'SAVEPOINT sp1;',    desc: 'create a partial rollback point' },
      { cmd: 'ROLLBACK TO sp1;',  desc: 'undo back to savepoint only' },
    ],
  },
  {
    label: 'Indexes',
    commands: [
      { cmd: 'CREATE INDEX ON users (email);',                          desc: 'basic B-tree index' },
      { cmd: 'CREATE INDEX CONCURRENTLY ON users (email);',             desc: 'create without locking table' },
      { cmd: 'CREATE UNIQUE INDEX ON users (email);',                   desc: 'enforce uniqueness' },
      { cmd: 'CREATE INDEX ON events USING GIN (tags);',                desc: 'GIN for array/JSONB search' },
      { cmd: 'EXPLAIN ANALYZE SELECT …;',                               desc: 'show query plan + actual timing' },
      { cmd: 'DROP INDEX idx_name;',                                    desc: 'remove an index' },
    ],
  },
  {
    label: 'Schema & admin',
    commands: [
      { cmd: 'CREATE TABLE t (id SERIAL PRIMARY KEY, name TEXT NOT NULL);', desc: 'create table' },
      { cmd: 'ALTER TABLE t ADD COLUMN score INT DEFAULT 0;',               desc: 'add a column' },
      { cmd: 'ALTER TABLE t DROP COLUMN old_col;',                          desc: 'remove a column' },
      { cmd: 'ALTER TABLE t RENAME COLUMN old TO new;',                     desc: 'rename column' },
      { cmd: 'DROP TABLE t;',                                               desc: 'delete table permanently' },
      { cmd: 'VACUUM ANALYZE tablename;',                                   desc: 'reclaim space + update stats' },
    ],
  },
];

// ── Copy button ───────────────────────────────────────────────
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

// ── Most used view ────────────────────────────────────────────
function MostUsedView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        REFERENCE · POSTGRES
      </div>
      <h1 className={styles.contentTitle}>Most used commands</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text)' }}>
        SQL and psql commands you'll reach for every session. Scan, copy, go.
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

// ── Setup view ────────────────────────────────────────────────
function SetupView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        SETUP · POSTGRES
      </div>
      <h1 className={styles.contentTitle}>Run this for real, locally</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--text)' }}>
        Everything in the playgrounds runs in-browser via a real SQLite engine. This spins
        up actual Postgres locally with Docker so you can keep going with the real thing.
      </p>

      <h3 className={styles.setupSectionTitle}>Postgres</h3>
      <div>
        <div className={styles.setupBlockHead}>
          <span>docker-compose.yml</span>
          <CopyButton text={REL_DOCKER_COMPOSE_YML} />
        </div>
        <pre className={styles.codeblock}>{REL_DOCKER_COMPOSE_YML}</pre>
      </div>
      <div>
        <div className={styles.setupBlockHead}>
          <span>Essential commands</span>
          <CopyButton text={REL_SETUP_COMMANDS} />
        </div>
        <pre className={styles.codeblock}>{REL_SETUP_COMMANDS}</pre>
      </div>

      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{
          __html: `<div class="callout">
            <div class="callout-label">How to use this</div>
            Save the compose file as <code>docker-compose.yml</code> in its own empty folder,
            then run the commands below it from that same folder in a terminal.
          </div>`,
        }}
      />
    </div>
  );
}

// ── Topic view ────────────────────────────────────────────────
interface TopicViewProps {
  topic: Topic;
  tier: Tier | undefined;
  prev: Topic | null;
  next: Topic | null;
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
        {tier?.label.toUpperCase()} · POSTGRES
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>
          {topicIndex + 1} / {totalTopics}
        </span>
      </div>
      <h1 className={styles.contentTitle}>{topic.title}</h1>

      <ContentBody html={topic.html} className={styles.contentBody} />

      {topic.playground?.type === 'sql' && (
        <SqlPlayground
          key={topic.id}
          topicId={topic.id}
          preset={topic.playground.preset}
          seedSql={REL_SEED_SQL}
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

// ── Main component ────────────────────────────────────────────
export default function RelationalTrack() {
  const [currentId, setCurrentId] = useState<string>(REL_TOPICS[0].id);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompleted(new Set(getCompleted('relational')));
  }, []);

  const complete = useCallback((topicId: string) => {
    markComplete('relational', topicId);
    setCompleted(c => new Set([...c, topicId]));
  }, []);

  const navigate = useCallback((id: string) => {
    setCurrentId(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSetup    = currentId === 'setup';
  const isMostUsed = currentId === 'most-used';
  const currentTopic = REL_TOPICS.find((t) => t.id === currentId) ?? null;
  const currentTier  = currentTopic
    ? REL_TIERS.find((t) => t.id === currentTopic.tier)
    : undefined;
  const idx  = REL_TOPICS.findIndex((t) => t.id === currentId);
  const prev = idx > 0 ? REL_TOPICS[idx - 1] : null;
  const next = idx < REL_TOPICS.length - 1 ? REL_TOPICS[idx + 1] : null;

  return (
    <div
      className={styles.app}
      style={
        { '--track-color': TRACK_COLOR, '--track-dim': TRACK_DIM } as React.CSSProperties
      }
    >
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar} aria-label="Track navigation">
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.homeLink}>
            ← back to Internals
          </Link>
          <div className={styles.brand}>RELATIONAL</div>
          <div className={styles.sub}>tables · keys · joins</div>
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

        {REL_TIERS.map((tier) => {
          const topicsInTier = REL_TOPICS.filter((t) => t.tier === tier.id);
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
                    className={`${styles.strataBar} ${
                      completed.has(topicsInTier[i].id) ? styles.strataBarFill : ''
                    }`}
                  />
                ))}
              </div>
              {tier.locked ? (
                <div className={styles.lockedNote}>
                  Not built yet — coming after earlier tiers are reviewed.
                </div>
              ) : (
                <div className={styles.navList}>
                  {topicsInTier.map((topic) => (
                    <button
                      key={topic.id}
                      className={`${styles.navItem} ${
                        topic.id === currentId ? styles.navItemActive : ''
                      }`}
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
            totalTopics={REL_TOPICS.length}
            onNavigate={navigate}
            onComplete={complete}
          />
        ) : null}
      </main>
    </div>
  );
}
