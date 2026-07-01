import type {
  AgentGraphNodeBundle,
  AgentGraphNodeFn,
} from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { detectIntentKind as classifyIntentKind } from '../../../../intent-kind.util';
import { isUserIntentClear as isUserIntentMessageClear } from '../../../../../intent/intent-scope.util';
import { loadSmallTalkHints } from '../../../../../intent/smalltalk-hints.util';
import { recordMachineCodeUsage } from '../../../run-metrics.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import {
  bundleFromAllowedRunInput,
  emptyScopedToolsBundle,
  spreadScopedToolsBundle,
  type TurnScopedToolsBundle,
} from '../../../turn/turn-scoped-tools.util';
import type {
  AgentRunStep,
  ParsedIntentPayload,
} from '../../types/agent-engine.types';

export function createIntentNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;

  const allowedToolsBundle = (): TurnScopedToolsBundle =>
    bundleFromAllowedRunInput({
      tools: ctx.input.tools,
      langChainTools: ctx.input.langChainTools,
      allowedToolIds: ctx.input.allowedToolIds,
    });

  const withIntentScopedTools = (
    state: Parameters<AgentGraphNodeFn>[0],
    bundle: TurnScopedToolsBundle,
  ) => ({
    ...state,
    intentScopedToolsBundle: bundle,
    ...spreadScopedToolsBundle(bundle),
  });

  return async (state) => {
    const stepNum = nextRunStepNumber(state.steps);

    const skipRecognition =
      !ctx.input.enableToolCall || ctx.input.tools.length === 0;
    const intentKind = classifyIntentKind(
      ctx.input.latestUserMessage,
      loadSmallTalkHints(),
    );

    if (intentKind === 'smalltalk') {
      const intentStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          intentClear: true,
          intentKind: 'smalltalk',
          matchedCategoryIds: [],
          intentMatched: false,
          smalltalk: true,
          deferToTurnRoute: true,
          skipped: skipRecognition || undefined,
        }),
      };
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, intentStep],
        AgentRunStatus.running,
      );
      return withIntentScopedTools(
        {
          ...state,
          steps: [...state.steps, intentStep],
          intentKind: 'smalltalk',
        },
        emptyScopedToolsBundle(),
      );
    }

    if (skipRecognition) {
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在处理你的请求…\n',
        'replace',
      );
      const intentStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          skipped: true,
          intentKind,
          matchedCategoryIds: [],
        }),
      };
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, intentStep],
        AgentRunStatus.running,
      );
      return {
        ...runHelpers.buildTurnRespondState(
          state,
          [...state.steps, intentStep],
          {
            kind: 'unsupported_scope',
            userMessage: ctx.input.latestUserMessage,
            payload: { readinessReason: 'tools_disabled' },
          },
        ),
        intentKind,
      };
    }

    deps.sse.emitThink(
      ctx.input.sessionId,
      ctx.input.runId,
      '正在理解你的问题…\n',
      'replace',
    );

    const categoryIds = [
      ...new Set(
        ctx.input.tools
          .map((t) => t.toolCategoryId)
          .filter((id): id is number => id != null),
      ),
    ];
    const categories =
      await deps.sessionScope.fetchToolCategoriesForAllowedTools(categoryIds);

    const intentClear = isUserIntentMessageClear(ctx.input.latestUserMessage);
    if (!intentClear) {
      const intentStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          intentClear: false,
          recallSource: 'none',
          matchedCategoryIds: [],
        }),
      };
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, intentStep],
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(
        state,
        [...state.steps, intentStep],
        {
          kind: 'message_unclear',
          userMessage: ctx.input.latestUserMessage,
        },
      );
    }

    let recallResult;
    try {
      recallResult = await deps.categoryIntentRecall.recallTopCategories(
        categories,
        ctx.input.latestUserMessage,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      deps.logger.warn(`category intent recall failed: ${message}`);
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在使用备用方式理解你的问题…\n',
        'delta',
      );
      const fallbackStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          error: message,
          fallback: true,
          fallbackReason: 'category_recall_error',
        }),
        meta: { code: 'INTENT_RECALL_FAILED' },
      };
      recordMachineCodeUsage(ctx.input.runMetrics, 'INTENT_RECALL_FAILED');
      fallbackStep.output = runHelpers.normalizeJsonLike({
        error: message,
        fallback: true,
        fallbackReason: 'category_recall_error',
        matchedCategoryIds: [],
      });
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, fallbackStep],
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(
        state,
        [...state.steps, fallbackStep],
        {
          kind: 'intent_recall_failed',
          userMessage: ctx.input.latestUserMessage,
        },
      );
    }

    const validCategoryIdSet = new Set(categories.map((c) => c.id));
    const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) =>
      validCategoryIdSet.has(id),
    );

    const intentOutputBase: Record<string, unknown> = {
      intentClear: true,
      matchedCategoryIds,
      includeUncategorized: false,
      toolsBeforeIntentNarrow: ctx.input.tools.length,
      recallSource: recallResult.source,
      recallMatches: recallResult.matches.map((item) => ({
        id: item.id,
        label: item.label,
        score: Number(item.score.toFixed(4)),
        source: item.source,
      })),
    };

    if (matchedCategoryIds.length === 0) {
      const intentStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          ...intentOutputBase,
          intentMatched: false,
          deferToTurnRoute: true,
        }),
      };
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, intentStep],
        AgentRunStatus.running,
      );
      return withIntentScopedTools(
        {
          ...state,
          steps: [...state.steps, intentStep],
          intentKind,
        },
        allowedToolsBundle(),
      );
    }

    const parsed: ParsedIntentPayload = {
      intentClear: true,
      guidance: '',
      matchedCategoryIds,
      includeUncategorized: false,
    };

    const narrowed = deps.sessionScope.filterToolsByIntent(
      ctx.input.tools,
      parsed,
    );
    if (narrowed.length === 0) {
      const intentStep: AgentRunStep = {
        step: stepNum,
        type: 'intent',
        output: runHelpers.normalizeJsonLike({
          ...intentOutputBase,
          toolsAfterIntentNarrow: 0,
          intentMatched: false,
          deferToTurnRoute: true,
        }),
      };
      await runHelpers.updateRun(
        ctx.input.runId,
        [...state.steps, intentStep],
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: [...state.steps, intentStep],
        intentKind,
      };
    }

    const scoped = await deps.sessionScope.resolveScopedToolsForIntent({
      sessionId: ctx.input.sessionId,
      userMessage: ctx.input.latestUserMessage,
      tools: narrowed,
      toolBuildCtx: ctx.input.toolBuildCtx,
      matchedCategoryIds,
    });

    const intentOutput: Record<string, unknown> = {
      ...intentOutputBase,
      intentMatched: true,
      toolsAfterIntentNarrow: narrowed.length,
      toolsAfterBindCap: scoped.scopedTools.length,
      scopeFromCache: scoped.fromCache,
    };
    if (scoped.fallbackReason) {
      intentOutput.fallback = true;
      intentOutput.fallbackReason = scoped.fallbackReason;
    }
    if (scoped.bindCap) {
      intentOutput.bindToolsCap = scoped.bindCap;
    }
    const intentStep: AgentRunStep = {
      step: stepNum,
      type: 'intent',
      output: runHelpers.normalizeJsonLike(intentOutput),
    };

    await runHelpers.updateRun(
      ctx.input.runId,
      [...state.steps, intentStep],
      AgentRunStatus.running,
    );
    return withIntentScopedTools(
      {
        ...state,
        steps: [...state.steps, intentStep],
        intentKind,
      },
      {
        scopedTools: scoped.scopedTools,
        scopedLangChainTools: scoped.scopedLangChainTools,
        scopedToolBundle: scoped.scopedToolBundle,
        scopedAllowedToolIds: scoped.scopedAllowedToolIds,
      },
    );
  };
}
