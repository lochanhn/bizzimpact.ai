import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as plan } from '../app/api/plan/route';
import { POST as discover } from '../app/api/discover/route';
import { POST as live } from '../app/api/discover/live/route';
import { POST as outcomes } from '../app/api/outcomes/route';
import { POST as webhook } from '../app/api/integrations/webhook/route';
test('new submission endpoints reject foreign and absent origins before doing work',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No network work should occur.');};
 try{for(const [path,post] of [['plan',plan],['discover',discover],['discover/live',live],['outcomes',outcomes],['integrations/webhook',webhook]] as const){
  for(const origin of [undefined,'https://elsewhere.invalid']){const response=await post(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:'{}'}));assert.equal(response.status,403,path);}
  const invalid=await post(new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost'},body:'{}'}));assert.equal(invalid.status,400,path);
 }assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
