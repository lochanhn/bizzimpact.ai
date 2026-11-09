import json

CAPABILITY_LABELS={
 'ai_voice_receptionist':'Answer and route incoming calls',
 'lead_capture':'Capture new customer enquiries',
 'automated_followup':'Follow up with leads or customers',
 'appointment_scheduling':'Schedule appointments',
 'quote_generation':'Prepare quotes or estimates',
 'demand_forecasting':'Forecast demand',
 'inventory_optimization':'Plan inventory and purchasing',
 'invoice_automation':'Process invoices',
 'marketing_content':'Create marketing content',
 'customer_support_chat':'Answer website questions',
 'workflow_automation':'Move work between business apps',
}

START_STEPS={
 'ai_voice_receptionist':'Create a test call flow with your hours, service area, common questions and a human fallback.',
 'lead_capture':'Define the customer details you actually need, then test one enquiry from start to finish.',
 'automated_followup':'Draft one approved follow-up message and require human review before any automatic sending.',
 'appointment_scheduling':'Connect a test calendar first and verify availability, time zones, cancellations and double-booking protection.',
 'quote_generation':'Build one sample quote with approved services, prices and taxes; review every quote before sending.',
 'demand_forecasting':'Import a small, non-sensitive sample of historical demand and compare its forecast with your normal process.',
 'inventory_optimization':'Start with one product category and confirm units, suppliers, lead times and reorder approvals.',
 'invoice_automation':'Test with redacted sample invoices and confirm vendor, amount, tax and duplicate handling before posting anything.',
 'marketing_content':'Create one brand guide and a small draft campaign; review facts, claims and tone before publishing.',
 'customer_support_chat':'Load a small set of approved FAQs and add a clear handoff when the answer is uncertain.',
 'workflow_automation':'Map one trigger and one action, then run it with test data before connecting live records.',
}

def _claim_text(product,key):
 values=[]
 for claim in product.get('evidence',[]):
  if claim.get('claim_key')!=key:continue
  value=claim.get('claim_value')
  if isinstance(value,str):
   try:value=json.loads(value)
   except (ValueError,TypeError):pass
  if isinstance(value,dict):
   text=', '.join(f'{k.replace("_"," ")}: {v}' for k,v in value.items() if v not in (None,'',False))
  else:text=str(value)
  if text and text not in values:values.append(text[:240])
 return values

def build_guidance(product,context=None):
 caps=product.get('matched_capabilities') or []
 quality=product.get('quality') or {}
 why=quality.get('explanation') or product.get('short_description') or 'This product has source-backed features related to the task you described.'
 steps=[]
 for cap in caps:
  step=START_STEPS.get(cap)
  if step and step not in steps:steps.append(step)
 if not steps:steps.append('Open the official product page and confirm that the feature you need is available for your business and location.')
 steps.extend([
  'Use fictional or redacted information for the first test; do not connect live customer data yet.',
  'Run one small pilot, compare it with your current process, and keep a manual fallback until the result is reliable.',
 ])
 checks=[]
 constraints=(context or {}).get('constraints')
 if constraints:checks.append('Confirm your stated requirements with the vendor: '+constraints[:220])
 prices=_claim_text(product,'pricing')
 integrations=_claim_text(product,'integration')
 if prices:checks.append('Confirm the current plan and total cost: '+prices[0])
 else:checks.append('Confirm current pricing, usage limits, cancellation terms and any setup fees.')
 if integrations:checks.append('Confirm that the required integration supports the exact action you need: '+integrations[0])
 else:checks.append('Confirm compatibility with the software you already use; a general capability does not prove an integration.')
 for issue in product.get('issues',[]):
  if issue and issue not in checks:checks.append(issue[:260])
 return {
  'why_it_may_help':why[:500],
  'covers':[CAPABILITY_LABELS.get(cap,cap.replace('_',' ').title()) for cap in caps],
  'setup_steps':steps[:6],
  'verify_before_buying':checks[:6],
 }

def attach_guidance(products,context=None):
 for product in products:product['guidance']=build_guidance(product,context)
 return products
