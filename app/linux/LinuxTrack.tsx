'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LINUX_TOPICS,
  LINUX_TIERS,
  LINUX_DOCKER_COMPOSE_YML,
  LINUX_SETUP_COMMANDS,
  type LinuxTopic,
  type Tier,
} from './data';
import styles from '../relational/track.module.css';
import { markComplete, getCompleted } from '../lib/progress';
import ContentBody from '../components/ContentBody';

const TRACK_COLOR = '#f59e42';
const TRACK_DIM   = '#f59e4233';

const MOST_USED_SECTIONS = [
  {
    label: 'Navigation & listing',
    commands: [
      { cmd: 'pwd',               desc: 'print current directory' },
      { cmd: 'ls -la',            desc: 'list all files with permissions' },
      { cmd: 'cd -',              desc: 'go back to previous directory' },
      { cmd: 'find . -name "*.log"', desc: 'find files by name pattern' },
    ],
  },
  {
    label: 'Files & directories',
    commands: [
      { cmd: 'mkdir -p a/b/c',    desc: 'create nested dirs in one shot' },
      { cmd: 'cp -r src/ dst/',   desc: 'copy directory recursively' },
      { cmd: 'mv old.txt new.txt',desc: 'rename / move a file' },
      { cmd: 'rm -rf folder/',    desc: 'delete directory permanently' },
      { cmd: '> file.log',        desc: 'truncate file to zero bytes (safe for live logs)' },
    ],
  },
  {
    label: 'Reading & searching',
    commands: [
      { cmd: 'tail -f app.log',   desc: 'follow a log file live' },
      { cmd: 'tail -n 100 -f app.log', desc: 'last 100 lines then follow' },
      { cmd: 'less file.txt',     desc: 'page through a file (q to quit)' },
      { cmd: 'grep -r "TODO" ./src', desc: 'search text inside files recursively' },
      { cmd: 'grep -E "ERROR|WARN" app.log', desc: 'match multiple patterns' },
    ],
  },
  {
    label: 'Processes',
    commands: [
      { cmd: 'ps aux | grep nginx', desc: 'find a running process' },
      { cmd: 'kill -15 PID',      desc: 'graceful stop (SIGTERM)' },
      { cmd: 'kill -9 PID',       desc: 'force kill (SIGKILL, no cleanup)' },
      { cmd: 'lsof -i :8080',     desc: 'which process owns port 8080' },
      { cmd: 'lsof -p PID',       desc: 'all open files for a process' },
    ],
  },
  {
    label: 'Permissions',
    commands: [
      { cmd: 'chmod 755 script.sh', desc: 'rwxr-xr-x (owner full, others r+x)' },
      { cmd: 'chmod 644 file.txt',  desc: 'rw-r--r-- (owner rw, others r)' },
      { cmd: 'chmod +x script.sh',  desc: 'add execute bit for everyone' },
      { cmd: 'chown user:group file', desc: 'change owner and group' },
      { cmd: 'sudo !!',             desc: 're-run last command as root' },
    ],
  },
  {
    label: 'Disk & system',
    commands: [
      { cmd: 'df -h',             desc: 'disk usage per filesystem' },
      { cmd: 'du -sh ./*',        desc: 'size of each item in current dir' },
      { cmd: 'free -h',           desc: 'RAM usage' },
      { cmd: 'uptime',            desc: 'load averages (1, 5, 15 min)' },
      { cmd: 'ss -tuln',          desc: 'listening ports' },
    ],
  },
  {
    label: 'Pipes & redirection',
    commands: [
      { cmd: 'cmd > out.txt 2>&1',  desc: 'stdout + stderr to file' },
      { cmd: 'cmd >> out.txt 2>&1', desc: 'append stdout + stderr to file' },
      { cmd: 'sort | uniq -c | sort -rn | head', desc: 'frequency count pattern' },
      { cmd: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10", desc: 'top IPs from nginx log' },
    ],
  },
  {
    label: 'Archiving',
    commands: [
      { cmd: 'tar -czf archive.tar.gz folder/', desc: 'create gzipped archive' },
      { cmd: 'tar -xzf archive.tar.gz',        desc: 'extract gzipped archive' },
      { cmd: 'tar -tzf archive.tar.gz',        desc: 'list contents without extracting' },
      { cmd: 'zip -r archive.zip folder/',     desc: 'zip for cross-platform' },
    ],
  },
  {
    label: 'SSH & remote',
    commands: [
      { cmd: 'ssh -L 5432:localhost:5432 user@host', desc: 'tunnel remote port to local' },
      { cmd: 'scp file.txt user@host:~/',             desc: 'copy file to remote' },
      { cmd: 'rsync -avz ./dist/ user@host:~/app/',  desc: 'sync directory to remote' },
      { cmd: 'ssh-copy-id user@host',                desc: 'install your public key on server' },
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

function SetupView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        SETUP · LINUX SANDBOX
      </div>
      <h1 className={styles.contentTitle}>Run a real Linux environment locally</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--text)' }}>
        Spin up an Ubuntu container with Docker. Everything in this track is designed to be practiced inside it — a clean, disposable environment you can break without consequences.
      </p>

      <h3 className={styles.setupSectionTitle}>Docker Compose</h3>
      <div>
        <div className={styles.setupBlockHead}>
          <span>docker-compose.yml</span>
          <CopyButton text={LINUX_DOCKER_COMPOSE_YML} />
        </div>
        <pre className={styles.codeblock}>{LINUX_DOCKER_COMPOSE_YML}</pre>
      </div>
      <div>
        <div className={styles.setupBlockHead}>
          <span>Commands</span>
          <CopyButton text={LINUX_SETUP_COMMANDS} />
        </div>
        <pre className={styles.codeblock}>{LINUX_SETUP_COMMANDS}</pre>
      </div>

      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{
          __html: `<div class="callout">
            <div class="callout-label">How to use this</div>
            Save <code>docker-compose.yml</code> in an empty folder and run the commands from that folder.
            The container gives you a full Ubuntu 24.04 shell. Try every command in the lessons here —
            you can always <code>docker compose down</code> and start fresh.
          </div>`,
        }}
      />
    </div>
  );
}

function MostUsedView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        REFERENCE · LINUX
      </div>
      <h1 className={styles.contentTitle}>Most used commands</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text)' }}>
        Commands you'll reach for every day. Grouped by task — scan, copy, and go.
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

interface TopicViewProps {
  topic: LinuxTopic;
  tier: Tier | undefined;
  prev: LinuxTopic | null;
  next: LinuxTopic | null;
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
        {tier?.label.toUpperCase()} · LINUX
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>
          {topicIndex + 1} / {totalTopics}
        </span>
      </div>
      <h1 className={styles.contentTitle}>{topic.title}</h1>

      <ContentBody html={topic.html} className={styles.contentBody} />

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

export default function LinuxTrack() {
  const [currentId, setCurrentId] = useState<string>(LINUX_TOPICS[0].id);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setCompleted(new Set(getCompleted('linux')));
  }, []);

  const complete = useCallback((topicId: string) => {
    markComplete('linux', topicId);
    setCompleted(c => new Set([...c, topicId]));
  }, []);

  const navigate = useCallback((id: string) => {
    setCurrentId(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSetup     = currentId === 'setup';
  const isMostUsed  = currentId === 'most-used';
  const currentTopic = LINUX_TOPICS.find(t => t.id === currentId) ?? null;
  const currentTier  = currentTopic ? LINUX_TIERS.find(t => t.id === currentTopic.tier) : undefined;
  const idx  = LINUX_TOPICS.findIndex(t => t.id === currentId);
  const prev = idx > 0 ? LINUX_TOPICS[idx - 1] : null;
  const next = idx < LINUX_TOPICS.length - 1 ? LINUX_TOPICS[idx + 1] : null;

  return (
    <div
      className={styles.app}
      style={{ '--track-color': TRACK_COLOR, '--track-dim': TRACK_DIM } as React.CSSProperties}
    >
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} aria-label="Track navigation">
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.homeLink}>
            ← back to Internals
          </Link>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
          <div className={styles.brand}>LINUX</div>
          <div className={styles.sub}>filesystem · processes · I/O</div>
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

        {LINUX_TIERS.map(tier => {
          const topicsInTier = LINUX_TOPICS.filter(t => t.tier === tier.id);
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
        <div className={styles.mobileBar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            ☰ Topics
          </button>
        </div>
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
            totalTopics={LINUX_TOPICS.length}
            onNavigate={navigate}
            onComplete={complete}
          />
        ) : null}
      </main>
    </div>
  );
}
