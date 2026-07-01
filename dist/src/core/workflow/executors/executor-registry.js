"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkflowExecutors = exports.getWorkflowExecutor = void 0;
const workflow_action_registry_1 = require("../workflow-action-registry");
const delegate_react_executor_1 = require("./delegate-react.executor");
const load_page_context_executor_1 = require("./load-page-context.executor");
const mutation_delegate_executor_1 = require("./mutation-delegate.executor");
const page_await_user_confirm_executor_1 = require("./page/page-await-user-confirm.executor");
const page_mutation_delegate_executor_1 = require("./page/page-mutation-delegate.executor");
const page_fetch_data_executor_1 = require("./page/page-fetch-data.executor");
const page_generate_and_push_executor_1 = require("./page/page-generate-and-push.executor");
const page_summarize_executor_1 = require("./page/page-summarize.executor");
const present_mutation_executor_1 = require("./present-mutation.executor");
const summarize_action_executor_1 = require("./summarize-action.executor");
const CHAT_EXECUTORS = [
    load_page_context_executor_1.loadPageContextExecutor,
    delegate_react_executor_1.fetchDataExecutor,
    delegate_react_executor_1.generateAndPushExecutor,
    summarize_action_executor_1.summarizeActionExecutor,
    mutation_delegate_executor_1.composeMutationExecutor,
    present_mutation_executor_1.presentMutationExecutor,
    mutation_delegate_executor_1.writeDataExecutor,
    mutation_delegate_executor_1.awaitUserConfirmExecutor,
];
const PAGE_EXECUTORS = [
    load_page_context_executor_1.loadPageContextExecutor,
    page_fetch_data_executor_1.pageFetchDataExecutor,
    page_generate_and_push_executor_1.pageGenerateAndPushExecutor,
    page_summarize_executor_1.pageSummarizeExecutor,
    page_mutation_delegate_executor_1.pageComposeMutationExecutor,
    page_mutation_delegate_executor_1.pageWriteDataExecutor,
    page_await_user_confirm_executor_1.pageAwaitUserConfirmExecutor,
];
const CHAT_EXECUTOR_BY_ACTION = new Map(CHAT_EXECUTORS.map((executor) => [executor.action, executor]));
const PAGE_EXECUTOR_BY_ACTION = new Map(PAGE_EXECUTORS.map((executor) => [executor.action, executor]));
function profileForExecutorLookup(profile) {
    return profile === 'page' ? 'page_action' : 'chat_skill';
}
function getWorkflowExecutor(action, profile = 'chat') {
    var _a;
    const entry = (0, workflow_action_registry_1.getWorkflowActionRegistryEntry)(action);
    if (!(entry === null || entry === void 0 ? void 0 : entry.implemented)) {
        return null;
    }
    if (!(0, workflow_action_registry_1.workflowProfileAllowsAction)(profileForExecutorLookup(profile), action)) {
        return null;
    }
    const registry = profile === 'page' ? PAGE_EXECUTOR_BY_ACTION : CHAT_EXECUTOR_BY_ACTION;
    return (_a = registry.get(action)) !== null && _a !== void 0 ? _a : null;
}
exports.getWorkflowExecutor = getWorkflowExecutor;
function listWorkflowExecutors(profile = 'chat') {
    return profile === 'page' ? [...PAGE_EXECUTORS] : [...CHAT_EXECUTORS];
}
exports.listWorkflowExecutors = listWorkflowExecutors;
//# sourceMappingURL=executor-registry.js.map