import { createHash } from 'node:crypto';
export function v5(value:string){const h=createHash('sha1').update('bizzimpact.ai/catalog/'+value).digest();h[6]=(h[6]&15)|80;h[8]=(h[8]&63)|128;const s=h.subarray(0,16).toString('hex');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;}
