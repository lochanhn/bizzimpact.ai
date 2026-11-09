"""Populate server-only implementation guides from the reviewed catalogue; no paid calls."""
import os
from psycopg.types.json import Jsonb
from app.storage import PostgresStore
from app.implementation import guide_for

def main():
 url=os.environ.get('DATABASE_URL')
 if not url:raise SystemExit('DATABASE_URL is required in the private environment.')
 store=PostgresStore(url);products=[product for product in store.catalog() if product.get('catalog_status') in ('seeded','confirmed')]
 with store.connect() as c:
  c.execute("DELETE FROM public.tool_implementation_guides WHERE tool_id IN (SELECT id FROM public.ai_tools WHERE catalog_status NOT IN ('seeded','confirmed'))")
  for product in products:
   guide=guide_for(product)
   c.execute('''INSERT INTO public.tool_implementation_guides(tool_id,guide_version,installation_type,verified_content,source_urls,last_reviewed_at,updated_at) VALUES(%s,%s,%s,%s,%s,%s,now()) ON CONFLICT(tool_id) DO UPDATE SET guide_version=excluded.guide_version,installation_type=excluded.installation_type,verified_content=excluded.verified_content,source_urls=excluded.source_urls,last_reviewed_at=excluded.last_reviewed_at,updated_at=now()''',(guide['tool_id'],guide['guide_version'],guide['installation_type'],Jsonb(guide),guide['source_urls'],guide['last_reviewed_at']))
 print(f'Indexed implementation guides for {len(products)} catalogue tools.')

if __name__=='__main__':main()
