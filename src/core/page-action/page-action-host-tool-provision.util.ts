import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  type PrismaClient,
} from '../../../generated/prisma/client';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';

export type PageActionHostToolInlineSpec = {
  name?: string | null;
  description?: string | null;
  /** 流式填入的 string 字段名，默认 text */
  fillField?: 'text' | 'content' | 'value' | null;
};

export function derivePageActionHostToolName(actionKey: string): string {
  const trimmed = actionKey.trim();
  const lastDot = trimmed.lastIndexOf('.');
  const segment = lastDot >= 0 ? trimmed.slice(lastDot + 1) : trimmed;
  const normalized = segment.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 120);
  return normalized.length > 0 ? normalized : 'fill';
}

export function buildDefaultFillArgsSchema(
  fillField: string = 'text',
): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      [fillField]: {
        type: 'string',
        description: 'Generated content to fill into the page field',
      },
    },
    required: [fillField],
  };
}

async function ensureHostPageForScope(
  prisma: PrismaClient,
  appClientId: number,
  scope: string,
): Promise<number> {
  const existing = await prisma.hostPage.findUnique({
    where: { appClientId_scope: { appClientId, scope } },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }
  const created = await prisma.hostPage.create({
    data: {
      appClientId,
      scope,
      label: scope,
    },
  });
  return created.id;
}

/**
 * PageAction 创建时：未传 hostToolId 则按约定自动查找或创建 HostTool。
 * - name 默认取 actionKey 最后一段
 * - argsSchema 默认单 string 字段（支持 inline_stream）
 * - 有 pageScope 时自动 ensure HostPage
 */
export async function resolveOrProvisionPageActionHostTool(
  prisma: PrismaClient,
  input: {
    appClientId: number;
    actionKey: string;
    pageActionName: string;
    pageActionDescription?: string | null;
    pageScope?: string | null;
    hostToolId?: number | null;
    hostTool?: PageActionHostToolInlineSpec | null;
  },
): Promise<HostToolDetailRow> {
  if (input.hostToolId != null) {
    const row = await prisma.hostTool.findFirst({
      where: { id: input.hostToolId, appClientId: input.appClientId },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new BadRequestException(
        `HostTool ${input.hostToolId} not found for AppClient ${input.appClientId}`,
      );
    }
    return row;
  }

  const name =
    input.hostTool?.name?.trim() ||
    derivePageActionHostToolName(input.actionKey);
  const description =
    input.hostTool?.description?.trim() ||
    input.pageActionDescription?.trim() ||
    input.pageActionName.trim();
  const fillField = input.hostTool?.fillField?.trim() || 'text';
  const pageScope = input.pageScope?.trim() || null;
  const definitionKey = pageScope
    ? `${pageScope}.${name}`
    : input.actionKey.trim();
  const expectedSchema = buildDefaultFillArgsSchema(fillField);

  const byDefinitionKey = await prisma.hostTool.findUnique({
    where: {
      appClientId_definitionKey: { appClientId: input.appClientId, definitionKey },
    },
    include: HOST_TOOL_DETAIL_INCLUDE,
  });
  if (byDefinitionKey) {
    return byDefinitionKey;
  }

  const byName = await prisma.hostTool.findUnique({
    where: {
      appClientId_name: { appClientId: input.appClientId, name },
    },
    include: HOST_TOOL_DETAIL_INCLUDE,
  });
  if (byName) {
    if (byName.definitionKey !== definitionKey) {
      throw new BadRequestException({
        code: 'HOST_TOOL_NAME_COLLISION',
        message:
          `HostTool name "${name}" is already used by definitionKey "${byName.definitionKey}"; ` +
          `use hostToolId or a different hostTool.name / actionKey`,
      });
    }
    return byName;
  }

  let hostPageId: number | null = null;
  if (pageScope) {
    hostPageId = await ensureHostPageForScope(
      prisma,
      input.appClientId,
      pageScope,
    );
  }

  try {
    return await prisma.hostTool.create({
      data: {
        appClientId: input.appClientId,
        hostPageId,
        definitionKey,
        name,
        description,
        argsSchema: expectedSchema as Prisma.InputJsonValue,
        isActive: true,
      },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const raced = await prisma.hostTool.findFirst({
        where: {
          appClientId: input.appClientId,
          OR: [{ definitionKey }, { name }],
        },
        include: HOST_TOOL_DETAIL_INCLUDE,
      });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}
