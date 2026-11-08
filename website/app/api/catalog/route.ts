import { NextResponse } from 'next/server';
import { tools, CATALOG_VERSION, CHECKED } from '@/lib/catalog';
import { loggedRoute } from '@/lib/server/http';
export const GET=loggedRoute('/api/catalog',(_request,trace)=>{trace.details.catalogVersion=CATALOG_VERSION;return NextResponse.json({version:CATALOG_VERSION,checked:CHECKED,mode:'Reviewed local catalogue',tools});});
