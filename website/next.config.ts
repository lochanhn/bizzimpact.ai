import type { NextConfig } from 'next';
const config: NextConfig = { output: 'standalone', poweredByHeader: false, logging:{incomingRequests:{ignore:[/\/auth\/(callback|confirm)/]},serverFunctions:false,browserToTerminal:false} };
export default config;
