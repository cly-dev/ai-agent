"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fitPromptToBudget = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const call_kind_policy_util_1 = require("./call-kind-policy.util");
const apply_block_degrade_util_1 = require("./apply-block-degrade.util");
const prompt_block_parser_util_1 = require("./prompt-block-parser.util");
const prompt_block_render_util_1 = require("./prompt-block-render.util");
function computeEffectiveBudget(budget) {
    const margin = (0, prompt_budget_constants_1.getPromptBudgetSafetyMarginRatio)();
    const reserve = (0, prompt_budget_constants_1.getPromptBudgetReserveTokens)();
    return Math.max(256, Math.floor(budget * (1 - margin)) - reserve);
}
function estimateRawMessagesTokens(messages) {
    const blocks = (0, prompt_block_parser_util_1.parsePromptBlocks)(messages);
    return (0, prompt_block_render_util_1.estimateBlocksTokens)(blocks);
}
function buildSkippedReport(budget, tokensBefore) {
    return {
        enabled: (0, prompt_budget_constants_1.isPromptBudgetEnabled)(),
        skipped: true,
        budget,
        tokensBefore,
        tokensAfter: tokensBefore,
        fitted: true,
        degradations: [],
        warnings: [],
    };
}
function fitPromptToBudget(messages, budget, hints) {
    var _a;
    const policy = (0, call_kind_policy_util_1.resolveCallKindPolicy)(hints === null || hints === void 0 ? void 0 : hints.callKind, hints === null || hints === void 0 ? void 0 : hints.skipFit);
    const tokensBefore = estimateRawMessagesTokens(messages);
    if (!(0, prompt_budget_constants_1.isPromptBudgetEnabled)() || policy.skipFit) {
        return {
            messages,
            report: buildSkippedReport(budget, tokensBefore),
        };
    }
    const effectiveBudget = computeEffectiveBudget(budget);
    const originals = (0, apply_block_degrade_util_1.mergeSessionHistoryTurnBlocks)((0, prompt_block_parser_util_1.parsePromptBlocks)(messages).map((block) => (Object.assign(Object.assign({}, block), { payload: structuredClone(block.payload) }))));
    for (const block of originals) {
        block.maxDegradeLevel = (0, call_kind_policy_util_1.applyCallKindPolicyToBlock)(block.kind, block.maxDegradeLevel, policy);
    }
    const degradeLevels = new Map(originals.map((block) => [block.id, 0]));
    const materialize = () => originals.map((original) => {
        var _a;
        return (0, apply_block_degrade_util_1.applyDegradeToBlock)(Object.assign(Object.assign({}, original), { degradeLevel: 0, payload: structuredClone(original.payload) }), (_a = degradeLevels.get(original.id)) !== null && _a !== void 0 ? _a : 0);
    });
    let blocks = materialize();
    let tokensAfter = (0, prompt_block_render_util_1.estimateBlocksTokens)(blocks);
    const degradations = [];
    const warnings = [];
    let guard = 0;
    const exhaustedBlockIds = new Set();
    while (tokensAfter > effectiveBudget && guard < 200) {
        guard += 1;
        const candidates = blocks
            .filter((block) => !exhaustedBlockIds.has(block.id))
            .map((block) => {
            var _a;
            return (Object.assign(Object.assign({}, block), { degradeLevel: (_a = degradeLevels.get(block.id)) !== null && _a !== void 0 ? _a : 0 }));
        });
        const candidate = (0, prompt_block_render_util_1.pickNextDegradeCandidate)(candidates);
        if (!candidate) {
            warnings.push(`prompt budget exceeded after degradations tokens=${tokensAfter} budget=${effectiveBudget}`);
            break;
        }
        const previousLevel = (_a = degradeLevels.get(candidate.id)) !== null && _a !== void 0 ? _a : 0;
        const nextLevel = (0, prompt_block_render_util_1.nextDegradeLevel)(previousLevel);
        if (nextLevel > candidate.maxDegradeLevel) {
            exhaustedBlockIds.add(candidate.id);
            continue;
        }
        degradeLevels.set(candidate.id, nextLevel);
        blocks = materialize();
        const nextTokens = (0, prompt_block_render_util_1.estimateBlocksTokens)(blocks);
        if (nextTokens >= tokensAfter) {
            if (nextLevel >= candidate.maxDegradeLevel) {
                exhaustedBlockIds.add(candidate.id);
            }
        }
        else {
            tokensAfter = nextTokens;
        }
        degradations.push({
            blockId: candidate.id,
            kind: candidate.kind,
            sourceMessageIndex: candidate.sourceMessageIndex,
            fromLevel: previousLevel,
            toLevel: nextLevel,
            tokensBefore: tokensAfter,
            tokensAfter: nextTokens,
        });
    }
    const report = {
        enabled: true,
        skipped: false,
        callKind: hints === null || hints === void 0 ? void 0 : hints.callKind,
        budget: effectiveBudget,
        tokensBefore,
        tokensAfter,
        fitted: tokensAfter <= effectiveBudget,
        degradations,
        warnings,
    };
    return {
        messages: (0, prompt_block_render_util_1.renderPromptBlocks)(blocks),
        report,
    };
}
exports.fitPromptToBudget = fitPromptToBudget;
//# sourceMappingURL=fit-prompt-to-budget.util.js.map