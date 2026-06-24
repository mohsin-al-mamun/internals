'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLastCompleted } from '../lib/progress';
import { REL_TOPICS } from '../relational/data';
import { NREL_TOPICS } from '../nonrelational/data';

interface Props {
  track: 'relational' | 'nonrelational';
  className?: string;
  accentColor: string;
}

export default function ContinueLink({ track, className, accentColor }: Props) {
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);

  useEffect(() => {
    const lastId = getLastCompleted(track);
    if (!lastId) return;
    const topics = track === 'relational' ? REL_TOPICS : NREL_TOPICS;
    const idx = topics.findIndex(t => t.id === lastId);
    const next = topics[idx + 1];
    if (next) setResumeTitle(next.title);
  }, [track]);

  if (!resumeTitle) return null;

  return (
    <Link
      href={`/${track}`}
      className={className}
      style={{
        display: 'block',
        marginTop: 14,
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 12,
        color: accentColor,
        opacity: 0.85,
        textDecoration: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      → Resume: {resumeTitle}
    </Link>
  );
}
