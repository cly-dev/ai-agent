import '../core/env/load-env';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import {
  DEFAULT_SWAGGER_SPEC_URL,
  applyTools,
  buildToolDrafts,
  listOperations,
  loadOpenApiSpec,
  promptSwaggerSpecUrl,
  resolveIntegrationAuthMode,
  resolveIntegrationId,
  resolveSelectedOperationKeys,
  resolveTargetAgentId,
  type SwaggerImportContext,
} from './swagger-tool-import.core';
import { buildPathFilter } from './tool-path-filter.util';

function parseArgs(argv: string[]): SwaggerImportContext & { outputPath: string } {
  const getArgValue = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    if (index >= 0 && index < argv.length - 1) {
      return argv[index + 1];
    }
    return undefined;
  };

  const parseCsv = (value: string | undefined): Set<string> => {
    if (!value) {
      return new Set<string>();
    }
    return new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  };

  const integrationIdValue =
    getArgValue('--integration-id') ?? process.env.GEN_TOOL_INTEGRATION_ID;
  const envAutoIntegration = process.env.GEN_TOOL_AUTO_INTEGRATION ?? '';
  const autoIntegration = argv.includes('--no-auto-integration')
    ? false
    : /^false$/i.test(envAutoIntegration)
      ? false
      : argv.includes('--auto-integration') ||
        envAutoIntegration === '' ||
        envAutoIntegration === '1' ||
        /^true$/i.test(envAutoIntegration);
  let integrationId: number | null = null;
  if (integrationIdValue) {
    const parsed = Number(integrationIdValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('integration id must be a positive integer');
    }
    integrationId = parsed;
  }
  const appClientIdValue =
    getArgValue('--app-client-id') ?? process.env.GEN_TOOL_APP_CLIENT_ID;
  let appClientId: number | null = null;
  if (appClientIdValue) {
    const parsed = Number(appClientIdValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('app-client-id must be a positive integer');
    }
    appClientId = parsed;
  }
  if (!autoIntegration && integrationId === null) {
    throw new Error(
      'integration id is required. use --integration-id <number> or enable --auto-integration',
    );
  }

  const agentIdValue = getArgValue('--agent-id') ?? process.env.GEN_TOOL_AGENT_ID;
  let agentId: number | null = null;
  if (agentIdValue) {
    const parsed = Number(agentIdValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('agent-id must be a positive integer');
    }
    agentId = parsed;
  }

  const dryRun = argv.includes('--dry-run');
  const apply = argv.includes('--apply');
  if (!dryRun && !apply) {
    throw new Error('choose one mode: --dry-run or --apply');
  }
  if (dryRun && apply) {
    throw new Error('cannot use --dry-run and --apply together');
  }

  const insecure =
    argv.includes('--insecure') ||
    process.env.GEN_TOOL_INSECURE === '1' ||
    /^true$/i.test(process.env.GEN_TOOL_INSECURE ?? '');

  return {
    specPath: getArgValue('--spec-path') ?? process.env.GEN_TOOL_SPEC_PATH,
    specUrl:
      getArgValue('--spec-url') ??
      process.env.GEN_TOOL_SPEC_URL ??
      DEFAULT_SWAGGER_SPEC_URL,
    outputPath:
      getArgValue('--output') ??
      process.env.GEN_TOOL_OUTPUT ??
      'tmp/generated-tools.json',
    integrationId,
    appClientId,
    agentId,
    autoIntegration,
    integrationName:
      getArgValue('--integration-name') ??
      process.env.GEN_TOOL_INTEGRATION_NAME,
    integrationBaseUrl:
      getArgValue('--integration-base-url') ??
      process.env.GEN_TOOL_INTEGRATION_BASE_URL,
    integrationApiKey:
      getArgValue('--integration-api-key') ??
      process.env.GEN_TOOL_INTEGRATION_API_KEY ??
      '',
    integrationAuthMode: resolveIntegrationAuthMode(
      getArgValue('--integration-auth-mode') ??
        process.env.GEN_TOOL_INTEGRATION_AUTH_MODE,
    ),
    dryRun,
    apply,
    insecure,
    tags: parseCsv(getArgValue('--tags') ?? process.env.GEN_TOOL_TAGS),
    ops: parseCsv(getArgValue('--ops') ?? process.env.GEN_TOOL_OPS),
    pathInclude: parseCsv(
      getArgValue('--path-include') ?? process.env.GEN_TOOL_PATH_INCLUDE,
    ),
    pathExclude: parseCsv(
      getArgValue('--path-exclude') ?? process.env.GEN_TOOL_PATH_EXCLUDE,
    ),
    noDefaultPathExclude:
      argv.includes('--no-default-path-exclude') ||
      process.env.GEN_TOOL_NO_DEFAULT_PATH_EXCLUDE === '1' ||
      /^true$/i.test(process.env.GEN_TOOL_NO_DEFAULT_PATH_EXCLUDE ?? ''),
  };
}

async function run(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const { outputPath, ...options } = parsed;
  if (!options.specPath && process.stdin.isTTY && process.stdout.isTTY) {
    options.specUrl = await promptSwaggerSpecUrl(options.specUrl);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const adapter = new PrismaPg(new Pool({ connectionString }));
  const prisma = new PrismaClient({ adapter });
  try {
    const spec = await loadOpenApiSpec(options);
    const resolvedIntegrationId = await resolveIntegrationId(
      prisma,
      options,
      spec,
    );
    const integration = await prisma.integration.findUnique({
      where: { id: resolvedIntegrationId },
      select: { appClientId: true },
    });
    if (!integration) {
      throw new Error(`integration ${resolvedIntegrationId} not found`);
    }
    const targetAgentId = await resolveTargetAgentId(
      prisma,
      options,
      integration.appClientId,
      'interactive',
    );
    const pathFilter = buildPathFilter({
      include: options.pathInclude,
      exclude: options.pathExclude,
      useDefaultExclude: !options.noDefaultPathExclude,
    });
    const operations = listOperations(spec, pathFilter);
    const selectedKeys = await resolveSelectedOperationKeys(
      options,
      operations,
      'interactive',
    );
    const drafts = buildToolDrafts(
      spec,
      pathFilter,
      selectedKeys,
      resolvedIntegrationId,
    );
    if (drafts.length === 0) {
      throw new Error('no operations matched filters');
    }

    const outputFullPath = path.resolve(process.cwd(), outputPath);
    fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
    fs.writeFileSync(outputFullPath, JSON.stringify(drafts, null, 2), 'utf-8');

    if (options.apply) {
      await applyTools(prisma, drafts, targetAgentId);
    }

    // eslint-disable-next-line no-console
    console.log(
      `path filter: include=[${pathFilter.include.join(', ') || '*'}] exclude=[${pathFilter.exclude.join(', ')}]`,
    );
    // eslint-disable-next-line no-console
    console.log(`integration id: ${resolvedIntegrationId}`);
    if (targetAgentId !== null) {
      // eslint-disable-next-line no-console
      console.log(`bound tools to agent id: ${targetAgentId}`);
    }
    // eslint-disable-next-line no-console
    console.log(`generated ${drafts.length} tools -> ${outputFullPath}`);
    // eslint-disable-next-line no-console
    console.log(options.apply ? 'database upsert completed' : 'dry-run only');
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
