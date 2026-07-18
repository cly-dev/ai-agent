import { resolveWorkflowIntentForPersist } from './resolve-workflow-intent-persist.util';
import { validateWorkflowTopology } from './validate-workflow.util';
import { deriveSkillExecutionChannels } from './derive-skill-execution-channels.util';
import { loadFlowForRunDetailed } from './load-flow-for-run.util';
import { loadSkillExecutionChannels } from './load-skill-execution-channels.util';
import {
  resolveSkillWorkflowForInit,
} from './workflow-init-skill.util';
import type { WorkflowPresetKind } from './workflow-preset.types';
import { listWorkflowPresetCatalog } from './workflow-preset.util';
import { allocateWorkflowIntentStateKeys } from './workflow-intent-state-key.util';
import {
  buildNativeDirectGraphFromIr,
  isWorkflowIrNativeDirectEligible,
} from './workflow-ir-native-direct.util';
import type { WorkflowProfile } from './workflow.types';

/**
 * Flow 主流程集成：Preset/Intent → IR → lower → topology → channels →
 * loadFlowForRun / Skill init 优先 Flow。
 * 不 mock compiler/lower；Prisma 仅 mock 持久化读。
 */

const PRESET_CASES: Array<{
  preset: WorkflowPresetKind;
  profile: WorkflowProfile;
  config: Record<string, unknown>;
  expectChannels: {
    httpRead: boolean;
    httpMutation: boolean;
    hostPush: boolean;
  };
}> = [
  {
    preset: 'fetch_and_answer',
    profile: 'chat_skill',
    config: { readToolId: 11 },
    expectChannels: {
      httpRead: true,
      httpMutation: false,
      hostPush: false,
    },
  },
  {
    preset: 'mutation_submit',
    profile: 'chat_skill',
    config: { writeToolId: 33 },
    expectChannels: {
      httpRead: false,
      httpMutation: true,
      hostPush: false,
    },
  },
  {
    preset: 'page_auto_fill',
    profile: 'page_action',
    config: { readToolId: 11, hostToolId: 22 },
    expectChannels: {
      httpRead: true,
      httpMutation: false,
      hostPush: true,
    },
  },
  {
    preset: 'page_auto_fill',
    profile: 'page_action',
    config: { hostToolId: 22 },
    expectChannels: {
      httpRead: false,
      httpMutation: false,
      hostPush: true,
    },
  },
];

describe('flow main path integration', () => {
  it.each(PRESET_CASES)(
    'preset $preset compiles to reachable legacy graph with expected channels',
    ({ preset, profile, config, expectChannels }) => {
      const resolved = resolveWorkflowIntentForPersist({
        profile,
        preset,
        presetConfig: config,
      });

      expect(resolved.ir.version).toBe(1);
      expect(resolved.ir.nodes.length).toBeGreaterThan(0);
      expect(resolved.legacyGraph.nodes.length).toBeGreaterThan(0);
      expect(resolved.legacyGraph.entryNodeId).toBeTruthy();

      const nodeIds = new Set(resolved.legacyGraph.nodes.map((n) => n.id));
      expect(nodeIds.has(resolved.legacyGraph.entryNodeId)).toBe(true);

      for (const edge of resolved.legacyGraph.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }

      const topo = validateWorkflowTopology({
        nodes: resolved.legacyGraph.nodes,
        edges: resolved.legacyGraph.edges,
        entryNodeId: resolved.legacyGraph.entryNodeId,
      });
      expect(topo).toEqual([]);

      const deliverable = expectChannels.httpMutation ? 'mutation' : 'answer';
      const channels = deriveSkillExecutionChannels({
        nodes: resolved.legacyGraph.nodes,
        deliverable,
        skillToolIds: [],
        hostToolIds: [],
      });
      expect(channels.httpRead).toBe(expectChannels.httpRead);
      expect(channels.httpMutation).toBe(expectChannels.httpMutation);
      expect(channels.hostPush).toBe(expectChannels.hostPush);
    },
  );

  it('mutation preset defaults to compose → await → write (no present/speak)', () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'mutation_submit',
      presetConfig: { writeToolId: 7 },
    });
    const actions = resolved.legacyGraph.nodes.map((n) => n.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'compose_mutation',
        'await_user_confirm',
        'write_data',
      ]),
    );
    expect(actions).not.toContain('present_mutation');
    expect(actions).not.toContain('summarize');
  });

  it('legacy Intent explainBeforeConfirm still materializes present → await → write', () => {
    // 产品 Preset 已不暴露说明开关；仅存量 Intent ===true 兼容
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      intent: {
        version: 1,
        profile: 'chat_skill',
        entryStepId: 'mutate',
        steps: [
          {
            id: 'mutate',
            operation: 'mutate',
            slots: { writeToolId: 7 },
            explainBeforeConfirm: true,
            summarizeAfter: true,
          },
        ],
        edges: [],
      },
    });
    const actions = resolved.legacyGraph.nodes.map((n) => n.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'compose_mutation',
        'present_mutation',
        'await_user_confirm',
        'write_data',
        'summarize',
      ]),
    );

    const present = resolved.legacyGraph.nodes.find(
      (n) => n.action === 'present_mutation',
    )!;
    const awaitConfirm = resolved.legacyGraph.nodes.find(
      (n) => n.action === 'await_user_confirm',
    )!;
    expect(
      resolved.legacyGraph.edges.some(
        (e) => e.from === present.id && e.to === awaitConfirm.id,
      ),
    ).toBe(true);
  });

  it('judge state description survives compile → materialize for detect_clues', () => {
    const { ir, legacyGraph } = resolveWorkflowIntentForPersist({
      profile: 'shared',
      intent: {
        version: 1,
        profile: 'shared',
        entryStepId: 'read',
        steps: [
          {
            id: 'read',
            operation: 'read',
            slots: { readToolIds: [1] },
          },
          {
            id: 'judge',
            operation: 'judge',
            capabilities: { policyHint: '按是否可直接回答分流' },
          },
          {
            id: 'answer',
            operation: 'deliver',
            channel: 'speak',
          },
          {
            id: 'change',
            operation: 'mutate',
            slots: { writeToolId: 9 },
          },
        ],
        edges: [
          { id: 'e0', from: 'read', to: 'judge', kind: 'always' },
          {
            id: 'e1',
            from: 'judge',
            to: 'answer',
            kind: 'state',
            state: {
              key: 'can_answer',
              description: '信息足够，可直接口头回答',
            },
          },
          {
            id: 'e2',
            from: 'judge',
            to: 'change',
            kind: 'state',
            state: {
              key: 'need_mutate',
              description: '需要用户确认后提交变更',
            },
          },
          { id: 'e3', from: 'judge', to: 'answer', kind: 'default' },
        ],
      },
    });

    const whenEdge = ir.edges.find((e) => e.id === 'e1');
    expect(whenEdge).toMatchObject({
      kind: 'when',
      when: 'can_answer',
      whenDescription: '信息足够，可直接口头回答',
    });

    const clueEdge = legacyGraph.edges.find((e) => e.id === 'e1');
    expect(clueEdge?.kind).toBe('clue');
    expect(clueEdge?.clue).toEqual({
      key: 'can_answer',
      description: '信息足够，可直接口头回答',
    });
    expect(
      legacyGraph.nodes.some((n) => n.action === 'detect_clues'),
    ).toBe(true);
  });

  it('page_auto_fill expands to read + fill only (no auto speak)', () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'shared',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 22, readToolId: 11 },
    });
    const ops = resolved.intent.steps.map((s) =>
      s.operation === 'deliver' ? `deliver:${s.channel}` : s.operation,
    );
    expect(ops).toEqual(['read', 'deliver:fill']);
    expect(
      resolved.legacyGraph.nodes.some((n) => n.action === 'summarize'),
    ).toBe(false);
  });

  it('preset catalog returns exactly three product cards', () => {
    const catalog = listWorkflowPresetCatalog();
    expect(catalog.map((r) => r.kind).sort()).toEqual([
      'fetch_and_answer',
      'mutation_submit',
      'page_auto_fill',
    ]);
    const keys = allocateWorkflowIntentStateKeys(['可回答', '可回答']);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('Plan A: native covers flat mutate and legacy explainBeforeConfirm phases', () => {
    const fill = resolveWorkflowIntentForPersist({
      profile: 'shared',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 22, readToolId: 11 },
    });
    expect(isWorkflowIrNativeDirectEligible(fill.ir)).toBe(true);
    const native = buildNativeDirectGraphFromIr(fill.ir);
    expect(native.executionMode).toBe('ir_native_direct');
    expect(native.nodes.every((n) => n.id === n.irNodeId)).toBe(true);

    const mutate = resolveWorkflowIntentForPersist({
      profile: 'shared',
      preset: 'mutation_submit',
      presetConfig: { writeToolId: 33 },
    });
    expect(isWorkflowIrNativeDirectEligible(mutate.ir)).toBe(true);

    // 存量 Intent 才可能 explain===true；Preset 产品面已不写该字段
    const mutateExplain = resolveWorkflowIntentForPersist({
      profile: 'shared',
      intent: {
        version: 1,
        profile: 'shared',
        entryStepId: 'mutate',
        steps: [
          {
            id: 'mutate',
            operation: 'mutate',
            slots: { writeToolId: 33 },
            explainBeforeConfirm: true,
          },
        ],
        edges: [],
      },
    });
    // present→await 相位化：无 materialize 合成的 __present / __draft 后缀
    expect(isWorkflowIrNativeDirectEligible(mutateExplain.ir)).toBe(true);
    const explainGraph = buildNativeDirectGraphFromIr(mutateExplain.ir);
    expect(
      explainGraph.nodes.every(
        (n) => !n.id.endsWith('__present') && !n.id.endsWith('__draft'),
      ),
    ).toBe(true);
    expect(
      Object.values(explainGraph.phasesByNodeId).some((p) => p === 'present'),
    ).toBe(true);
  });

  it('allows mutation presets on any profile', () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      preset: 'mutation_submit',
      presetConfig: { writeToolId: 33 },
    });
    expect(resolved.intent.steps.some((s) => s.operation === 'mutate')).toBe(
      true,
    );
  });

  it('loadFlowForRunDetailed lowers Flow.ir head and returns workflowRun', async () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'fetch_and_answer',
      presetConfig: { readToolId: 11 },
    });

    const prisma = {
      flow: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          version: 2,
          ir: resolved.ir,
          isActive: true,
          appClientId: 1,
        }),
      },
      flowRevision: {
        findUnique: jest.fn(),
      },
    };

    const result = await loadFlowForRunDetailed(prisma as never, {
      flowId: 9,
      appClientId: 1,
    });

    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') {
      return;
    }
    expect(result.workflowId).toBe(9);
    expect(result.version).toBe(2);
    expect(result.nodes.map((n) => n.action)).toEqual([
      'fetch_data',
      'summarize',
    ]);
    expect(result.workflowRun.workflowId).toBe(9);
    expect(prisma.flowRevision.findUnique).not.toHaveBeenCalled();
  });

  it('loadFlowForRunDetailed pins FlowRevision when flowVersion differs from head', async () => {
    const head = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'fetch_and_answer',
      presetConfig: { readToolId: 1 },
    });
    const pinned = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 2 },
    });

    const prisma = {
      flow: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5,
          version: 3,
          ir: head.ir,
          isActive: true,
          appClientId: 1,
        }),
      },
      flowRevision: {
        findUnique: jest.fn().mockResolvedValue({
          ir: pinned.ir,
          version: 1,
        }),
      },
    };

    const result = await loadFlowForRunDetailed(prisma as never, {
      flowId: 5,
      appClientId: 1,
      flowVersion: 1,
    });

    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') {
      return;
    }
    expect(result.version).toBe(1);
    expect(result.nodes.map((n) => n.action)).toEqual([
      'generate_and_push',
    ]);
  });

  it('loadSkillExecutionChannels prefers Flow over legacy Workflow', async () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 22 },
    });

    const prisma = {
      flow: {
        findFirst: jest.fn().mockResolvedValue({
          ir: resolved.ir,
          deliverable: 'answer',
          version: 1,
        }),
      },
      flowRevision: { findUnique: jest.fn() },
      workflow: { findUnique: jest.fn() },
      workflowRevision: { findUnique: jest.fn() },
    };

    const channels = await loadSkillExecutionChannels(prisma as never, {
      flowId: 8,
      flowVersion: 1,
      workflowId: 99,
      workflowVersion: 1,
      skillToolIds: [],
      hostToolIds: [],
    });

    expect(channels.hostPush).toBe(true);
    expect(channels.httpRead).toBe(false);
    expect(prisma.flow.findFirst).toHaveBeenCalled();
    expect(prisma.workflow.findUnique).not.toHaveBeenCalled();
  });

  it('resolveSkillWorkflowForInit prefers flowId over workflowId', async () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'chat_skill',
      preset: 'fetch_and_answer',
      presetConfig: { readToolId: 11 },
    });

    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: 12,
          flowVersion: 1,
          workflowId: 99,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
      flow: {
        findFirst: jest.fn().mockResolvedValue({
          id: 12,
          version: 1,
          ir: resolved.ir,
          isActive: true,
          appClientId: 1,
        }),
      },
      flowRevision: { findUnique: jest.fn() },
      workflow: { findFirst: jest.fn() },
      workflowRevision: { findUnique: jest.fn() },
    };

    const result = await resolveSkillWorkflowForInit(prisma as never, {
      skillId: 3,
      appClientId: 1,
    });

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') {
      return;
    }
    expect(result.source).toBe('flow');
    expect(result.workflow.workflowId).toBe(12);
    expect(prisma.workflow.findFirst).not.toHaveBeenCalled();
  });

  it('resolveSkillWorkflowForInit does not load legacy workflow when flowId absent', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: null,
          flowVersion: null,
          workflowId: 9,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
      workflow: { findFirst: jest.fn() },
      flow: { findFirst: jest.fn() },
    };

    const result = await resolveSkillWorkflowForInit(prisma as never, {
      skillId: 3,
      appClientId: 1,
    });

    expect(result.kind).toBe('no_workflow_binding');
    expect(prisma.workflow.findFirst).not.toHaveBeenCalled();
    expect(prisma.flow.findFirst).not.toHaveBeenCalled();
  });
});
