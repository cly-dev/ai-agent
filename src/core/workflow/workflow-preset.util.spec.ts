import {
  expandWorkflowPreset,
  listWorkflowPresetCatalog,
  validateWorkflowPresetInput,
} from './workflow-preset.util';
import type { WorkflowPresetKind } from './workflow-preset.types';
import type { WorkflowProfile } from './workflow.types';

describe('workflow-preset.util', () => {
  it('lists presets filtered by profile', () => {
    const pagePresets = listWorkflowPresetCatalog('page_action');
    expect(pagePresets.map((row) => row.kind)).toEqual([
      'page_auto_fill',
      'page_context_push',
      'fetch_push_summarize',
    ]);
    expect(
      listWorkflowPresetCatalog('chat_skill').some(
        (row) => row.kind === 'mutation_submit',
      ),
    ).toBe(true);
  });

  it('expands page_auto_fill with optional fetch', () => {
    const nodes = expandWorkflowPreset({
      preset: 'page_auto_fill',
      profile: 'page_action',
      config: {
        hostToolId: 10,
        readToolId: 20,
      },
    });
    expect(nodes.map((node) => node.action)).toEqual([
      'load_page_context',
      'fetch_data',
      'generate_and_push',
      'summarize',
    ]);
    expect(nodes[1]?.input).toEqual(
      expect.objectContaining({ toolIds: [20] }),
    );
    expect(nodes[2]?.input).toEqual(
      expect.objectContaining({ hostToolIds: [10] }),
    );
  });

  it('expands mutation_submit with confirm chain', () => {
    const nodes = expandWorkflowPreset({
      preset: 'mutation_submit',
      profile: 'chat_skill',
      config: {
        writeToolId: 99,
        readToolId: 20,
      },
    });
    expect(nodes.map((node) => node.action)).toEqual([
      'fetch_data',
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ]);
    expect(nodes[4]?.input).toEqual(
      expect.objectContaining({ toolId: 99, useComposedArgs: true }),
    );
  });

  it('expands page_context_mutation_submit with page load and confirm chain', () => {
    const nodes = expandWorkflowPreset({
      preset: 'page_context_mutation_submit',
      profile: 'chat_skill',
      config: {
        writeToolId: 99,
      },
    });
    expect(nodes.map((node) => node.action)).toEqual([
      'load_page_context',
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ]);
    expect(nodes.map((node) => node.name)).toEqual([
      '加载页上下文',
      '生成参数',
      '草稿说明',
      '确认读写',
      '执行读写',
      '总结说明',
    ]);
  });

  it('rejects mutation_submit on page_action profile', () => {
    const issues = validateWorkflowPresetInput({
      preset: 'mutation_submit',
      profile: 'page_action',
      config: { writeToolId: 1 },
    });
    expect(issues.some((row) => row.code === 'preset_profile_incompatible')).toBe(
      true,
    );
  });

  it('rejects missing required hostToolId', () => {
    const issues = validateWorkflowPresetInput({
      preset: 'page_context_push',
      profile: 'page_action',
      config: {},
    });
    expect(issues.some((row) => row.path === 'presetConfig.hostToolId')).toBe(
      true,
    );
  });

  it('uses custom objectives when provided', () => {
    const nodes = expandWorkflowPreset({
      preset: 'fetch_and_answer',
      profile: 'chat_skill',
      config: {
        readToolId: 1,
        objectives: {
          fetch: 'Custom fetch objective',
          summarize: 'Custom summarize objective',
        },
      },
    });
    expect(nodes[0]?.objective).toBe('Custom fetch objective');
    expect(nodes[1]?.objective).toBe('Custom summarize objective');
  });

  it('isWorkflowPresetKind guard', async () => {
    const { isWorkflowPresetKind } = await import('./workflow-preset.util');
    expect(isWorkflowPresetKind('fetch_and_answer')).toBe(true);
    expect(isWorkflowPresetKind('unknown' as WorkflowPresetKind)).toBe(false);
  });
});
