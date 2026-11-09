from app.guidance import build_guidance
from app.engine import search_catalog

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
