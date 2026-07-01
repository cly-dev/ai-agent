import { deriveSkillExecutionChannels } from './derive-skill-execution-channels.util';
import type { WorkflowNodeDef } from './workflow.types';

describe('deriveSkillExecutionChannels', () => {
  it('detects mutation_submit style workflow', () => {
    const nodes: WorkflowNodeDef[] = [
      {
        id: 'fetch',
        action: 'fetch_data',
        name: 'fetch',
        objective: 'o',
        input: { toolId: 7 },
      },
      {
        id: 'compose',
        action: 'compose_mutation',
        name: 'compose',
        objective: 'o',
        input: { toolId: 18 },
      },
      {
        id: 'await',
        action: 'await_user_confirm',
        name: 'await',
        objective: 'o',
        input: { confirmKind: 'mutation' },
      },
      {
        id: 'write',
        action: 'write_data',
        name: 'write',
        objective: 'o',
        input: { toolId: 18 },
      },
    ];
    expect(
      deriveSkillExecutionChannels({
        nodes,
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

  it('detects page push workflow', () => {
    const nodes: WorkflowNodeDef[] = [
      {
        id: 'load',
        action: 'load_page_context',
        name: 'load',
        objective: 'o',
        input: {},
      },
      {
        id: 'push',
        action: 'generate_and_push',
        name: 'push',
        objective: 'o',
        input: { hostToolId: 12 },
      },
    ];
    expect(
      deriveSkillExecutionChannels({
        nodes,
        deliverable: 'answer',
        skillToolIds: [],
        hostToolIds: [12],
      }),
    ).toEqual({
      httpRead: true,
      httpMutation: false,
      hostPush: true,
      primaryWriteChannel: 'host',
    });
  });

  it('prefers http primary channel on dual-capability mutation workflow', () => {
    const nodes: WorkflowNodeDef[] = [
      {
        id: 'fetch',
        action: 'fetch_data',
        name: 'fetch',
        objective: 'o',
        input: { toolId: 7 },
      },
      {
        id: 'compose',
        action: 'compose_mutation',
        name: 'compose',
        objective: 'o',
        input: { toolId: 18 },
      },
      {
        id: 'push',
        action: 'generate_and_push',
        name: 'push',
        objective: 'o',
        input: { hostToolId: 12 },
      },
    ];
    expect(
      deriveSkillExecutionChannels({
        nodes,
        deliverable: 'mutation',
        skillToolIds: [7, 18],
        hostToolIds: [12],
      }),
    ).toEqual({
      httpRead: true,
      httpMutation: true,
      hostPush: true,
      primaryWriteChannel: 'http',
    });
  });
});
