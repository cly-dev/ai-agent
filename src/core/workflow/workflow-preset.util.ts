import type {
  WorkflowPresetCatalogEntry,
  WorkflowPresetConfig,
  WorkflowPresetKind,
  WorkflowPresetValidationIssue,
} from './workflow-preset.types';
import type { WorkflowNodeDef, WorkflowProfile } from './workflow.types';

const ALL_WORKFLOW_PROFILES: WorkflowProfile[] = [
  'page_action',
  'chat_skill',
  'shared',
];

const PRESET_PROFILES: Record<WorkflowPresetKind, WorkflowProfile[]> = {
  page_auto_fill: ALL_WORKFLOW_PROFILES,
  page_context_push: ALL_WORKFLOW_PROFILES,
  fetch_push_summarize: ALL_WORKFLOW_PROFILES,
  fetch_and_answer: ALL_WORKFLOW_PROFILES,
  mutation_submit: ALL_WORKFLOW_PROFILES,
  page_context_mutation_submit: ALL_WORKFLOW_PROFILES,
};

type MutationChainLabels = {
  compose?: string;
  present?: string;
  await?: string;
  write?: string;
  summarize?: string;
};

const DEFAULT_OBJECTIVES = {
  loadPage:
    'Load page context and materialize observations required for this turn.',
  fetch: 'Fetch data from the bound read tool using identifiers from user intent.',
  push: 'Generate user-facing content and push to the page via the bound host tool.',
  compose:
    'Compose write parameters only from read observations; do not execute HTTP write yet.',
  present:
    'Present the pending mutation draft to the user; quote composed arguments verbatim.',
  write: 'Execute the bound write tool using composed parameters after user confirmation.',
  summarize: 'Summarize the outcome for the user in concise language.',
} as const;

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function objective(
  config: WorkflowPresetConfig,
  key: keyof typeof DEFAULT_OBJECTIVES,
): string {
  const fromConfig = config.objectives?.[key];
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }
  return DEFAULT_OBJECTIVES[key];
}

function loadPageNode(config: WorkflowPresetConfig): WorkflowNodeDef {
  return {
    id: 'load_page',
    action: 'load_page_context',
    name: '加载页上下文',
    objective: objective(config, 'loadPage'),
    input: {
      materialize: config.materializePageContext !== false,
    },
  };
}

function fetchNode(
  config: WorkflowPresetConfig,
  toolId: number,
  id = 'fetch_data',
): WorkflowNodeDef {
  return {
    id,
    action: 'fetch_data',
    name: '获取数据',
    objective: objective(config, 'fetch'),
    input: {
      toolIds: [toolId],
      completeWhen: config.fetchCompleteWhen ?? 'first_success',
    },
  };
}

function pushNode(
  config: WorkflowPresetConfig,
  hostToolId: number,
  id = 'generate_push',
): WorkflowNodeDef {
  return {
    id,
    action: 'generate_and_push',
    name: '生成并推送',
    objective: objective(config, 'push'),
    input: {
      hostToolIds: [hostToolId],
    },
  };
}

function summarizeNode(
  config: WorkflowPresetConfig,
  name = '说明总结',
): WorkflowNodeDef {
  return {
    id: 'summarize',
    action: 'summarize',
    name,
    objective: objective(config, 'summarize'),
    input: {
      mode: config.summarizeMode ?? 'final',
    },
  };
}

function expandMutationWriteConfirmChain(
  config: WorkflowPresetConfig,
  writeToolId: number,
  labels?: MutationChainLabels,
): WorkflowNodeDef[] {
  return [
    {
      id: 'compose_mutation',
      action: 'compose_mutation',
      name: labels?.compose ?? '组装变更参数',
      objective: objective(config, 'compose'),
      input: { toolId: writeToolId },
    },
    {
      id: 'present_mutation',
      action: 'present_mutation',
      name: labels?.present ?? '展示变更草稿',
      objective: objective(config, 'present'),
      input: { mode: config.presentMode ?? 'brief' },
    },
    {
      id: 'await_confirm',
      action: 'await_user_confirm',
      name: labels?.await ?? '等待用户确认',
      objective: 'Wait for user confirmation before executing the write.',
      input: { confirmKind: config.confirmKind ?? 'mutation' },
    },
    {
      id: 'write_data',
      action: 'write_data',
      name: labels?.write ?? '提交变更',
      objective: objective(config, 'write'),
      input: { toolId: writeToolId, useComposedArgs: true },
    },
    summarizeNode(config, labels?.summarize),
  ];
}

function expandPageAutoFill(config: WorkflowPresetConfig): WorkflowNodeDef[] {
  const hostToolId = config.hostToolId!;
  const nodes: WorkflowNodeDef[] = [loadPageNode(config)];
  if (config.readToolId != null) {
    nodes.push(fetchNode(config, config.readToolId));
  }
  nodes.push(pushNode(config, hostToolId), summarizeNode(config));
  return nodes;
}

function expandPageContextPush(config: WorkflowPresetConfig): WorkflowNodeDef[] {
  return [
    loadPageNode(config),
    pushNode(config, config.hostToolId!),
    summarizeNode(config),
  ];
}

function expandFetchPushSummarize(config: WorkflowPresetConfig): WorkflowNodeDef[] {
  return [
    fetchNode(config, config.readToolId!),
    pushNode(config, config.hostToolId!),
    summarizeNode(config),
  ];
}

function expandFetchAndAnswer(config: WorkflowPresetConfig): WorkflowNodeDef[] {
  return [fetchNode(config, config.readToolId!), summarizeNode(config)];
}

function expandMutationSubmit(config: WorkflowPresetConfig): WorkflowNodeDef[] {
  const writeToolId = config.writeToolId!;
  const nodes: WorkflowNodeDef[] = [];
  if (config.readToolId != null) {
    nodes.push(fetchNode(config, config.readToolId, 'fetch_before_write'));
  }
  nodes.push(...expandMutationWriteConfirmChain(config, writeToolId));
  return nodes;
}

function expandPageContextMutationSubmit(
  config: WorkflowPresetConfig,
): WorkflowNodeDef[] {
  const writeToolId = config.writeToolId!;
  const nodes: WorkflowNodeDef[] = [loadPageNode(config)];
  if (config.readToolId != null) {
    nodes.push(fetchNode(config, config.readToolId, 'fetch_before_write'));
  }
  nodes.push(
    ...expandMutationWriteConfirmChain(config, writeToolId, {
      compose: '生成参数',
      present: '草稿说明',
      await: '确认读写',
      write: '执行读写',
      summarize: '总结说明',
    }),
  );
  return nodes;
}

export const WORKFLOW_PRESET_CATALOG: WorkflowPresetCatalogEntry[] = [
  {
    kind: 'page_auto_fill',
    label: '页内自动回填',
    description:
      '加载页上下文 →（可选）拉取数据 → Host Tool 推送 → 总结说明。PageAction 最常用场景。',
    profiles: PRESET_PROFILES.page_auto_fill,
    requiredConfig: ['hostToolId'],
    optionalConfig: [
      'readToolId',
      'fetchCompleteWhen',
      'summarizeMode',
      'materializePageContext',
      'objectives',
    ],
    expandedActions: [
      'load_page_context',
      'fetch_data?',
      'generate_and_push',
      'summarize',
    ],
  },
  {
    kind: 'page_context_push',
    label: '页内推送',
    description: '加载页上下文 → Host Tool 推送 → 总结说明（不拉 HTTP 读接口）。',
    profiles: PRESET_PROFILES.page_context_push,
    requiredConfig: ['hostToolId'],
    optionalConfig: ['summarizeMode', 'materializePageContext', 'objectives'],
    expandedActions: ['load_page_context', 'generate_and_push', 'summarize'],
  },
  {
    kind: 'fetch_push_summarize',
    label: '拉数并推送',
    description: 'HTTP 拉数 → Host Tool 推送 → 总结说明。',
    profiles: PRESET_PROFILES.fetch_push_summarize,
    requiredConfig: ['readToolId', 'hostToolId'],
    optionalConfig: [
      'fetchCompleteWhen',
      'summarizeMode',
      'objectives',
    ],
    expandedActions: ['fetch_data', 'generate_and_push', 'summarize'],
  },
  {
    kind: 'fetch_and_answer',
    label: '拉数作答',
    description: 'HTTP 拉数 → 文字总结。Chat 只读问答。',
    profiles: PRESET_PROFILES.fetch_and_answer,
    requiredConfig: ['readToolId'],
    optionalConfig: ['fetchCompleteWhen', 'summarizeMode', 'objectives'],
    expandedActions: ['fetch_data', 'summarize'],
  },
  {
    kind: 'mutation_submit',
    label: '变更提交',
    description:
      '（可选）拉数 → 组装写参数 → 展示草稿 → 用户确认 → 执行写 → 总结。',
    profiles: PRESET_PROFILES.mutation_submit,
    requiredConfig: ['writeToolId'],
    optionalConfig: [
      'readToolId',
      'presentMode',
      'confirmKind',
      'summarizeMode',
      'objectives',
    ],
    expandedActions: [
      'fetch_data?',
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ],
  },
  {
    kind: 'page_context_mutation_submit',
    label: '页内写确认',
    description:
      '加载页上下文 → 生成参数 → 草稿说明 → 确认读写 → 执行读写 → 总结说明。适合带 pageContext 的 Chat 写操作。',
    profiles: PRESET_PROFILES.page_context_mutation_submit,
    requiredConfig: ['writeToolId'],
    optionalConfig: [
      'readToolId',
      'presentMode',
      'confirmKind',
      'summarizeMode',
      'materializePageContext',
      'objectives',
    ],
    expandedActions: [
      'load_page_context',
      'fetch_data?',
      'compose_mutation',
      'present_mutation',
      'await_user_confirm',
      'write_data',
      'summarize',
    ],
  },
];

export function listWorkflowPresetCatalog(
  _profile?: WorkflowProfile,
): WorkflowPresetCatalogEntry[] {
  return WORKFLOW_PRESET_CATALOG;
}

export function isWorkflowPresetKind(value: unknown): value is WorkflowPresetKind {
  return (
    typeof value === 'string' &&
    WORKFLOW_PRESET_CATALOG.some((row) => row.kind === value)
  );
}

export function validateWorkflowPresetInput(input: {
  preset: WorkflowPresetKind;
  profile: WorkflowProfile;
  config: unknown;
}): WorkflowPresetValidationIssue[] {
  const issues: WorkflowPresetValidationIssue[] = [];
  const catalog = WORKFLOW_PRESET_CATALOG.find((row) => row.kind === input.preset);
  if (!catalog) {
    issues.push({
      path: 'preset',
      code: 'unknown_preset',
      message: `Unknown workflow preset: ${input.preset}`,
    });
    return issues;
  }
  if (!input.config || typeof input.config !== 'object' || Array.isArray(input.config)) {
    issues.push({
      path: 'presetConfig',
      code: 'invalid_preset_config',
      message: 'presetConfig must be an object',
    });
    return issues;
  }
  const config = input.config as WorkflowPresetConfig;
  for (const key of catalog.requiredConfig) {
    const value = config[key];
    if (key.endsWith('ToolId') || key.endsWith('Id')) {
      if (!isPositiveInt(value)) {
        issues.push({
          path: `presetConfig.${key}`,
          code: 'missing_required',
          message: `${key} is required for preset ${input.preset}`,
        });
      }
    }
  }
  if (config.readToolId != null && !isPositiveInt(config.readToolId)) {
    issues.push({
      path: 'presetConfig.readToolId',
      code: 'invalid_tool_id',
      message: 'readToolId must be a positive integer',
    });
  }
  if (config.writeToolId != null && !isPositiveInt(config.writeToolId)) {
    issues.push({
      path: 'presetConfig.writeToolId',
      code: 'invalid_tool_id',
      message: 'writeToolId must be a positive integer',
    });
  }
  if (config.hostToolId != null && !isPositiveInt(config.hostToolId)) {
    issues.push({
      path: 'presetConfig.hostToolId',
      code: 'invalid_host_tool_id',
      message: 'hostToolId must be a positive integer',
    });
  }
  return issues;
}

export function expandWorkflowPreset(input: {
  preset: WorkflowPresetKind;
  profile: WorkflowProfile;
  config: WorkflowPresetConfig;
}): WorkflowNodeDef[] {
  const issues = validateWorkflowPresetInput({
    preset: input.preset,
    profile: input.profile,
    config: input.config,
  });
  if (issues.length > 0) {
    throw new Error(
      `Workflow preset validation failed: ${issues.map((row) => row.message).join('; ')}`,
    );
  }

  let nodes: WorkflowNodeDef[];
  switch (input.preset) {
    case 'page_auto_fill':
      nodes = expandPageAutoFill(input.config);
      break;
    case 'page_context_push':
      nodes = expandPageContextPush(input.config);
      break;
    case 'fetch_push_summarize':
      nodes = expandFetchPushSummarize(input.config);
      break;
    case 'fetch_and_answer':
      nodes = expandFetchAndAnswer(input.config);
      break;
    case 'mutation_submit':
      nodes = expandMutationSubmit(input.config);
      break;
    case 'page_context_mutation_submit':
      nodes = expandPageContextMutationSubmit(input.config);
      break;
    default:
      throw new Error(`Unsupported workflow preset: ${input.preset satisfies never}`);
  }

  return nodes;
}

export function parseWorkflowPresetConfig(value: unknown): WorkflowPresetConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as WorkflowPresetConfig;
}
