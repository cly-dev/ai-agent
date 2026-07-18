import type { PrismaService } from '../../../prisma/prisma.service';
import type { PageActionSseSink } from '../../page-action/stream/page-action-sse-sink.types';
import type { AgentChatPageContext } from '../../host-bridge/page-context.types';
import type { LlmChatMessage } from '../../llm/llm.types';
import type { LlmService } from '../../llm/llm.service';
import type { ToolEngineService } from '../../tool-engine/tool-engine.service';
import type { ResolvedPageActionHostTool } from '../../page-action/page-action-host-tool.util';
import type { PageWorkflowToolBundle } from '../../page-action/page-workflow-tool-bundle.util';
import type { PageActionRunStepRecorder } from '../../page-action/page-action-run-steps.util';
import type { MaterializedEntity } from '../../entity-materialization/entity-materialization.types';

export type PageWorkflowExecutorRuntime = {
  pageContext: AgentChatPageContext | null;
  /** PageAction invoke.context；供 HostTool x-contextIdCatalog */
  actionContext?: Record<string, unknown> | null;
  messages: LlmChatMessage[];
  nodeOutputs: Record<string, unknown>;
  systemPrompt: string;
  objectivePrefix?: string | null;
  llmService: LlmService;
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  sseSink: PageActionSseSink;
  hostTool: ResolvedPageActionHostTool | null;
  stepRecorder: PageActionRunStepRecorder;
  toolBundle: PageWorkflowToolBundle | null;
  /** 本 PageAction run 物化实体；识图 / 审批对照用。 */
  materializedEntities: MaterializedEntity[];
  fillText: string;
  dslOutcome: string | null;
  metrics: {
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
  };
};
