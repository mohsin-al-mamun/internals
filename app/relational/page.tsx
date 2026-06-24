import type { Metadata } from 'next';
import RelationalTrack from './RelationalTrack';

export const metadata: Metadata = {
  title: 'Relational · DB Console',
  description: 'PostgreSQL — tables, keys, joins, transactions',
};

export default function RelationalPage() {
  return <RelationalTrack />;
}
