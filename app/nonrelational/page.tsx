import type { Metadata } from 'next';
import NonRelationalTrack from './NonRelationalTrack';

export const metadata: Metadata = {
  title: 'Non-Relational · Internals',
  description: 'MongoDB & Redis — documents, key-value, flexible shape',
};

export default function NonRelationalPage() {
  return <NonRelationalTrack />;
}
