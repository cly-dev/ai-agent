/**
 * 决策环工具清单：agentMetadata 推导 role + compact 卡片。
 */

import {
  extractProvidesFromResponseProfile,
  parseAgentMetadata,
  resolveToolDecisionRole,
} from '../../tool-engine/tool-agent-metadata.util';
import {
  buildCompactToolInput,
  listRequiredParamNames,
  type RequestBodyCompact,
  type ToolParamCompact,
} from '../../tool-engine/tool-decision-input.util';
import {
  TOOL_DECISION_ROLE_META,
  TOOL_DECISION_ROLES,
  ToolDecisionRoleEnum,
  type ToolDecisionRole,
} from '../../tool-engine/tool-decision-role.enum';

export type { ToolDecisionRole };
export {
  TOOL_DECISION_ROLES,
  ToolDecisionRoleEnum,
  TOOL_DECISION_ROLE_META,
};

export type ToolDecisionCompact = {
  name: string;
  description: string;
  role: ToolDecisionRole;
  requiredParams: string[];
  /** Same shape as Tool.inputSchema (parameters + requestBody), merged with agentMetadata. */
  inputSchema: {
    parameters: ToolParamCompact[];
    requestBody?: RequestBodyCompact | null;
  };
  optionalParamNames?: string[];
  mode?: string;
  resource?: string;
  operation?: string;
  businessFields?: string[];
  provides?: string[];
  isMutation?: boolean;
  priority?: number;
};

/** 决策 system 中追加的角色说明（随本轮 scoped 工具集动态生成）。 */
export function buildToolRoleGuidanceForDecision(
  tools: Array<{ role: ToolDecisionRole }>,
): string {
  const roles = new Set(tools.map((tool) => tool.role));
  const lines: string[] = [
    'Tool selection rules:',
    '- Prefer mode/resource/operation on each compact entry over description text.',
    '- WRITE (isMutation=true): must call the tool when businessFields are satisfied; do not claim success without tool_calls.',
    '- READ: if Previous tool observations already provide the fields the user needs, answer from observations with empty tool_calls.',
    '- If businessFields are missing, ask the user; do not guess parameter values.',
    '- Map user conditions to tool input using inputSchema.parameters and requestBody (name, type, in, description).',
    '- When optionalParamNames is present, those query/header params exist but are omitted from detail — still valid for filtering.',
    '',
    'Semantic roles (derived from agentMetadata):',
  ];

  if (roles.has('read-detail')) {
    lines.push(
      '- read-detail: single-entity read (often by id). Payloads may include SKU-level price, inventory, logistics, SEO — use these fields before calling other read APIs.',
    );
  }
  if (roles.has('read-list')) {
    lines.push(
      '- read-list: multi-entity / conditional search (may return many rows). Use when you need ids or a set of candidates before detail calls.',
    );
  }
  if (roles.has('read-stats')) {
    lines.push(
      '- read-stats: aggregates/counts only, not full records.',
    );
  }
  if (roles.has('write-batch')) {
    lines.push(
      '- write-batch: mutates many records (price, inventory, status). Never use for read-only user questions.',
    );
  }
  if (roles.has('write-single')) {
    lines.push(
      '- write-single: create or update one entity.',
    );
  }
  if (roles.has('write-meta')) {
    lines.push(
      '- write-meta: side attributes (relations, notes, collections), not core catalog fetch.',
    );
  }
  if (roles.has('admin')) {
    lines.push('- admin: cache/test utilities, not user-facing answers.');
  }

  if (roles.has('read-detail') && roles.has('write-batch')) {
    lines.push(
      'If previous observations already include read-detail data with the fields the user asked for (e.g. price in skus), answer from observations — do NOT call write-batch price/inventory/status tools.',
    );
  }
  if (roles.has('read-detail') && roles.has('read-list')) {
    lines.push(
      'Typical flow: read-list to discover ids, then read-detail per id — skip detail calls when observations already cover every entity the user named.',
    );
  }

  return lines.join('\n');
}

export function summarizeToolsForDecisionPrompt(
  tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    schema?: unknown;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
  }>,
): ToolDecisionCompact[] {
  return tools.map((tool) => {
    const meta = parseAgentMetadata(tool.agentMetadata);
    const role = resolveToolDecisionRole({
      agentMetadata: tool.agentMetadata,
      responseProfile: tool.responseProfile,
      method: tool.method,
      name: tool.name,
      description: tool.description,
    });
    const input = buildCompactToolInput(
      tool.inputSchema,
      tool.schema,
      tool.agentMetadata,
    );
    return {
      name: tool.name,
      description: tool.description,
      role,
      requiredParams: listRequiredParamNames(input),
      inputSchema: {
        parameters: input.parameters,
        requestBody: input.requestBody ?? null,
      },
      ...(input.optionalParamNames && input.optionalParamNames.length > 0
        ? { optionalParamNames: input.optionalParamNames }
        : {}),
      ...(meta
        ? {
            mode: meta.mode,
            resource: meta.resource,
            operation: meta.operation,
            businessFields: meta.businessFields,
            isMutation: meta.isMutation,
            priority: meta.priority,
          }
        : {}),
      provides: extractProvidesFromResponseProfile(tool.responseProfile),
    };
  });
}
