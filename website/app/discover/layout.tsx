import type { Metadata } from 'next';
import './discover.css';

export const metadata: Metadata = {
  title: 'Discover AI tools — bizzimpact.ai',
  description: 'Describe a business problem in your own words and find matching AI tools from a reviewed, source-linked catalogue.',
};
export default function DiscoverLayout({ children }: { children: React.ReactNode }) { return children; }
