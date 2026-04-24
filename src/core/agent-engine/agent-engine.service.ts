import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentRunStatus } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { LlmService } from '../llm/llm.service';
import type { LlmChatMessage, LlmToolDefinition } from '../llm/llm.types';
import { PromptComposerService } from '../prompt/prompt-composer.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../../modules/chat/chat-events.service';

type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
};

type AgentRunStepType = 'llm' | 'tool';
type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  meta?: {
    prompt?: string;
    model?: string;
    latency?: number;
  };
};

type AgentRunResult = {
  runId: number;
  output: string;
  status: AgentRunStatus;
};

/**
 * Agent 运行编排核心：
 * - 驱动 LLM 决策与 tool 调用循环
 * - 持久化 AgentRun 执行轨迹
 * - 通过 SSE 推送 think/result 事件
 */
@Injectable()
export class AgentEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptComposer: PromptComposerService,
    private readonly toolEngine: ToolEngineService,
    private readonly chatEvents: ChatEventsService,
  ) {}

  /** 执行一次 Agent 运行。 */
  async run(input: AgentRunInput): Promise<AgentRunResult | null> {
    // 仅允许用户访问自己的会话。
    const session = await this.prisma.session.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      select: { id: true, agentId: true, appClientId: true },
    });
    if (!session) {
      throw new NotFoundException('chat not found');
    }
    if (!session.agentId) {
      return null;
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: session.agentId, appClientId: session.appClientId },
      select: {
        id: true,
        toolIds: true,
        maxSteps: true,
        enableToolCall: true,
        config: true,
      },
    });
    if (!agent) {
      throw new NotFoundException(`agent ${session.agentId} not found`);
    }

    const tools = await this.prisma.tool.findMany({
      where: {
        id: { in: agent.toolIds },
        appClientId: session.appClientId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        inputSchema: true,
        schema: true,
      },
    });
    const toolDefinitions = this.toLlmTools(tools);

    // 创建运行记录，后续每个步骤会增量回写。
    const run = await this.prisma.agentRun.create({
      data: {
        agentId: agent.id,
        appClientId: session.appClientId,
        sessionId: session.id,
        input: input.input,
        status: AgentRunStatus.running,
        steps: [],
        currentStep: 0,
        maxSteps: agent.maxSteps,
      },
    });

    const steps: AgentRunStep[] = [];
    const toolObservations: Array<{ name: string; output: unknown }> = [];
    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: input.input,
    });

    let finalOutput = '';
    let status: AgentRunStatus = AgentRunStatus.running;
    let currentStep = 0;

    try {
      // 主循环：LLM 决策 ->（可选）tool 调用 -> 下一轮。
      for (let step = 1; step <= agent.maxSteps; step += 1) {
        currentStep = step;
        this.emitThink(
          input.sessionId,
          `step ${step}/${agent.maxSteps} reasoning and decision`,
        );

        const decisionPrompt = this.buildDecisionPrompt(
          tools,
          toolObservations,
          agent.enableToolCall,
        );
        const messages: LlmChatMessage[] = [
          ...prompt.messages,
          { role: 'system', content: decisionPrompt },
        ];
        const llmResult = await this.llmService.streamChat(
          {
          messages,
          stream: true,
          tools: agent.enableToolCall ? toolDefinitions : [],
          },
          {
            onDelta: (delta) => {
              // 流式 token 增量通过 think 事件推给前端。
              if (delta.contentDelta.trim().length > 0) {
                this.emitThink(
                  input.sessionId,
                  `step ${step}/${agent.maxSteps} llm: ${delta.contentDelta}`,
                );
              }
            },
          },
        );
        const llmText = llmResult.content.trim();
        steps.push({
          step,
          type: 'llm',
          output: this.normalizeJsonLike({
            content: llmText,
            toolCalls: llmResult.toolCalls,
          }),
          meta: {
            model: llmResult.model,
            prompt: decisionPrompt,
          },
        });
        await this.updateRun(run.id, steps, step, AgentRunStatus.running);

        if (!agent.enableToolCall || llmResult.toolCalls.length === 0) {
          finalOutput = llmText;
          status = AgentRunStatus.success;
          break;
        }
        for (const toolCall of llmResult.toolCalls) {
          this.emitThink(
            input.sessionId,
            `step ${step}/${agent.maxSteps} call tool ${toolCall.name}`,
          );
          const toolResult = await this.toolEngine.executeByName(
            toolCall.name,
            toolCall.arguments,
            agent.toolIds,
          );
          toolObservations.push({
            name: toolResult.name,
            output: toolResult.output,
          });
          steps.push({
            step,
            type: 'tool',
            name: toolResult.name,
            input: toolCall.arguments,
            output: this.normalizeJsonLike(toolResult.output),
            meta: { latency: toolResult.latency },
          });
          await this.updateRun(run.id, steps, step, AgentRunStatus.running);
          this.emitThink(
            input.sessionId,
            `step ${step}/${agent.maxSteps} tool ${toolCall.name} finished`,
          );
        }
      }

      // 超步数时尝试 fallbackReply 兜底。
      if (status !== AgentRunStatus.success) {
        const fallback = this.resolveFallbackReply(agent.config);
        if (!fallback) {
          throw new BadRequestException('agent run exceeded max steps');
        }
        finalOutput = fallback;
        status = AgentRunStatus.success;
      }
      // 清理最终输出中的 <think> 标签内容。
      finalOutput = this.sanitizeFinalOutput(finalOutput);

      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          output: finalOutput,
          status,
          steps: this.toJsonSteps(steps),
          currentStep,
        },
      });

      this.chatEvents.emit(input.sessionId, {
        event: 'result',
        payload: {
          content: JSON.stringify({
            source: 'agent-run',
            action: 'final',
            runId: run.id,
            output: finalOutput,
          }),
        },
      });

      return { runId: run.id, output: finalOutput, status };
    } catch (error) {
      // 失败时回写 failed 状态与错误信息。
      const errorText = error instanceof Error ? error.message : String(error);
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: AgentRunStatus.failed,
          error: errorText,
          steps: this.toJsonSteps(steps),
          currentStep,
        },
      });
      throw error;
    }
  }

  /** 增量更新 AgentRun 当前步骤与状态。 */
  private async updateRun(
    runId: number,
    steps: AgentRunStep[],
    currentStep: number,
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: { steps: this.toJsonSteps(steps), currentStep, status },
    });
  }

  /** 步骤数据按 JSON 存储。 */
  private toJsonSteps(steps: AgentRunStep[]): Prisma.InputJsonValue {
    return steps as unknown as Prisma.InputJsonValue;
  }

  /** 推送 think 事件。 */
  private emitThink(sessionId: string, content: string): void {
    this.chatEvents.emit(sessionId, {
      event: 'think',
      payload: { content },
    });
  }

  /** 规范化步骤 input/output，便于序列化入库。 */
  private normalizeJsonLike(
    value: unknown,
  ): Record<string, unknown> | string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return String(value);
  }

  /** 数据库工具定义转换为 LLM function-calling tools。 */
  private toLlmTools(
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
      schema: unknown;
    }>,
  ): LlmToolDefinition[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.toJsonSchema(tool.inputSchema, tool.schema),
      },
    }));
  }

  /** 优先 inputSchema，失败后回退 schema，最后兜底空 object。 */
  private toJsonSchema(
    inputSchema: unknown,
    fallbackSchema: unknown,
  ): Record<string, unknown> {
    const primary = this.normalizeJsonSchemaLike(inputSchema);
    if (primary) {
      return primary;
    }
    const fallback = this.normalizeJsonSchemaLike(fallbackSchema);
    if (fallback) {
      return fallback;
    }
    return { type: 'object', properties: {} };
  }

  /** 兼容标准 JSON Schema / OpenAPI parameters / requestBody。 */
  private normalizeJsonSchemaLike(
    source: unknown,
  ): Record<string, unknown> | null {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return null;
    }
    const row = source as Record<string, unknown>;
    if (this.isStandardJsonSchema(row)) {
      return row;
    }
    const byParameters = this.convertOpenApiParameters(row);
    if (byParameters) {
      return byParameters;
    }
    const byRequestBody = this.convertOpenApiRequestBody(row);
    if (byRequestBody) {
      return byRequestBody;
    }
    return null;
  }

  /** 判断是否已是标准 JSON Schema。 */
  private isStandardJsonSchema(value: Record<string, unknown>): boolean {
    const type = value.type;
    const properties = value.properties;
    return (
      type === 'object' &&
      properties !== null &&
      typeof properties === 'object' &&
      !Array.isArray(properties)
    );
  }

  /** OpenAPI parameters -> JSON Schema。 */
  private convertOpenApiParameters(
    value: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const parameters = value.parameters;
    if (!Array.isArray(parameters) || parameters.length === 0) {
      return null;
    }
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const item of parameters) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      const param = item as Record<string, unknown>;
      const name = param.name;
      if (typeof name !== 'string' || name.trim().length === 0) {
        continue;
      }
      properties[name] = this.convertParameterSchema(param);
      if (param.required === true) {
        required.push(name);
      }
    }
    const result: Record<string, unknown> = {
      type: 'object',
      properties,
    };
    if (required.length > 0) {
      result.required = Array.from(new Set(required));
    }
    return result;
  }

  /** 单个 OpenAPI 参数转换为 JSON Schema 字段。 */
  private convertParameterSchema(
    param: Record<string, unknown>,
  ): Record<string, unknown> {
    const schema: Record<string, unknown> = {};
    const type = param.type;
    if (typeof type === 'string') {
      schema.type = this.mapOpenApiType(type);
    } else {
      schema.type = 'string';
    }
    const description = param.description;
    if (typeof description === 'string' && description.trim().length > 0) {
      schema.description = description;
    }
    const enumValue = param.enum;
    if (Array.isArray(enumValue) && enumValue.length > 0) {
      schema.enum = enumValue;
    }
    const items = param.items;
    if (
      schema.type === 'array' &&
      items &&
      typeof items === 'object' &&
      !Array.isArray(items)
    ) {
      schema.items = this.convertItemsSchema(items as Record<string, unknown>);
    }
    return schema;
  }

  /** OpenAPI items -> JSON Schema items。 */
  private convertItemsSchema(
    items: Record<string, unknown>,
  ): Record<string, unknown> {
    const schema: Record<string, unknown> = {};
    const type = items.type;
    schema.type = typeof type === 'string' ? this.mapOpenApiType(type) : 'string';
    const enumValue = items.enum;
    if (Array.isArray(enumValue) && enumValue.length > 0) {
      schema.enum = enumValue;
    }
    return schema;
  }

  /** OpenAPI 类型名映射到 JSON Schema。 */
  private mapOpenApiType(value: string): string {
    switch (value) {
      case 'integer':
      case 'number':
      case 'string':
      case 'boolean':
      case 'array':
      case 'object':
        return value;
      default:
        return 'string';
    }
  }

  /** OpenAPI requestBody -> JSON Schema。 */
  private convertOpenApiRequestBody(
    value: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const requestBody = value.requestBody;
    if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
      return null;
    }
    const body = requestBody as Record<string, unknown>;
    const content = body.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return null;
    }
    const contentRow = content as Record<string, unknown>;
    const appJson = contentRow['application/json'];
    if (!appJson || typeof appJson !== 'object' || Array.isArray(appJson)) {
      return null;
    }
    const appJsonRow = appJson as Record<string, unknown>;
    const schema = appJsonRow.schema;
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return null;
    }
    return schema as Record<string, unknown>;
  }

  /** 每轮推理前拼接决策提示词。 */
  private buildDecisionPrompt(
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
    }>,
    observations: Array<{ name: string; output: unknown }>,
    enableToolCall: boolean,
  ): string {
    return [
      'You are running an agent execution loop.',
      enableToolCall
        ? 'If a tool is needed, use native tool_calls. If not needed, answer in message content.'
        : 'Tool calling is disabled. Reply directly in message content.',
      'Never wrap output with markdown code fences.',
      `Available tools: ${JSON.stringify(tools)}`,
      `Previous tool observations: ${JSON.stringify(observations)}`,
    ].join('\n');
  }

  /** 读取 agent.config 中的 fallbackReply。 */
  private resolveFallbackReply(config: unknown): string | null {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return null;
    }
    const row = config as Record<string, unknown>;
    const fallback = row.fallbackReply;
    if (typeof fallback !== 'string') {
      return null;
    }
    return fallback.trim().length > 0 ? fallback.trim() : null;
  }

  /** 剥离最终输出中的 <think>...</think> 块。 */
  private sanitizeFinalOutput(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const withoutThink = trimmed.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return withoutThink || trimmed;
  }
}
