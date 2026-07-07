import { type HostToolDecisionDefinition } from '../../../../../host-bridge';
import { type HostToolPlanStepHandleResult } from '../../host-tool/host-tool-llm.util';
import type { TaskPlanStep } from '../../plan/task-plan.types';
import type { AgentGraphState, AgentRunStep, GraphToolCall, ToolObservation } from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { AgentGraphRunHelpers } from './run.helpers';
import type { AgentGraphSkillFrameHelpers } from './skill-frame.util';
import type { AgentGraphDecisionHelpers } from './decision.util';
export type HostToolAfterLlmResult = {
    kind: 'continue';
} | {
    kind: 'state';
    state: AgentGraphState;
};
export interface AgentGraphHostToolHandleHelpers {
    handleHostToolPreLlmSkip: (input: {
        graphState: AgentGraphState;
        pendingHostStep: TaskPlanStep;
        hostToolsForPrompt: HostToolDecisionDefinition[];
        llmStepNumber: number;
        nextIteration: number;
    }) => AgentGraphState | null;
    processHostToolAfterLlmDecision: (input: {
        graphState: AgentGraphState;
        pendingHostStep: TaskPlanStep | null;
        hostToolsForPrompt: HostToolDecisionDefinition[];
        observationsForLlm: ToolObservation[];
        llmStepNumber: number;
        nextIteration: number;
        steps: AgentRunStep[];
        httpCalls: GraphToolCall[];
        hostCalls: GraphToolCall[];
        toolCallsFromLlm: GraphToolCall[];
    }) => HostToolAfterLlmResult;
    applyHostToolPlanStepHandle: (graphState: AgentGraphState, input: {
        handle: HostToolPlanStepHandleResult;
        planStepId: string;
        steps: AgentRunStep[];
        nextIteration: number;
        httpCalls: GraphToolCall[];
        sessionId: string;
        runId: number;
        turnId: number;
        warnMessage?: string;
    }, withPlanSyncStep: AgentGraphSkillFrameHelpers['withPlanSyncStep']) => AgentGraphState;
    tryDispatchHostToolFromPlanDraft: (input: {
        graphState: AgentGraphState;
        pendingHostStep: TaskPlanStep;
        hostToolsForPrompt: HostToolDecisionDefinition[];
        observationsForLlm: ToolObservation[];
        llmStepNumber: number;
        nextIteration: number;
        steps: AgentRunStep[];
        httpCalls?: GraphToolCall[];
        llmHostCalls?: GraphToolCall[];
        reason?: string;
    }) => AgentGraphState | null;
}
export declare function applyHostToolPlanStepHandle(deps: AgentGraphDeps, skillFrame: AgentGraphSkillFrameHelpers, graphState: AgentGraphState, input: {
    handle: HostToolPlanStepHandleResult;
    planStepId: string;
    steps: AgentRunStep[];
    nextIteration: number;
    httpCalls: GraphToolCall[];
    sessionId: string;
    runId: number;
    turnId: number;
    warnMessage?: string;
}, withPlanSyncStep: AgentGraphSkillFrameHelpers['withPlanSyncStep']): AgentGraphState;
export declare function tryDispatchHostToolFromPlanDraft(deps: AgentGraphDeps, runHelpers: AgentGraphRunHelpers, hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>, skillFrame: AgentGraphSkillFrameHelpers, decision: AgentGraphDecisionHelpers, ctx: AgentGraphRunContext, input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls?: GraphToolCall[];
    llmHostCalls?: GraphToolCall[];
    reason?: string;
}): AgentGraphState | null;
export declare function handleHostToolPreLlmSkip(deps: AgentGraphDeps, runHelpers: AgentGraphRunHelpers, hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>, skillFrame: AgentGraphSkillFrameHelpers, ctx: AgentGraphRunContext, input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    llmStepNumber: number;
    nextIteration: number;
}): AgentGraphState | null;
export declare function processHostToolAfterLlmDecision(deps: AgentGraphDeps, hostToolHandle: Pick<AgentGraphHostToolHandleHelpers, 'applyHostToolPlanStepHandle'>, skillFrame: AgentGraphSkillFrameHelpers, ctx: AgentGraphRunContext, input: {
    graphState: AgentGraphState;
    pendingHostStep: TaskPlanStep | null;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    observationsForLlm: ToolObservation[];
    llmStepNumber: number;
    nextIteration: number;
    steps: AgentRunStep[];
    httpCalls: GraphToolCall[];
    hostCalls: GraphToolCall[];
    toolCallsFromLlm: GraphToolCall[];
}): HostToolAfterLlmResult;
export declare function createAgentGraphHostToolHandleHelpers(deps: AgentGraphDeps, runHelpers: AgentGraphRunHelpers, skillFrame: AgentGraphSkillFrameHelpers, decision: AgentGraphDecisionHelpers, ctx: AgentGraphRunContext): AgentGraphHostToolHandleHelpers;
