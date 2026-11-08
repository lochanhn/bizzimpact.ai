import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
export const metadata:Metadata={title:'bizzimpact.ai — A little guidance. A bigger impact.',description:'Find practical AI tools for your small business. Clear comparisons, honest costs and a plan to get started.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>;}
