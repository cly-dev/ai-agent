import type { Prisma } from '../../../generated/prisma/client';
import type { ToolDebugResult } from '../../core/tool-engine/tool-engine.types';
import type { AgentMetadata } from '../../core/tool-engine/tool-agent-metadata.types';
import type { ToolResponseProfile } from '../../core/tool-engine/tool-response-profile.types';

/**
 * Tool 详情/列表项统一 include：返回所有直接关联表数据。
 * - appClient：所属业务系统
 * - toolCategory：类目（前端可当标签展示 label）
 * - integration：所属集成
 * - agentTools / skillTools / roleTools：关联绑定及嵌套实体摘要
 */
export const TOOL_DETAIL_INCLUDE = {
  appClient: true,
  toolCategory: true,
  integration: true,
  agentTools: {
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          appClientId: true,
          enableToolCall: true,
          maxSteps: true,
        },
      },
    },
  },
  skillTools: {
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
  roleTools: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          allowToolLevel: true,
        },
      },
    },
  },
} satisfies Prisma.ToolInclude;

export type ToolDetailRow = Prisma.ToolGetPayload<{
  include: typeof TOOL_DETAIL_INCLUDE;
}>;

/** 列表/详情统一响应：关联实体 + 类目标签 tags */
export type ToolResponse = ToolDetailRow & {
  /** 展示用标签，目前为 toolCategory.label（无类目则为空数组） */
  tags: string[];
};

export type InitToolSchemasFromDebugResult = {
  debug: ToolDebugResult;
  outputSchema: Record<string, unknown>;
  responseProfile: ToolResponseProfile;
  agentMetadata: AgentMetadata;
  source: 'llm' | 'fallback';
  agentMetadataSource: 'llm' | 'heuristic' | 'existing';
  persisted: boolean;
  tool: ToolResponse;
};
