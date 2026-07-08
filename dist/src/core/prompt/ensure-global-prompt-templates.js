"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toResolvedGlobalPrompt = exports.publishGlobalPromptsFromDefaults = exports.ensureGlobalPromptTemplates = exports.DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS = void 0;
const prompt_defaults_1 = require("./prompt-defaults");
const prompt_template_catalog_1 = require("./prompt-template.catalog");
const prompt_template_keys_1 = require("./prompt-template.keys");
const DEFAULT_LOCALE = 'zh-CN';
exports.DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS = [
    prompt_template_keys_1.PROMPT_KEYS.AGENT_TOOL_DECISION,
    prompt_template_keys_1.PROMPT_KEYS.AGENT_PLAN,
];
function assertDefaultsCoverAllKeys() {
    for (const key of prompt_template_keys_1.PROMPT_KEY_LIST) {
        if (!prompt_defaults_1.PROMPT_DEFAULT_CONTENT[key]) {
            throw new Error(`PROMPT_DEFAULT_CONTENT missing key: ${key}`);
        }
        if (!(0, prompt_template_catalog_1.getPromptTemplateCatalogItem)(key)) {
            throw new Error(`PROMPT_TEMPLATE_CATALOG missing key: ${key}`);
        }
    }
}
async function ensureGlobalPromptTemplates(prisma, locale = DEFAULT_LOCALE) {
    var _a;
    assertDefaultsCoverAllKeys();
    const created = [];
    const skipped = [];
    for (const key of prompt_template_keys_1.PROMPT_KEY_LIST) {
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
        const version = ((_a = max._max.version) !== null && _a !== void 0 ? _a : 0) + 1;
        const meta = (0, prompt_template_catalog_1.getPromptTemplateCatalogItem)(key);
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
                content: prompt_defaults_1.PROMPT_DEFAULT_CONTENT[key],
                isActive: true,
            },
        });
        created.push(key);
    }
    return { created, skipped };
}
exports.ensureGlobalPromptTemplates = ensureGlobalPromptTemplates;
function globalPromptScopeWhere(key, locale) {
    return {
        key,
        appClientId: null,
        agentId: null,
        locale,
    };
}
async function publishGlobalPromptsFromDefaults(prisma, input) {
    var _a, _b;
    assertDefaultsCoverAllKeys();
    const locale = (_a = input.locale) !== null && _a !== void 0 ? _a : DEFAULT_LOCALE;
    const published = [];
    const unchanged = [];
    const missing = [];
    for (const key of input.keys) {
        const content = prompt_defaults_1.PROMPT_DEFAULT_CONTENT[key];
        if (!content) {
            missing.push(key);
            continue;
        }
        const scope = globalPromptScopeWhere(key, locale);
        const active = await prisma.promptTemplate.findFirst({
            where: Object.assign(Object.assign({}, scope), { isActive: true }),
            select: { id: true, content: true, version: true },
        });
        if (input.onlyIfOutdated !== false && (active === null || active === void 0 ? void 0 : active.content) === content) {
            unchanged.push(key);
            continue;
        }
        const max = await prisma.promptTemplate.aggregate({
            where: scope,
            _max: { version: true },
        });
        const version = ((_b = max._max.version) !== null && _b !== void 0 ? _b : 0) + 1;
        const meta = (0, prompt_template_catalog_1.getPromptTemplateCatalogItem)(key);
        const row = await prisma.$transaction(async (tx) => {
            await tx.promptTemplate.updateMany({
                where: Object.assign(Object.assign({}, scope), { isActive: true }),
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
exports.publishGlobalPromptsFromDefaults = publishGlobalPromptsFromDefaults;
function toResolvedGlobalPrompt(row) {
    return {
        key: row.key,
        version: row.version,
        content: row.content,
        scope: 'global',
        templateId: row.id,
    };
}
exports.toResolvedGlobalPrompt = toResolvedGlobalPrompt;
//# sourceMappingURL=ensure-global-prompt-templates.js.map