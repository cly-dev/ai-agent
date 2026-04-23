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
} from '../llm.types';

type OpenAiCompatibleResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
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

    const payload = {
      model: request.model,
      parameters: request.parameters ?? {},
      messages: request.messages,
      tools: request.tools ?? undefined,
      stream: request.stream ?? false,
      max_tokens: request.maxTokens ?? undefined,
      temperature: request.temperature ?? undefined,
    };

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
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new InternalServerErrorException(
          'llm response does not contain message content',
        );
      }

      return {
        content,
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

  private resolveEndpoint(baseUrl: string, chatPath: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const path = chatPath.trim();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}
