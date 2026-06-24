import type { Metadata } from 'next';
import DockerTrack from './DockerTrack';

export const metadata: Metadata = {
  title: 'Docker · Internals',
  description: 'Containers, images, compose, and what actually happens under the hood.',
};

export default function DockerPage() {
  return <DockerTrack />;
}
