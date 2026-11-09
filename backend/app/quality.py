import copy,json,math,re
from urllib.parse import urlsplit
from .prompts import PROMPT_VERSION

RUBRIC_VERSION='evidence-match-v1'
def valid_source(value):
 try:
  p=urlsplit(value or '');return p.scheme=='https' and bool(p.hostname) and not p.username and not p.password
 except ValueError:return False

def evidence_packets(products):
 packets=[]
 for product in products[:8]:
  claims=[]
  for i,e in enumerate(product.get('evidence',[])):
   if e.get('claim_key') not in ('capability','ai_feature') or not valid_source(e.get('source_url')):continue
   claims.append({'evidence_id':f"{product['tool_id']}:e{i}",'kind':e['claim_key'],'value':e['claim_value'],'excerpt':e.get('evidence_excerpt'),'source_url':e['source_url'],'verification':e['verification_state'],'observed_at':e.get('observed_at')})
  packets.append({'tool_id':product['tool_id'],'name':product['name'],'description':product.get('short_description'),'limitations':product.get('issues',[])[:8],'capabilities':product['matched_capabilities'],'claims':claims[:16]})
 return packets

def assess_recommendations(products,intent,provider,profile,problem,context,usage):
 result=copy.deepcopy(products[:8]);packets=evidence_packets(result)
 report={'prompt_version':PROMPT_VERSION,'rubric_version':RUBRIC_VERSION,'retrieved_candidates':len(products),'assessed_candidates':0,'quality_gate_passed':0,'checks':['Controlled capability IDs','Retrieved record identity','Source URL and date presence','Per-tool citation ownership','Separate model evidence audit'],'limitations':['An evidence match index is not a probability of success or an independent product rating.','Price, exact integrations, regional availability and privacy terms still need verification.'],'rejected_candidates':[]}
 assessments={};verdicts={}
 if provider and result:
  try:
   batch=provider.assess_candidates(profile,problem,context,intent,packets,usage)
   ids=[a.tool_id for a in batch.assessments];known={p['tool_id'] for p in packets}
   if len(ids)!=len(set(ids)) or set(ids)!=known:raise ValueError('Invalid candidate identities')
   proposed=[]
   for a in batch.assessments:
    packet=next(p for p in packets if p['tool_id']==a.tool_id);evidence={e['evidence_id'] for e in packet['claims']}
    if a.applicability in ('direct','partial') and (not a.evidence_ids or not set(a.evidence_ids)<=evidence):continue
    if not set(a.evidence_ids)<=evidence:continue
    assessments[a.tool_id]=a;proposed.append(a.model_dump())
   if proposed:
    judged=provider.judge_candidates(problem,context,packets,proposed,usage)
    judge_ids=[v.tool_id for v in judged.verdicts]
    if len(judge_ids)!=len(set(judge_ids)) or set(judge_ids)!={a['tool_id'] for a in proposed}:raise ValueError('Incomplete quality audit')
    verdicts={v.tool_id:v for v in judged.verdicts}
   report['assessed_candidates']=len(assessments)
  except Exception:report['assessment_warning']='AI assessment or evidence audit was unavailable or invalid; unapproved explanations and full scores are withheld.'
 wanted=set(intent.required_capabilities)
 report['assessment_audit']=[{'tool_id':id,'applicability':a.applicability,'audit_passed':bool(verdicts.get(id) and verdicts[id].supported),'audit_reason':verdicts[id].reason if id in verdicts else 'No approved evidence audit'} for id,a in assessments.items()]
 for product,packet in zip(result,packets):
  matched=set(product['matched_capabilities'])&wanted
  backed={e['value'] for e in packet['claims'] if e['kind']=='capability' and isinstance(e['value'],str) and e.get('observed_at') and e['verification'] in ('vendor_documented','third_party_reported','independently_tested')}
  coverage=round(50*len(matched)/len(wanted),1) if wanted else 0
  evidence=round(25*len(matched&backed)/len(matched),1) if matched else 0
  a=assessments.get(product['tool_id']);v=verdicts.get(product['tool_id']);passed=bool(a and v and v.supported and a.applicability in ('direct','partial') and matched)
  provisional=product.get('catalog_status')=='provisional' or not matched<=backed
  points={'direct':25.0,'partial':12.5,'unclear':0.0,'not_relevant':0.0}.get(a.applicability) if passed else None
  requested=(problem+' '+((context or {}).get('desired_outcome') or '')).lower()
  booking_requested='appointment_scheduling' in wanted and bool(re.search(r'book|confirm',requested))
  feature_text=' '.join(str(e['value']) for e in packet['claims'] if e['kind']=='ai_feature' and e['verification'] in ('vendor_documented','third_party_reported','independently_tested')).lower()
  exact_booking_backed=bool(re.search(r'book(?:s|ing)?\s+(?:appointments?|reservations?)|confirm(?:ed|s)?\s+(?:bookings?|appointments?)',feature_text))
  action_limited=bool(booking_requested and not exact_booking_backed)
  if action_limited and points is not None:points=min(points,12.5)
  status='provisional' if provisional else 'passed' if passed else 'withheld' if a or provider else 'not_assessed'
  if a and a.applicability=='not_relevant' and v and v.supported:
   report['rejected_candidates'].append({'tool_id':a.tool_id,'reason':'AI evidence audit did not support relevance to this task.'});product['_rejected']=True
  refs=a.evidence_ids if passed else []
  product['quality']={'rubric_version':RUBRIC_VERSION,'score':round(coverage+evidence+points,1) if passed and not provisional else None,'task_coverage_points':coverage,'source_evidence_points':evidence,'workflow_relevance_points':points,'assessment_status':status,'explanation':a.explanation if passed else None,'evidence_ids':refs,'source_urls':list(dict.fromkeys(e['source_url'] for e in packet['claims'] if e['evidence_id'] in refs)),'checks':report['checks'],'limitations':report['limitations']+(['Provisional or incomplete source evidence prevents a full score.'] if provisional else [])+(['The exact booking action is not established by a broad scheduling tag; workflow points are capped at 12.5.'] if action_limited else [])}
  if passed:report['quality_gate_passed']+=1
 result=[p for p in result if not p.pop('_rejected',False)]
 result.sort(key=lambda p:(p['quality']['score'] is not None,p['quality']['score'] or 0,p['quality']['task_coverage_points']),reverse=True)
 return result,report
