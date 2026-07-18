import { Annotation } from '@langchain/langgraph';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentRunStatus, type ToolLevel } from '../../../../../../../generated/prisma/client';
import type { BuiltLangChainTools } from '../../../../../tool-engine/tool-engine.service';
import type { ToolResponseProfile } from '../../../../../tool-engine/tool-response-profile.types';
import type { HostToolDecisionDefinition } from '../../../../../host-bridge';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentRunStep,
  GraphToolCall,
} from '../../types/agent-engine.types';
import type {
  ToolErrorDisposition,
  ToolExecutionStatus,
} from '../../../tool/tool-execution-status.util';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { TurnExecutionContract } from '../../../turn/turn-execution-contract.types';
import type { TurnScopedToolsBundle } from '../../../turn/turn-scoped-tools.util';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
import type { WorkflowIrDocument } from '../../../../../workflow/workflow-ir.types';
import type { WorkflowExecutionMode } from '../../../../../workflow/workflow-ir-native-direct.util';
import type { MaterializedEntity } from '../../../../../entity-materialization/entity-materialization.types';

export function createAgentGraphStateAnnotation() {
  const State = Annotation.Root({
      iteration: Annotation<number>({
        default: () => 0,
        reducer: (_state, update) => update,
      }),
      steps: Annotation<AgentRunStep[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      toolObservations: Annotation<Array<{ name: string; output: unknown }>>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      preloadedToolObservations: Annotation<
        Array<{ name: string; output: unknown }> | undefined
      >({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingToolCalls: Annotation<GraphToolCall[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingRespond: Annotation<AgentGraphState['pendingRespond']>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      intentKind: Annotation<'task' | 'smalltalk' | 'unclear'>({
        default: () => 'task',
        reducer: (_state, update) => update,
      }),
      finalOutput: Annotation<string>({
        default: () => '',
        reducer: (_state, update) => update,
      }),
      status: Annotation<AgentRunStatus>({
        default: () => AgentRunStatus.running,
        reducer: (_state, update) => update,
      }),
      finished: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      scopedTools: Annotation<AgentEngineTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedLangChainTools: Annotation<DynamicStructuredTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedAllowedToolIds: Annotation<number[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedToolBundle: Annotation<BuiltLangChainTools | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      planStepToolCandidates: Annotation<AgentEngineTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      planStepToolCandidateStrategy: Annotation<
        AgentGraphState['planStepToolCandidateStrategy']
      >({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      intentScopedToolsBundle: Annotation<TurnScopedToolsBundle | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      toolProfilesByName: Annotation<Record<string, ToolResponseProfile | null>>({
        default: () => ({}),
        reducer: (_state, update) => update,
      }),
      hasExpandedOnce: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      awaitingWriteConfirmation: Annotation<boolean | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      skillApplied: Annotation<boolean | undefined>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      activeSkillId: Annotation<number | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillPrompt: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillName: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillDescription: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillConfig: Annotation<unknown>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillRiskLevel: Annotation<ToolLevel | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      taskPlan: Annotation<TaskPlanSnapshot | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      lastToolRoundMeta: Annotation<{
        toolCalls: GraphToolCall[];
        executionStatuses: ToolExecutionStatus[];
        errorDispositions: ToolErrorDisposition[];
        roundObservationIndices: number[];
      } | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      pagedListHttpUsed: Annotation<number | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      planAborted: Annotation<boolean | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      confirmedPreviewSerialized: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      pageContext: Annotation<AgentGraphState['pageContext']>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      materializedEntities: Annotation<MaterializedEntity[] | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      scopedHostTools: Annotation<HostToolDecisionDefinition[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedHostLangChainTools: Annotation<DynamicStructuredTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      turnExecutionContract: Annotation<TurnExecutionContract | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      planRunContext: Annotation<AgentGraphState['planRunContext']>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      workflowRun: Annotation<WorkflowRunState | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      workflowNodeDefs: Annotation<WorkflowNodeDef[] | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      workflowIr: Annotation<WorkflowIrDocument | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      workflowExecutionMode: Annotation<
        WorkflowExecutionMode | undefined
      >({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      workflowNodeOutputs: Annotation<Record<string, unknown> | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      workflowAwaitingReact: Annotation<boolean | undefined>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
    });
  return State;
}
