// Questionnaire answers → Business Brief → Discovery → Review → Integration.
// Deterministic core, no network. Owner-reported outcomes (if any) are passed in by the caller.
import { buildBrief, type Answers, type BusinessBrief } from './intake/brief';
import { discoverFromBrief } from './discovery/from-brief';
import type { DiscoveryResult } from './discovery/discover';
import { review, type ReviewResult } from './review/review';
import { integrate, type IntegrationResult } from './integration/plan';
import { issuePlanToken, type Report } from './review/outcomes';

export type PlanResult = { brief: BusinessBrief; discovery: DiscoveryResult; review: ReviewResult; integration: IntegrationResult; generatedAt: string; planToken: string; checkInTools: { toolId: string; name: string }[] };

export function runPlan(answers: Answers, reports: Report[] = []): PlanResult {
  const brief = buildBrief(answers);
  const discovery = discoverFromBrief(brief);
  const rev = review(brief, discovery, reports);
  const integration = integrate(brief, rev);
  // Owners may later report on any tool we showed them as an option (plan, top picks, worth a look).
  const shown = [...(integration.recommended?.tools.map(t => t.toolId) ?? []), ...rev.reviews.filter(r => r.status !== 'not-suitable').slice(0, 8).map(r => r.toolId)];
  const checkInTools = [...new Set(shown)].map(id => ({ toolId: id, name: rev.reviews.find(r => r.toolId === id)?.name ?? id }));
  const planToken = issuePlanToken({ toolIds: checkInTools.map(t => t.toolId), industry: brief.business.industry, teamSize: brief.business.teamSize });
  return { brief, discovery, review: rev, integration, generatedAt: new Date().toISOString(), planToken, checkInTools };
}
