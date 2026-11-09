"""Explicit operator command after migration; never executes on import/startup."""
import json,os
from app.storage import PostgresStore
from app.engine import DATA
if __name__=='__main__':
 url=os.environ.get('DATABASE_URL')
 if not url:raise SystemExit('Configure DATABASE_URL in the backend environment first.')
 records=json.loads((DATA/'researched-catalog.json').read_text());PostgresStore(url).upsert_catalog(records)
 print(f'Seeded {len(records)} source-linked tool records. No model/search calls.')
