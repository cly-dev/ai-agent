/**
 * §8.B 步序来源与意图冲突 — 夹具回归（不启动完整 LangGraph）。
 */

import { compileTaskPlanToWorkflow } from './compile-plan-to-workflow.util';
import { routeAfterWorkflowInit } from './workflow-graph-routing.util';
import { buildWorkflowInitSkippedPendingRespond } from './workflow-init-skip.util';
import {
  deriveTurnUserIntent,
  resolveSkillIntentAlignment,
} from '../agent-engine/engine/turn/skill-intent-alignment.util';
import { buildSkillCapabilityProfile } from '../agent-engine/engine/turn/skill-capability-profile.util';
import type { TurnRoutingDecision } from '../agent-engine/engine/turn/turn-routing.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { fetchSummarizeTaskPlan } from './workflow-graph-fixture.util';

function minimalRouting(
  overrides: Partial<TurnRoutingDecision> = {},
): TurnRoutingDecision {
  return {
    route: 'orchestrated_task',
    method: 'llm',
    reason: 'test',
    suggestedSkillId: null,
    pageContextApplies: false,
    pageContextTaskKind: 'none',
    llmPageContextTaskKind: 'none',
    hostMutationIntent: false,
    llmWriteChannel: 'none',
    ...overrides,
  };
}

describe('§8.B plan source and intent alignment fixtures', () => {
  it('8.B.1 compiles orchestrated plan from template source', () => {
    const plan = fetchSummarizeTaskPlan();
    const compiled = compileTaskPlanToWorkflow({ plan, workflowId: 0 });
    expect(compiled?.compiledFrom).toBe('legacy_config');
    expect(compiled?.workflowRun.currentNodeId).toBe('fetch');
    expect(compiled?.nodes[0]?.action).toBe('fetch_data');
  });

  it('8.B.3 write vs http-only skill → clarify, no workflow run', () => {
    const routing = minimalRouting({
      hostMutationIntent: true,
      llmWriteChannel: 'host',
    });
    const alignment = resolveSkillIntentAlignment({
      userMessage: '帮我改一下',
      requestedSkillId: 9,
      skillProfile: buildSkillCapabilityProfile({
        skillId: 9,
        skillName: 'HTTP Read',
        skillToolIds: [1],
        hostToolIds: [],
        channels: {
          httpRead: true,
          httpMutation: false,
          hostPush: false,
          primaryWriteChannel: null,
        },
      }),
      skillConfig: null,
      intent: deriveTurnUserIntent({
        routing,
        pageContextPlan: 'none',
        writeChannel: 'http',
      }),
      routing,
    });
    expect(alignment.status).toBe('clarify');
    if (alignment.status === 'clarify') {
      expect(alignment.respond.kind).toBe('skill_intent_mismatch');
    }

    expect(
      routeAfterWorkflowInit({
        finished: false,
        workflowRun: null,
        pendingRespond: buildWorkflowInitSkippedPendingRespond({
          reason: 'no_task_plan',
          userMessage: '帮我改一下',
        }),
      } as AgentGraphState),
    ).toBe('summarize');
  });

  it('8.B.4 read vs host-only skill → intent_first drops explicit skill', () => {
    const routing = minimalRouting({
      route: 'on_page_task',
      pageContextApplies: true,
      pageContextTaskKind: 'answer',
      llmPageContextTaskKind: 'answer',
    });
    const alignment = resolveSkillIntentAlignment({
      userMessage: '说明页面',
      requestedSkillId: 3,
      skillProfile: buildSkillCapabilityProfile({
        skillId: 3,
        skillName: 'Host Only',
        skillToolIds: [],
        hostToolIds: [10],
        channels: {
          httpRead: false,
          httpMutation: false,
          hostPush: true,
          primaryWriteChannel: 'host',
        },
      }),
      skillConfig: null,
      intent: deriveTurnUserIntent({
        routing,
        pageContextPlan: 'entity_read_detail',
      }),
      routing,
    });
    expect(alignment.status).toBe('intent_first');
    if (alignment.status === 'intent_first') {
      expect(alignment.effectiveSkillSelect).not.toBe('explicit');
    }
  });

  it('8.B.6 workflow init hard skip produces pendingRespond → summarize route', () => {
    const pendingRespond = buildWorkflowInitSkippedPendingRespond({
      reason: 'scope_mismatch',
      userMessage: '查询',
    });
    expect(pendingRespond?.mode).toBe('turn');
    expect(
      routeAfterWorkflowInit({
        finished: false,
        workflowRun: null,
        pendingRespond,
      } as AgentGraphState),
    ).toBe('summarize');
  });
});
