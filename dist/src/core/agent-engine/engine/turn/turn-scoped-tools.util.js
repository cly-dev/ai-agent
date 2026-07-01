"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spreadScopedToolsBundle = exports.applyTurnScopedToolsFromContract = exports.shouldUseExplicitSkillScopedTools = exports.resolveScopedToolsSourceFromContract = exports.bundleFromRequestedSkillCtx = exports.bundleFromAllowedRunInput = void 0;
function bundleFromAllowedRunInput(input) {
    return {
        scopedTools: input.tools,
        scopedLangChainTools: input.langChainTools.tools,
        scopedToolBundle: input.langChainTools,
        scopedAllowedToolIds: input.allowedToolIds,
    };
}
exports.bundleFromAllowedRunInput = bundleFromAllowedRunInput;
function bundleFromRequestedSkillCtx(ctx) {
    return {
        scopedTools: ctx.scoped.scopedTools,
        scopedLangChainTools: ctx.scoped.scopedLangChainTools,
        scopedToolBundle: ctx.scoped.scopedToolBundle,
        scopedAllowedToolIds: ctx.scoped.scopedAllowedToolIds,
    };
}
exports.bundleFromRequestedSkillCtx = bundleFromRequestedSkillCtx;
function resolveScopedToolsSourceFromContract(contract) {
    return contract.plan.scopedToolsSource;
}
exports.resolveScopedToolsSourceFromContract = resolveScopedToolsSourceFromContract;
function shouldUseExplicitSkillScopedTools(contract) {
    return resolveScopedToolsSourceFromContract(contract) === 'explicit_skill';
}
exports.shouldUseExplicitSkillScopedTools = shouldUseExplicitSkillScopedTools;
function applyTurnScopedToolsFromContract(input) {
    if (shouldUseExplicitSkillScopedTools(input.contract) &&
        input.requestedSkillCtx != null) {
        return bundleFromRequestedSkillCtx(input.requestedSkillCtx);
    }
    return input.intentScopedTools;
}
exports.applyTurnScopedToolsFromContract = applyTurnScopedToolsFromContract;
function spreadScopedToolsBundle(bundle) {
    return {
        scopedTools: bundle.scopedTools,
        scopedLangChainTools: bundle.scopedLangChainTools,
        scopedToolBundle: bundle.scopedToolBundle,
        scopedAllowedToolIds: bundle.scopedAllowedToolIds,
    };
}
exports.spreadScopedToolsBundle = spreadScopedToolsBundle;
//# sourceMappingURL=turn-scoped-tools.util.js.map