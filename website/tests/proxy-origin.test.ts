import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError,requireSameOrigin } from '../lib/server/http';

test('production submissions use the public HTTPS origin behind a proxy',()=>{
 const previous={NODE_ENV:process.env.NODE_ENV,SITE_URL:process.env.SITE_URL};
 Object.assign(process.env,{NODE_ENV:'production',SITE_URL:'https://business.example'});
 const request=(origin?:string)=>new Request('http://localhost:3000/api/v1/demo',{
  method:'POST',headers:{...(origin?{Origin:origin}:{}),'X-Forwarded-Host':'attacker.example','X-Forwarded-Proto':'https'},
 });
 try{
  assert.doesNotThrow(()=>requireSameOrigin(request('https://business.example')));
  for(const origin of ['https://attacker.example','http://localhost:3000',undefined]){
   assert.throws(()=>requireSameOrigin(request(origin)),(error:unknown)=>error instanceof HttpError&&error.status===403);
  }
  delete process.env.SITE_URL;
  assert.throws(()=>requireSameOrigin(request('https://business.example')),(error:unknown)=>error instanceof HttpError&&error.status===503);
 }finally{
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
