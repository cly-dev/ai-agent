import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import {
  buildSkillWorkflowMigrationPlan,
  hasLegacySkillConfigWorkflow,
  resolveMigratedWorkflowKeyConflict,
  stripLegacySkillConfigWorkflow,
} from '../../src/core/workflow/legacy/migrate-skill-config-workflow.util';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

type MigrationOutcome =
  | 'migrated'
  | 'dry_run'
  | 'skipped_no_legacy'
  | 'skipped_has_workflow'
  | 'skipped_invalid'
  | 'failed';

type MigrationReportRow = {
  skillId: number;
  skillName: string;
  agentId: number;
  appClientId: number;
  outcome: MigrationOutcome;
  workflowId?: number;
  workflowKey?: string;
  issues?: string[];
  error?: string;
};

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw?.trim()) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw == null || raw.trim() === '') {
    return defaultValue;
  }
  return raw === '1' || raw.toLowerCase() === 'true';
}

async function resolveWorkflowKey(
  appClientId: number,
  preferredKey: string,
  skillId: number,
): Promise<string> {
  let candidate = preferredKey;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await prisma.workflow.findFirst({
      where: { appClientId, workflowKey: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    candidate = resolveMigratedWorkflowKeyConflict(preferredKey, skillId);
    if (attempt === 1) {
      candidate = `${candidate}.${Date.now()}`;
    }
  }
  return `${preferredKey}.skill${skillId}.${Date.now()}`;
}

async function migrateOneSkill(input: {
  dryRun: boolean;
  stripLegacy: boolean;
  skill: {
    id: number;
    name: string;
    capabilityKey: string | null;
    config: unknown;
    workflowId: number | null;
    appClientId: number;
    skillTools: Array<{ toolId: number; isRequired: boolean }>;
    skillHostTools: Array<{ hostToolId: number; isRequired: boolean }>;
  };
}): Promise<MigrationReportRow> {
  const base: MigrationReportRow = {
    skillId: input.skill.id,
    skillName: input.skill.name,
    agentId: 0,
    appClientId: input.skill.appClientId,
    outcome: 'skipped_no_legacy',
  };

  if (input.skill.workflowId != null) {
    return {
      ...base,
      outcome: 'skipped_has_workflow',
      workflowId: input.skill.workflowId,
    };
  }

  if (!hasLegacySkillConfigWorkflow(input.skill.config)) {
    return base;
  }

  const plan = buildSkillWorkflowMigrationPlan({
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
    return { ...base, outcome: 'skipped_no_legacy' };
  }

  if (plan.validationIssues.length > 0) {
    return {
      ...base,
      outcome: 'skipped_invalid',
      workflowKey: plan.workflowKey,
      issues: plan.validationIssues.map(
        (issue) => `${issue.path}: ${issue.code} — ${issue.message}`,
      ),
    };
  }

  const workflowKey = await resolveWorkflowKey(
    input.skill.appClientId,
    plan.workflowKey,
    input.skill.id,
  );

  if (input.dryRun) {
    return {
      ...base,
      outcome: 'dry_run',
      workflowKey,
    };
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
          nodes: plan.nodes as Prisma.InputJsonValue,
          version: 1,
          constraints: [] as Prisma.InputJsonValue,
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
          nodes: workflow.nodes as Prisma.InputJsonValue,
          deliverable: workflow.deliverable,
          constraints: workflow.constraints as Prisma.InputJsonValue,
          changeNote: `migrated from Skill#${input.skill.id} config.workflow`,
        },
      });

      const nextConfig = input.stripLegacy
        ? stripLegacySkillConfigWorkflow(input.skill.config)
        : input.skill.config;

      await tx.skill.update({
        where: { id: input.skill.id },
        data: {
          workflowId: workflow.id,
          workflowVersion: 1,
          ...(input.stripLegacy && nextConfig != null
            ? { config: nextConfig as Prisma.InputJsonValue }
            : {}),
        },
      });

      return workflow;
    });

    return {
      ...base,
      outcome: 'migrated',
      workflowId: created.id,
      workflowKey: created.workflowKey,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...base,
      outcome: 'failed',
      workflowKey,
      error: message,
    };
  }
}

async function main() {
  const dryRun = parseBool(process.env.DRY_RUN, true);
  const stripLegacy = parseBool(process.env.STRIP_LEGACY_CONFIG_WORKFLOW, false);
  const appClientId = parsePositiveInt(process.env.APP_CLIENT_ID);
  const skillId = parsePositiveInt(process.env.SKILL_ID);

  const skills = await prisma.skill.findMany({
    where: {
      ...(skillId != null ? { id: skillId } : {}),
      ...(appClientId != null ? { appClientId } : {}),
    },
    include: {
      skillTools: { select: { toolId: true, isRequired: true } },
      skillHostTools: { select: { hostToolId: true, isRequired: true } },
    },
    orderBy: { id: 'asc' },
  });

  const report: MigrationReportRow[] = [];
  for (const skill of skills) {
    report.push(
      await migrateOneSkill({
        dryRun,
        stripLegacy,
        skill,
      }),
    );
  }

  const summary = report.reduce<Record<MigrationOutcome, number>>(
    (acc, row) => {
      acc[row.outcome] = (acc[row.outcome] ?? 0) + 1;
      return acc;
    },
    {
      migrated: 0,
      dry_run: 0,
      skipped_no_legacy: 0,
      skipped_has_workflow: 0,
      skipped_invalid: 0,
      failed: 0,
    },
  );

  console.log(
    JSON.stringify(
      {
        dryRun,
        stripLegacy,
        appClientId,
        skillId,
        scanned: skills.length,
        summary,
        rows: report,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
