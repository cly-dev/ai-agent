import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';

export type WorkflowScopeContext = {
  allowedToolIds: number[];
  allowedHostToolIds: number[];
  allowedDefinitionKeys?: string[];
};

function pushIssue(
  issues: WorkflowValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validateNodeAgainstScope(
  node: WorkflowNodeDef,
  scope: WorkflowScopeContext,
  issues: WorkflowValidationIssue[],
): void {
  const rawInput: unknown = node.input;
  if (!isRecord(rawInput)) {
    return;
  }
  const input = rawInput;
  const toolIds = new Set(scope.allowedToolIds);
  const hostToolIds = new Set(scope.allowedHostToolIds);
  const definitionKeys = new Set(scope.allowedDefinitionKeys ?? []);

  switch (node.action) {
    case 'fetch_data': {
      const toolId = input.toolId;
      const definitionKey = input.definitionKey;
      if (isPositiveInt(toolId) && !toolIds.has(toolId)) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.toolId`,
          'tool_out_of_scope',
          `toolId ${toolId} is not in current run scope`,
        );
      }
      if (
        typeof definitionKey === 'string' &&
        definitionKey.trim() &&
        definitionKeys.size > 0 &&
        !definitionKeys.has(definitionKey.trim())
      ) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.definitionKey`,
          'tool_out_of_scope',
          `definitionKey ${definitionKey} is not in current run scope`,
        );
      }
      break;
    }
    case 'generate_and_push': {
      const hostToolId = input.hostToolId;
      if (isPositiveInt(hostToolId) && !hostToolIds.has(hostToolId)) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.hostToolId`,
          'host_tool_out_of_scope',
          `hostToolId ${hostToolId} is not in current run scope`,
        );
      }
      break;
    }
    case 'compose_mutation':
    case 'write_data': {
      const toolId = input.toolId;
      if (isPositiveInt(toolId) && !toolIds.has(toolId)) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.toolId`,
          'tool_out_of_scope',
          `toolId ${toolId} is not in current run scope`,
        );
      }
      break;
    }
    default:
      break;
  }
}

export function validateWorkflowAgainstScope(input: {
  nodes: WorkflowNodeDef[];
  scope: WorkflowScopeContext;
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  for (const node of input.nodes) {
    validateNodeAgainstScope(node, input.scope, issues);
  }
  return issues;
}

export function isWorkflowCompatibleWithScope(input: {
  nodes: WorkflowNodeDef[];
  scope: WorkflowScopeContext;
}): boolean {
  return validateWorkflowAgainstScope(input).length === 0;
}
