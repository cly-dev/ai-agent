import type { AgentGraphState } from '../../agent-engine/engine/main/types/agent-engine.types';
import type { AgentGraphNodeBundle } from '../../agent-engine/engine/main/agent-graph/types/graph.types';
import type { PageWorkflowExecutorRuntime } from '../page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow.types';
import type { WorkflowExecutorHost, WorkflowExecutorOutcome } from './workflow-executor.types';
export declare function requireChatExecutorHost(host: WorkflowExecutorHost): Extract<WorkflowExecutorHost, {
    profile: 'chat';
}>;
export declare function requirePageExecutorHost(host: WorkflowExecutorHost): Extract<WorkflowExecutorHost, {
    profile: 'page';
}>;
export declare function resolveExecutorPageContext(host: WorkflowExecutorHost): AgentGraphState['pageContext'];
export declare function isCompletedExecutorOutcome(outcome: WorkflowExecutorOutcome): outcome is Extract<WorkflowExecutorOutcome, {
    kind: 'completed';
}>;
export declare function assertPageExecutorCompleted(action: WorkflowNodeDef['action'], outcome: WorkflowExecutorOutcome): Extract<WorkflowExecutorOutcome, {
    kind: 'completed';
}>;
export declare function chatExecutorContext(input: {
    bundle: AgentGraphNodeBundle;
    state: AgentGraphState;
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
}): {
    host: {
        profile: "chat";
        bundle: AgentGraphNodeBundle;
        state: AgentGraphState;
    };
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
};
export declare function pageExecutorContext(input: {
    runtime: PageWorkflowExecutorRuntime;
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
}): {
    host: {
        profile: "page";
        runtime: PageWorkflowExecutorRuntime;
    };
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
};
