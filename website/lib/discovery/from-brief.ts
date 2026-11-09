// Business Brief → Discovery. Ticked struggles become required needs with certainty (no text
// interpretation); free-text additions stay optional and labelled as inferred.
import type { BusinessBrief } from '../intake/brief';
import { discoverWithIntent, type DiscoveryResult } from './discover';
import type { Intent } from './interpret';

const CONFIDENCE = { focus: 1, secondary: 0.8, inferred: 0.5 } as const;

export function intentFromBrief(brief: BusinessBrief): Intent {
  return {
    capabilities: brief.needs.map(n => ({
      id: n.capabilityId, label: n.label, role: n.priority === 'inferred' ? 'optional' as const : 'required' as const,
      confidence: CONFIDENCE[n.priority], source: n.source === 'free-text' ? 'text' as const : 'questionnaire' as const, evidence: [n.evidence],
    })),
    excluded: [], channels: brief.channels,
    channelSource: brief.channels.length ? 'clarification' : 'not-needed',
    clarification: null, industryHint: brief.business.industry, notes: [],
  };
}

export function discoverFromBrief(brief: BusinessBrief, limit = 40): DiscoveryResult {
  return discoverWithIntent(intentFromBrief(brief), {
    industry: brief.business.industry, teamSize: brief.business.teamSize, budget: brief.constraints.budget,
    software: brief.stack.status === 'not-sure' ? ['Not sure'] : brief.stack.tools, limit,
  }, { interpreter: 'questionnaire-v1', profileSnapshot: { business: brief.business, stack: brief.stack, constraints: brief.constraints } });
}
