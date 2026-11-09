from app.guidance import build_guidance
from app.engine import search_catalog
from app.implementation import guide_for,build_plan

def product(id='one',caps=None):
 return {'tool_id':id,'name':'Anyword','official_url':'https://anyword.com/','short_description':'Create marketing copy.','matched_capabilities':caps or ['marketing_content'],'evidence':[{'claim_key':'pricing','claim_value':'Starter plan details','source_url':'https://anyword.com/pricing','verification_state':'vendor_documented'}],'issues':['Confirm publishing permissions.']}

def test_every_tool_gets_customer_facing_setup_guidance_without_scores():
 guidance=build_guidance(product(),{'constraints':'Keep final publishing approval with the owner.'})
 assert guidance['why_it_may_help']=='Create marketing copy.'
 assert 'Create marketing content' in guidance['covers']
 assert any('brand guide' in step for step in guidance['setup_steps'])
 assert any('publishing approval' in check for check in guidance['verify_before_buying'])
 assert 'score' not in guidance

def test_semantic_similarity_orders_only_within_required_capability_results():
 products=[product('lexical'),product('semantic'),product('wrong',['invoice_automation'])]
 results=search_catalog(products,['marketing_content'],query='unrelated words',semantic_scores={'semantic':.91,'lexical':.32,'wrong':.99})
 assert [item['tool_id'] for item in results]==['semantic','lexical']

def test_verified_implementation_plan_personalizes_without_inventing_connections():
 item=product();item['evidence'][0]['observed_at']='2026-11-08T00:00:00Z'
 answers={'goal':'Draft and approve three marketing emails each week.','existing_software':['HubSpot'],'platform':'browser','data_sensitivity':'customer','technical_comfort':'no_code','admin_access':'no','team_size':'2_10'}
 guide=guide_for(item);plan=build_plan(item,answers)
 assert guide['guide_version']=='implementation-1.0.0' and guide['source_urls']==['https://anyword.com/','https://anyword.com/pricing']
 assert plan['personalization_source']=='verified_rules' and plan['usage']['model_calls']==0
 assert any(step['step_id']=='integration' and step['needs_confirmation'] for step in plan['steps'])
 assert any(step['step_id']=='privacy' for step in plan['steps'])
 assert 'supports HubSpot' not in str(plan)

def test_grounded_model_can_reorder_only_known_steps():
 class Provider:
  def call(self,_messages,usage,**_kwargs):
   usage['model_calls']+=1
   return {'content':'{"overview":"Pilot Anyword for approved weekly email drafts.","ordered_step_ids":["pilot","invented","confirm"],"questions_to_confirm":["Who approves the final draft?"]}'}
 answers={'goal':'Draft and approve weekly marketing emails.','existing_software':[],'platform':'browser','data_sensitivity':'public','technical_comfort':'guided','admin_access':'yes','team_size':'just_me'}
 plan=build_plan(product(),answers,Provider())
 assert plan['personalization_source']=='openrouter_grounded' and plan['steps'][0]['step_id']=='pilot'
 assert 'invented' not in [step['step_id'] for step in plan['steps']]
