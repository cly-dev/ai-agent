import type { PrismaClient } from '../../../generated/prisma/client';
import { PROMPT_DEFAULT_CONTENT } from './prompt-defaults';
import { getPromptTemplateCatalogItem } from './prompt-template.catalog';
import { PROMPT_KEY_LIST, type PromptTemplateKey } from './prompt-template.keys';

const DEFAULT_LOCALE = 'zh-CN';

export type EnsureGlobalPromptTemplatesResult = {
  created: PromptTemplateKey[];
  skipped: PromptTemplateKey[];
};

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
