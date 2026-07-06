"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../src/core/env/load-env");
const crypto_1 = require("crypto");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../generated/prisma/client");
const ensure_global_prompt_templates_1 = require("../src/core/prompt/ensure-global-prompt-templates");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
const DEFAULT_ROLES = [
    {
        name: 'admin',
        description: 'System administrator with full tool access',
        allowToolLevel: client_1.ToolLevel.L3,
    },
    {
        name: 'operator',
        description: 'Operator with medium-risk tool access',
        allowToolLevel: client_1.ToolLevel.L2,
    },
    {
        name: 'viewer',
        description: 'Viewer with low-risk tool access',
        allowToolLevel: client_1.ToolLevel.L1,
    },
];
const ADMIN_EMAIL = 'admin@qq.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '12345789';
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
async function seedRoles() {
    const seededRoles = await Promise.all(DEFAULT_ROLES.map((role) => prisma.role.upsert({
        where: { name: role.name },
        update: {
            description: role.description,
            allowToolLevel: role.allowToolLevel,
        },
        create: role,
    })));
    const adminRole = seededRoles.find((role) => role.name === 'admin');
    if (!adminRole) {
        throw new Error('Failed to seed admin role');
    }
    return adminRole;
}
async function seedAdminUser() {
    const hashedPassword = hashPassword(ADMIN_PASSWORD);
    await prisma.adminUser.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            username: ADMIN_USERNAME,
            password: hashedPassword,
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
        create: {
            email: ADMIN_EMAIL,
            username: ADMIN_USERNAME,
            password: hashedPassword,
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
    });
}
async function seedLlmModelConfig() {
    const chatData = {
        singletonKey: 1,
        provider: 'openai-compatible',
        model: '/data/models/Qwen3-32B-AWQ',
        apiKey: null,
        baseUrl: 'http://172.30.30.153:8000',
        chatPath: '/v1/chat/completions',
        parameters: {},
        stream: false,
        maxTokens: 2000,
        temperature: null,
        enabled: true,
    };
    const existingChat = await prisma.llmModelConfig.findFirst({
        where: { kind: 'chat' },
        orderBy: { id: 'asc' },
    });
    if (existingChat) {
        await prisma.llmModelConfig.update({
            where: { id: existingChat.id },
            data: chatData,
        });
    }
    else {
        await prisma.llmModelConfig.create({
            data: Object.assign({ kind: 'chat' }, chatData),
        });
    }
    const embeddingData = {
        singletonKey: null,
        provider: 'transformers.js',
        model: 'https://media.cdn.a-premium.com/static/models/all-MiniLM-L6-v2',
        apiKey: null,
        baseUrl: 'local',
        chatPath: '/v1/embeddings',
        parameters: { allowRemoteModels: true },
        stream: false,
        maxTokens: null,
        temperature: null,
        enabled: true,
    };
    const existingEmbedding = await prisma.llmModelConfig.findFirst({
        where: { kind: 'transformers_embedding' },
        orderBy: { id: 'asc' },
    });
    if (existingEmbedding) {
        await prisma.llmModelConfig.update({
            where: { id: existingEmbedding.id },
            data: embeddingData,
        });
    }
    else {
        await prisma.llmModelConfig.create({
            data: Object.assign({ kind: 'transformers_embedding' }, embeddingData),
        });
    }
    await prisma.intentRecallConfig.upsert({
        where: { singletonKey: 1 },
        update: {
            recallMode: 'auto',
            vectorTopK: 10,
            vectorMinScore: 0.25,
            bindToolsMax: 25,
            fallbackToKeyword: true,
        },
        create: {
            singletonKey: 1,
            recallMode: 'auto',
            vectorTopK: 10,
            vectorMinScore: 0.25,
            bindToolsMax: 25,
            fallbackToKeyword: true,
        },
    });
}
async function main() {
    try {
        await seedRoles();
        await seedAdminUser();
        await seedLlmModelConfig();
        const prompts = await (0, ensure_global_prompt_templates_1.ensureGlobalPromptTemplates)(prisma);
        if (prompts.created.length > 0) {
            console.log(`Seeded prompt templates: ${prompts.created.join(', ')}`);
        }
    }
    catch (error) {
        throw new Error(`Failed to seed defaults: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
}
main()
    .finally(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    await prisma.$disconnect();
    throw error;
});
//# sourceMappingURL=seed.js.map