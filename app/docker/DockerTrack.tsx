'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DOCKER_TOPICS,
  DOCKER_TIERS,
  DOCKER_SETUP_INSTRUCTIONS,
  type DockerTopic,
  type Tier,
} from './data';
import styles from '../relational/track.module.css';
import { markComplete, getCompleted } from '../lib/progress';
import ContentBody from '../components/ContentBody';

const TRACK_COLOR = '#a78bfa';
const TRACK_DIM   = '#a78bfa33';

const MOST_USED_SECTIONS = [
  {
    label: 'Container lifecycle',
    commands: [
      { cmd: 'docker run -d -p 8080:80 --name web nginx', desc: 'run detached, map port, name it' },
      { cmd: 'docker run -it --rm ubuntu bash',           desc: 'interactive shell, auto-delete on exit' },
      { cmd: 'docker ps',                                 desc: 'running containers' },
      { cmd: 'docker ps -a',                              desc: 'all containers including stopped' },
      { cmd: 'docker stop web',                           desc: 'graceful stop (SIGTERM)' },
      { cmd: 'docker rm web',                             desc: 'delete stopped container' },
      { cmd: 'docker rm -f web',                          desc: 'force delete running container' },
    ],
  },
  {
    label: 'Images',
    commands: [
      { cmd: 'docker build -t myapp:latest .',             desc: 'build from Dockerfile in current dir' },
      { cmd: 'docker build --no-cache -t myapp .',         desc: 'build ignoring layer cache' },
      { cmd: 'docker images',                              desc: 'list local images' },
      { cmd: 'docker pull nginx:alpine',                   desc: 'download image from registry' },
      { cmd: 'docker tag myapp myuser/myapp:1.0.0',        desc: 'tag for push' },
      { cmd: 'docker push myuser/myapp:1.0.0',             desc: 'push to registry' },
      { cmd: 'docker rmi myapp:old',                       desc: 'delete an image' },
      { cmd: 'docker history myapp',                       desc: 'show layers and commands that built them' },
    ],
  },
  {
    label: 'Exec & debug',
    commands: [
      { cmd: 'docker exec -it web bash',                   desc: 'open shell in running container' },
      { cmd: 'docker exec -it web sh',                     desc: 'use sh for Alpine images' },
      { cmd: 'docker logs -f web',                         desc: 'follow container logs' },
      { cmd: 'docker logs --tail 100 web',                 desc: 'last 100 lines' },
      { cmd: 'docker stats',                               desc: 'live CPU/memory for all containers' },
      { cmd: 'docker inspect web',                         desc: 'full metadata as JSON' },
      { cmd: 'docker cp web:/app/app.log ./',              desc: 'copy file from container to host' },
    ],
  },
  {
    label: 'docker-compose',
    commands: [
      { cmd: 'docker compose up -d',         desc: 'start all services in background' },
      { cmd: 'docker compose up --build',    desc: 'rebuild images then start' },
      { cmd: 'docker compose down',          desc: 'stop and remove containers' },
      { cmd: 'docker compose down -v',       desc: 'also delete named volumes' },
      { cmd: 'docker compose ps',            desc: 'status of all services' },
      { cmd: 'docker compose logs -f app',   desc: 'follow logs for one service' },
      { cmd: 'docker compose exec app bash', desc: 'shell into a running service' },
      { cmd: 'docker compose restart app',   desc: 'restart one service' },
    ],
  },
  {
    label: 'Volumes & networks',
    commands: [
      { cmd: 'docker volume ls',              desc: 'list volumes' },
      { cmd: 'docker volume inspect pgdata',  desc: 'see where data lives on host' },
      { cmd: 'docker volume rm pgdata',       desc: 'delete a volume (data gone)' },
      { cmd: 'docker network create mynet',   desc: 'create a named bridge network' },
      { cmd: 'docker network ls',             desc: 'list networks' },
      { cmd: 'docker network inspect mynet',  desc: 'see containers on a network' },
    ],
  },
  {
    label: 'Cleanup',
    commands: [
      { cmd: 'docker container prune',        desc: 'remove all stopped containers' },
      { cmd: 'docker image prune',            desc: 'remove dangling (untagged) images' },
      { cmd: 'docker image prune -a',         desc: 'remove all unused images' },
      { cmd: 'docker volume prune',           desc: 'remove unused volumes' },
      { cmd: 'docker system prune',           desc: 'remove stopped containers + dangling images + unused networks' },
      { cmd: 'docker system df',              desc: 'show how much disk Docker is using' },
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
        SETUP · DOCKER
      </div>
      <h1 className={styles.contentTitle}>Get Docker running locally</h1>
      <p style={{ margin: '0 0 16px', color: 'var(--text)' }}>
        Install Docker Desktop, then verify it works with a hello-world container. Everything in this track is designed to be practiced on your local Docker installation.
      </p>

      <h3 className={styles.setupSectionTitle}>Docker Desktop</h3>
      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{
          __html: `<div class="callout">
            <div class="callout-label">Install</div>
            Download Docker Desktop from <strong>docs.docker.com/get-docker</strong> for Mac, Windows, or Linux.
            It includes the Docker daemon, CLI, and docker-compose in one package.
          </div>`,
        }}
      />
      <div>
        <div className={styles.setupBlockHead}>
          <span>Verify and get started</span>
          <CopyButton text={DOCKER_SETUP_INSTRUCTIONS} />
        </div>
        <pre className={styles.codeblock}>{DOCKER_SETUP_INSTRUCTIONS}</pre>
      </div>
    </div>
  );
}

function MostUsedView() {
  return (
    <div className={styles.contentFade}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowDot} />
        REFERENCE · DOCKER
      </div>
      <h1 className={styles.contentTitle}>Most used commands</h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text)' }}>
        Docker commands you'll reach for every session. Scan, copy, go.
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
  topic: DockerTopic;
  tier: Tier | undefined;
  prev: DockerTopic | null;
  next: DockerTopic | null;
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
        {tier?.label.toUpperCase()} · DOCKER
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

export default function DockerTrack() {
  const [currentId, setCurrentId] = useState<string>(DOCKER_TOPICS[0].id);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setCompleted(new Set(getCompleted('docker')));
  }, []);

  const complete = useCallback((topicId: string) => {
    markComplete('docker', topicId);
    setCompleted(c => new Set([...c, topicId]));
  }, []);

  const navigate = useCallback((id: string) => {
    setCurrentId(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isSetup    = currentId === 'setup';
  const isMostUsed = currentId === 'most-used';
  const currentTopic = DOCKER_TOPICS.find(t => t.id === currentId) ?? null;
  const currentTier  = currentTopic ? DOCKER_TIERS.find(t => t.id === currentTopic.tier) : undefined;
  const idx  = DOCKER_TOPICS.findIndex(t => t.id === currentId);
  const prev = idx > 0 ? DOCKER_TOPICS[idx - 1] : null;
  const next = idx < DOCKER_TOPICS.length - 1 ? DOCKER_TOPICS[idx + 1] : null;

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
          <div className={styles.brand}>DOCKER</div>
          <div className={styles.sub}>containers · images · compose</div>
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

        {DOCKER_TIERS.map(tier => {
          const topicsInTier = DOCKER_TOPICS.filter(t => t.tier === tier.id);
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
            totalTopics={DOCKER_TOPICS.length}
            onNavigate={navigate}
            onComplete={complete}
          />
        ) : null}
      </main>
    </div>
  );
}
