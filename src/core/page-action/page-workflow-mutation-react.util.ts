import { NotFoundException } from '@nestjs/common';
import type { ToolLevel } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import {
  completeWorkflowNode,
  failWorkflowNode,
} from '../workflow/workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../workflow/workflow-node-output.util';
import type { ComposeMutationNodeInput } from '../workflow/workflow-node-input.types';
import type { WriteDataNodeInput } from '../workflow/workflow-node-input.types';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import {
  buildPageComposeNodeOutput,
  readComposeMutationToolId,
  readWriteDataToolId,
  type PageWorkflowComposeOutput,
} from './page-workflow-pending-write.util';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import { executePageWorkflowComposeMutation } from './page-workflow-compose-mutation.util';

export type PageWorkflowReactResult =
  | {
      ok: true;
      workflowRun: WorkflowRunState;
      outputRef: string;
      nodeOutput: unknown;
    }
  | {
      ok: false;
      workflowRun: WorkflowRunState;
      errorCode: string;
      errorMessage: string;
    };

async function resolveWriteTool(
  prisma: PrismaService,
  appClientId: number,
  toolId: number,
) {
  const tool = await prisma.tool.findFirst({
    where: { id: toolId, appClientId, isActive: true },
  });
  if (!tool) {
    throw new NotFoundException({
      code: 'WRITE_TOOL_NOT_FOUND',
      message: `Write tool id=${toolId} not found`,
    });
  }
  return tool;
}

/**
 * page workflow 内联 react：compose_mutation / write_data。
 * compose 将参数写入 nodeOutputs；write 直接执行 HTTP 写工具。
 */
export async function runPageWorkflowMutationReact(input: {
  def: WorkflowNodeDef;
  nodeId: string;
  workflowRun: WorkflowRunState;
  runtime: PageWorkflowExecutorRuntime;
  allowedToolIds: number[];
  pendingWrite?: ApprovalPendingWrite | null;
}): Promise<PageWorkflowReactResult> {
  const { def, nodeId, runtime } = input;

  if (def.action === 'compose_mutation') {
    const nodeInput = def.input as ComposeMutationNodeInput;
    const toolId = readComposeMutationToolId(nodeInput);
    if (toolId == null) {
      const failed = failWorkflowNode(input.workflowRun, nodeId, {
        code: 'COMPOSE_TOOL_ID_MISSING',
        message: 'compose_mutation requires toolId',
      });
      return {
        ok: false,
        workflowRun: failed,
        errorCode: 'COMPOSE_TOOL_ID_MISSING',
        errorMessage: 'compose_mutation requires toolId',
      };
    }
    if (!input.allowedToolIds.includes(toolId)) {
      const failed = failWorkflowNode(input.workflowRun, nodeId, {
        code: 'COMPOSE_TOOL_NOT_ALLOWED',
        message: `toolId ${toolId} not in user allowed tools`,
      });
      return {
        ok: false,
        workflowRun: failed,
        errorCode: 'COMPOSE_TOOL_NOT_ALLOWED',
        errorMessage: `toolId ${toolId} not in user allowed tools`,
      };
    }

    try {
      const tool = await resolveWriteTool(
        runtime.prisma,
        runtime.appClientId,
        toolId,
      );
      const composedArgs =
        input.pendingWrite?.arguments ??
        (
          await executePageWorkflowComposeMutation({
            runtime,
            def,
            writeToolId: tool.id,
            allowedToolIds: input.allowedToolIds,
            stepRecorder: runtime.stepRecorder,
          })
        ).arguments;

      const composeOutput: PageWorkflowComposeOutput = {
        tool: tool.name,
        toolId: tool.id,
        arguments: composedArgs,
        riskLevel: tool.riskLevel,
      };
      runtime.nodeOutputs[nodeId] = buildPageComposeNodeOutput(composeOutput);
      runtime.stepRecorder.record({
        type: 'workflow',
        name: `${nodeId}:compose`,
        detail: {
          toolId: tool.id,
          toolName: tool.name,
        },
      });

      const outputRef = buildWorkflowNodeOutputRef(def.action, nodeId);
      return {
        ok: true,
        workflowRun: completeWorkflowNode(input.workflowRun, nodeId, outputRef),
        outputRef,
        nodeOutput: runtime.nodeOutputs[nodeId],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = failWorkflowNode(input.workflowRun, nodeId, {
        code: 'COMPOSE_FAILED',
        message,
      });
      return {
        ok: false,
        workflowRun: failed,
        errorCode: 'COMPOSE_FAILED',
        errorMessage: message,
      };
    }
  }

  if (def.action === 'write_data') {
    const nodeInput = def.input as WriteDataNodeInput;
    const toolId = readWriteDataToolId(nodeInput);
    const pending =
      input.pendingWrite ??
      resolvePendingWriteFromRuntime(runtime, input.allowedToolIds);
    if (!pending) {
      const failed = failWorkflowNode(input.workflowRun, nodeId, {
        code: 'WRITE_PENDING_MISSING',
        message: 'No composed write arguments for write_data',
      });
      return {
        ok: false,
        workflowRun: failed,
        errorCode: 'WRITE_PENDING_MISSING',
        errorMessage: 'No composed write arguments for write_data',
      };
    }
    if (toolId != null && pending.name) {
      const tool = await runtime.prisma.tool.findFirst({
        where: { id: toolId, appClientId: runtime.appClientId, isActive: true },
      });
      if (tool && tool.name !== pending.name) {
        const failed = failWorkflowNode(input.workflowRun, nodeId, {
          code: 'WRITE_TOOL_MISMATCH',
          message: `write_data toolId=${toolId} does not match composed tool ${pending.name}`,
        });
        return {
          ok: false,
          workflowRun: failed,
          errorCode: 'WRITE_TOOL_MISMATCH',
          errorMessage: failed.nodes.find((row) => row.nodeId === nodeId)?.error
            ?.message ?? 'write tool mismatch',
        };
      }
    }

    try {
      const result = await runtime.toolEngine.executeByName(
        pending.name,
        pending.arguments,
        input.allowedToolIds,
        runtime.userId,
      );
      runtime.stepRecorder.record({
        type: 'workflow',
        name: `${nodeId}:write`,
        detail: {
          toolName: pending.name,
        },
        status: 'ok',
      });
      const outputRef = buildWorkflowNodeOutputRef(def.action, nodeId);
      const nodeOutput = { tool: pending.name, output: result.output };
      runtime.nodeOutputs[nodeId] = nodeOutput;
      return {
        ok: true,
        workflowRun: completeWorkflowNode(input.workflowRun, nodeId, outputRef),
        outputRef,
        nodeOutput,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = failWorkflowNode(input.workflowRun, nodeId, {
        code: 'WRITE_EXEC_ERROR',
        message,
      });
      return {
        ok: false,
        workflowRun: failed,
        errorCode: 'WRITE_EXEC_ERROR',
        errorMessage: message,
      };
    }
  }

  const failed = failWorkflowNode(input.workflowRun, nodeId, {
    code: 'REACT_UNSUPPORTED_ACTION',
    message: `Page react does not support action ${def.action}`,
  });
  return {
    ok: false,
    workflowRun: failed,
    errorCode: 'REACT_UNSUPPORTED_ACTION',
    errorMessage: `Page react does not support action ${def.action}`,
  };
}

function resolvePendingWriteFromRuntime(
  runtime: PageWorkflowExecutorRuntime,
  allowedToolIds: number[],
): ApprovalPendingWrite | null {
  for (const output of Object.values(runtime.nodeOutputs)) {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      continue;
    }
    const row = output as Record<string, unknown>;
    const nested = row.page_compose_mutation as PageWorkflowComposeOutput | undefined;
    if (nested?.tool && nested.arguments) {
      if (nested.toolId && !allowedToolIds.includes(nested.toolId)) {
        return null;
      }
      return {
        name: nested.tool,
        arguments: nested.arguments,
        riskLevel: (nested.riskLevel as ToolLevel) ?? 'L2',
      };
    }
  }
  return null;
}
