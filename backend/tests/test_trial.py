import copy
from fastapi.testclient import TestClient
import app.main as main
from app.engine import catalog
from app.storage import LocalStore
from test_discovery import profile

def trial_service(tmp_path,monkeypatch):
 shared=LocalStore(tmp_path/'shared-budget.sqlite')
 shared.catalog=lambda:copy.deepcopy(catalog('catalog'))
 shared.upsert_catalog=lambda records:None
 monkeypatch.setattr(main,'PostgresStore',lambda _:shared)
 for key,value in {'DISCOVERY_MODE':'live','OPENROUTER_ENABLED':'true','EXPLICIT_LIVE_AUTHORIZED':'true','OPENROUTER_API_KEY':'test-placeholder','OPENROUTER_MODEL':'test/model','PUBLIC_AI_TRIAL_ENABLED':'true'}.items():monkeypatch.setenv(key,value)
 app=main.create_app(tmp_path/'sessions.sqlite',db_url='private-test-db');return TestClient(app),shared

def test_live_trial_uses_real_catalogue_and_shared_ledger_without_paid_baseline(tmp_path,monkeypatch):
 c,shared=trial_service(tmp_path,monkeypatch);assert c.get('/api/v1/availability').json()['live_trial']
 token=c.post('/api/v1/trial').json()['token'];assert token.startswith('trial_');c.headers['Authorization']='Bearer '+token
 context=c.get('/api/v1/context').json();assert context['trial'] and not context['synthetic'] and context['mode']=='live'
 saved=c.post('/api/v1/businesses',json=profile()).json();baseline=c.post('/api/v1/discovery/baseline',json={'business_id':saved['business_id']}).json()
 assert baseline['tools'] and all(not t['synthetic'] for t in baseline['tools']) and baseline['usage']['model_calls']==0
 assert c.post('/api/v1/trial/logout').status_code==200 and c.get('/api/v1/businesses').status_code==401

def test_trial_tokens_do_not_grant_access_to_other_sessions(tmp_path,monkeypatch):
 c,_=trial_service(tmp_path,monkeypatch);first=c.post('/api/v1/trial').json()['token'];c.headers['Authorization']='Bearer '+first
 id=c.post('/api/v1/businesses',json=profile()).json()['business_id'];other=c.post('/api/v1/trial').json()['token'];c.headers['Authorization']='Bearer '+other
 assert c.get(f'/api/v1/businesses/{id}/profile').status_code==404

def test_trial_creation_is_disabled_without_explicit_flags(tmp_path,monkeypatch):
 monkeypatch.delenv('PUBLIC_AI_TRIAL_ENABLED',raising=False);app=main.create_app(tmp_path/'disabled.sqlite');c=TestClient(app)
 assert not c.get('/api/v1/availability').json()['live_trial'];assert c.post('/api/v1/trial').status_code==503

def test_four_search_limit_is_checked_before_a_paid_provider_is_created(tmp_path,monkeypatch):
 c,_=trial_service(tmp_path,monkeypatch);token=c.post('/api/v1/trial').json()['token'];c.headers['Authorization']='Bearer '+token
 id=c.post('/api/v1/businesses',json=profile()).json()['business_id'];owner=c.app.state.local.demo_owner(token)
 for i in range(4):c.app.state.local.put('run',f'run-{i}',owner,{'status':'completed'})
 response=c.post('/api/v1/discovery/runs',json={'business_id':id,'problem_text':'Answer incoming calls.'});assert response.status_code==429
