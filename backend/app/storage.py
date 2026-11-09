import hashlib,json,sqlite3,threading,time,secrets
from pathlib import Path
from uuid import uuid4
from datetime import datetime,timezone

def now():return datetime.now(timezone.utc).isoformat()
class LocalStore:
 """Persistent, isolated local DEMO storage. Not the live PostgreSQL adapter."""
 def __init__(self,path):
  Path(path).parent.mkdir(parents=True,exist_ok=True);self.path=str(path);self.lock=threading.RLock()
  with self.connect() as c:
   c.executescript('CREATE TABLE IF NOT EXISTS objects(kind TEXT,id TEXT,owner TEXT,payload TEXT,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,owner TEXT,expires REAL); CREATE TABLE IF NOT EXISTS spend(id INTEGER PRIMARY KEY CHECK(id=1),spent REAL NOT NULL); INSERT OR IGNORE INTO spend VALUES(1,0);')
 def connect(self):return sqlite3.connect(self.path,timeout=10)
 def put(self,kind,id,owner,payload):
  with self.lock,self.connect() as c:c.execute('INSERT INTO objects VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload WHERE objects.owner=excluded.owner',(kind,id,owner,json.dumps(payload)))
 def get(self,kind,id,owner):
  with self.connect() as c:r=c.execute('SELECT payload FROM objects WHERE kind=? AND id=? AND owner=?',(kind,id,owner)).fetchone()
  return json.loads(r[0]) if r else None
 def list(self,kind,owner):
  with self.connect() as c:r=c.execute('SELECT payload FROM objects WHERE kind=? AND owner=? ORDER BY rowid',(kind,owner)).fetchall()
  return [json.loads(v[0]) for v in r]
 def recover_runs(self):
  with self.connect() as c:rows=c.execute("SELECT id,owner,payload FROM objects WHERE kind='run'").fetchall()
  for id,owner,raw in rows:
   value=json.loads(raw)
   if value['status'] not in ('completed','partial','failed','needs_clarification'):
    value['status']='partial' if value.get('tools') else 'failed';value['error_code']='worker_restarted';value['warnings'].append('The local worker restarted before this run finished. Start a new discovery to retry.');value['updated_at']=now();value['state_history'].append({'status':value['status'],'at':now()});self.put('run',id,owner,value)
 def demo(self,prefix='demo_'):
  token=prefix+secrets.token_urlsafe(32);owner=str(uuid4());expiry=time.time()+7200
  with self.connect() as c:
   expired=c.execute('SELECT owner FROM sessions WHERE expires<?',(time.time(),)).fetchall()
   for (old,) in expired:c.execute('DELETE FROM objects WHERE owner=?',(old,))
   c.execute('DELETE FROM sessions WHERE expires<?',(time.time(),));c.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),owner,expiry))
  return token,owner
 def demo_owner(self,token):
  with self.connect() as c:r=c.execute('SELECT owner FROM sessions WHERE hash=? AND expires>?',(hashlib.sha256(token.encode()).hexdigest(),time.time())).fetchone()
  return r[0] if r else None
 def revoke(self,token):
  owner=self.demo_owner(token)
  with self.connect() as c:
   c.execute('DELETE FROM sessions WHERE hash=?',(hashlib.sha256(token.encode()).hexdigest(),))
   if owner:c.execute('DELETE FROM objects WHERE owner=?',(owner,))
 def reserve(self,amount,ceiling=20):
  with self.lock,self.connect() as c:
   c.execute('BEGIN IMMEDIATE');spent=c.execute('SELECT spent FROM spend WHERE id=1').fetchone()[0]
   if spent+amount>ceiling:return False
   c.execute('UPDATE spend SET spent=spent+? WHERE id=1',(amount,));return True
 def settle(self,reserved,actual):
  with self.lock,self.connect() as c:c.execute('UPDATE spend SET spent=MAX(0,spent+?) WHERE id=1',(actual-reserved,))
class TrialStore:
 """Ephemeral trial records, researched catalogue and one shared PostgreSQL spend ledger."""
 def __init__(self,local,shared):self.local=local;self.shared=shared
 def put(self,*args):return self.local.put(*args)
 def get(self,*args):return self.local.get(*args)
 def list(self,*args):return self.local.list(*args)
 def catalog(self):return self.shared.catalog()
 def reserve(self,*args,**kwargs):return self.shared.reserve(*args,**kwargs)
 def settle(self,*args):return self.shared.settle(*args)
 def upsert_catalog(self,records):return None  # Public trials cannot mutate the curated catalogue.
class PostgresStore:
 """Private records use the supplied businesses/discovery_runs tables plus JSON wire snapshots."""
 def __init__(self,url):self.url=url
 def connect(self):
  import psycopg
  return psycopg.connect(self.url,connect_timeout=8)
 def get(self,kind,id,owner):
  table='businesses' if kind=='business' else 'discovery_runs'
  with self.connect() as c:r=c.execute(f'SELECT api_payload FROM public.{table} WHERE id=%s AND owner_user_id=%s',(id,owner)).fetchone()
  return r[0] if r else None
 def list(self,kind,owner):
  table='businesses' if kind=='business' else 'discovery_runs'
  with self.connect() as c:r=c.execute(f'SELECT api_payload FROM public.{table} WHERE owner_user_id=%s ORDER BY created_at',(owner,)).fetchall()
  return [v[0] for v in r if v[0]]
 def put(self,kind,id,owner,payload):
  from psycopg.types.json import Jsonb
  with self.connect() as c:
   table='businesses' if kind=='business' else 'discovery_runs'
   existing=c.execute(f'SELECT owner_user_id FROM public.{table} WHERE id=%s FOR UPDATE',(id,)).fetchone()
   if existing and str(existing[0])!=owner:raise PermissionError('Record ownership mismatch')
   if kind=='business':
    p=payload['profile'];args=(id,owner,p['industry']['category'],p['industry']['subtype'],p['business_description'],p['customer_type'],p['employee_band'],p['operating_region']['country'],p['operating_region']['region'],p['existing_software_status'],p['improvement_priorities'],p['monthly_budget_band'],p['customer_contact_channels'],Jsonb(payload))
    c.execute('''INSERT INTO public.businesses(id,owner_user_id,industry_category,industry_subtype,business_description,customer_type,employee_band,country_code,region_code,existing_software_status,improvement_priorities,monthly_budget_band,customer_contact_channels,api_payload,onboarding_completed_at) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now()) ON CONFLICT(id) DO UPDATE SET industry_category=excluded.industry_category,industry_subtype=excluded.industry_subtype,business_description=excluded.business_description,customer_type=excluded.customer_type,employee_band=excluded.employee_band,country_code=excluded.country_code,region_code=excluded.region_code,existing_software_status=excluded.existing_software_status,improvement_priorities=excluded.improvement_priorities,monthly_budget_band=excluded.monthly_budget_band,customer_contact_channels=excluded.customer_contact_channels,api_payload=excluded.api_payload,updated_at=now() WHERE businesses.owner_user_id=excluded.owner_user_id''',args)
    c.execute('DELETE FROM public.business_software WHERE business_id=%s AND EXISTS (SELECT 1 FROM public.businesses WHERE id=%s AND owner_user_id=%s)',(id,id,owner))
    for s in p['existing_software']:c.execute('INSERT INTO public.business_software(business_id,raw_name,normalized_name) VALUES(%s,%s,%s)',(id,s['raw_name'],s['raw_name'].lower()))
   else:
    c.execute('''INSERT INTO public.discovery_runs(id,business_id,owner_user_id,mode,problem_text,force_web,profile_snapshot,profile_fingerprint,status,api_payload) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO UPDATE SET status=excluded.status,api_payload=excluded.api_payload,updated_at=now() WHERE discovery_runs.owner_user_id=excluded.owner_user_id''',(id,payload['business_id'],owner,'problem_search',payload['problem_text'],payload.get('force_web',False),Jsonb(payload['profile_snapshot']),hashlib.sha256(json.dumps(payload['profile_snapshot'],sort_keys=True).encode()).hexdigest(),payload['status'],Jsonb(payload)))
    if kind=='run':
     c.execute('UPDATE public.discovery_runs SET interpreted_requirements=%s,clarification_question=%s,warnings=%s,error_code=%s,search_calls=%s,model_calls=%s,estimated_cost_usd=%s WHERE id=%s AND owner_user_id=%s',(Jsonb(payload.get('requirements')),payload.get('clarification_question'),Jsonb(payload.get('warnings',[])),payload.get('error_code'),payload['usage']['search_calls'],payload['usage']['model_calls'],payload['usage']['estimated_cost_usd'],id,owner))
     c.execute('DELETE FROM public.discovery_queries WHERE run_id=%s',(id,))
     for q in payload.get('queries',[]):c.execute('INSERT INTO public.discovery_queries(run_id,query_kind,query_text,provider,executed) VALUES(%s,%s,%s,%s,%s)',(id,q['query_kind'],q['query_text'],'openrouter' if q['executed'] else 'planned',q['executed']))
     c.execute('DELETE FROM public.discovery_candidates WHERE run_id=%s',(id,))
     for order,p in enumerate(payload.get('tools',[])):
      c.execute('INSERT INTO public.discovery_candidates(run_id,tool_id,matched_capabilities,retrieval_channels,provenance_urls,discovery_status,first_seen_order,issue_flags) SELECT %s,%s,%s,%s,%s,%s,%s,%s WHERE EXISTS(SELECT 1 FROM public.ai_tools WHERE id=%s)',(id,p['tool_id'],p['matched_capabilities'],p['retrieval_channels'],list(dict.fromkeys(e['source_url'] for e in p['evidence'] if e['source_url'])),p['discovery_status'],order,p['issues'],p['tool_id']))
 def reserve(self,amount,ceiling=20):
  with self.connect() as c:
   r=c.execute('UPDATE public.discovery_budget SET reserved_usd=reserved_usd+%s WHERE id=1 AND reserved_usd+%s<=%s RETURNING id',(amount,amount,ceiling)).fetchone()
  return bool(r)
 def settle(self,reserved,actual):
  with self.connect() as c:c.execute('UPDATE public.discovery_budget SET reserved_usd=GREATEST(0,reserved_usd+%s) WHERE id=1',(actual-reserved,))
 def catalog(self):
  with self.connect() as c:r=c.execute("SELECT api_payload FROM public.ai_tools WHERE catalog_status!='rejected' AND api_payload IS NOT NULL ORDER BY name").fetchall()
  return [x[0] for x in r]
 def upsert_catalog(self,products):
  from psycopg.types.json import Jsonb
  from urllib.parse import urlsplit
  from .contracts import CAPABILITIES
  with self.connect() as c:
   for cap in CAPABILITIES:c.execute('INSERT INTO public.capabilities(id,category,display_name) VALUES(%s,%s,%s) ON CONFLICT DO NOTHING',(cap,'discovery',cap.replace('_',' ')))
   for p in products:
    domain=urlsplit(p['official_url']).hostname.removeprefix('www.');key=domain+'|'+''.join(ch for ch in p['name'].lower() if ch.isalnum())
    row=c.execute('''INSERT INTO public.ai_tools(id,canonical_product_key,name,official_url,official_domain,short_description,ai_classification,catalog_status,api_payload,last_checked_at) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,now()) ON CONFLICT(canonical_product_key) DO UPDATE SET api_payload=excluded.api_payload,last_checked_at=now() RETURNING id''',(p['tool_id'],key,p['name'],p['official_url'],domain,p.get('short_description'),p['ai_classification'],p['catalog_status'],Jsonb(p))).fetchone()
    tool_id=row[0];p['tool_id']=str(tool_id)
    c.execute('UPDATE public.ai_tools SET api_payload=%s WHERE id=%s',(Jsonb(p),tool_id))
    c.execute('DELETE FROM public.tool_capabilities WHERE tool_id=%s',(tool_id,));c.execute('DELETE FROM public.tool_claims WHERE tool_id=%s',(tool_id,))
    for e in p['evidence']:
     source_id=None
     if e['source_url']:
      source_id=c.execute('INSERT INTO public.tool_sources(tool_id,url,source_kind,retrieval_method) VALUES(%s,%s,%s,%s) ON CONFLICT(tool_id,url) DO UPDATE SET retrieved_at=now() RETURNING id',(tool_id,e['source_url'],'vendor_official' if e['verification_state']=='vendor_documented' else 'third_party','catalog_review')).fetchone()[0]
     kind=e['claim_key'] if e['claim_key'] in ('capability','ai_feature','integration','pricing') else 'other'
     claim_id=c.execute('INSERT INTO public.tool_claims(tool_id,source_id,claim_type,claim_key,claim_value,verification_state) VALUES(%s,%s,%s,%s,%s,%s) RETURNING id',(tool_id,source_id,kind,e['claim_key'],Jsonb(e['claim_value']),e['verification_state'])).fetchone()[0]
     if kind=='capability' and e['claim_value'] in CAPABILITIES:c.execute('INSERT INTO public.tool_capabilities(tool_id,capability_id,claim_id) VALUES(%s,%s,%s) ON CONFLICT DO NOTHING',(tool_id,e['claim_value'],claim_id))
