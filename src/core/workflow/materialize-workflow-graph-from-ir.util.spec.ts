import { resolveWorkflowIntentForPersist } from './resolve-workflow-intent-persist.util';
import {
  materializeDirectIrNode,
  materializeExpandIrNode,
  materializeWorkflowGraphFromIr,
  workflowIrHasExpandTypes,
} from './materialize-workflow-graph-from-ir.util';
import { validateWorkflowIrTopology } from './validate-workflow-ir-topology.util';
import { deriveSkillExecutionChannelsFromIr } from './derive-skill-execution-channels-from-ir.util';
import { lowerWorkflowIrToLegacyGraph } from './lower-ir-to-legacy-graph.util';
import { initWorkflowRun } from './workflow-run.util';
import {
  projectIrRunNodeStatuses,
  resolveCurrentIrNodeId,
} from './project-ir-run-status.util';

describe('materializeWorkflowGraphFromIr', () => {
  it('direct-only preset fetch_and_answer materializes without lower', () => {
    const { ir } = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'fetch_and_answer',
      presetConfig: { readToolId: 11 },
    });
    expect(workflowIrHasExpandTypes(ir)).toBe(false);
    expect(validateWorkflowIrTopology(ir)).toEqual([]);

    const graph = materializeWorkflowGraphFromIr(ir);
    expect(graph.materializedDirectFromIr).toBe(true);
    expect(graph.nodes.every((n) => n.irType != null)).toBe(true);

    const lowered = lowerWorkflowIrToLegacyGraph(ir);
    expect(graph.nodes.map((n) => n.id)).toEqual(
      lowered.nodes.map((n) => n.id),
    );
    expect(graph.nodes.map((n) => n.action)).toEqual(
      lowered.nodes.map((n) => n.action),
    );
  });

  it('mutation preset defaults to compose → await → write without present/speak', () => {
    const { ir } = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'mutation_submit',
      presetConfig: { writeToolId: 33 },
    });
    const graph = materializeWorkflowGraphFromIr(ir);
    const actions = graph.nodes.map((n) => n.action);
    expect(actions).toContain('compose_mutation');
    expect(actions).toContain('await_user_confirm');
    expect(actions).toContain('write_data');
    expect(actions).not.toContain('present_mutation');
    expect(actions).not.toContain('summarize');
  });

  it('legacy Intent explainBeforeConfirm true keeps present_mutation', () => {
    const { ir } = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      intent: {
        version: 1,
        profile: 'chat_skill',
        entryStepId: 'mutate',
        steps: [
          {
            id: 'mutate',
            operation: 'mutate',
            slots: { writeToolId: 33 },
            explainBeforeConfirm: true,
            summarizeAfter: true,
          },
        ],
        edges: [],
      },
    });
    const graph = materializeWorkflowGraphFromIr(ir);
    expect(graph.nodes.some((n) => n.action === 'present_mutation')).toBe(true);
    expect(graph.nodes.some((n) => n.action === 'summarize')).toBe(true);
  });

  it('llm vision expand materializes summarize_images with irType llm', () => {
    const { ir } = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      intent: {
        version: 1,
        profile: 'page_action',
        entryStepId: 'read',
        steps: [
          {
            id: 'read',
            operation: 'read',
            capabilities: {
              images: { enabled: true, from: 'page_context' },
            },
          },
          {
            id: 'speak',
            operation: 'deliver',
            channel: 'speak',
          },
        ],
        edges: [
          { id: 'e1', from: 'read', to: 'speak', kind: 'always' },
        ],
      },
    });
    const visionNode = ir.nodes.find((n) => n.type === 'llm');
    expect(visionNode).toBeDefined();
    const defs = materializeExpandIrNode(visionNode!);
    expect(defs[0]?.action).toBe('summarize_images');
    expect(defs[0]?.irType).toBe('llm');
    expect(defs[0]?.irConfig).toEqual(
      expect.objectContaining({
        capabilities: { vision: true },
      }),
    );
  });

  it('deriveSkillExecutionChannelsFromIr matches preset expectations', () => {
    const { ir } = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 22, readToolId: 11 },
    });
    expect(deriveSkillExecutionChannelsFromIr({ ir })).toEqual({
      httpRead: true,
      httpMutation: false,
      hostPush: true,
      primaryWriteChannel: 'host',
    });
  });

  it('materializeDirectIrNode stamps irType on data_query', () => {
    const def = materializeDirectIrNode({
      id: 'read',
      type: 'data_query',
      config: { toolIds: [1], objective: 'fetch' },
    });
    expect(def.irType).toBe('data_query');
    expect(def.action).toBe('fetch_data');
    expect(def.irConfig).toEqual({ toolIds: [1], objective: 'fetch' });
    expect(def.input).toEqual({
      toolIds: [1],
      completeWhen: undefined,
    });
  });

  it('empty IR yields empty channels', () => {
    expect(
      deriveSkillExecutionChannelsFromIr({
        ir: { version: 1, entryNodeId: 'x', nodes: [], edges: [] },
        deliverable: 'mutation',
      }),
    ).toEqual({
      httpRead: false,
      httpMutation: false,
      hostPush: false,
      primaryWriteChannel: null,
    });
  });
});
