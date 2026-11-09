import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const backend=fileURLToPath(new URL('../../backend/',import.meta.url));
const website=fileURLToPath(new URL('../',import.meta.url));
let backendSettings={};
try{backendSettings=parseEnv(readFileSync(new URL('../../backend/.env.local',import.meta.url),'utf8'));}
catch(error){if(error.code!=='ENOENT')throw error;}
// Load backend settings only for the Python process. Exported values take precedence.
const backendEnv={...backendSettings,...process.env};
const children=[];
function start(command,args,cwd,env=process.env){const child=spawn(command,args,{cwd,stdio:'inherit',env});children.push(child);child.on('error',()=>{console.error(`Could not start ${command}. See PHASE1_STATUS.md for setup.`);stop(1);});child.on('exit',code=>stop(code??0));}
let stopping=false;function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),500);}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
start('uv',['run','--frozen','uvicorn','app.main:app','--host','127.0.0.1','--port','8001'],backend,backendEnv);
start('npm',['run','dev'],website);
