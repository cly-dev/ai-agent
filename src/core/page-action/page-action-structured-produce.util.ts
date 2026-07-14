import type { AIMessage } from '@langchain/core/messages';
import { extractToolCalls } from '../agent-engine/engine/main/agent-graph/runtime/decision.util';
import {
  resolveHostToolArgsSchemaForToolCallBind,
  sanitizeHostToolArgsAgainstContextCatalogs,
} from '../host-bridge/host-tool-args-context-catalog.util';
import {
  softValidateHostToolArgsAgainstSchema,
  unwrapHostToolArgsEnvelope,
} from '../host-bridge/host-tool-args-from-llm.util';
import type { HostToolDecisionDefinition } from '../host-bridge/host-tool-decision.types';
import { buildHostLangChainTools } from '../host-bridge/host-tool-langchain.util';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';
import {
  logPageActionLlmPrompt,
  logPageActionLlmResponse,
} from './page-action-run-debug.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/** Abort 须向上抛，禁止被当成 produce 失败再 fallback。 */
export function isLlmAbortError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) {
    return true;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return false;
}

export type HostToolToolCallProduceResult =
  | {
      ok: true;
      args: Record<string, unknown>;
      model: string | null;
      promptTokens: number | null;
      completionTokens: number | null;
      /** 是否已真正向模型发起 invoke。 */
      llmInvoked: true;
      retryWithStreamParse: false;
      droppedCatalogIds?: Record<string, string[]>;
    }
  | {
      ok: false;
      error: string;
      model: string | null;
      promptTokens: number | null;
      completionTokens: number | null;
      llmInvoked: boolean;
      /**
       * false：本地/协议错误（如 bind 失败），禁止再烧 stream+parse。
       * true：模型侧失败（无 tool_call / 校验失败等），可 fallback。
       */
      retryWithStreamParse: boolean;
    };

/**
 * instant 主产出：与 compose_mutation / ReAct host tool 同构——
 * `bindTools(hostTool stub)` + `tool_choice=工具名`，从 tool_call.arguments 取参。
 * 若 argsSchema 标注 x-contextIdCatalog，flush 前 sanitize 白名单；enum 注入默认关（见 HOST_TOOL_CATALOG_ENUM_INJECT）。
 */
export async function produceHostToolArgsViaToolCall(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  hostTool: HostToolDecisionDefinition;
  /** PageAction invoke.context；供 x-contextIdCatalog 白名单 */
  actionContext?: Record<string, unknown> | null;
  actionRunId?: number;
  actionKey?: string | null;
  budgetHints?: PromptBudgetHints;
  signal?: AbortSignal;
}): Promise<HostToolToolCallProduceResult> {
  let modelName: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  /** 仅在 bound.invoke 开始后置 true，避免 createModel 失败虚增调用次数。 */
  let didInvoke = false;

  try {
    if (input.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const { schema: schemaForBind, catalogEnumInjected } =
      resolveHostToolArgsSchemaForToolCallBind(
        input.hostTool.argsSchema,
        input.actionContext ?? null,
      );
    const toolForBind: HostToolDecisionDefinition = {
      ...input.hostTool,
      argsSchema: schemaForBind,
    };

    let tools;
    let byName: Map<string, unknown>;
    try {
      const built = buildHostLangChainTools([toolForBind]);
      tools = built.tools;
      byName = built.byName;
    } catch (error) {
      return {
        ok: false,
        error: `host_tool_bind_failed:${formatUnknownError(error)}`,
        model: modelName,
        promptTokens,
        completionTokens,
        llmInvoked: false,
        retryWithStreamParse: false,
      };
    }

    const lcTool = byName.get(input.hostTool.name);
    if (!lcTool || tools.length === 0) {
      return {
        ok: false,
        error: 'host_tool_bind_failed',
        model: modelName,
        promptTokens,
        completionTokens,
        llmInvoked: false,
        retryWithStreamParse: false,
      };
    }

    const { model, messages: fittedMessages } =
      await input.llmService.createLangChainChatModelForMessages(input.messages, {
        budgetHints: input.budgetHints ?? { callKind: 'decision' },
      });

    if (input.actionRunId != null) {
      logPageActionLlmPrompt({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        phase: 'tool_call_fitted',
        messages: fittedMessages,
        meta: {
          producePath: 'tool_call',
          tool: input.hostTool.name,
          budgetHints: input.budgetHints ?? { callKind: 'decision' },
          preFitMessageCount: input.messages.length,
          fittedMessageCount: fittedMessages.length,
          argsSchemaKeys: Object.keys(
            (input.hostTool.argsSchema.properties as Record<string, unknown> | undefined) ??
              {},
          ),
          catalogEnumInjected,
        },
      });
    }

    // 强制调用这一把 Host Tool，避免模型写正文或乱点其它 tool
    const bound = model.bindTools(tools, {
      tool_choice: input.hostTool.name,
    });

    didInvoke = true;
    const aiMessage = (await bound.invoke(fittedMessages, {
      signal: input.signal,
    })) as AIMessage;

    const responseMeta = aiMessage.response_metadata as
      | Record<string, unknown>
      | undefined;
    const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
    promptTokens = usage?.promptTokens ?? null;
    completionTokens = usage?.completionTokens ?? null;
    modelName =
      resolveLlmModelNameFromResponseMeta(responseMeta) ?? model.model ?? null;

    const toolCalls = extractToolCalls(aiMessage);
    // 只接受精确工具名，禁止 toolCalls[0] 误取异名调用
    const matched = toolCalls.find((call) => call.name === input.hostTool.name);
    if (!matched) {
      if (input.actionRunId != null) {
        logPageActionLlmResponse({
          actionRunId: input.actionRunId,
          actionKey: input.actionKey,
          phase: 'tool_call',
          model: modelName,
          promptTokens,
          completionTokens,
          detail: {
            ok: false,
            error:
              toolCalls.length > 0
                ? 'host_tool_call_name_mismatch'
                : 'no_host_tool_call',
            toolCalls: toolCalls.map((call) => ({
              name: call.name,
              arguments: call.arguments,
            })),
          },
        });
      }
      return {
        ok: false,
        error:
          toolCalls.length > 0 ? 'host_tool_call_name_mismatch' : 'no_host_tool_call',
        model: modelName,
        promptTokens,
        completionTokens,
        llmInvoked: true,
        retryWithStreamParse: true,
      };
    }

    const rawArgs = isRecord(matched.arguments) ? matched.arguments : {};
    // 偶发把 args 再包一层 toolName；解包后 softValidate（对原始 schema）
    const unwrapped = unwrapHostToolArgsEnvelope(
      rawArgs,
      input.hostTool.argsSchema,
    );
    const sanitized = sanitizeHostToolArgsAgainstContextCatalogs(
      unwrapped,
      input.hostTool.argsSchema,
      input.actionContext ?? null,
    );
    if (!softValidateHostToolArgsAgainstSchema(sanitized.args, input.hostTool.argsSchema)) {
      if (input.actionRunId != null) {
        logPageActionLlmResponse({
          actionRunId: input.actionRunId,
          actionKey: input.actionKey,
          phase: 'tool_call',
          model: modelName,
          promptTokens,
          completionTokens,
          detail: {
            ok: false,
            error: 'tool_call_args_validate_failed',
            rawArgs: unwrapped,
            droppedCatalogIds: sanitized.droppedByField,
            toolCalls: toolCalls.map((call) => ({
              name: call.name,
              arguments: call.arguments,
            })),
          },
        });
      }
      return {
        ok: false,
        error: 'tool_call_args_validate_failed',
        model: modelName,
        promptTokens,
        completionTokens,
        llmInvoked: true,
        retryWithStreamParse: true,
      };
    }

    if (input.actionRunId != null) {
      logPageActionLlmResponse({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        phase: 'tool_call',
        model: modelName,
        promptTokens,
        completionTokens,
        detail: {
          ok: true,
          tool: matched.name,
          args: sanitized.args,
          droppedCatalogIds: sanitized.droppedByField,
          rawArgs: unwrapped,
        },
      });
    }

    return {
      ok: true,
      args: sanitized.args,
      model: modelName,
      promptTokens,
      completionTokens,
      llmInvoked: true,
      retryWithStreamParse: false,
      droppedCatalogIds: sanitized.droppedByField,
    };
  } catch (error) {
    if (isLlmAbortError(error, input.signal)) {
      throw error;
    }
    return {
      ok: false,
      error: formatUnknownError(error),
      model: modelName,
      promptTokens,
      completionTokens,
      llmInvoked: didInvoke,
      retryWithStreamParse: true,
    };
  }
}
