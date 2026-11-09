import copy,json
import httpx,pytest
from app.contracts import BusinessProfile,Intent
from app.engine import DATA,interpret,search_catalog,plan_queries,Orchestrator,catalog
from app.providers import OpenRouterProvider
from app.storage import LocalStore
from test_discovery import profile,service,business

CASES=json.loads((DATA/'discovery-evaluation.json').read_text())['cases']
@pytest.mark.parametrize('case',CASES,ids=[c['id'] for c in CASES])
def test_curated_task_interpretation(case):
 intent=interpret(profile(),case['problem'],context=case.get('context'))
 assert set(intent.required_capabilities)==set(case['expected'])
 assert not set(case.get('excluded',[]))&set(intent.required_capabilities)
 if 'clarification' in case:assert intent.clarification_needed==case['clarification']

def test_retrieval_considers_full_catalogue_before_limiting():
 broad={'name':'Broad match','matched_capabilities':['lead_capture'],'issues':[]}
 products=[dict(broad,name=f'Partial {i}') for i in range(30)]+[dict(broad,name='Covers both tasks',matched_capabilities=['lead_capture','appointment_scheduling'])]
 original=copy.deepcopy(products)
 result=search_catalog(products,['lead_capture','appointment_scheduling'],limit=3)
 assert result[0]['name']=='Covers both tasks'
 assert len(result)==3 and products==original

def test_local_lexical_retrieval_can_surface_later_task_specific_records():
 products=[{'tool_id':str(i),'name':f'General marketing {i}','short_description':'Create marketing content','matched_capabilities':['marketing_content'],'evidence':[]} for i in range(20)]
 products.append({'tool_id':'specific','name':'Social scheduler','short_description':'Schedule Instagram posts and captions','matched_capabilities':['marketing_content'],'evidence':[]})
 result=search_catalog(products,['marketing_content'],limit=8,query='Schedule Instagram posts')
 assert result[0]['tool_id']=='specific' and result[0]['_retrieval_bm25']>0

def test_discovery_context_is_saved_and_constraints_are_not_claimed_verified(service):
 client,_=service
 p=profile();p['customer_description']='Local homeowners';id=business(client,p)
 context={'current_workflow':'I call people back after work.','desired_outcome':'Book appointments after answering incoming phone calls.','constraints':'Must keep QuickBooks and never send messages without approval.'}
 created=client.post('/api/v1/discovery/runs',json={'business_id':id,'problem_text':'Customer requests get lost.','context':context})
 assert created.status_code==202
 run=client.get(created.json()['poll_url']).json()
 assert run['discovery_context']==context
 assert run['profile_snapshot']['customer_description']=='Local homeowners'
 assert run['status']=='completed' and 'appointment_scheduling' in run['requirements']['required_capabilities']
 assert all(any('still need to be checked' in issue for issue in t['issues']) for t in run['tools'])
 assert run['usage']['model_calls']==0 and run['usage']['search_calls']==0
 queries=json.dumps(run['queries']);assert 'never send messages' not in queries

def test_optional_context_length_is_bounded(service):
 client,_=service;id=business(client)
 response=client.post('/api/v1/discovery/runs',json={'business_id':id,'problem_text':'Help with invoices.','context':{'constraints':'x'*501}})
 assert response.status_code==400

def test_customer_description_is_optional_and_bounded():
 assert BusinessProfile.model_validate(profile()).customer_description is None
 with pytest.raises(ValueError):BusinessProfile.model_validate({**profile(),'customer_description':'x'*301})

def test_model_receives_task_context_but_web_queries_do_not_receive_raw_answers(tmp_path):
 sent=[]
 def reply(request):
  sent.append(json.loads(request.content))
  return httpx.Response(200,json={'usage':{'cost':0},'choices':[{'message':{'content':json.dumps({'problem_summary':'Phone answering','required_capabilities':['ai_voice_receptionist']})}}]})
 provider=OpenRouterProvider('test','test/model',LocalStore(tmp_path/'provider.sqlite'),httpx.Client(transport=httpx.MockTransport(reply)))
 p=profile();p['customer_description']='Local homeowners';context={'current_workflow':'Voicemail each evening','desired_outcome':'Answer incoming calls','constraints':'Keep private@example.com out of queries'}
 intent=provider.parse_problem(p,'We miss calls.',{'model_calls':0,'search_calls':0,'estimated_cost_usd':0},context=context)
 payload=json.loads(sent[0]['messages'][1]['content'])
 assert payload['context']['customers']=='Local homeowners'
 assert payload['context']['workflow']['current_workflow']=='Voicemail each evening'
 assert 'private@example.com' not in json.dumps(payload)
 queries=json.dumps(plan_queries(p,intent));assert 'Voicemail each evening' not in queries and 'private@example.com' not in queries

def test_run_specific_requirements_do_not_pollute_shared_catalogue():
 candidate=copy.deepcopy(catalog('mock')[0]);candidate['retrieval_channels']=['web_search'];candidate['synthetic']=False
 candidate['matched_capabilities']=['ai_voice_receptionist','lead_capture','appointment_scheduling']
 class Store:
  seeded=[]
  def put(self,*args):pass
  def catalog(self):return []
  def upsert_catalog(self,records):self.seeded=copy.deepcopy(records)
 class Parser:
  def parse_problem(self,*args,**kwargs):return Intent(problem_summary='Phone answering',required_capabilities=['ai_voice_receptionist','lead_capture'])
  def extract_claims(self,*args):return copy.deepcopy(candidate)
 class Search:
  def search(self,*args):return [{'url':candidate['official_url']}]
 class Fetch:
  def fetch(self,url):return {'url':url}
 store=Store();run={'run_id':'test-run','owner':'owner','profile_snapshot':profile(),'problem_text':'I miss phone calls.','discovery_context':{'constraints':'Must keep existing software.'},'usage':{'model_calls':0,'search_calls':0,'estimated_cost_usd':0},'warnings':[],'state_history':[],'tools':[]}
 Orchestrator(store,'live',Parser(),Search(),Fetch()).execute(run)
 assert run['status']=='completed'
 assert len(store.seeded)==1 and 'appointment_scheduling' in store.seeded[0]['matched_capabilities']
 assert not any('still need to be checked' in issue for issue in store.seeded[0]['issues'])
 assert 'appointment_scheduling' not in run['tools'][0]['matched_capabilities']
