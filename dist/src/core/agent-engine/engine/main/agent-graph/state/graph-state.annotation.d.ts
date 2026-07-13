import type { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentRunStatus, type ToolLevel } from '../../../../../../../generated/prisma/client';
import type { BuiltLangChainTools } from '../../../../../tool-engine/tool-engine.service';
import type { ToolResponseProfile } from '../../../../../tool-engine/tool-response-profile.types';
import type { HostToolDecisionDefinition } from '../../../../../host-bridge';
import type { AgentEngineTool, AgentRunStep, GraphToolCall } from '../../types/agent-engine.types';
import type { ToolErrorDisposition, ToolExecutionStatus } from '../../../tool/tool-execution-status.util';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { TurnExecutionContract } from '../../../turn/turn-execution-contract.types';
import type { TurnScopedToolsBundle } from '../../../turn/turn-scoped-tools.util';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
export declare function createAgentGraphStateAnnotation(): import("@langchain/langgraph/dist/graph/annotation").AnnotationRoot<{
    iteration: import("@langchain/langgraph/dist/channels/base").BaseChannel<number, number | import("@langchain/langgraph/dist/constants").OverwriteValue<number>, unknown>;
    steps: import("@langchain/langgraph/dist/channels/base").BaseChannel<AgentRunStep[], AgentRunStep[] | import("@langchain/langgraph/dist/constants").OverwriteValue<AgentRunStep[]>, unknown>;
    toolObservations: import("@langchain/langgraph/dist/channels/base").BaseChannel<{
        name: string;
        output: unknown;
    }[], {
        name: string;
        output: unknown;
    }[] | import("@langchain/langgraph/dist/constants").OverwriteValue<{
        name: string;
        output: unknown;
    }[]>, unknown>;
    preloadedToolObservations: import("@langchain/langgraph/dist/channels/base").BaseChannel<{
        name: string;
        output: unknown;
    }[], {
        name: string;
        output: unknown;
    }[] | import("@langchain/langgraph/dist/constants").OverwriteValue<{
        name: string;
        output: unknown;
    }[]>, unknown>;
    pendingToolCalls: import("@langchain/langgraph/dist/channels/base").BaseChannel<GraphToolCall[], GraphToolCall[] | import("@langchain/langgraph/dist/constants").OverwriteValue<GraphToolCall[]>, unknown>;
    pendingRespond: import("@langchain/langgraph/dist/channels/base").BaseChannel<import("../../../turn/turn-respond.types").PendingRespond, import("../../../turn/turn-respond.types").PendingRespond | import("@langchain/langgraph/dist/constants").OverwriteValue<import("../../../turn/turn-respond.types").PendingRespond>, unknown>;
    intentKind: import("@langchain/langgraph/dist/channels/base").BaseChannel<"task" | "smalltalk" | "unclear", "task" | "smalltalk" | "unclear" | import("@langchain/langgraph/dist/constants").OverwriteValue<"task" | "smalltalk" | "unclear">, unknown>;
    finalOutput: import("@langchain/langgraph/dist/channels/base").BaseChannel<string, string | import("@langchain/langgraph/dist/constants").OverwriteValue<string>, unknown>;
    status: import("@langchain/langgraph/dist/channels/base").BaseChannel<AgentRunStatus, AgentRunStatus | import("@langchain/langgraph/dist/constants").OverwriteValue<AgentRunStatus>, unknown>;
    finished: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
    scopedTools: import("@langchain/langgraph/dist/channels/base").BaseChannel<AgentEngineTool[], AgentEngineTool[] | import("@langchain/langgraph/dist/constants").OverwriteValue<AgentEngineTool[]>, unknown>;
    scopedLangChainTools: import("@langchain/langgraph/dist/channels/base").BaseChannel<DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[], DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[] | import("@langchain/langgraph/dist/constants").OverwriteValue<DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[]>, unknown>;
    scopedAllowedToolIds: import("@langchain/langgraph/dist/channels/base").BaseChannel<number[], number[] | import("@langchain/langgraph/dist/constants").OverwriteValue<number[]>, unknown>;
    scopedToolBundle: import("@langchain/langgraph/dist/channels/base").BaseChannel<BuiltLangChainTools, BuiltLangChainTools | import("@langchain/langgraph/dist/constants").OverwriteValue<BuiltLangChainTools>, unknown>;
    planStepToolCandidates: import("@langchain/langgraph/dist/channels/base").BaseChannel<AgentEngineTool[], AgentEngineTool[] | import("@langchain/langgraph/dist/constants").OverwriteValue<AgentEngineTool[]>, unknown>;
    planStepToolCandidateStrategy: import("@langchain/langgraph/dist/channels/base").BaseChannel<import("../../plan/plan-tool-candidates.util").PlanToolCandidateStrategy, import("../../plan/plan-tool-candidates.util").PlanToolCandidateStrategy | import("@langchain/langgraph/dist/constants").OverwriteValue<import("../../plan/plan-tool-candidates.util").PlanToolCandidateStrategy>, unknown>;
    intentScopedToolsBundle: import("@langchain/langgraph/dist/channels/base").BaseChannel<TurnScopedToolsBundle, TurnScopedToolsBundle | import("@langchain/langgraph/dist/constants").OverwriteValue<TurnScopedToolsBundle>, unknown>;
    toolProfilesByName: import("@langchain/langgraph/dist/channels/base").BaseChannel<Record<string, ToolResponseProfile>, Record<string, ToolResponseProfile> | import("@langchain/langgraph/dist/constants").OverwriteValue<Record<string, ToolResponseProfile>>, unknown>;
    hasExpandedOnce: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
    awaitingWriteConfirmation: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
    skillApplied: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
    activeSkillId: import("@langchain/langgraph/dist/channels/base").BaseChannel<number, number | import("@langchain/langgraph/dist/constants").OverwriteValue<number>, unknown>;
    activeSkillPrompt: import("@langchain/langgraph/dist/channels/base").BaseChannel<string, string | import("@langchain/langgraph/dist/constants").OverwriteValue<string>, unknown>;
    activeSkillName: import("@langchain/langgraph/dist/channels/base").BaseChannel<string, string | import("@langchain/langgraph/dist/constants").OverwriteValue<string>, unknown>;
    activeSkillDescription: import("@langchain/langgraph/dist/channels/base").BaseChannel<string, string | import("@langchain/langgraph/dist/constants").OverwriteValue<string>, unknown>;
    activeSkillConfig: import("@langchain/langgraph/dist/channels/base").BaseChannel<unknown, unknown, unknown>;
    activeSkillRiskLevel: import("@langchain/langgraph/dist/channels/base").BaseChannel<ToolLevel, ToolLevel | import("@langchain/langgraph/dist/constants").OverwriteValue<ToolLevel>, unknown>;
    taskPlan: import("@langchain/langgraph/dist/channels/base").BaseChannel<TaskPlanSnapshot, TaskPlanSnapshot | import("@langchain/langgraph/dist/constants").OverwriteValue<TaskPlanSnapshot>, unknown>;
    lastToolRoundMeta: import("@langchain/langgraph/dist/channels/base").BaseChannel<{
        toolCalls: GraphToolCall[];
        executionStatuses: ToolExecutionStatus[];
        errorDispositions: ToolErrorDisposition[];
        roundObservationIndices: number[];
    }, {
        toolCalls: GraphToolCall[];
        executionStatuses: ToolExecutionStatus[];
        errorDispositions: ToolErrorDisposition[];
        roundObservationIndices: number[];
    } | import("@langchain/langgraph/dist/constants").OverwriteValue<{
        toolCalls: GraphToolCall[];
        executionStatuses: ToolExecutionStatus[];
        errorDispositions: ToolErrorDisposition[];
        roundObservationIndices: number[];
    }>, unknown>;
    pagedListHttpUsed: import("@langchain/langgraph/dist/channels/base").BaseChannel<number, number | import("@langchain/langgraph/dist/constants").OverwriteValue<number>, unknown>;
    planAborted: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
    confirmedPreviewSerialized: import("@langchain/langgraph/dist/channels/base").BaseChannel<string, string | import("@langchain/langgraph/dist/constants").OverwriteValue<string>, unknown>;
    pageContext: import("@langchain/langgraph/dist/channels/base").BaseChannel<import("../../../../../host-bridge").AgentChatPageContext, import("../../../../../host-bridge").AgentChatPageContext | import("@langchain/langgraph/dist/constants").OverwriteValue<import("../../../../../host-bridge").AgentChatPageContext>, unknown>;
    scopedHostTools: import("@langchain/langgraph/dist/channels/base").BaseChannel<HostToolDecisionDefinition[], HostToolDecisionDefinition[] | import("@langchain/langgraph/dist/constants").OverwriteValue<HostToolDecisionDefinition[]>, unknown>;
    scopedHostLangChainTools: import("@langchain/langgraph/dist/channels/base").BaseChannel<DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[], DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[] | import("@langchain/langgraph/dist/constants").OverwriteValue<DynamicStructuredTool<import("@langchain/core/dist/tools/types").ToolInputSchemaBase, any, any, any, unknown, string>[]>, unknown>;
    turnExecutionContract: import("@langchain/langgraph/dist/channels/base").BaseChannel<TurnExecutionContract, TurnExecutionContract | import("@langchain/langgraph/dist/constants").OverwriteValue<TurnExecutionContract>, unknown>;
    planRunContext: import("@langchain/langgraph/dist/channels/base").BaseChannel<import("../../plan/plan-observation-scope.util").PlanRunContext, import("../../plan/plan-observation-scope.util").PlanRunContext | import("@langchain/langgraph/dist/constants").OverwriteValue<import("../../plan/plan-observation-scope.util").PlanRunContext>, unknown>;
    workflowRun: import("@langchain/langgraph/dist/channels/base").BaseChannel<WorkflowRunState, WorkflowRunState | import("@langchain/langgraph/dist/constants").OverwriteValue<WorkflowRunState>, unknown>;
    workflowNodeDefs: import("@langchain/langgraph/dist/channels/base").BaseChannel<WorkflowNodeDef[], WorkflowNodeDef[] | import("@langchain/langgraph/dist/constants").OverwriteValue<WorkflowNodeDef[]>, unknown>;
    workflowNodeOutputs: import("@langchain/langgraph/dist/channels/base").BaseChannel<Record<string, unknown>, Record<string, unknown> | import("@langchain/langgraph/dist/constants").OverwriteValue<Record<string, unknown>>, unknown>;
    workflowAwaitingReact: import("@langchain/langgraph/dist/channels/base").BaseChannel<boolean, boolean | import("@langchain/langgraph/dist/constants").OverwriteValue<boolean>, unknown>;
}>;
