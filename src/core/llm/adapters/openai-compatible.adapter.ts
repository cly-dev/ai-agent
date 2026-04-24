import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { LlmAdapter } from './llm-adapter.interface';
import type {
  LlmAdapterConfig,
  LlmChatRequest,
  LlmChatResult,
  LlmStreamHandlers,
  LlmToolCall,
} from '../llm.types';

type OpenAiCompatibleResponse = {
  model?: string;
  done?: boolean;
  message?: {
    content?: string | null;
    tool_calls?: Array<{
      function?: {
        name?: string;
        arguments?: unknown;
      };
    }>;
  };
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: unknown;
        };
      }>;
    };
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: unknown;
        };
      }>;
    };
  }>;
};

@Injectable()
export class OpenAiCompatibleAdapter implements LlmAdapter {
  async chat(
    request: LlmChatRequest,
    config: LlmAdapterConfig,
  ): Promise<LlmChatResult> {
    const endpoint = this.resolveEndpoint(config.baseUrl, config.chatPath);
    const apiKey = config.apiKey?.trim() ?? '';

    const payload = this.buildPayload(request, false);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestException(
          `llm request failed: ${response.status} ${response.statusText} ${errorText}`,
        );
      }

      const data = (await response.json()) as OpenAiCompatibleResponse;
      const { content, toolCalls } = this.extractMessage(data);
      if (!content && toolCalls.length === 0) {
        throw new InternalServerErrorException(
          'llm response does not contain message content or tool_calls',
        );
      }

      return {
        content,
        toolCalls,
        model: data.model ?? request.model,
        raw: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `llm adapter request error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async streamChat(
    request: LlmChatRequest,
    config: LlmAdapterConfig,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult> {
    const endpoint = this.resolveEndpoint(config.baseUrl, config.chatPath);
    const apiKey = config.apiKey?.trim() ?? '';
    const payload = this.buildPayload(request, true);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new BadRequestException(
          `llm stream request failed: ${response.status} ${response.statusText} ${errorText}`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      const toolCalls: LlmToolCall[] = [];
      let model = request.model;
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const lineRaw of lines) {
          const line = lineRaw.trim();
          if (!line) {
            continue;
          }
          const data = this.tryParseChunk(line);
          if (!data) {
            continue;
          }
          const extracted = this.extractMessage(data);
          content += extracted.content;
          for (const item of extracted.toolCalls) {
            toolCalls.push(item);
          }
          model = data.model ?? model;
          done = data.done === true;
          handlers?.onDelta?.({
            model,
            contentDelta: extracted.content,
            toolCalls: extracted.toolCalls,
            done,
            raw: data,
          });
        }
      }

      if (buffer.trim()) {
        const data = this.tryParseChunk(buffer.trim());
        if (data) {
          const extracted = this.extractMessage(data);
          content += extracted.content;
          for (const item of extracted.toolCalls) {
            toolCalls.push(item);
          }
          model = data.model ?? model;
          done = done || data.done === true;
          handlers?.onDelta?.({
            model,
            contentDelta: extracted.content,
            toolCalls: extracted.toolCalls,
            done,
            raw: data,
          });
        }
      }

      if (!content && toolCalls.length === 0) {
        return this.chat(
          {
            ...request,
            stream: false,
          },
          config,
        );
      }
      return {
        content,
        toolCalls,
        model,
        raw: { done },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `llm adapter stream error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private resolveEndpoint(baseUrl: string, chatPath: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const path = chatPath.trim();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  private extractContent(data: OpenAiCompatibleResponse): string {
    const text =
      data.message?.content ??
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.delta?.content;
    if (!text) {
      return '';
    }
    return text;
  }

  private extractToolCalls(data: OpenAiCompatibleResponse): LlmToolCall[] {
    const toolCalls =
      data.message?.tool_calls ??
      data.choices?.[0]?.message?.tool_calls ??
      data.choices?.[0]?.delta?.tool_calls ??
      [];
    return toolCalls
      .map((item) => {
        const name = item.function?.name;
        if (!name) {
          return null;
        }
        return {
          name,
          arguments: this.normalizeArguments(item.function?.arguments),
        };
      })
      .filter((item) => item !== null) as LlmToolCall[];
  }

  private extractMessage(data: OpenAiCompatibleResponse): {
    content: string;
    toolCalls: LlmToolCall[];
  } {
    return {
      content: this.extractContent(data),
      toolCalls: this.extractToolCalls(data),
    };
  }

  private buildPayload(
    request: LlmChatRequest,
    forceStream: boolean,
  ): Record<string, unknown> {
    return {
      model: request.model,
      messages: request.messages,
      stream: forceStream ? true : request.stream ?? false,
      tools: request.tools ?? [],
      parameters: request.parameters ?? {},
      max_tokens: request.maxTokens ?? undefined,
      temperature: request.temperature ?? undefined,
    };
  }

  private tryParseChunk(value: string): OpenAiCompatibleResponse | null {
    const line = value.trim();
    if (!line) {
      return null;
    }
    if (line === '[DONE]') {
      return { done: true };
    }
    const normalized = line.startsWith('data:') ? line.slice(5).trim() : line;
    if (!normalized || normalized === '[DONE]') {
      return { done: true };
    }
    try {
      return JSON.parse(normalized) as OpenAiCompatibleResponse;
    } catch {
      return null;
    }
  }

  private normalizeArguments(value: unknown): Record<string, unknown> {
    if (!value) {
      return {};
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return {};
  }
}
