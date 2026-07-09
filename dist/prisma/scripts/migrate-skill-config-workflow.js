"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const migrate_skill_config_workflow_util_1 = require("../../src/core/workflow/legacy/migrate-skill-config-workflow.util");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function parsePositiveInt(raw) {
    if (!(raw === null || raw === void 0 ? void 0 : raw.trim())) {
        return null;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0 ? value : null;
}
function parseBool(raw, defaultValue) {
    if (raw == null || raw.trim() === '') {
        return defaultValue;
    }
    return raw === '1' || raw.toLowerCase() === 'true';
}
async function resolveWorkflowKey(appClientId, preferredKey, skillId) {
    let candidate = preferredKey;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const existing = await prisma.workflow.findFirst({
            where: { appClientId, workflowKey: candidate },
            select: { id: true },
        });
        if (!existing) {
            return candidate;
        }
        candidate = (0, migrate_skill_config_workflow_util_1.resolveMigratedWorkflowKeyConflict)(preferredKey, skillId);
        if (attempt === 1) {
            candidate = `${candidate}.${Date.now()}`;
        }
    }
    return `${preferredKey}.skill${skillId}.${Date.now()}`;
}
async function migrateOneSkill(input) {
    const base = {
        skillId: input.skill.id,
        skillName: input.skill.name,
        agentId: 0,
        appClientId: input.skill.appClientId,
        outcome: 'skipped_no_legacy',
    };
    if (input.skill.workflowId != null) {
        return Object.assign(Object.assign({}, base), { outcome: 'skipped_has_workflow', workflowId: input.skill.workflowId });
    }
    if (!(0, migrate_skill_config_workflow_util_1.hasLegacySkillConfigWorkflow)(input.skill.config)) {
        return base;
    }
    const plan = (0, migrate_skill_config_workflow_util_1.buildSkillWorkflowMigrationPlan)({
        skillId: input.skill.id,
        skillName: input.skill.name,
        capabilityKey: input.skill.capabilityKey,
        config: input.skill.config,
        toolBindings: input.skill.skillTools.map((row) => ({
            toolId: row.toolId,
            isRequired: row.isRequired,
        })),
        hostToolBindings: input.skill.skillHostTools.map((row) => ({
            hostToolId: row.hostToolId,
            isRequired: row.isRequired,
        })),
    });
    if (!plan) {
        return Object.assign(Object.assign({}, base), { outcome: 'skipped_no_legacy' });
    }
    if (plan.validationIssues.length > 0) {
        return Object.assign(Object.assign({}, base), { outcome: 'skipped_invalid', workflowKey: plan.workflowKey, issues: plan.validationIssues.map((issue) => `${issue.path}: ${issue.code} — ${issue.message}`) });
    }
    const workflowKey = await resolveWorkflowKey(input.skill.appClientId, plan.workflowKey, input.skill.id);
    if (input.dryRun) {
        return Object.assign(Object.assign({}, base), { outcome: 'dry_run', workflowKey });
    }
    try {
        const created = await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.create({
                data: {
                    appClientId: input.skill.appClientId,
                    workflowKey,
                    name: plan.name,
                    description: `Migrated from Skill#${input.skill.id} config.workflow`,
                    goal: plan.goal,
                    profile: 'chat_skill',
                    deliverable: plan.deliverable,
                    nodes: plan.nodes,
                    version: 1,
                    constraints: [],
                    isActive: true,
                    workflowTools: plan.tools.length
                        ? {
                            create: plan.tools.map((row) => ({
                                toolId: row.toolId,
                                isRequired: row.isRequired,
                            })),
                        }
                        : undefined,
                    workflowHostTools: plan.hostTools.length
                        ? {
                            create: plan.hostTools.map((row) => ({
                                hostToolId: row.hostToolId,
                                isRequired: row.isRequired,
                            })),
                        }
                        : undefined,
                },
            });
            await tx.workflowRevision.create({
                data: {
                    workflowId: workflow.id,
                    version: 1,
                    nodes: workflow.nodes,
                    deliverable: workflow.deliverable,
                    constraints: workflow.constraints,
                    changeNote: `migrated from Skill#${input.skill.id} config.workflow`,
                },
            });
            const nextConfig = input.stripLegacy
                ? (0, migrate_skill_config_workflow_util_1.stripLegacySkillConfigWorkflow)(input.skill.config)
                : input.skill.config;
            await tx.skill.update({
                where: { id: input.skill.id },
                data: Object.assign({ workflowId: workflow.id, workflowVersion: 1 }, (input.stripLegacy && nextConfig != null
                    ? { config: nextConfig }
                    : {})),
            });
            return workflow;
        });
        return Object.assign(Object.assign({}, base), { outcome: 'migrated', workflowId: created.id, workflowKey: created.workflowKey });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Object.assign(Object.assign({}, base), { outcome: 'failed', workflowKey, error: message });
    }
}
async function main() {
    const dryRun = parseBool(process.env.DRY_RUN, true);
    const stripLegacy = parseBool(process.env.STRIP_LEGACY_CONFIG_WORKFLOW, false);
    const appClientId = parsePositiveInt(process.env.APP_CLIENT_ID);
    const skillId = parsePositiveInt(process.env.SKILL_ID);
    const skills = await prisma.skill.findMany({
        where: Object.assign(Object.assign({}, (skillId != null ? { id: skillId } : {})), (appClientId != null ? { appClientId } : {})),
        include: {
            skillTools: { select: { toolId: true, isRequired: true } },
            skillHostTools: { select: { hostToolId: true, isRequired: true } },
        },
        orderBy: { id: 'asc' },
    });
    const report = [];
    for (const skill of skills) {
        report.push(await migrateOneSkill({
            dryRun,
            stripLegacy,
            skill,
        }));
    }
    const summary = report.reduce((acc, row) => {
        var _a;
        acc[row.outcome] = ((_a = acc[row.outcome]) !== null && _a !== void 0 ? _a : 0) + 1;
        return acc;
    }, {
        migrated: 0,
        dry_run: 0,
        skipped_no_legacy: 0,
        skipped_has_workflow: 0,
        skipped_invalid: 0,
        failed: 0,
    });
    console.log(JSON.stringify({
        dryRun,
        stripLegacy,
        appClientId,
        skillId,
        scanned: skills.length,
        summary,
        rows: report,
    }, null, 2));
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate-skill-config-workflow.js.map