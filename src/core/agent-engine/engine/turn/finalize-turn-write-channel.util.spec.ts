import {
  deriveSkillExecutionChannels,
  EMPTY_SKILL_EXECUTION_CHANNELS,
} from '../../../workflow/derive-skill-execution-channels.util';
import {
  buildSkillCapabilityProfile,
} from './skill-capability-profile.util';
import {
  deriveTurnUserIntent,
  resolveSkillIntentAlignment,
} from './skill-intent-alignment.util';
import { finalizeTurnWriteChannel } from './finalize-turn-write-channel.util';
import type { TurnRoutingDecision } from './turn-routing.types';
import type { WorkflowNodeDef } from '../../../workflow/workflow.types';

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
    llmWriteChannel: 'none',
    hostMutationIntent: false,
    ...overrides,
  };
}

const mutationWorkflowNodes: WorkflowNodeDef[] = [
  {
    id: 'fetch_before_write',
    action: 'fetch_data',
    name: 'fetch',
    objective: 'fetch',
    input: { toolId: 7 },
  },
  {
    id: 'compose_mutation',
    action: 'compose_mutation',
    name: 'compose',
    objective: 'compose',
    input: { toolId: 18 },
  },
  {
    id: 'await_confirm',
    action: 'await_user_confirm',
    name: 'await',
    objective: 'await',
    input: { confirmKind: 'mutation' },
  },
  {
    id: 'write_data',
    action: 'write_data',
    name: 'write',
    objective: 'write',
    input: { toolId: 18, useComposedArgs: true },
  },
];

describe('skill execution channels + write channel finalize', () => {
  it('derives httpMutation from mutation workflow nodes', () => {
    expect(
      deriveSkillExecutionChannels({
        nodes: mutationWorkflowNodes,
        deliverable: 'mutation',
        skillToolIds: [7, 18],
        hostToolIds: [],
      }),
    ).toEqual({
      httpRead: true,
      httpMutation: true,
      hostPush: false,
      primaryWriteChannel: 'http',
    });
  });

  it('without workflow nodes does not infer httpMutation', () => {
    expect(
      deriveSkillExecutionChannels({
        nodes: [],
        skillToolIds: [7, 18],
        hostToolIds: [],
      }),
    ).toEqual({
      httpRead: true,
      httpMutation: false,
      hostPush: false,
      primaryWriteChannel: null,
    });
  });

  it('anchors dual-capability mutation skill when LLM picks host', () => {
    const dualNodes: WorkflowNodeDef[] = [
      ...mutationWorkflowNodes,
      {
        id: 'push',
        action: 'generate_and_push',
        name: 'push',
        objective: 'push',
        input: { hostToolId: 12 },
      },
    ];
    const raw = minimalRouting({
      route: 'on_page_task',
      llmWriteChannel: 'host',
      hostMutationIntent: true,
      reason: 'misclassified_dual',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: dualNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [12],
    });
    const { writeChannel, routing, skillChannelAnchored } =
      finalizeTurnWriteChannel({ routing: raw, skillChannels: channels });
    expect(skillChannelAnchored).toBe(true);
    expect(writeChannel).toBe('http');
    expect(routing.route).toBe('orchestrated_task');
    expect(routing.llmWriteChannel).toBe('http');
  });

  it('anchors http-only mutation skill when LLM picks host', () => {
    const raw = minimalRouting({
      route: 'on_page_task',
      llmWriteChannel: 'host',
      hostMutationIntent: true,
      reason: 'misclassified',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: mutationWorkflowNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [],
    });
    const { writeChannel, routing, skillChannelAnchored } =
      finalizeTurnWriteChannel({ routing: raw, skillChannels: channels });
    expect(skillChannelAnchored).toBe(true);
    expect(writeChannel).toBe('http');
    expect(routing.route).toBe('orchestrated_task');
    expect(routing.llmWriteChannel).toBe('http');
  });

  it('aligns explicit http mutation skill after channel finalize', () => {
    const raw = minimalRouting({
      route: 'on_page_task',
      llmWriteChannel: 'host',
      hostMutationIntent: true,
    });
    const channels = deriveSkillExecutionChannels({
      nodes: mutationWorkflowNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [],
    });
    const { writeChannel, routing } = finalizeTurnWriteChannel({
      routing: raw,
      skillChannels: channels,
    });
    const alignment = resolveSkillIntentAlignment({
      userMessage: 'reviewId 43690 自动回复',
      requestedSkillId: 2,
      skillProfile: buildSkillCapabilityProfile({
        skillId: 2,
        skillName: '评论自动回复',
        skillToolIds: [7, 18],
        hostToolIds: [],
        channels,
      }),
      skillConfig: null,
      intent: deriveTurnUserIntent({
        routing,
        pageContextPlan: 'none',
        writeChannel,
      }),
      routing,
    });
    expect(alignment.status).toBe('aligned');
  });

  it('still clarifies read-only http skill on write intent', () => {
    const routing = minimalRouting({
      hostMutationIntent: true,
      llmWriteChannel: 'host',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: [],
      skillToolIds: [1],
      hostToolIds: [],
    });
    const alignment = resolveSkillIntentAlignment({
      userMessage: '帮我改一下',
      requestedSkillId: 9,
      skillProfile: buildSkillCapabilityProfile({
        skillId: 9,
        skillName: 'HTTP Read',
        skillToolIds: [1],
        hostToolIds: [],
        channels,
      }),
      skillConfig: null,
      intent: deriveTurnUserIntent({
        routing,
        pageContextPlan: 'none',
        writeChannel: 'host',
      }),
      routing,
    });
    expect(alignment.status).toBe('clarify');
  });

  it('does not anchor when channels are empty', () => {
    const raw = minimalRouting({
      hostMutationIntent: true,
      llmWriteChannel: 'host',
    });
    const { writeChannel, skillChannelAnchored } = finalizeTurnWriteChannel({
      routing: raw,
      skillChannels: EMPTY_SKILL_EXECUTION_CHANNELS,
    });
    expect(skillChannelAnchored).toBe(false);
    expect(writeChannel).toBe('host');
  });
});
