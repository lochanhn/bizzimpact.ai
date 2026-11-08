import copy,json,re,logging
from pathlib import Path
from urllib.parse import urlsplit
from .contracts import Intent,CAPABILITIES
from .storage import now
DATA=Path(__file__).resolve().parents[1]/'data'
FIXTURES=json.loads((DATA/'synthetic-catalog.json').read_text())
Q9='How do customers usually reach your business?'

def clean_text(value):
 value=re.sub(r'sk-[\w-]+','[redacted]',value)
 value=re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}','[redacted]',value)
 value=re.sub(r'(?:\+?\d[\d ().-]{7,}\d)','[redacted]',value)
 return value[:2000]

def interpret(profile,problem,answer=None,skip=False):
 text=problem.lower();caps=[];explicit=[];inferred=[]
 def add(*values):
  for value in values:
   if value not in caps:caps.append(value)
 phone=bool(re.search(r'\b(call|calls|phone|telephone|voicemail)\b',text))
 chat=bool(re.search(r'website|web chat|chatbot|live chat',text))
 inquiry=bool(re.search(r'inquir|enquir|customer|lead|respond',text))
 inventory=bool(re.search(r'inventor|stock|restock|perishable|over.?order|ingredient|waste|forecast',text))
 if phone:add('ai_voice_receptionist','lead_capture');explicit.append('phone channel stated')
 if chat:add('customer_support_chat','lead_capture');explicit.append('website channel stated')
 if re.search(r'appoint|reservat|booked|booking|schedule',text):add('appointment_scheduling')
 if inquiry and not inventory and not phone and not chat:add('lead_capture','automated_followup')
 if inventory:add('demand_forecasting','inventory_optimization')
 if re.search(r'invoic|receipt|bill entry',text):add('invoice_automation')
 if re.search(r'market|social post|caption|campaign|promotion|content|advertis',text):add('marketing_content')
 if re.search(r'quot(e|es|ing)|estimate for customer',text):add('quote_generation')
 if re.search(r'automat(e|ing|ion).*workflow|repetitive|copy.*between',text):add('workflow_automation')
 known=profile.get('customer_contact_channels') or []
 channels=[] if skip else ([x.strip() for x in answer.split(',')] if answer else known)
 if inquiry and not phone and not chat:
  if 'Phone calls' in channels:add('ai_voice_receptionist');explicit.append('phone channel selected')
  if 'Website' in channels:add('customer_support_chat');explicit.append('website channel selected')
 clarification=inquiry and not inventory and not phone and not chat and not channels and not answer and not skip and 'marketing_content' not in caps and 'invoice_automation' not in caps
 if not caps:inferred.append('No supported capability could be confidently mapped; broader discovery is needed.')
 return Intent(problem_summary=clean_text(problem)[:500],required_capabilities=caps,explicit_attributes=explicit,inferred_attributes=inferred,clarification_needed=clarification)

SAFE_INDUSTRIES={'landscaping','hvac','plumbing','cleaning','restaurant','cafe','coffee shop','online retail','consultancy'}
SAFE_SOFTWARE={'google calendar','outlook','shopify','square','quickbooks','housecall pro','salesforce'}
def plan_queries(profile,intent):
 caps=intent.required_capabilities
 label='AI phone answering voice receptionist' if 'ai_voice_receptionist' in caps else 'AI inventory optimization demand forecasting' if 'inventory_optimization' in caps else 'AI '+(' '.join(caps[:2]).replace('_',' ') or 'business workflow tools')
 subtype=profile['industry']['subtype'].lower()
 industry=subtype if subtype in SAFE_INDUSTRIES else 'small business'
 queries=[{'query_kind':'capability','query_text':f'{label} small business','executed':False},{'query_kind':'industry','query_text':f'{label} for {industry}','executed':False}]
 selected=[s['raw_name'].lower() for s in profile['existing_software']] if profile['existing_software_status']=='selected' else []
 relevant={'google calendar','outlook','housecall pro'} if any(c in caps for c in ('ai_voice_receptionist','appointment_scheduling')) else {'shopify','square'} if 'marketing_content' in caps else {'quickbooks','square'} if 'invoice_automation' in caps else SAFE_SOFTWARE if 'workflow_automation' in caps else set()
 safe=next((s for s in selected if s in SAFE_SOFTWARE and s in relevant),None)
 if safe:queries.append({'query_kind':'integration','query_text':f'{label} {safe} integration','executed':False})
 else:queries.append({'query_kind':'alternate','query_text':f'{label} software alternatives official features','executed':False})
 return queries[:3]

def fixture_product(p,channel='catalog'):
 caps=p.get('capabilities',[])
 return {'tool_id':p['id'],'name':p['name'],'official_url':p['official_url'],'short_description':'Fictional fixture used to demonstrate the discovery workflow.','ai_classification':'unverified','catalog_status':p.get('catalog_status','seeded'),'matched_capabilities':caps,'retrieval_channels':[channel],'discovery_status':'evidence_pending','evidence':[{'claim_key':'capability','claim_value':c,'verification_state':'unverified','source_url':None,'observed_at':None} for c in caps],'issues':['Synthetic demonstration product. Not a real vendor, price or integration.'],'synthetic':True}

def catalog(mode):
 if mode=='mock':return [fixture_product(p) for p in FIXTURES['products']]
 return json.loads((DATA/'researched-catalog.json').read_text())

def search_catalog(products,capabilities,limit=15):
 result=[]
 for product in products:
  matched=[cap for cap in product['matched_capabilities'] if cap in capabilities]
  if matched:
   p=copy.deepcopy(product);p['matched_capabilities']=matched;result.append(p)
 return result[:limit]

def baseline_capabilities(profile):
 priorities=profile['improvement_priorities'];caps=[]
 mapping={'Marketing':['marketing_content'],'Getting new customers':['lead_capture'],'Sales':['lead_capture','automated_followup'],'Customer service':['customer_support_chat','ai_voice_receptionist'],'Scheduling':['appointment_scheduling'],'Inventory & purchasing':['inventory_optimization','demand_forecasting'],'Finance & invoicing':['invoice_automation'],'Administrative work':['workflow_automation']}
 for priority in priorities:
  caps.extend(mapping.get(priority,[]))
 if not caps:
  category=profile['industry']['category']
  caps=['lead_capture','appointment_scheduling'] if category=='Home Services' else ['marketing_content','inventory_optimization'] if category=='Food & Beverage' else []
 return list(dict.fromkeys(caps))

def canonical_key(product):
 # Host + product identity: distinct products on one vendor domain stay distinct.
 return urlsplit(product['official_url']).hostname.removeprefix('www.')+'|'+re.sub(r'[^a-z0-9]','',product['name'].lower())

def dedupe(products):
 result={}
 for p in products:
  key=canonical_key(p)
  if key not in result:result[key]=copy.deepcopy(p);continue
  existing=result[key]
  for field in ['retrieval_channels','matched_capabilities','issues']:
   existing[field]=list(dict.fromkeys(existing.get(field,[])+p.get(field,[])))
  for evidence in p.get('evidence',[]):
   if evidence not in existing['evidence']:existing['evidence'].append(evidence)
 return list(result.values())

def mock_web(intent):
 if 'ai_voice_receptionist' not in intent.required_capabilities:return []
 duplicate=fixture_product(FIXTURES['products'][0],'mock_web')
 duplicate['official_url']=FIXTURES['mock_web_duplicate_product']['official_url']
 return [duplicate,fixture_product(FIXTURES['mock_web_new_product'],'mock_web')]

class Orchestrator:
 def __init__(self,store,mode,parser=None,searcher=None,fetcher=None):self.store=store;self.mode=mode;self.parser=parser;self.searcher=searcher;self.fetcher=fetcher
 def save(self,run,state):
  run['status']=state;run['updated_at']=now();run['state_history'].append({'status':state,'at':now()});self.store.put('run',run['run_id'],run['owner'],run)
 def execute(self,run,answer=None,skip=False):
  try:
   self.save(run,'parsing');profile=run['profile_snapshot']
   intent=interpret(profile,run['problem_text'],answer,skip)
   if self.parser:
    try:
     parsed=self.parser.parse_problem(profile,run['problem_text'],run['usage'])
     # Deterministic clarification state/explicit channels override model guesses.
     parsed.clarification_needed=intent.clarification_needed
     if answer or skip:parsed.required_capabilities=list(dict.fromkeys(parsed.required_capabilities+intent.required_capabilities))
     intent=parsed
    except Exception:run['warnings'].append('AI interpretation unavailable or invalid; a deterministic capability parser was used.')
   run['requirements']=intent.model_dump();run['clarification_question']=Q9 if intent.clarification_needed else None
   if intent.clarification_needed:self.save(run,'needs_clarification');return
   run['queries']=plan_queries(profile,intent);self.save(run,'catalog_search')
   run['tools']=search_catalog(self.store.catalog() if self.mode!='mock' and hasattr(self.store,'catalog') else catalog(self.mode),intent.required_capabilities)
   if self.searcher and self.fetcher:
    self.save(run,'web_search');seen=set();pages=0
    for query in run['queries']:
     if run['usage']['model_calls']>=5:run['warnings'].append('Per-run model-call limit reached; remaining live work paused.');break
     try:
      hits=self.searcher.search(query['query_text'],run['usage']);query['executed']=self.mode!='mock';query['simulated']=self.mode=='mock'
      for hit in hits:
       host=urlsplit(hit['url']).hostname
       if host in seen or len(seen)>=5 or pages>=10:continue
       seen.add(host);pages+=1
       if run['usage']['model_calls']>=5:break
       page=self.fetcher.fetch(hit['url']);candidate=self.parser.extract_claims(page,run['usage'])
       if candidate:run['tools'].append(candidate)
     except Exception:run['warnings'].append('Some live retrieval failed or reached a safety/budget limit; known catalogue results are retained.')
   else:run['warnings'].append('Live discovery is disabled or unavailable; these are catalogue results only.')
   if self.mode=='mock':run['warnings'].append('Synthetic demo: web results are simulated; no external request was made.')
   self.save(run,'enriching');run['tools']=dedupe(run['tools']);run['clarification_question']=None
   run['tools']=[p for p in run['tools'] if set(p['matched_capabilities'])&set(intent.required_capabilities)]
   if not run['tools']:run['warnings'].append('No evidenced catalogue candidate covers this need yet. No tools were invented to fill the result.')
   terminal='partial' if self.mode!='mock' and (not self.searcher or run['warnings']) else 'completed'
   if self.mode!='mock' and hasattr(self.store,'upsert_catalog'):
    self.store.upsert_catalog([p for p in run['tools'] if 'web_search' in p['retrieval_channels']])
   self.save(run,terminal)
   logging.getLogger('bizzimpact').info(json.dumps({'event':'discovery_completed','run_id':run['run_id'],'status':terminal,'model_id':getattr(self.parser,'model',None),**run['usage']}))
  except Exception:
   run['error_code']='discovery_failed';run['warnings'].append('Discovery could not finish. Any existing candidates remain available.');self.save(run,'partial' if run['tools'] else 'failed')
