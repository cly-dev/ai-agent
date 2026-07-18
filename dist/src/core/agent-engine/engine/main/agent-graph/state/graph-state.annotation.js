"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphStateAnnotation = void 0;
const langgraph_1 = require("@langchain/langgraph");
const client_1 = require("../../../../../../../generated/prisma/client");
function createAgentGraphStateAnnotation() {
    const State = langgraph_1.Annotation.Root({
        iteration: (0, langgraph_1.Annotation)({
            default: () => 0,
            reducer: (_state, update) => update,
        }),
        steps: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        toolObservations: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        preloadedToolObservations: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        pendingToolCalls: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        pendingRespond: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        intentKind: (0, langgraph_1.Annotation)({
            default: () => 'task',
            reducer: (_state, update) => update,
        }),
        finalOutput: (0, langgraph_1.Annotation)({
            default: () => '',
            reducer: (_state, update) => update,
        }),
        status: (0, langgraph_1.Annotation)({
            default: () => client_1.AgentRunStatus.running,
            reducer: (_state, update) => update,
        }),
        finished: (0, langgraph_1.Annotation)({
            default: () => false,
            reducer: (_state, update) => update,
        }),
        scopedTools: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        scopedLangChainTools: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        scopedAllowedToolIds: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        scopedToolBundle: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        planStepToolCandidates: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        planStepToolCandidateStrategy: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        intentScopedToolsBundle: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        toolProfilesByName: (0, langgraph_1.Annotation)({
            default: () => ({}),
            reducer: (_state, update) => update,
        }),
        hasExpandedOnce: (0, langgraph_1.Annotation)({
            default: () => false,
            reducer: (_state, update) => update,
        }),
        awaitingWriteConfirmation: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        skillApplied: (0, langgraph_1.Annotation)({
            default: () => false,
            reducer: (_state, update) => update,
        }),
        activeSkillId: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        activeSkillPrompt: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        activeSkillName: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        activeSkillDescription: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        activeSkillConfig: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        activeSkillRiskLevel: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        taskPlan: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        lastToolRoundMeta: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        pagedListHttpUsed: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        planAborted: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        confirmedPreviewSerialized: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        pageContext: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        materializedEntities: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        scopedHostTools: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        scopedHostLangChainTools: (0, langgraph_1.Annotation)({
            default: () => [],
            reducer: (_state, update) => update,
        }),
        turnExecutionContract: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        planRunContext: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        workflowRun: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        workflowNodeDefs: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        workflowIr: (0, langgraph_1.Annotation)({
            default: () => null,
            reducer: (_state, update) => update,
        }),
        workflowExecutionMode: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        workflowNodeOutputs: (0, langgraph_1.Annotation)({
            default: () => undefined,
            reducer: (_state, update) => update,
        }),
        workflowAwaitingReact: (0, langgraph_1.Annotation)({
            default: () => false,
            reducer: (_state, update) => update,
        }),
    });
    return State;
}
exports.createAgentGraphStateAnnotation = createAgentGraphStateAnnotation;
//# sourceMappingURL=graph-state.annotation.js.map