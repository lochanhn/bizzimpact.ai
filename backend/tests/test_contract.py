import json
from app.main import create_app
from app.engine import DATA
from fastapi.testclient import TestClient

def test_required_api_routes_are_present(tmp_path):
 app=create_app(tmp_path/'contract.sqlite');actual={(method,route.path) for route in app.routes if hasattr(route,'methods') for method in route.methods}
 expected={('GET','/api/v1/onboarding/schema'),('GET','/api/v1/businesses'),('POST','/api/v1/businesses'),('GET','/api/v1/businesses/{business_id}/profile'),('PUT','/api/v1/businesses/{business_id}/profile'),('POST','/api/v1/discovery/baseline'),('POST','/api/v1/discovery/runs'),('GET','/api/v1/discovery/runs/{run_id}'),('POST','/api/v1/discovery/runs/{run_id}/clarification'),('GET','/api/v1/tools/{tool_id}')}
 assert expected<=actual

def test_catalogue_mirror_and_claim_provenance_are_consistent():
 records=json.loads((DATA/'researched-catalog.json').read_text());mirror=json.loads((DATA.parents[1]/'website/data/discovery-catalog.json').read_text());assert records==mirror;assert len(records)==111
 for tool in records:
  assert 'score' not in tool and 'stars' not in tool
  for e in tool['evidence']:assert e['source_url'].startswith('https://') and e['observed_at'] and e['verification_state']=='vendor_documented'

def test_schema_is_frozen_across_frontend_backend():
 backend=json.loads((DATA/'onboarding-spec.json').read_text());frontend=json.loads((DATA.parents[1]/'website/data/onboarding-spec.json').read_text());assert backend==frontend
 assert [q['id'] for q in backend['questions'] if q.get('conditional')]==['Q9']
