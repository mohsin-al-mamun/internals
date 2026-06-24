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

  const isSetup = currentId === 'setup';
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
