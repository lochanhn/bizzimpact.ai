import copy,hashlib,json,logging,os,threading,time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4,UUID
import httpx
from fastapi import FastAPI,BackgroundTasks,Depends,HTTPException,Request
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from .contracts import BusinessProfile,DiscoveryRequest,BusinessRequest,Clarification,DiscoveredTool,DiscoveryRunCreated,DiscoveryRun,BaselineResult,BusinessCreated
from .storage import LocalStore,PostgresStore,TrialStore,now
from .engine import DATA,Orchestrator,baseline_capabilities,catalog,search_catalog
from .providers import OpenRouterProvider,OpenRouterSearchAdapter,SafePageFetcher,MockLLMProvider,MockSearchProvider,MockPageFetcher
from .guidance import attach_guidance,build_guidance
log=logging.getLogger('bizzimpact');logging.basicConfig(level=logging.INFO,format='%(message)s')
logging.getLogger('httpx').setLevel(logging.WARNING)
@dataclass
class Actor:
 owner:str
 demo:bool
 store:object
 mode:str
 trial:bool=False

def create_app(local_path=None,db_url=None):
 local=LocalStore(local_path or os.getenv('DEMO_DB_PATH',str(DATA.parent/'.runtime/demo.sqlite')));local.recover_runs()
 database_url=db_url or os.getenv('DATABASE_URL');pg=PostgresStore(database_url) if database_url else None
 def live_enabled():return os.getenv('DISCOVERY_MODE')=='live' and os.getenv('OPENROUTER_ENABLED')=='true' and os.getenv('EXPLICIT_LIVE_AUTHORIZED')=='true' and bool(os.getenv('OPENROUTER_API_KEY')) and bool(os.getenv('OPENROUTER_MODEL'))
 limits={};limit_lock=threading.Lock();clarify_lock=threading.Lock()
 app=FastAPI(title='bizzimpact.ai Phase 1 discovery',version='2.0.0')
 app.state.local=local
 @app.middleware('http')
 async def diagnostics(request,call_next):
  ident=str(uuid4());start=time.monotonic()
  if request.headers.get('content-length','0').isdigit() and int(request.headers.get('content-length','0'))>16000:return JSONResponse({'detail':'Request too large','code':'too_large'},status_code=413)
  chunks=[];total=0
  async for chunk in request.stream():
   total+=len(chunk)
   if total>16000:return JSONResponse({'detail':'Request too large','code':'too_large'},status_code=413)
   chunks.append(chunk)
  request._body=b''.join(chunks)
  try:response=await call_next(request)
  except Exception:response=JSONResponse({'detail':'The service could not finish this request.','code':'internal_error'},status_code=500)
  response.headers['X-Request-Id']=ident;response.headers['Cache-Control']='no-store'
  log.info(json.dumps({'event':'request_completed','request_id':ident,'method':request.method,'status':response.status_code,'duration_ms':round((time.monotonic()-start)*1000)}))
  return response
 @app.exception_handler(RequestValidationError)
 async def validation(_request,error):
  # Pydantic errors normally include the original input; never return/log it.
  return JSONResponse({'detail':'Check the required answers and selection rules.','code':'invalid_input','fields':['.'.join(str(p) for p in e['loc'][1:]) for e in error.errors()]},status_code=400)
 def rate(key,max_count=30):
  with limit_lock:
   now_time=time.time()
   for k in list(limits):
    if limits[k][1]<=now_time:del limits[k]
   count,until=limits.get(key,(0,now_time+60))
   if count>=max_count:raise HTTPException(429,'Please wait a minute before trying again.')
   if len(limits)>5000:raise HTTPException(429,'Service is busy. Please try later.')
   limits[key]=(count+1,until)
 security=HTTPBearer(auto_error=False,scheme_name='BearerAuth',bearerFormat='JWT')
 def actor(request:Request,_credentials:HTTPAuthorizationCredentials|None=Depends(security)):
  authorization=request.headers.get('authorization','');token=authorization.removeprefix('Bearer ') if authorization.startswith('Bearer ') else ''
  if token.startswith('demo_'):
   owner=local.demo_owner(token)
   if owner:return Actor(owner,True,local,'mock')
  elif token.startswith('trial_'):
   owner=local.demo_owner(token)
   if owner and pg and live_enabled() and os.getenv('PUBLIC_AI_TRIAL_ENABLED')=='true':return Actor(owner,False,TrialStore(local,pg),'live',True)
  elif token:
   url=os.getenv('SUPABASE_URL','').rstrip('/');key=os.getenv('SUPABASE_PUBLISHABLE_KEY','')
   if not url or not key:raise HTTPException(503,'Supabase backend configuration is missing.')
   try:
    response=httpx.get(url+'/auth/v1/user',headers={'apikey':key,'Authorization':'Bearer '+token},timeout=8)
    response.raise_for_status();user=response.json();UUID(user['id'])
    if user.get('aud')!='authenticated':raise ValueError()
   except Exception:raise HTTPException(401,'Sign in again to continue.') from None
   if not pg:raise HTTPException(503,'Configure the PostgreSQL connection and migrations for private saved profiles.')
   mode=os.getenv('DISCOVERY_MODE','mock')
   if mode not in ('mock','catalog','live'):mode='catalog'
   return Actor(user['id'],False,pg,mode)
  raise HTTPException(401,'Sign in or start the constrained synthetic demo.')
 def owned(kind,id,a):
  try:UUID(id)
  except ValueError:raise HTTPException(404,'Not found.')
  row=a.store.get(kind,id,a.owner)
  if not row:raise HTTPException(404,'Not found.')
  return row
 def orchestrator(a):
  if a.mode=='mock':return Orchestrator(a.store,'mock',MockLLMProvider(),MockSearchProvider(),MockPageFetcher())
  provider=None;searcher=None
  authorized=not a.demo and a.mode=='live' and os.getenv('EXPLICIT_LIVE_AUTHORIZED')=='true' and os.getenv('OPENROUTER_ENABLED')=='true'
  if authorized:
   key=os.getenv('OPENROUTER_API_KEY');model=os.getenv('OPENROUTER_MODEL')
   if key and model:
    embedding_model=os.getenv('EMBEDDING_MODEL','openai/text-embedding-3-small') if os.getenv('EMBEDDINGS_ENABLED')=='true' else None
    provider=OpenRouterProvider(key,model,a.store,credit_floor=5,embedding_model=embedding_model)
    if os.getenv('LIVE_WEB_ENABLED')=='true':searcher=OpenRouterSearchAdapter(provider)
  return Orchestrator(a.store,a.mode,provider,searcher,SafePageFetcher() if searcher else None)
 @app.get('/health')
 def health():return {'ok':True,'default_mode':os.getenv('DISCOVERY_MODE','mock'),'paid_calls_enabled_by_default':live_enabled()}
 @app.get('/api/v1/availability')
 def availability():return {'live_trial':bool(pg and live_enabled() and os.getenv('PUBLIC_AI_TRIAL_ENABLED')=='true'),'live_web':live_enabled() and os.getenv('LIVE_WEB_ENABLED')=='true'}
 @app.post('/api/v1/trial',status_code=201)
 def trial(request:Request):
  if not pg or not live_enabled() or os.getenv('PUBLIC_AI_TRIAL_ENABLED')!='true':raise HTTPException(503,'AI trials are not enabled.')
  rate('trial:'+str(request.client.host),3);token,_owner=local.demo(prefix='trial_')
  return {'token':token,'synthetic':False,'trial':True,'expires_in':7200}
 @app.post('/api/v1/trial/logout')
 def trial_logout(request:Request):
  token=request.headers.get('authorization','').removeprefix('Bearer ')
  if token.startswith('trial_'):local.revoke(token)
  return {'ok':True}
 @app.post('/api/v1/demo',status_code=201)
 def demo(request:Request):
  rate('demo:'+str(request.client.host),12);token,_owner=local.demo()
  return {'token':'demo_'+token if not token.startswith('demo_') else token,'synthetic':True,'expires_in':7200}
 # LocalStore must hash the exact returned token; mint/store uses this prefix as well.
 @app.post('/api/v1/demo/logout')
 def demo_logout(request:Request):
  token=request.headers.get('authorization','').removeprefix('Bearer ');local.revoke(token);return {'ok':True}
 @app.get('/api/v1/context')
 def context(a:Actor=Depends(actor)):return {'demo':a.demo,'trial':a.trial,'mode':a.mode,'synthetic':a.mode=='mock'}
 @app.get('/api/v1/onboarding/schema')
 def schema():return json.loads((DATA/'onboarding-spec.json').read_text())
 @app.get('/api/v1/businesses')
 def list_businesses(a:Actor=Depends(actor)):return [{'business_id':v['business_id'],'industry_subtype':v['profile']['industry']['subtype'],'profile':v['profile']} for v in a.store.list('business',a.owner)]
 @app.post('/api/v1/businesses',status_code=201,response_model=BusinessCreated)
 def create_business(profile:BusinessProfile,a:Actor=Depends(actor)):
  rate(a.owner+':profile');id=str(uuid4());payload={'business_id':id,'owner':a.owner,'profile':profile.model_dump(),'created_at':now()};a.store.put('business',id,a.owner,payload)
  return {'business_id':id,'profile':payload['profile']}
 @app.get('/api/v1/businesses/{business_id}/profile',response_model=BusinessProfile)
 def get_profile(business_id:str,a:Actor=Depends(actor)):return owned('business',business_id,a)['profile']
 @app.put('/api/v1/businesses/{business_id}/profile',response_model=BusinessProfile)
 def put_profile(business_id:str,profile:BusinessProfile,a:Actor=Depends(actor)):
  payload=owned('business',business_id,a);payload['profile']=profile.model_dump();a.store.put('business',business_id,a.owner,payload);return payload['profile']
 @app.post('/api/v1/discovery/baseline',response_model=BaselineResult)
 def baseline(body:BusinessRequest,a:Actor=Depends(actor)):
  p=owned('business',body.business_id,a)['profile'];caps=baseline_capabilities(p)
  tools=search_catalog(a.store.catalog() if a.mode!='mock' and hasattr(a.store,'catalog') else catalog(a.mode),caps,6)
  return {'business_id':body.business_id,'capability_categories':caps,'tools':attach_guidance(tools),'is_baseline':True,'usage':{'model_calls':0,'search_calls':0,'estimated_cost_usd':0},'synthetic':a.mode=='mock'}
 @app.post('/api/v1/discovery/runs',status_code=202,response_model=DiscoveryRunCreated)
 def create_run(body:DiscoveryRequest,background:BackgroundTasks,request:Request,a:Actor=Depends(actor)):
  if a.trial:
   rate('trial-run:'+str(request.client.host),10)
   if len(a.store.list('run',a.owner))>=4:raise HTTPException(429,'This AI trial has reached its four-search limit.')
  rate(a.owner+':run',8);p=owned('business',body.business_id,a)['profile'];id=str(uuid4())
  run={'run_id':id,'business_id':body.business_id,'owner':a.owner,'status':'queued','mode':'problem_search','profile_snapshot':copy.deepcopy(p),'discovery_context':body.context.model_dump(),'problem_text':body.problem_text,'force_web':body.force_web,'requirements':None,'clarification_question':None,'tools':[],'warnings':[],'error_code':None,'usage':{'search_calls':0,'model_calls':0,'estimated_cost_usd':0},'queries':[],'state_history':[{'status':'queued','at':now()}],'synthetic':a.mode=='mock','created_at':now(),'updated_at':now()}
  a.store.put('run',id,a.owner,run);background.add_task(orchestrator(a).execute,run)
  return {'run_id':id,'status':'queued','poll_url':f'/api/v1/discovery/runs/{id}','estimated_duration_note':'The status page shows the actual discovery progress.'}
 @app.get('/api/v1/discovery/runs/{run_id}',response_model=DiscoveryRun)
 def get_run(run_id:str,a:Actor=Depends(actor)):
  run=owned('run',run_id,a);run.pop('owner',None);run.pop('problem_text',None)
  return run
 @app.post('/api/v1/discovery/runs/{run_id}/clarification',status_code=202,response_model=DiscoveryRunCreated)
 def clarify(run_id:str,body:Clarification,background:BackgroundTasks,a:Actor=Depends(actor)):
  with clarify_lock:
   run=owned('run',run_id,a)
   if run['status']!='needs_clarification':raise HTTPException(409,'This run is not awaiting clarification.')
   if not body.skip and any(c.strip() not in ('Phone calls','Email','Website','Social media','WhatsApp / SMS','Walk-ins','Online marketplaces','Other') for c in (body.answer or '').split(',')):raise HTTPException(400,'Select a listed contact channel or skip.')
   run['status']='parsing';a.store.put('run',run_id,a.owner,run)
  background.add_task(orchestrator(a).execute,run,body.answer,body.skip)
  return {'run_id':run_id,'status':'queued','poll_url':f'/api/v1/discovery/runs/{run_id}'}
 @app.get('/api/v1/tools/{tool_id}',response_model=DiscoveredTool)
 def get_tool(tool_id:str):
  for product in (pg.catalog() if pg else catalog('catalog'))+catalog('mock'):
   if product['tool_id']==tool_id:
    product=copy.deepcopy(product);product['guidance']=build_guidance(product);return product
  if tool_id=='00000000-0000-4000-8000-000000000005':
   from .engine import fixture_product,FIXTURES
   product=fixture_product(FIXTURES['mock_web_new_product'],'mock_web');product['guidance']=build_guidance(product);return product
  raise HTTPException(404,'Tool not found. A live provisional candidate is available in its owner’s discovery run only.')
 return app
app=create_app()
