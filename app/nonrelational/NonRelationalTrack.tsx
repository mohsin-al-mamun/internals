'use client';

import { useState, useCallback } from 'react';
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

const TRACK_COLOR = '#38d39b';
const TRACK_DIM   = '#38d39b33';

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

function SetupView() {
  return (
    <>
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
    </>
  );
}

interface TopicViewProps {
  topic: NrelTopic;
  tier: Tier | undefined;
  prev: NrelTopic | null;
  next: NrelTopic | null;
  onNavigate: (id: string) => void;
}

function TopicView({ topic, tier, prev, next, onNavigate }: TopicViewProps) {
  return (
    <>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        {tier?.label.toUpperCase()} · MONGODB / REDIS
      </div>
      <h1 className={styles.contentTitle}>{topic.title}</h1>

      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{ __html: topic.html }}
      />

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
            onClick={() => onNavigate(next.id)}
          >
            <span className={styles.navBtnLabel}>next →</span>
            {next.title}
          </button>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}

export default function NonRelationalTrack() {
  const [currentId, setCurrentId] = useState<string>(NREL_TOPICS[0].id);

  const navigate = useCallback((id: string) => {
    setCurrentId(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSetup = currentId === 'setup';
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
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.homeLink}>
            ← back to console home
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

        <div className={styles.setupDivider} />

        {NREL_TIERS.map(tier => {
          const topicsInTier = NREL_TOPICS.filter(t => t.tier === tier.id);
          return (
            <div
              key={tier.id}
              className={`${styles.tier} ${tier.locked ? styles.tierLocked : ''}`}
            >
              <div className={styles.tierHead}>
                <div className={styles.tierName}>{tier.name}</div>
                <div className={`${styles.tierLabel} ${tier.locked ? styles.tierLabelMuted : ''}`}>
                  {tier.label}
                </div>
              </div>
              <div className={styles.strata}>
                {NREL_TIERS.map(t2 => (
                  <div
                    key={t2.id}
                    className={`${styles.strataBar} ${t2.order <= tier.order ? styles.strataBarFill : ''}`}
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
                    >
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
      <main className={styles.content}>
        {isSetup ? (
          <SetupView />
        ) : currentTopic ? (
          <TopicView
            topic={currentTopic}
            tier={currentTier}
            prev={prev}
            next={next}
            onNavigate={navigate}
          />
        ) : null}
      </main>
    </div>
  );
}
