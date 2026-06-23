import { tool } from '@langchain/core/tools';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { jsonSchemaToZod } from '../tool-engine/json-schema-to-zod.util';
import type { HostToolDecisionDefinition } from './host-tool-decision.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 将 Host Tool 元数据转为 LangChain bindTools 用 stub（服务端不执行，仅产参）。 */
export function buildHostLangChainTools(
  definitions: HostToolDecisionDefinition[],
): {
  tools: DynamicStructuredTool[];
  byName: Map<string, DynamicStructuredTool>;
} {
  const tools: DynamicStructuredTool[] = [];
  const byName = new Map<string, DynamicStructuredTool>();

  for (const def of definitions) {
    const schema = isRecord(def.argsSchema) ? def.argsSchema : { type: 'object' };
    const parameters = jsonSchemaToZod(schema);
    const lcTool = tool(
      async (input: Record<string, unknown>) =>
        JSON.stringify({
          hostTool: def.name,
          acknowledged: true,
          args: input,
        }),
      {
        name: def.name,
        description: def.description,
        schema: parameters,
      },
    );
    tools.push(lcTool);
    byName.set(def.name, lcTool);
  }

  return { tools, byName };
}

export function summarizeHostToolsForLlmSchema(
  definitions: HostToolDecisionDefinition[],
): Array<{
  name: string;
  description: string;
  argsSchema: Record<string, unknown>;
  execution: 'browser';
}> {
  return definitions.map((def) => ({
    name: def.name,
    description: def.description,
    argsSchema: def.argsSchema,
    execution: 'browser' as const,
  }));
}
