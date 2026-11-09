"""Explicit, paid operator evaluation. Never runs on import or application startup."""
import argparse,json,os,time
from datetime import datetime,timezone
from pathlib import Path
from app.contracts import BusinessProfile
from app.engine import DATA,interpret
from app.providers import OpenRouterProvider
from app.prompts import PROMPT_VERSION
from app.storage import PostgresStore

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--paid-authorized',action='store_true');parser.add_argument('--models',nargs='+',default=['openai/gpt-4.1-mini']);parser.add_argument('--limit',type=int,default=20);parser.add_argument('--budget-usd',type=float,default=1);parser.add_argument('--cases',default=str(DATA/'discovery-evaluation.json'));args=parser.parse_args()
 if not args.paid_authorized:raise SystemExit('Pass --paid-authorized only after explicit approval.')
 key=os.environ.get('OPENROUTER_API_KEY');db=os.environ.get('DATABASE_URL')
 if not key or not db:raise SystemExit('Configure private OPENROUTER_API_KEY and DATABASE_URL.')
 raw=json.loads((DATA/'scenarios.json').read_text())['cases'][0]['profile'];raw['existing_software']=[{'raw_name':s} for s in raw['existing_software']];raw['industry']={'category':'Other','subtype':'Small business'};raw['business_description']='We run a small business and need help with the described task.';profile=BusinessProfile.model_validate(raw).model_dump()
 cases=json.loads(Path(args.cases).read_text())['cases'][:args.limit];rows=[];spent=0
 for model in args.models:
  provider=OpenRouterProvider(key,model,PostgresStore(db),credit_floor=5)
  for case in cases:
   if spent+0.2>args.budget_usd:break
   usage={'model_calls':0,'search_calls':0,'estimated_cost_usd':0};start=time.monotonic()
   row={'model':model,'case_id':case['id'],'expected':case['expected']}
   try:
    intent=provider.parse_problem(profile,case['problem'],usage,context=case.get('context'))
    predicted=set(intent.required_capabilities);expected=set(case['expected']);allowed=set(case.get('allowed',case['expected']));tasks_ok=expected<=predicted and predicted<=allowed and not predicted&set(case.get('excluded',[]));effective_clarification=interpret(profile,case['problem'],context=case.get('context')).clarification_needed;semantic=tasks_ok and ('clarification' not in case or intent.clarification_needed==case['clarification']);row.update(predicted=sorted(predicted),summary=intent.problem_summary,inferred_attributes=intent.inferred_attributes,exact_match=predicted==expected,semantic_pass=semantic,pipeline_pass=tasks_ok and ('clarification' not in case or effective_clarification==case['clarification']),effective_clarification=effective_clarification,true_positive=len(predicted&expected),false_positive=len(predicted-allowed),false_negative=len(expected-predicted),clarification=intent.clarification_needed)
   except Exception as error:row.update(exact_match=False,semantic_pass=False,error=type(error).__name__,true_positive=0,false_positive=0,false_negative=len(case['expected']))
   row['usage']=usage;row['latency_seconds']=round(time.monotonic()-start,3);spent+=usage['estimated_cost_usd'];rows.append(row)
   print(json.dumps({'model':model,'case':case['id'],'passed':row.get('semantic_pass',False),'predicted':row.get('predicted'),'error':row.get('error'),'cost_usd':round(usage['estimated_cost_usd'],6)}),flush=True)
 summaries=[]
 for model in args.models:
  selected=[r for r in rows if r['model']==model];tp=sum(r.get('true_positive',0) for r in selected);fp=sum(r.get('false_positive',0) for r in selected);fn=sum(r.get('false_negative',0) for r in selected)
  summaries.append({'model':model,'cases':len(selected),'exact_matches':sum(r['exact_match'] for r in selected),'semantic_passes':sum(r.get('semantic_pass',False) for r in selected),'precision':round(tp/(tp+fp),3) if tp+fp else None,'recall':round(tp/(tp+fn),3) if tp+fn else None,'cost_usd':round(sum(r['usage']['estimated_cost_usd'] for r in selected),6),'mean_latency_seconds':round(sum(r['latency_seconds'] for r in selected)/len(selected),3) if selected else None})
 report={'timestamp':datetime.now(timezone.utc).isoformat(),'prompt_version':PROMPT_VERSION,'dataset':Path(args.cases).name,'profile_context':'Neutral small-business profile; scenarios specify the task without a contradictory landscaping profile.','limitations':'Synthetic operator-labelled regression examples; no claim of real-owner accuracy. Reusing these cases for prompt tuning makes them development data. Cost fields are provider-reported when present, otherwise conservative reservations.','budget_usd':args.budget_usd,'total_cost_usd':round(spent,6),'summaries':summaries,'cases':rows}
 directory=Path('evaluations');directory.mkdir(exist_ok=True);path=directory/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-interpretation.json');path.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'report':str(path),'summaries':summaries,'total_cost_usd':round(spent,6)}),flush=True)

if __name__=='__main__':main()
