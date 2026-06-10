import {
  extractToolErrorResponseSource,
  extractToolErrorUserHint,
  formatResponseSourceForDisplay,
  isAgentToolErrorObservation,
} from './agent-run-user-messages.util';
import type { ToolObservation } from './main/agent-engine.types';
import type { TaskPlanSnapshot } from './main/task-plan.types';
import {
  formatPlanContextForSummarize,
  resolveSummarizeUserMessageForPlan,
} from './main/task-plan.util';
import type { ToolRoundMeta } from './tool/tool-result-check.util';
import type { ToolExecutionStatus } from './tool/tool-execution-status.util';

export type WriteConfirmResumeOperation = {
  toolName: string;
  toolDescription?: string;
  status: 'SUCCESS' | 'ERROR';
  errorHint?: string;
  errorResponseSource?: string;
};

export type WriteConfirmResumeSummaryPayload = {
  userMessage: string;
  outcome: 'success' | 'failed';
  operations: WriteConfirmResumeOperation[];
  successCount: number;
  failureCount: number;
  totalCount: number;
};

export function buildWriteConfirmResumeSummaryPayload(input: {
  userMessage: string;
  writeRoundMeta: ToolRoundMeta;
  observations: ToolObservation[];
  scopedTools: Array<{ name: string; description?: string }>;
}): WriteConfirmResumeSummaryPayload {
  const toolByName = new Map(
    input.scopedTools.map((tool) => [tool.name, tool]),
  );
  const operations: WriteConfirmResumeOperation[] =
    input.writeRoundMeta.toolCalls.map((call, index) => {
      const executionStatus: ToolExecutionStatus =
        input.writeRoundMeta.executionStatuses[index] ?? 'ERROR';
      const observationIndex =
        input.writeRoundMeta.roundObservationIndices[index];
      const observation =
        observationIndex != null
          ? input.observations[observationIndex]
          : null;
      const errorObs =
        observation != null && isAgentToolErrorObservation(observation.output)
          ? observation.output
          : null;
      const errorHint = errorObs ? extractToolErrorUserHint(errorObs) : undefined;
      const errorResponseSource =
        errorObs?.responseSource != null
          ? formatResponseSourceForDisplay(
              extractToolErrorResponseSource(errorObs) ??
                errorObs.responseSource,
            )
          : undefined;
      const def = toolByName.get(call.name);
      return {
        toolName: call.name,
        ...(def?.description ? { toolDescription: def.description } : {}),
        status: executionStatus === 'ERROR' ? 'ERROR' : 'SUCCESS',
        ...(errorHint ? { errorHint } : {}),
        ...(errorResponseSource ? { errorResponseSource } : {}),
      };
    });

  const successCount = operations.filter(
    (row) => row.status === 'SUCCESS',
  ).length;
  const failureCount = operations.filter(
    (row) => row.status === 'ERROR',
  ).length;

  return {
    userMessage: input.userMessage.trim(),
    outcome: failureCount > 0 ? 'failed' : 'success',
    operations,
    successCount,
    failureCount,
    totalCount: operations.length,
  };
}

export function buildWriteConfirmResumeSummaryObservation(input: {
  userMessage: string;
  writeRoundMeta: ToolRoundMeta;
  observations: ToolObservation[];
  scopedTools: Array<{ name: string; description?: string }>;
}): ToolObservation {
  const payload = buildWriteConfirmResumeSummaryPayload(input);
  return {
    name: 'write_confirm_resume',
    output: payload,
    quality: payload.outcome === 'success' ? 'high' : 'low',
  };
}

export function isWriteConfirmResumeSummaryObservation(
  observation: ToolObservation | null | undefined,
): observation is ToolObservation & { name: 'write_confirm_resume' } {
  return observation?.name === 'write_confirm_resume';
}

export function formatWriteConfirmResumeSummarizeUserMessage(input: {
  payload: WriteConfirmResumeSummaryPayload;
  taskPlan?: TaskPlanSnapshot | null;
  toolResultsJson?: string;
}): string {
  const originalRequest = resolveSummarizeUserMessageForPlan(
    input.payload.userMessage,
    input.taskPlan,
  );
  const planContext = formatPlanContextForSummarize(input.taskPlan);
  const operationLines = input.payload.operations.map((row, index) => {
    const parts = [
      `${index + 1}. tool=${row.toolName}`,
      `status=${row.status}`,
    ];
    if (row.toolDescription) {
      parts.push(`description=${row.toolDescription}`);
    }
    if (row.errorHint) {
      parts.push(`error=${row.errorHint}`);
    }
    if (row.errorResponseSource) {
      parts.push(`responseSource=${row.errorResponseSource}`);
    }
    return parts.join(' | ');
  });

  return [
    `Original user request: ${originalRequest}`,
    planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
    '<write_confirm_resume>',
    'Context: User confirmed pending write tool call(s); system executed them synchronously (no re-planning).',
    `Outcome: ${input.payload.outcome}`,
    `Total confirmed write operations: ${input.payload.totalCount}`,
    `Succeeded: ${input.payload.successCount}`,
    `Failed: ${input.payload.failureCount}`,
    'Operations:',
    ...operationLines,
    '</write_confirm_resume>',
    input.toolResultsJson
      ? `Merged tool results (evidence only):\n${input.toolResultsJson}`
      : null,
  ]
    .filter((line): line is string => line != null && line.length > 0)
    .join('\n');
}
