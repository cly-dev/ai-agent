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
import {
  reconcileTurnIntent,
  routeFromTaskKind,
  writeChannelFromTaskKind,
} from './resolve-turn-task-kind.util';
import type { TurnRouteDraft } from './turn-routing.types';
import { DEFAULT_TURN_READ_DELIVERABLE } from './turn-routing.types';
import type { WorkflowNodeDef } from '../../../workflow/workflow.types';

function minimalRouteDraft(
  overrides: Partial<TurnRouteDraft> = {},
): TurnRouteDraft {
  return {
    route: 'orchestrated_task',
    method: 'llm',
    reason: 'test',
    suggestedSkillId: null,
    pageContextApplies: false,
    llmPageContextTaskKind: 'none',
    readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    draftWriteChannel: 'none',
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

describe('reconcileTurnIntent', () => {
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

  it('anchors dual-capability mutation skill when route draft picks host', () => {
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
    const routeDraft = minimalRouteDraft({
      route: 'on_page_task',
      draftWriteChannel: 'host',
      reason: 'misclassified_dual',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: dualNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [12],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
    });
    expect(reconciled.skillChannelAnchored).toBe(true);
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('http');
    expect(routeFromTaskKind(reconciled.taskKind)).toBe('orchestrated_task');
    expect(reconciled.taskKind).toBe('http_mutation');
  });

  it('anchors http-only mutation skill when route draft picks host', () => {
    const routeDraft = minimalRouteDraft({
      route: 'on_page_task',
      draftWriteChannel: 'host',
      reason: 'misclassified',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: mutationWorkflowNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
    });
    expect(reconciled.skillChannelAnchored).toBe(true);
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('http');
    expect(routeFromTaskKind(reconciled.taskKind)).toBe('orchestrated_task');
    expect(reconciled.taskKind).toBe('http_mutation');
  });

  it('aligns explicit http mutation skill after reconcile', () => {
    const routeDraft = minimalRouteDraft({
      route: 'on_page_task',
      draftWriteChannel: 'host',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: mutationWorkflowNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
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
      taskKind: reconciled.taskKind,
      intent: deriveTurnUserIntent({
        taskKind: reconciled.taskKind,
        pageContextPlan: 'none',
      }),
      routeMeta: reconciled.routeMeta,
    });
    expect(alignment.status).toBe('aligned');
  });

  it('still clarifies read-only http skill on write intent', () => {
    const routeDraft = minimalRouteDraft({
      draftWriteChannel: 'host',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: [],
      skillToolIds: [1],
      hostToolIds: [],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
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
      taskKind: reconciled.taskKind,
      intent: deriveTurnUserIntent({
        taskKind: reconciled.taskKind,
        pageContextPlan: 'none',
      }),
      routeMeta: reconciled.routeMeta,
    });
    expect(alignment.status).toBe('clarify');
  });

  it('does not anchor when channels are empty', () => {
    const routeDraft = minimalRouteDraft({
      draftWriteChannel: 'host',
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: EMPTY_SKILL_EXECUTION_CHANNELS,
      explicitSkill: true,
    });
    expect(reconciled.skillChannelAnchored).toBe(false);
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('host');
  });

  it('aligns explicit http read skill when route draft mislabels analyze as mutation', () => {
    const routeDraft = minimalRouteDraft({
      route: 'orchestrated_task',
      llmPageContextTaskKind: 'mutation',
      draftWriteChannel: 'http',
      reason: 'misclassified_analyze_as_write',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: [
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'fetch',
          objective: 'fetch reviews',
          input: { toolId: 7 },
        },
        {
          id: 'summarize',
          action: 'summarize',
          name: 'summarize',
          objective: 'summarize',
          input: {},
        },
      ],
      skillToolIds: [7],
      hostToolIds: [],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
    });
    expect(reconciled.taskKind).toBe('orchestrated_read');
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('none');

    const alignment = resolveSkillIntentAlignment({
      userMessage: '分析 2025-2026 a-premium 评论数据',
      requestedSkillId: 1,
      skillProfile: buildSkillCapabilityProfile({
        skillId: 1,
        skillName: '评论分析',
        skillToolIds: [7],
        hostToolIds: [],
        channels,
      }),
      skillConfig: null,
      taskKind: reconciled.taskKind,
      intent: deriveTurnUserIntent({
        taskKind: reconciled.taskKind,
        pageContextPlan: 'none',
      }),
      routeMeta: reconciled.routeMeta,
    });
    expect(alignment.status).toBe('aligned');
  });

  it('dual-capability skill uses read signals when route draft mislabels analyze as mutation', () => {
    const routeDraft = minimalRouteDraft({
      route: 'orchestrated_task',
      llmPageContextTaskKind: 'analyze',
      draftWriteChannel: 'http',
    });
    const channels = deriveSkillExecutionChannels({
      nodes: mutationWorkflowNodes,
      deliverable: 'mutation',
      skillToolIds: [7, 18],
      hostToolIds: [],
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: channels,
      explicitSkill: true,
    });
    expect(reconciled.taskKind).toBe('orchestrated_read');
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('none');
  });

  it('keeps orchestrated_read when route is orchestrated_task without explicit skill even if draftWriteChannel is http', () => {
    const routeDraft = minimalRouteDraft({
      route: 'orchestrated_task',
      llmPageContextTaskKind: 'analyze',
      draftWriteChannel: 'http',
      reason: 'mislabeled_http_write_on_read_analysis',
    });
    const reconciled = reconcileTurnIntent({
      routeDraft,
      pageContext: null,
      skillChannels: EMPTY_SKILL_EXECUTION_CHANNELS,
      explicitSkill: false,
    });
    expect(reconciled.taskKind).toBe('orchestrated_read');
    expect(writeChannelFromTaskKind(reconciled.taskKind)).toBe('none');
  });
});
