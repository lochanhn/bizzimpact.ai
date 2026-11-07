import { NextResponse } from 'next/server';
import { assessmentSchema } from '@/lib/assessment';
import { assess } from '@/lib/match';
export async function POST(request:Request) {
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return NextResponse.json({error:'Send a JSON assessment.'},{status:415});
 const reader=request.body?.getReader();
 const chunks:Uint8Array[]=[];let bytes=0;
 if(reader) {
  try {
   while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;
    if(bytes>16000){await reader.cancel();return NextResponse.json({error:'This assessment is too large.'},{status:413});}
    chunks.push(chunk.value);
   }
  }catch{return NextResponse.json({error:'The assessment could not be read.'},{status:400});}
 }
 const raw=Buffer.concat(chunks).toString('utf8');
 let value:unknown;
 try{value=JSON.parse(raw);}catch{return NextResponse.json({error:'The assessment could not be read.'},{status:400});}
 const parsed=assessmentSchema.safeParse(value);
 if(!parsed.success)return NextResponse.json({error:'Please check your answers.',fields:parsed.error.flatten().fieldErrors},{status:400});
 return NextResponse.json(assess(parsed.data),{headers:{'Cache-Control':'no-store'}});
}
