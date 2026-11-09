import copy
import pytest
from app.contracts import AssessmentBatch,VerdictBatch,Intent
from app.quality import assess_recommendations,evidence_packets
from app.engine import catalog
from test_discovery import profile

def product():
 p=copy.deepcopy(catalog('catalog')[0]);p['matched_capabilities']=['lead_capture','appointment_scheduling'];p['catalog_status']='seeded';p['evidence']=[{'claim_key':'capability','claim_value':cap,'source_url':'https://vendor.example/features','verification_state':'vendor_documented','observed_at':'2026-11-08'} for cap in p['matched_capabilities']];return p
class Provider:
 def __init__(self,mode='valid'):self.mode=mode
 def assess_candidates(self,profile,problem,context,intent,packets,usage):
  p=packets[0];id='invented-tool' if self.mode=='unknown_tool' else p['tool_id'];refs=['wrong-tool:e0'] if self.mode=='wrong_citation' else [e['evidence_id'] for e in p['claims']]
  return AssessmentBatch(assessments=[{'tool_id':id,'applicability':'direct','explanation':'Covers lead capture and appointment scheduling.','evidence_ids':refs}])
 def judge_candidates(self,problem,context,packets,proposed,usage):return VerdictBatch(verdicts=[{'tool_id':p['tool_id'],'supported':self.mode!='judge_rejects','reason':'Checked against source claims.'} for p in packets])
def assess(p=None,provider=None):return assess_recommendations([p or product()],Intent(problem_summary='Capture requests and book appointments',required_capabilities=['lead_capture','appointment_scheduling']),provider,profile(),'Capture requests and book appointments.',{}, {'model_calls':0,'search_calls':0,'estimated_cost_usd':0})

def test_score_is_computed_from_explicit_rubric_not_model_number():
 p=product();p['evidence'].append({'claim_key':'ai_feature','claim_value':'Books appointments directly after the owner approves the rules.','source_url':'https://vendor.example/features','verification_state':'vendor_documented','observed_at':'2026-11-08'})
 products,report=assess(p,Provider());quality=products[0]['quality']
 assert quality['score']==100 and quality['task_coverage_points']==50 and quality['source_evidence_points']==25 and quality['workflow_relevance_points']==25
 assert quality['assessment_status']=='passed' and report['quality_gate_passed']==1
 assert quality['source_urls']==['https://vendor.example/features']

def test_generic_scheduling_tag_cannot_earn_full_workflow_points_for_booking():
 products,_=assess(provider=Provider());quality=products[0]['quality']
 assert quality['workflow_relevance_points']==12.5 and quality['score']==87.5
 assert any('exact booking action' in text.lower() for text in quality['limitations'])

@pytest.mark.parametrize('mode',['unknown_tool','wrong_citation','judge_rejects'])
def test_unsupported_identity_citations_or_explanations_are_withheld(mode):
 products,report=assess(provider=Provider(mode));quality=products[0]['quality']
 assert quality['score'] is None and quality['explanation'] is None
 assert report['quality_gate_passed']==0

def test_unreviewed_web_claims_cannot_receive_full_score():
 p=product();p['catalog_status']='provisional'
 products,_=assess(p,Provider());assert products[0]['quality']['score'] is None and products[0]['quality']['assessment_status']=='provisional'

def test_no_model_means_no_invented_ai_explanation_or_full_score():
 products,_=assess();q=products[0]['quality'];assert q['score'] is None and q['explanation'] is None and q['assessment_status']=='not_assessed'

def test_only_capability_and_feature_claims_are_sent_for_scoring():
 p=product();p['evidence'].append({'claim_key':'pricing','claim_value':'Unverified price','source_url':'https://vendor.example','verification_state':'unverified'})
 packets=evidence_packets([p]);assert len(packets[0]['claims'])==2

def test_missing_sources_cannot_inflate_source_points():
 p=product();p['evidence'][0]['source_url']=None
 products,_=assess(p,Provider());q=products[0]['quality'];assert q['source_evidence_points']==12.5 and q['score'] is None

def test_credit_floor_prevents_post_and_spend_reservation(tmp_path):
 import httpx
 from app.providers import OpenRouterProvider,BudgetStopped
 from app.storage import LocalStore
 methods=[]
 def reply(request):methods.append(request.method);return httpx.Response(200,json={'data':{'limit_remaining':4.99}})
 store=LocalStore(tmp_path/'budget.sqlite');provider=OpenRouterProvider('test','test/model',store,httpx.Client(transport=httpx.MockTransport(reply)),credit_floor=5);usage={'model_calls':0,'search_calls':0,'estimated_cost_usd':0}
 with pytest.raises(BudgetStopped):provider.call([],usage)
 assert methods==['GET'] and usage['model_calls']==0
 with store.connect() as c:assert c.execute('select spent from spend where id=1').fetchone()[0]==0

def test_rejected_non_search_request_refunds_unused_reservation(tmp_path):
 import httpx
 from app.providers import OpenRouterProvider
 from app.storage import LocalStore
 store=LocalStore(tmp_path/'rejected.sqlite');client=httpx.Client(transport=httpx.MockTransport(lambda _:httpx.Response(400,json={'error':{'message':'Unsupported schema'}})));provider=OpenRouterProvider('test','test/model',store,client);usage={'model_calls':0,'search_calls':0,'estimated_cost_usd':0}
 with pytest.raises(httpx.HTTPStatusError):provider.call([],usage)
 assert usage['estimated_cost_usd']==0
 with store.connect() as c:assert c.execute('select spent from spend where id=1').fetchone()[0]==0

def test_capability_extraction_requires_controlled_ids():
 from app.contracts import ExtractedClaim
 with pytest.raises(ValueError):ExtractedClaim(claim_key='capability',claim_value='Some vague stock feature',evidence_excerpt='Stock planning')
 assert ExtractedClaim(claim_key='capability',claim_value='inventory_optimization',evidence_excerpt='Stock planning').claim_value=='inventory_optimization'

def test_undated_claims_do_not_receive_complete_source_points():
 p=product();p['evidence'][0]['observed_at']=None
 products,_=assess(p,Provider());assert products[0]['quality']['source_evidence_points']==12.5 and products[0]['quality']['score'] is None
