/**
 * Slim tool cards for the decision loop (<tool_schema>).
 * Exposes filters/returns only — no full Swagger parameters.
 */

import {
  extractProvidesFromResponseProfile,
  parseAgentMetadata,
  resolveToolDecisionRole,
} from '../../../tool-engine/tool-agent-metadata.util';
import {
  buildCompactToolInput,
  listRequiredParamNames,
} from '../../../tool-engine/tool-decision-input.util';
import { parseResponseProfile } from '../../../tool-engine/tool-output-projection.util';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';

export type ToolSchemaCompact = {
  name: string;
  /** 工具说明（bind 后写入 decision <tool_schema>，供模型选型） */
  description?: string;
  role: ToolDecisionRole;
  resource?: string;
  operation?: string;
  filters?: string[];
  returns?: string[];
  businessFields?: string[];
  isMutation?: boolean;
  requiredParams?: string[];
};

const SCHEMA_PARAM_SKIP = new Set([
  'X-SHOP-ID',
  'page',
  'size',
  'sort',
  'vo',
]);

function extractFilterNames(
  input: ReturnType<typeof buildCompactToolInput>,
): string[] {
  const fromParams = input.parameters
    .filter((row) => !row.required && !SCHEMA_PARAM_SKIP.has(row.name))
    .map((row) => row.name);
  const optional = input.optionalParamNames ?? [];
  return [...new Set([...fromParams, ...optional])].slice(0, 16);
}

function extractReturnFields(
  responseProfile: unknown,
  provides: string[],
): string[] {
  if (provides.length > 0) {
    return provides.slice(0, 10);
  }
  const profile = parseResponseProfile(responseProfile);
  if (!profile) {
    return [];
  }
  const paths = profile.coreFields.map((field) => {
    const tail = field.path.split('.').filter(Boolean).pop() ?? field.path;
    const aliases: Record<string, string> = {
      availableTotal: 'availableStock',
      imageUrl: 'image',
    };
    return aliases[tail] ?? tail;
  });
  return [...new Set(paths)].slice(0, 10);
}

export function summarizeToolsForLlmSchema(
  tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    schema?: unknown;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
  }>,
): ToolSchemaCompact[] {
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
    const provides = extractProvidesFromResponseProfile(tool.responseProfile);
    const requiredParams = listRequiredParamNames(input).filter(
      (name) => name !== 'vo',
    );
    const filters = meta?.isMutation ? undefined : extractFilterNames(input);
    const returns = extractReturnFields(tool.responseProfile, provides);
    const description = tool.description?.trim();

    const row: ToolSchemaCompact = {
      name: tool.name,
      ...(description ? { description } : {}),
      role,
      ...(meta?.resource ? { resource: meta.resource } : {}),
      ...(meta?.operation ? { operation: meta.operation } : {}),
      ...(filters && filters.length > 0 ? { filters } : {}),
      ...(returns.length > 0 ? { returns } : {}),
      ...(meta?.businessFields && meta.businessFields.length > 0
        ? { businessFields: meta.businessFields }
        : {}),
      ...(meta?.isMutation != null ? { isMutation: meta.isMutation } : {}),
      ...(requiredParams.length > 0 ? { requiredParams } : {}),
    };
    return row;
  });
}
