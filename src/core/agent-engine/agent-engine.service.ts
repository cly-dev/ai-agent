import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AgentRunStatus } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { normalizeToolCallArgs } from '../llm/tool-call-args.util';
import { LlmService } from '../llm/llm.service';
import type { LlmChatMessage, LlmToolDefinition } from '../llm/llm.types';
import { PromptComposerService } from '../prompt/prompt-composer.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../../modules/chat/chat-events.service';
import { AgentService } from '../../modules/agent/agent.service';

type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
};

type AgentRunStepType = 'intent' | 'llm' | 'tool';
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

/** 带分类信息的工具行，供意图识别后按 toolCategory 过滤并 bindTools。 */
type AgentEngineTool = {
  id: number;
  name: string;
  description: string;
  inputSchema: unknown;
  schema: unknown;
  toolCategoryId: number | null;
};

type ParsedIntentPayload = {
  intentClear: boolean;
  guidance: string;
  matchedCategoryIds: number[];
  /** 意图明确且需要「未归类」工具时置 true（对应 toolCategoryId 为空的工具）。 */
  includeUncategorized: boolean;
};

type AgentRunResult = {
  runId: number;
  output: string;
  status: AgentRunStatus;
};

type GraphToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type AgentGraphState = {
  /** 当前已完成的 llm 轮次计数（每次进入 llm 节点 +1）。 */
  iteration: number;
  /** 执行轨迹（intent/llm/tool），用于持久化 AgentRun.steps。 */
  steps: AgentRunStep[];
  /** 已执行工具的观测结果，供后续 llm 决策参考。 */
  toolObservations: Array<{ name: string; output: unknown }>;
  /** llm 产生但尚未执行的工具调用队列。 */
  pendingToolCalls: GraphToolCall[];
  /** 最终输出文本（成功结束时写入 AgentRun.output）。 */
  finalOutput: string;
  /** 当前运行状态（running/success/failed）。 */
  status: AgentRunStatus;
  /** 是否提前结束图执行（true 时路由到 END）。 */
  finished: boolean;
  /** 意图识别后可见的工具集合（已按分类与权限收窄）。 */
  scopedTools: AgentEngineTool[];
  /** 与 scopedTools 对应的 function-calling 定义（用于 bindTools）。 */
  scopedToolDefinitions: LlmToolDefinition[];
  /** 与 scopedTools 对应的可执行 toolId 白名单（执行阶段二次校验）。 */
  scopedAllowedToolIds: number[];
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
    private readonly agentService: AgentService,
  ) {}

  /** 执行一次 Agent 运行。 */
  async run(input: AgentRunInput): Promise<AgentRunResult | null> {
    /**
     * 前置流程：
     * 1) DSN -> appId（由 AppClientDsnGuard 写入会话所属 appClientId）
     * 2) userId -> user role（按 UserApp.roleId 解析）
     * 3) 获取/校验 Session 归属
     * 4) 加载 Agent（prompt/策略）
     * 5) 加载 Tool（按 appId）
     * 6) 按角色过滤 Tool（allowToolLevel + RoleTool）
     */
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
        maxSteps: true,
        enableToolCall: true,
        config: true,
      },
    });
    if (!agent) {
      throw new NotFoundException(`agent ${session.agentId} not found`);
    }

    const allowedTools = await this.agentService.getAllowedTools(
      agent.id,
      input.userId,
      session.appClientId,
    );
    const tools: AgentEngineTool[] = allowedTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      schema: tool.schema,
      toolCategoryId: tool.toolCategoryId ?? null,
    }));
    const allowedToolIds = tools.map((tool) => tool.id);
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
    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: input.input,
    });

    let finalOutput = '';
    let status: AgentRunStatus = AgentRunStatus.running;
    let currentStep = 0;

    try {
      const model = await this.llmService.createLangChainChatModel({
        streaming: true,
      });
      const graphState = await this.runWithLangGraph({
        model: model as unknown as {
          bindTools: (tools: unknown[]) => {
            invoke: (
              messages: unknown,
              options?: Record<string, unknown>,
            ) => Promise<AIMessage>;
          };
        },
        promptMessages: prompt.messages,
        latestUserMessage: input.input,
        sessionId: input.sessionId,
        runId: run.id,
        maxSteps: agent.maxSteps,
        enableToolCall: agent.enableToolCall,
        tools,
        toolDefinitions,
        allowedToolIds,
      });
      currentStep = graphState.iteration;
      status = graphState.status;
      finalOutput = graphState.finalOutput;
      steps.splice(0, steps.length, ...graphState.steps);

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
  private toLlmTools(tools: AgentEngineTool[]): LlmToolDefinition[] {
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
    schema.type =
      typeof type === 'string' ? this.mapOpenApiType(type) : 'string';
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
    if (
      !requestBody ||
      typeof requestBody !== 'object' ||
      Array.isArray(requestBody)
    ) {
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
    const withoutThink = trimmed
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim();
    return withoutThink || trimmed;
  }

  /** 为本轮可用工具拉取关联的 ToolCategory 说明，供意图识别使用。 */
  private async fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]) {
    const uniq = Array.from(new Set(toolCategoryIds));
    if (uniq.length === 0) {
      return [];
    }
    return this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
  }

  private buildIntentRecognitionPrompt(
    categories: Array<{
      id: number;
      label: string;
      description: string | null;
    }>,
    hasUncategorizedTools: boolean,
  ): string {
    const catalog = categories.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description ?? undefined,
    }));
    const extra = hasUncategorizedTools
      ? '\n系统中还存在「未归类」的工具（不带业务分类）；若用户需求明显依赖这类工具，将 includeUncategorized 设为 true。\n'
      : '';
    return [
      '你是意图识别助手。根据用户最新消息，判断表述是否足以安全地选择工具类别。',
      '只输出一行合法 JSON（不要 Markdown、不要注释），格式严格如下：',
      '{"intentClear":boolean,"guidance":string,"matchedCategoryIds":number[],"includeUncategorized":boolean}',
      '字段含义：',
      '- intentClear: 用户需求是否清晰、可操作；若缺少关键条件、语义含糊、可同时指向多类无关业务，则为 false。',
      '- guidance: 当 intentClear 为 false 时，用简体中文友好追问或引导用户补充；为 true 时可为空字符串。',
      '- matchedCategoryIds: intentClear 为 true 时，从下面「工具分类目录」中选出最相关的分类 id（可多选）；若仅需闲聊/无需调用任何业务工具，则为 []。',
      '- includeUncategorized: intentClear 为 true 且需要未归类工具时为 true，否则 false。',
      extra,
      `工具分类目录（id 必须原样来自此列表）：${JSON.stringify(catalog)}`,
    ].join('\n');
  }

  private extractJsonObjectText(content: string): string {
    const trimmed = content.trim();
    const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (fence?.[1]) {
      return fence[1].trim();
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }
    return trimmed;
  }

  private parseIntentPayload(content: string): ParsedIntentPayload {
    const defaults: ParsedIntentPayload = {
      intentClear: true,
      guidance: '',
      matchedCategoryIds: [],
      includeUncategorized: false,
    };
    try {
      const raw = this.extractJsonObjectText(content);
      const row: unknown = JSON.parse(raw);
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        return defaults;
      }
      const o = row as Record<string, unknown>;
      const intentClear = o.intentClear === false ? false : true;
      const guidance = typeof o.guidance === 'string' ? o.guidance.trim() : '';
      const matchedCategoryIds = Array.isArray(o.matchedCategoryIds)
        ? o.matchedCategoryIds
            .map((id) => (typeof id === 'number' ? id : Number(id)))
            .filter((id) => Number.isInteger(id) && id > 0)
        : [];
      const includeUncategorized = o.includeUncategorized === true;
      return {
        intentClear,
        guidance,
        matchedCategoryIds,
        includeUncategorized,
      };
    } catch {
      return defaults;
    }
  }

  /** 在已通过角色/Agent 权限过滤后的工具集合上，再按意图分类收窄 bindTools 范围。 */
  private filterToolsByIntent(
    tools: AgentEngineTool[],
    parsed: ParsedIntentPayload,
  ): AgentEngineTool[] {
    if (!parsed.intentClear) {
      return tools;
    }
    const idSet = new Set(parsed.matchedCategoryIds);
    const noCategoryFilter = idSet.size === 0 && !parsed.includeUncategorized;
    if (noCategoryFilter) {
      return tools;
    }
    const narrowed = tools.filter((t) => {
      if (t.toolCategoryId != null && idSet.has(t.toolCategoryId)) {
        return true;
      }
      if (t.toolCategoryId == null && parsed.includeUncategorized) {
        return true;
      }
      return false;
    });
    return narrowed.length > 0 ? narrowed : tools;
  }

  private async runWithLangGraph(input: {
    /** 由 LlmService 创建的可 bindTools 模型实例。 */
    model: {
      bindTools: (tools: unknown[]) => {
        invoke: (
          messages: unknown,
          options?: Record<string, unknown>,
        ) => Promise<AIMessage>;
      };
    };
    /** PromptComposer 产出的基础消息（系统提示、记忆、历史对话）。 */
    promptMessages: LlmChatMessage[];
    /** 最新用户输入，仅用于 intent 识别。 */
    latestUserMessage: string;
    /** SSE 推送目标会话。 */
    sessionId: string;
    /** AgentRun 主键，用于增量回写步骤。 */
    runId: number;
    /** 最大 llm 循环轮次。 */
    maxSteps: number;
    /** Agent 配置是否允许工具调用。 */
    enableToolCall: boolean;
    /** 初始候选工具（已过 Agent + 角色权限过滤）。 */
    tools: AgentEngineTool[];
    /** tools 对应 function-calling 声明。 */
    toolDefinitions: LlmToolDefinition[];
    /** tools 对应可执行 toolId 白名单。 */
    allowedToolIds: number[];
  }): Promise<AgentGraphState> {
    // LangGraph 状态定义：每个字段的 reducer 采用“直接覆盖最新值”。
    const State = Annotation.Root({
      iteration: Annotation<number>({
        default: () => 0,
        reducer: (_state, update) => update,
      }),
      steps: Annotation<AgentRunStep[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      toolObservations: Annotation<Array<{ name: string; output: unknown }>>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingToolCalls: Annotation<GraphToolCall[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      finalOutput: Annotation<string>({
        default: () => '',
        reducer: (_state, update) => update,
      }),
      status: Annotation<AgentRunStatus>({
        default: () => AgentRunStatus.running,
        reducer: (_state, update) => update,
      }),
      finished: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      scopedTools: Annotation<AgentEngineTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedToolDefinitions: Annotation<LlmToolDefinition[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedAllowedToolIds: Annotation<number[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
    });
    // 节点1：意图识别 + 工具收窄（按 toolCategory），必要时直接结束并返回引导语。
    const intent = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;
      const baseScopedTools = input.tools;
      const baseDefs = input.toolDefinitions;
      const baseIds = input.allowedToolIds;

      const skipRecognition = !input.enableToolCall || input.tools.length === 0;

      if (skipRecognition) {
        // 工具关闭或无工具可用：跳过识别，沿用初始 scoped 集合。
        this.emitThink(
          input.sessionId,
          `intent skipped (toolCall ${
            input.enableToolCall ? 'on' : 'off'
          }, tools=${input.tools.length})`,
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            skipped: true,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, intentStep],
          scopedTools: baseScopedTools,
          scopedToolDefinitions: baseDefs,
          scopedAllowedToolIds: baseIds,
        };
      }

      this.emitThink(
        input.sessionId,
        'intent recognition: clarity & tool category',
      );

      const categoryIds = [
        ...new Set(
          input.tools
            .map((t) => t.toolCategoryId)
            .filter((id): id is number => id != null),
        ),
      ];
      const categories = await this.fetchToolCategoriesForAllowedTools(
        categoryIds,
      );
      const hasUncategorized = input.tools.some(
        (t) => t.toolCategoryId == null,
      );

      const systemPrompt = this.buildIntentRecognitionPrompt(
        categories,
        hasUncategorized,
      );

      let rawContent = '';
      try {
        // 单独一次轻量 chat：只做“是否明确 + 分类匹配”判断，不参与主循环推理。
        const chatResult = await this.llmService.chat({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                `用户最新消息（仅据此判断）：\n${input.latestUserMessage.trim()}`,
              ].join('\n'),
            },
          ],
          stream: false,
        });
        rawContent = chatResult.content ?? '';
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.emitThink(
          input.sessionId,
          `intent recognition failed (fallback allow all tools): ${message}`,
        );
        const fallbackStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            error: message,
            fallback: true,
          }),
          meta: { prompt: systemPrompt },
        };
        await this.updateRun(
          input.runId,
          [...state.steps, fallbackStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, fallbackStep],
          scopedTools: baseScopedTools,
          scopedToolDefinitions: baseDefs,
          scopedAllowedToolIds: baseIds,
        };
      }

      let parsed = this.parseIntentPayload(rawContent);
      const validCategoryIdSet = new Set(categories.map((c) => c.id));
      parsed = {
        ...parsed,
        matchedCategoryIds: parsed.matchedCategoryIds.filter((id) =>
          validCategoryIdSet.has(id),
        ),
      };

      const intentStep: AgentRunStep = {
        step: idx,
        type: 'intent',
        output: this.normalizeJsonLike({
          rawContent: rawContent.slice(0, 4000),
          intentClear: parsed.intentClear,
          matchedCategoryIds: parsed.matchedCategoryIds,
          includeUncategorized: parsed.includeUncategorized,
        }),
        meta: { prompt: systemPrompt },
      };

      if (!parsed.intentClear) {
        // 用户意图不明确：提前成功结束（给澄清引导），不进入 llm/tools 节点。
        const guidance =
          parsed.guidance.trim().length > 0
            ? parsed.guidance
            : '你的描述还不够明确，请说明具体场景、对象或你希望完成的操作，我再继续处理。';
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: [...state.steps, intentStep],
          finished: true,
          finalOutput: guidance,
          status: AgentRunStatus.success,
          scopedTools: baseScopedTools,
          scopedToolDefinitions: baseDefs,
          scopedAllowedToolIds: baseIds,
        };
      }

      const narrowed = this.filterToolsByIntent(input.tools, parsed);
      const scopedDefs = this.toLlmTools(narrowed);
      const scopedIds = narrowed.map((t) => t.id);

      await this.updateRun(
        input.runId,
        [...state.steps, intentStep],
        0,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: [...state.steps, intentStep],
        scopedTools: narrowed,
        scopedToolDefinitions: scopedDefs,
        scopedAllowedToolIds: scopedIds,
      };
    };

    // 节点2：主推理节点。基于当前 observation 决定“直接回答”或“发起 tool_calls”。
    const llm = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const step = state.iteration + 1;
      this.emitThink(
        input.sessionId,
        `step ${step}/${input.maxSteps} reasoning and decision`,
      );
      const toolsForPrompt = state.scopedTools;
      const decisionPrompt = this.buildDecisionPrompt(
        toolsForPrompt,
        state.toolObservations,
        input.enableToolCall,
      );
      const runnable = input.enableToolCall
        ? input.model.bindTools(state.scopedToolDefinitions as unknown[])
        : input.model.bindTools([]);
      const aiMessage = await runnable.invoke(
        [
          ...input.promptMessages.map((item) => ({
            role: item.role,
            content: item.content,
          })),
          { role: 'system', content: decisionPrompt },
        ],
        {
          callbacks: [
            {
              handleLLMNewToken: (token: string) => {
                if (token.trim().length > 0) {
                  this.emitThink(
                    input.sessionId,
                    `step ${step}/${input.maxSteps} llm: ${token}`,
                  );
                }
              },
            },
          ],
        },
      );
      const responseMeta = aiMessage.response_metadata as
        | Record<string, unknown>
        | undefined;
      const toolCalls = input.enableToolCall
        ? this.extractToolCalls(aiMessage)
        : [];
      const llmText = this.extractAiMessageText(aiMessage).trim();
      const steps = [
        ...state.steps,
        {
          step,
          type: 'llm' as const,
          output: this.normalizeJsonLike({
            content: llmText,
            toolCalls,
          }),
          meta: {
            model:
              typeof responseMeta?.model_name === 'string'
                ? responseMeta.model_name
                : undefined,
            prompt: decisionPrompt,
          },
        },
      ];
      await this.updateRun(input.runId, steps, step, AgentRunStatus.running);
      if (toolCalls.length === 0) {
        // 无 tool_calls：本轮产出即最终答案，流程结束。
        return {
          ...state,
          iteration: step,
          steps,
          pendingToolCalls: [],
          finalOutput: llmText,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      return {
        ...state,
        iteration: step,
        steps,
        // 交给 tools 节点执行（本轮可能包含多个调用）。
        pendingToolCalls: toolCalls,
      };
    };
    // 节点3：工具执行节点。并行执行同轮 tool_calls，统一汇总后回到 llm。
    const tools = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const nextSteps = [...state.steps];
      const observations = [...state.toolObservations];
      for (const toolCall of state.pendingToolCalls) {
        this.emitThink(
          input.sessionId,
          `step ${state.iteration}/${input.maxSteps} call tool ${toolCall.name}`,
        );
      }
      const toolResults = await Promise.all(
        state.pendingToolCalls.map((toolCall) =>
          this.toolEngine.executeByName(
            toolCall.name,
            toolCall.arguments,
            state.scopedAllowedToolIds,
          ),
        ),
      );
      for (let idx = 0; idx < toolResults.length; idx += 1) {
        const toolResult = toolResults[idx];
        const toolCall = state.pendingToolCalls[idx];
        observations.push({
          name: toolResult.name,
          output: toolResult.output,
        });
        nextSteps.push({
          step: state.iteration,
          type: 'tool',
          name: toolResult.name,
          input: toolCall.arguments,
          output: this.normalizeJsonLike(toolResult.output),
          meta: { latency: toolResult.latency },
        });
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.running,
        );
        this.emitThink(
          input.sessionId,
          `step ${state.iteration}/${input.maxSteps} tool ${toolCall.name} finished`,
        );
      }
      return {
        ...state,
        steps: nextSteps,
        // 把工具结果沉淀为 observation，供下一轮 llm 决策使用。
        toolObservations: observations,
        pendingToolCalls: [],
      };
    };
    // 图路由：
    // START -> intent -> llm -> tools -> llm ...
    // 任一节点置 finished=true 或达到 maxSteps 时终止。
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addEdge(START, 'intent')
      .addConditionalEdges('intent', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        return 'llm';
      })
      .addConditionalEdges('llm', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        return 'tools';
      })
      .addConditionalEdges('tools', (state: AgentGraphState) => {
        if (state.iteration >= input.maxSteps) {
          return END;
        }
        return 'llm';
      });
    const app = graph.compile();
    return app.invoke({
      iteration: 0,
      steps: [],
      toolObservations: [],
      pendingToolCalls: [],
      finalOutput: '',
      status: AgentRunStatus.running,
      finished: false,
      scopedTools: input.tools,
      scopedToolDefinitions: input.toolDefinitions,
      scopedAllowedToolIds: input.allowedToolIds,
    });
  }

  private extractAiMessageText(message: AIMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === 'object' && 'text' in item
            ? String(item.text ?? '')
            : '',
        )
        .join('');
    }
    return '';
  }

  private extractToolCalls(message: AIMessage): GraphToolCall[] {
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
        const directName = row.name;
        const directArgs = row.args;
        if (typeof directName === 'string') {
          return {
            name: directName,
            arguments: normalizeToolCallArgs(directArgs),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        const name = fnRow.name;
        if (typeof name !== 'string') {
          return null;
        }
        return {
          name,
          arguments: normalizeToolCallArgs(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as GraphToolCall[];
  }
}
