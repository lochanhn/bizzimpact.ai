import { NextResponse } from 'next/server';
import { tools, CATALOG_VERSION, CHECKED } from '@/lib/catalog';
export function GET(){return NextResponse.json({version:CATALOG_VERSION,checked:CHECKED,mode:'Reviewed local catalogue',tools});}
