import type { PromptTemplate, PrismaClient } from '../../../generated/prisma/client';
import { PROMPT_DEFAULT_CONTENT } from './prompt-defaults';
import { getPromptTemplateCatalogItem } from './prompt-template.catalog';
import {
  PROMPT_KEYS,
  PROMPT_KEY_LIST,
  type PromptTemplateKey,
} from './prompt-template.keys';

const DEFAULT_LOCALE = 'zh-CN';

export type EnsureGlobalPromptTemplatesResult = {
  created: PromptTemplateKey[];
  skipped: PromptTemplateKey[];
};

export type PublishGlobalPromptsFromDefaultsResult = {
  published: Array<{ key: PromptTemplateKey; version: number; templateId: number }>;
  unchanged: PromptTemplateKey[];
  missing: PromptTemplateKey[];
};

/** 与 runtime 默认发版对齐：tool_decision + plan。 */
export const DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS: PromptTemplateKey[] = [
  PROMPT_KEYS.AGENT_TOOL_DECISION,
  PROMPT_KEYS.AGENT_PLAN,
];

function assertDefaultsCoverAllKeys(): void {
  for (const key of PROMPT_KEY_LIST) {
    if (!PROMPT_DEFAULT_CONTENT[key]) {
      throw new Error(`PROMPT_DEFAULT_CONTENT missing key: ${key}`);
    }
    if (!getPromptTemplateCatalogItem(key)) {
      throw new Error(`PROMPT_TEMPLATE_CATALOG missing key: ${key}`);
    }
  }
}

/**
 * 确保每个平台 key 在 DB 中有全局 active 行（zh-CN）。
 * 已存在则跳过，不覆盖运营在后台改过的内容。
 */
export async function ensureGlobalPromptTemplates(
  prisma: PrismaClient,
  locale = DEFAULT_LOCALE,
): Promise<EnsureGlobalPromptTemplatesResult> {
  assertDefaultsCoverAllKeys();
  const created: PromptTemplateKey[] = [];
  const skipped: PromptTemplateKey[] = [];

  for (const key of PROMPT_KEY_LIST) {
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        key,
        appClientId: null,
        agentId: null,
        locale,
        isActive: true,
      },
      select: { id: true },
    });
    if (existing) {
      skipped.push(key);
      continue;
    }

    const max = await prisma.promptTemplate.aggregate({
      where: { key, appClientId: null, agentId: null, locale },
      _max: { version: true },
    });
    const version = (max._max.version ?? 0) + 1;
    const meta = getPromptTemplateCatalogItem(key)!;
    await prisma.promptTemplate.create({
      data: {
        key,
        version,
        appClientId: null,
        agentId: null,
        locale,
        category: meta.category,
        title: meta.title,
        description: meta.description,
        content: PROMPT_DEFAULT_CONTENT[key],
        isActive: true,
      },
    });
    created.push(key);
  }

  return { created, skipped };
}

function globalPromptScopeWhere(
  key: string,
  locale: string,
): {
  key: string;
  appClientId: null;
  agentId: null;
  locale: string;
} {
  return {
    key,
    appClientId: null,
    agentId: null,
    locale,
  };
}

/**
 * 将代码默认文案发为新版本并设为 global active（不删历史版本）。
 * onlyIfOutdated=true 时，active 内容与默认一致则跳过。
 */
export async function publishGlobalPromptsFromDefaults(
  prisma: PrismaClient,
  input: {
    keys: PromptTemplateKey[];
    locale?: string;
    onlyIfOutdated?: boolean;
  },
): Promise<PublishGlobalPromptsFromDefaultsResult> {
  assertDefaultsCoverAllKeys();
  const locale = input.locale ?? DEFAULT_LOCALE;
  const published: PublishGlobalPromptsFromDefaultsResult['published'] = [];
  const unchanged: PromptTemplateKey[] = [];
  const missing: PromptTemplateKey[] = [];

  for (const key of input.keys) {
    const content = PROMPT_DEFAULT_CONTENT[key];
    if (!content) {
      missing.push(key);
      continue;
    }

    const scope = globalPromptScopeWhere(key, locale);
    const active = await prisma.promptTemplate.findFirst({
      where: { ...scope, isActive: true },
      select: { id: true, content: true, version: true },
    });

    if (input.onlyIfOutdated !== false && active?.content === content) {
      unchanged.push(key);
      continue;
    }

    const max = await prisma.promptTemplate.aggregate({
      where: scope,
      _max: { version: true },
    });
    const version = (max._max.version ?? 0) + 1;
    const meta = getPromptTemplateCatalogItem(key)!;

    const row = await prisma.$transaction(async (tx) => {
      await tx.promptTemplate.updateMany({
        where: { ...scope, isActive: true },
        data: { isActive: false },
      });
      return tx.promptTemplate.create({
        data: {
          key,
          version,
          appClientId: null,
          agentId: null,
          locale,
          category: meta.category,
          title: meta.title,
          description: meta.description,
          content,
          isActive: true,
        },
      });
    });

    published.push({ key, version: row.version, templateId: row.id });
  }

  return { published, unchanged, missing };
}

export function toResolvedGlobalPrompt(row: Pick<PromptTemplate, 'id' | 'key' | 'version' | 'content'>) {
  return {
    key: row.key,
    version: row.version,
    content: row.content,
    scope: 'global' as const,
    templateId: row.id,
  };
}
