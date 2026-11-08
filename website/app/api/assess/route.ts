import { NextResponse } from 'next/server';
import { assessmentSchema } from '@/lib/assessment';
import { assess } from '@/lib/match';
import { loggedRoute,readJSON } from '@/lib/server/http';
export const POST=loggedRoute('/api/assess',async(request,trace)=>{
 const parsed=assessmentSchema.safeParse(await readJSON(request));
 if(!parsed.success){trace.details.reasonCode='invalid_input';return NextResponse.json({error:'Please check your answers.',fields:parsed.error.flatten().fieldErrors},{status:400});}
 const result=assess(parsed.data);
 trace.details={catalogVersion:result.catalogVersion,rulesVersion:result.rulesVersion,suitableCount:result.suitable.length,checkCount:result.check.length,excludedCount:result.excluded.length};
 return NextResponse.json(result);
});
