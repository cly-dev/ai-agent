import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpMethod } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ToolExecutionResult = {
  toolId: number;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  latency: number;
};

@Injectable()
export class ToolEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async executeByName(
    toolName: string,
    input: Record<string, unknown>,
    allowedToolIds: number[],
  ): Promise<ToolExecutionResult> {
    const tool = await this.prisma.tool.findFirst({
      where: {
        name: toolName,
        id: { in: allowedToolIds },
        isActive: true,
      },
      include: {
        integration: true,
      },
    });
    if (!tool) {
      throw new NotFoundException(`tool ${toolName} not found or not allowed`);
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = tool.timeout ?? 10_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        this.resolveUrl(tool.integration.baseUrl, tool.path, tool.method, input),
        {
          method: this.toHttpMethod(tool.method),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tool.integration.apiKey}`,
          },
          body: tool.method === HttpMethod.Get ? undefined : JSON.stringify(input),
          signal: controller.signal,
        },
      );
      const bodyText = await response.text();
      const output = this.safeJsonParse(bodyText);
      if (!response.ok) {
        throw new BadRequestException(
          `tool ${tool.name} failed: ${response.status} ${response.statusText}`,
        );
      }
      return {
        toolId: tool.id,
        name: tool.name,
        input,
        output,
        latency: Date.now() - startedAt,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private toHttpMethod(method: HttpMethod): string {
    switch (method) {
      case HttpMethod.Get:
        return 'GET';
      case HttpMethod.Post:
        return 'POST';
      case HttpMethod.Put:
        return 'PUT';
      case HttpMethod.Delete:
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  private resolveUrl(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    input: Record<string, unknown>,
  ): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBase}${normalizedPath}`);
    if (method === HttpMethod.Get) {
      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
