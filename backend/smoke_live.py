"""Paid operator integration check; uses synthetic profiles, real catalogue and real models."""
import argparse,copy,json,os,tempfile,time
from datetime import datetime,timezone
from pathlib import Path
from uuid import uuid4
from app.contracts import BusinessProfile
from app.engine import DATA,Orchestrator
from app.providers import OpenRouterProvider,OpenRouterSearchAdapter,SafePageFetcher
from app.storage import LocalStore,TrialStore,PostgresStore,now

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--paid-authorized',action='store_true');parser.add_argument('--web',action='store_true');parser.add_argument('--cases',nargs='+',default=['calls','invoices','marketing','inventory']);args=parser.parse_args()
 if not args.paid_authorized:raise SystemExit('Explicit paid authorization is required.')
 shared=PostgresStore(os.environ['DATABASE_URL']);model=os.environ.get('OPENROUTER_MODEL','openai/gpt-4.1-mini');key=os.environ['OPENROUTER_API_KEY'];rows=[]
 cases={'calls':(0,'I miss incoming phone calls and need appointments booked.'),'invoices':(4,'Extract and match invoice details for my bookkeeper.'),'marketing':(3,'Create marketing content for my online shop; no chatbot or appointments.'),'inventory':(2,'Use our sales history to forecast ingredient demand and plan stock purchases.')}
 with tempfile.TemporaryDirectory(prefix='bizzimpact-live-') as directory:
  store=TrialStore(LocalStore(Path(directory)/'trial.sqlite'),shared)
  for name in args.cases:
   index,problem=cases[name];p=copy.deepcopy(json.loads((DATA/'scenarios.json').read_text())['cases'][index]['profile']);p['existing_software']=[{'raw_name':s} if isinstance(s,str) else s for s in p['existing_software']];p=BusinessProfile.model_validate(p).model_dump();owner=str(uuid4());business=str(uuid4());id=str(uuid4());start=time.monotonic()
   run={'run_id':id,'business_id':business,'owner':owner,'status':'queued','mode':'problem_search','profile_snapshot':p,'discovery_context':{'constraints':'I must approve anything before it is sent or purchased.'},'problem_text':problem,'force_web':args.web,'requirements':None,'clarification_question':None,'tools':[],'warnings':[],'error_code':None,'usage':{'model_calls':0,'search_calls':0,'estimated_cost_usd':0},'queries':[],'state_history':[],'synthetic':False,'created_at':now(),'updated_at':now()}
   provider=OpenRouterProvider(key,model,store,credit_floor=5);orchestrator=Orchestrator(store,'live',provider,OpenRouterSearchAdapter(provider) if args.web else None,SafePageFetcher() if args.web else None);orchestrator.execute(run)
   rows.append({'case':name,'status':run['status'],'latency_seconds':round(time.monotonic()-start,3),'usage':run['usage'],'quality_report':run.get('quality_report',{}),'warnings':run['warnings'],'queries':run['queries'],'tools':[{'tool_id':p['tool_id'],'name':p['name'],'quality':p.get('quality'),'source_urls':list(dict.fromkeys(e['source_url'] for e in p['evidence'] if e.get('source_url')))} for p in run['tools']]})
   print(json.dumps({'case':name,'status':run['status'],'tools':len(run['tools']),'approved_scores':sum(t.get('quality',{}).get('score') is not None for t in run['tools']),'usage':run['usage'],'warnings':run['warnings']}),flush=True)
 report={'timestamp':datetime.now(timezone.utc).isoformat(),'model':model,'synthetic_profiles':True,'real_paid_calls':True,'limitations':'Automated consistency checks on vendor claims, not independent product testing or real-owner validation.','cases':rows}
 output=Path('evaluations');output.mkdir(exist_ok=True);path=output/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-rag-smoke.json');path.write_text(json.dumps(report,indent=2)+'\n');print('Report: '+str(path),flush=True)

if __name__=='__main__':main()
