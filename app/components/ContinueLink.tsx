'use client';

import { useEffect, useState } from 'react';
import { getLastCompleted } from '../lib/progress';
import { REL_TOPICS } from '../relational/data';
import { NREL_TOPICS } from '../nonrelational/data';
import { LINUX_TOPICS } from '../linux/data';
import { DOCKER_TOPICS } from '../docker/data';

interface Props {
  track: 'relational' | 'nonrelational' | 'linux' | 'docker';
  accentColor: string;
}

export default function ContinueLink({ track, accentColor }: Props) {
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);

  useEffect(() => {
    const lastId = getLastCompleted(track);
    if (!lastId) return;
    const topics = track === 'relational' ? REL_TOPICS : track === 'nonrelational' ? NREL_TOPICS : track === 'linux' ? LINUX_TOPICS : DOCKER_TOPICS;
    const idx = topics.findIndex(t => t.id === lastId);
    const next = topics[idx + 1];
    if (next) setResumeTitle(next.title);
  }, [track]);

  if (!resumeTitle) return null;

  return (
    <span
      style={{
        display: 'block',
        marginTop: 14,
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 12,
        color: accentColor,
        opacity: 0.85,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      → Resume: {resumeTitle}
    </span>
  );
}
