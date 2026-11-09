from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
CAPABILITIES=('ai_voice_receptionist','lead_capture','automated_followup','appointment_scheduling','quote_generation','demand_forecasting','inventory_optimization','invoice_automation','marketing_content','customer_support_chat','workflow_automation')
Capability=Literal['ai_voice_receptionist','lead_capture','automated_followup','appointment_scheduling','quote_generation','demand_forecasting','inventory_optimization','invoice_automation','marketing_content','customer_support_chat','workflow_automation']
PRIORITIES=('Marketing','Getting new customers','Sales','Customer service','Scheduling','Inventory & purchasing','Logistics & delivery','Finance & invoicing','HR & workforce','Administrative work','Analytics & planning','Not sure yet')
CHANNELS=('Phone calls','Email','Website','Social media','WhatsApp / SMS','Walk-ins','Online marketplaces','Other')
class StrictModel(BaseModel):
 model_config=ConfigDict(extra='forbid',str_strip_whitespace=True)
class Industry(StrictModel):
 category:str=Field(min_length=1,max_length=100)
 subtype:str=Field(min_length=1,max_length=100)
 raw_custom:str|None=Field(default=None,max_length=100)
class Region(StrictModel):
 country:str=Field(min_length=2,max_length=2,pattern=r'^[A-Za-z]{2}$')
 region:str|None=Field(default=None,max_length=100)
 @field_validator('country')
 @classmethod
 def uppercase(cls,value):return value.upper()
class Software(StrictModel):
 raw_name:str=Field(min_length=1,max_length=100)
 canonical_id:str|None=Field(default=None,max_length=100)
class BusinessProfile(StrictModel):
 industry:Industry
 business_description:str=Field(min_length=1,max_length=500)
 customer_type:Literal['b2c','b2b','both','government','other']|None=None
 customer_description:str|None=Field(default=None,max_length=300)
 employee_band:Literal['solo','2_10','11_50','51_250','250_plus']
 operating_region:Region
 existing_software_status:Literal['selected','none','unknown']
 existing_software:list[Software]=Field(max_length=30)
 improvement_priorities:list[str]=Field(default_factory=list,max_length=3)
 monthly_budget_band:Literal['free','under_50','50_150','150_500','over_500','unknown']|None=None
 customer_contact_channels:list[str]|None=Field(default=None,max_length=8)
 @model_validator(mode='after')
 def consistency(self):
  if (self.existing_software_status=='selected')!=bool(self.existing_software):raise ValueError('Choose selected software, None, or Not sure exclusively.')
  if len({s.raw_name.lower() for s in self.existing_software})!=len(self.existing_software):raise ValueError('Software selections must be unique.')
  if any(x not in PRIORITIES for x in self.improvement_priorities):raise ValueError('Unknown priority.')
  if len(set(self.improvement_priorities))!=len(self.improvement_priorities):raise ValueError('Duplicate priority.')
  if 'Not sure yet' in self.improvement_priorities and len(self.improvement_priorities)>1:raise ValueError('Not sure yet is exclusive.')
  if self.customer_contact_channels and (len(set(self.customer_contact_channels))!=len(self.customer_contact_channels) or any(x not in CHANNELS for x in self.customer_contact_channels)):raise ValueError('Invalid contact channel.')
  return self
class DiscoveryContext(StrictModel):
 current_workflow:str|None=Field(default=None,max_length=500)
 desired_outcome:str|None=Field(default=None,max_length=500)
 constraints:str|None=Field(default=None,max_length=500)
class DiscoveryRequest(StrictModel):
 business_id:str=Field(pattern=r'^[0-9a-fA-F-]{36}$')
 problem_text:str=Field(min_length=10,max_length=2000)
 force_web:bool=False
 context:DiscoveryContext=Field(default_factory=DiscoveryContext)
class BusinessRequest(StrictModel):
 business_id:str=Field(pattern=r'^[0-9a-fA-F-]{36}$')
class Clarification(StrictModel):
 # Compatibility extension: documented reference minLength=1 did not represent Skip.
 answer:str|None=Field(default=None,max_length=500)
 skip:bool=False
 @model_validator(mode='after')
 def either(self):
  if not self.skip and not self.answer:raise ValueError('Answer or explicitly skip.')
  return self
class Intent(StrictModel):
 problem_summary:str=Field(max_length=500)
 required_capabilities:list[Capability]=Field(default_factory=list,max_length=11)
 optional_capabilities:list[Capability]=Field(default_factory=list,max_length=11)
 explicit_attributes:list[str]=Field(default_factory=list,max_length=15)
 inferred_attributes:list[str]=Field(default_factory=list,max_length=15)
 clarification_needed:bool=False
class ExtractedClaim(StrictModel):
 claim_key:Literal['ai_feature','capability','integration','pricing']
 claim_value:str=Field(min_length=1,max_length=300)
 evidence_excerpt:str=Field(min_length=1,max_length=180)
 @model_validator(mode='after')
 def controlled_capability_value(self):
  if self.claim_key=='capability' and self.claim_value not in CAPABILITIES:raise ValueError('Capability claims must use a controlled capability ID.')
  return self
class ExtractedProduct(StrictModel):
 name:str=Field(min_length=1,max_length=100)
 description:str=Field(max_length=400)
 capabilities:list[Capability]=Field(max_length=11)
 claims:list[ExtractedClaim]=Field(max_length=8)
class CandidateAssessment(StrictModel):
 tool_id:str=Field(min_length=1,max_length=100)
 applicability:Literal['direct','partial','unclear','not_relevant']
 explanation:str=Field(min_length=1,max_length=400)
 evidence_ids:list[str]=Field(max_length=8)
class AssessmentBatch(StrictModel):
 assessments:list[CandidateAssessment]=Field(max_length=8)
class CandidateVerdict(StrictModel):
 tool_id:str=Field(min_length=1,max_length=100)
 supported:bool=Field(description='True if the explanation is factually grounded in its cited evidence, including honest partial relevance with explicit unknowns. This does NOT mean the product satisfies every requirement.')
 reason:str=Field(max_length=300)
class VerdictBatch(StrictModel):
 verdicts:list[CandidateVerdict]=Field(max_length=8)
class MatchQuality(BaseModel):
 rubric_version:str='evidence-match-v1'
 score:float|None=None
 task_coverage_points:float
 source_evidence_points:float
 workflow_relevance_points:float|None=None
 assessment_status:Literal['passed','withheld','not_assessed','provisional']
 explanation:str|None=None
 evidence_ids:list[str]=Field(default_factory=list)
 source_urls:list[str]=Field(default_factory=list)
 checks:list[str]=Field(default_factory=list)
 limitations:list[str]=Field(default_factory=list)

class ClaimEvidence(BaseModel):
 claim_key:str
 claim_value:object=None
 verification_state:Literal['vendor_documented','third_party_reported','independently_tested','unverified','conflicting']
 source_url:str|None=None
 observed_at:str|None=None
 evidence_excerpt:str|None=None
class DiscoveredTool(BaseModel):
 tool_id:str
 name:str
 official_url:str
 short_description:str|None=None
 ai_classification:Literal['ai_native','ai_enabled','non_ai_complement','unverified']='unverified'
 catalog_status:Literal['seeded','provisional','confirmed','rejected']
 matched_capabilities:list[Capability]
 retrieval_channels:list[str]
 discovery_status:Literal['candidate','evidence_pending','verified_candidate','rejected']='candidate'
 evidence:list[ClaimEvidence]
 issues:list[str]=Field(default_factory=list)
 synthetic:bool=False
 quality:MatchQuality|None=None
class Usage(BaseModel):
 model_config=ConfigDict(extra='allow')
 model_calls:int=Field(ge=0)
 search_calls:int=Field(ge=0)
 estimated_cost_usd:float=Field(ge=0,allow_inf_nan=False)
class DiscoveryRunCreated(BaseModel):
 run_id:str
 status:Literal['queued']='queued'
 poll_url:str
 estimated_duration_note:str|None=None
class DiscoveryRun(BaseModel):
 run_id:str
 business_id:str
 status:Literal['queued','parsing','needs_clarification','catalog_search','web_search','enriching','completed','partial','failed']
 mode:Literal['baseline','problem_search']
 requirements:Intent|None=None
 clarification_question:str|None=None
 tools:list[DiscoveredTool]
 warnings:list[str]
 error_code:str|None=None
 usage:Usage
 profile_snapshot:BusinessProfile
 discovery_context:DiscoveryContext=Field(default_factory=DiscoveryContext)
 quality_report:dict=Field(default_factory=dict)
 state_history:list[dict]
 queries:list[dict]
 synthetic:bool
 created_at:str
 updated_at:str
class BaselineResult(BaseModel):
 business_id:str
 capability_categories:list[Capability]
 tools:list[DiscoveredTool]
 is_baseline:Literal[True]=True
 usage:Usage
 synthetic:bool
class BusinessCreated(BaseModel):
 business_id:str
 profile:BusinessProfile
