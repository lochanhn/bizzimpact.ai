import type { Metadata } from 'next';
import '../discover/discover.css';
import './start.css';

export const metadata: Metadata = {
  title: 'Your AI plan — bizzimpact.ai',
  description: 'Answer a short business check-up and get AI tools reviewed for your business, plus a plan to adopt them.',
};
export default function StartLayout({ children }: { children: React.ReactNode }) { return children; }
