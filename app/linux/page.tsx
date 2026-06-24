import type { Metadata } from 'next';
import LinuxTrack from './LinuxTrack';

export const metadata: Metadata = {
  title: 'Linux Commands · Internals',
  description: 'Filesystem, processes, permissions, scripting — the shell from the ground up.',
};

export default function LinuxPage() {
  return <LinuxTrack />;
}
