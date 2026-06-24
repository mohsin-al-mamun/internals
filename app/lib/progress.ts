const STORAGE_KEY = 'dbconsole:progress';

type TrackId = 'relational' | 'nonrelational';

type Progress = {
  relational: string[];
  nonrelational: string[];
};

function load(): Progress {
  if (typeof window === 'undefined') return { relational: [], nonrelational: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { relational: [], nonrelational: [] };
  } catch {
    return { relational: [], nonrelational: [] };
  }
}

function save(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function markComplete(track: TrackId, topicId: string) {
  const p = load();
  if (!p[track].includes(topicId)) {
    p[track] = [...p[track], topicId];
    save(p);
  }
}

export function getCompleted(track: TrackId): string[] {
  return load()[track];
}

export function getLastCompleted(track: TrackId): string | null {
  const list = load()[track];
  return list.length > 0 ? list[list.length - 1] : null;
}
