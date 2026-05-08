import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { LlmModelConfig } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeToolCallArgs as normalizeToolArguments } from './tool-call-args.util';
import type {
  LlmChatInput,
  LlmChatResult,
  LlmStreamDelta,
  LlmStreamHandlers,
  LlmToolCall,
  LlmToolDefinition,
} from './llm.types';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private cachedConfig: LlmModelConfig | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.refreshConfigCache();
    } catch (error) {
      this.logger.warn(
        `skip llm config preload on startup: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async refreshConfigCache(): Promise<void> {
    this.cachedConfig = await this.loadActiveConfigFromDb();
  }

  async chat(input: LlmChatInput): Promise<LlmChatResult> {
    return this.invokeWithLangChain(input, false);
  }

  async streamChat(
    input: LlmChatInput,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult> {
    return this.invokeWithLangChain(input, true, handlers);
  }

  async createLangChainChatModel(options?: {
    streaming?: boolean;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatOpenAI> {
    const config = await this.getCachedConfig();
    const parameters = this.normalizeParameters(config.parameters);
    const resolvedTemperature =
      options?.temperature ??
      config.temperature ??
      this.pickNumber(parameters.temperature);
    const resolvedMaxTokens =
      options?.maxTokens ??
      config.maxTokens ??
      this.pickNumber(parameters.maxTokens);
    const fromDb = config.apiKey != null ? String(config.apiKey).trim() : '';
    const fromEnv = process.env.OPENAI_API_KEY
      ? String(process.env.OPENAI_API_KEY).trim()
      : '';
    // Must be non-empty: '' is treated as “no key” by the OpenAI client. Intranet gateways ignore it.
    const apiKey = fromDb || fromEnv || 'local-internal';
    const model = new ChatOpenAI({
      model: config.model,
      apiKey,
      temperature: resolvedTemperature ?? undefined,
      maxTokens: resolvedMaxTokens ?? undefined,
      streaming: options?.streaming ?? true,
      configuration: {
        baseURL: this.resolveLangChainBaseUrl(config.baseUrl, config.chatPath),
      },
    });
    return model;
  }

  private async invokeWithLangChain(
    input: LlmChatInput,
    forceStreaming: boolean,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult> {
    const model = await this.createLangChainChatModel({
      streaming: forceStreaming || input.stream === true,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    });
    const runnable =
      input.tools && input.tools.length > 0
        ? model.bindTools(this.toLangChainTools(input.tools))
        : model.bindTools([]);
    const response = (await runnable.invoke(
      input.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        callbacks: handlers
          ? [
              {
                handleLLMNewToken: (token: string) => {
                  const delta: LlmStreamDelta = {
                    model: this.extractModelName(undefined, model.model),
                    contentDelta: token,
                    toolCalls: [],
                    done: false,
                    raw: token,
                  };
                  handlers.onDelta?.(delta);
                },
              },
            ]
          : undefined,
      },
    )) as AIMessage;
    const content = this.extractAiMessageContent(response.content);
    const toolCalls = this.extractToolCalls(response);
    const modelName = this.extractModelName(
      response.response_metadata as Record<string, unknown> | undefined,
      model.model,
    );
    if (handlers?.onDelta) {
      handlers.onDelta({
        model: modelName,
        contentDelta: '',
        toolCalls,
        done: true,
        raw: response,
      });
    }
    return {
      content,
      toolCalls,
      model: modelName,
      raw: response,
    };
  }

  private async getCachedConfig(): Promise<LlmModelConfig> {
    if (this.cachedConfig && this.cachedConfig.enabled) {
      return this.cachedConfig;
    }
    this.cachedConfig = await this.loadActiveConfigFromDb();
    return this.cachedConfig;
  }

  private async loadActiveConfigFromDb(): Promise<LlmModelConfig> {
    const config = await this.prisma.llmModelConfig.findFirst({
      where: { enabled: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (!config) {
      throw new NotFoundException('no enabled llm model config found');
    }
    return config;
  }

  private normalizeParameters(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private pickNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return null;
  }

  private resolveLangChainBaseUrl(baseUrl: string, chatPath: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = chatPath.trim();
    if (!normalizedPath) {
      return normalizedBase;
    }
    const withoutChatCompletions = normalizedPath.replace(
      /\/chat\/completions\/?$/i,
      '',
    );
    if (!withoutChatCompletions || withoutChatCompletions === '/') {
      return normalizedBase;
    }
    const prefix = withoutChatCompletions.startsWith('/')
      ? withoutChatCompletions
      : `/${withoutChatCompletions}`;
    return `${normalizedBase}${prefix}`.replace(/\/+$/, '');
  }

  private toLangChainTools(
    tools: LlmToolDefinition[],
  ): Array<Record<string, unknown>> {
    return tools
      .map((tool) => {
        if (!tool?.function?.name) {
          return null;
        }
        return {
          type: 'function',
          function: {
            name: tool.function.name,
            description: tool.function.description ?? '',
            parameters: tool.function.parameters ?? {
              type: 'object',
              properties: {},
            },
          },
        };
      })
      .filter((item) => item !== null) as Array<Record<string, unknown>>;
  }

  private extractAiMessageContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (!Array.isArray(content)) {
      return '';
    }
    return content
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return '';
        }
        const row = item as Record<string, unknown>;
        const text = row.text;
        return typeof text === 'string' ? text : '';
      })
      .join('');
  }

  private extractToolCalls(message: AIMessage): LlmToolCall[] {
    const value = (message.tool_calls ??
      message.additional_kwargs?.tool_calls ??
      []) as unknown[];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        if (typeof row.name === 'string') {
          return {
            name: row.name,
            arguments: normalizeToolArguments(row.args),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        if (typeof fnRow.name !== 'string') {
          return null;
        }
        return {
          name: fnRow.name,
          arguments: normalizeToolArguments(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as LlmToolCall[];
  }

  private extractModelName(
    responseMeta: Record<string, unknown> | undefined,
    fallback: string,
  ): string {
    const modelName = responseMeta?.model_name;
    if (typeof modelName === 'string' && modelName.trim()) {
      return modelName;
    }
    return fallback;
  }
}
