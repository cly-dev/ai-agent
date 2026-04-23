import '../core/env/load-env';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as readline from 'readline/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  HttpMethod,
  PrismaClient,
  ToolLevel,
} from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

type HttpVerb = 'get' | 'post' | 'put' | 'patch' | 'delete';

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
};

type OpenApiPathItem = Partial<Record<HttpVerb, OpenApiOperation>>;

type OpenApiTagObject = {
  name?: string;
  description?: string;
};

type OpenApiDocument = {
  paths?: Record<string, OpenApiPathItem>;
  tags?: OpenApiTagObject[];
};

type ToolDraft = {
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  riskLevel: ToolLevel;
  schema: Prisma.InputJsonValue;
  inputSchema: Prisma.InputJsonValue;
  outputSchema: Prisma.InputJsonValue | null;
  integrationId: number;
  isActive: boolean;
  /** OpenAPI 首个 tag，用于同步 ToolCategory */
  categoryLabel: string;
  /** 来自 spec 顶层 tags[].description（若有） */
  categoryDescription: string | null;
};

type OperationMeta = {
  key: string;
  method: HttpVerb;
  urlPath: string;
  tag: string;
  operation: OpenApiOperation;
};

type CliOptions = {
  specPath?: string;
  specUrl: string;
  outputPath: string;
  integrationId: number;
  dryRun: boolean;
  apply: boolean;
  insecure: boolean;
  riskLevel: ToolLevel;
  tags: Set<string>;
  ops: Set<string>;
};

const DEFAULT_SPEC_URL = 'https://api.ads.a-premium-test.com/v3/api-docs';
const HTTP_METHODS: HttpVerb[] = ['get', 'post', 'put', 'patch', 'delete'];
const METHOD_ENUM_MAP: Record<HttpVerb, HttpMethod> = {
  get: HttpMethod.Get,
  post: HttpMethod.Post,
  put: HttpMethod.Put,
  patch: HttpMethod.Put,
  delete: HttpMethod.Delete,
};

function parseArgs(argv: string[]): CliOptions {
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
  if (!integrationIdValue) {
    throw new Error(
      'integration id is required. use --integration-id <number>',
    );
  }
  const integrationId = Number(integrationIdValue);
  if (!Number.isInteger(integrationId) || integrationId <= 0) {
    throw new Error('integration id must be a positive integer');
  }

  const riskLevelRaw = (
    getArgValue('--risk-level') ??
    process.env.GEN_TOOL_RISK_LEVEL ??
    'L1'
  )
    .trim()
    .toUpperCase();
  const allowedRiskLevels: Record<string, ToolLevel> = {
    L1: ToolLevel.L1,
    L2: ToolLevel.L2,
    L3: ToolLevel.L3,
  };
  const riskLevel = allowedRiskLevels[riskLevelRaw];
  if (!riskLevel) {
    throw new Error('risk level must be one of: L1, L2, L3');
  }

  const dryRun = argv.includes('--dry-run');
  const apply = argv.includes('--apply');
  if (!dryRun && !apply) {
    throw new Error('choose one mode: --dry-run or --apply');
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
      DEFAULT_SPEC_URL,
    outputPath:
      getArgValue('--output') ??
      process.env.GEN_TOOL_OUTPUT ??
      'tmp/generated-tools.json',
    integrationId,
    dryRun,
    apply,
    insecure,
    riskLevel,
    tags: parseCsv(getArgValue('--tags') ?? process.env.GEN_TOOL_TAGS),
    ops: parseCsv(getArgValue('--ops') ?? process.env.GEN_TOOL_OPS),
  };
}

function opKey(method: HttpVerb, urlPath: string): string {
  return `${method.toUpperCase()}:${urlPath}`;
}

function normalizeOpSelector(raw: string): string {
  const parts = raw.split(':');
  if (parts.length !== 2) {
    throw new Error(`invalid op selector: ${raw}. expected METHOD:/path`);
  }
  const method = parts[0].trim().toUpperCase();
  const methodSet = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  if (!methodSet.has(method)) {
    throw new Error(`invalid method in op selector: ${raw}`);
  }
  const urlPath = normalizePath(parts[1].trim());
  return `${method}:${urlPath}`;
}

function normalizePath(urlPath: string): string {
  if (urlPath.startsWith('/')) {
    return urlPath;
  }
  return `/${urlPath}`;
}

function buildToolName(
  operation: OpenApiOperation,
  method: HttpVerb,
  urlPath: string,
): string {
  const raw = operation.operationId?.trim();
  if (raw) {
    return raw;
  }
  return `${method}_${urlPath.replace(/\W+/g, '_').replace(/^_+|_+$/g, '')}`;
}

function buildDescription(
  operation: OpenApiOperation,
  method: HttpVerb,
  urlPath: string,
): string {
  return (
    operation.summary?.trim() ??
    operation.description?.trim() ??
    `${method.toUpperCase()} ${urlPath}`
  );
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

const SPEC_DOWNLOAD_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const SPEC_DOWNLOAD_TIMEOUT_MS = 120_000;
const SPEC_DOWNLOAD_MAX_REDIRECTS = 10;
const SPEC_DOWNLOAD_MAX_ATTEMPTS = 3;
const SPEC_DOWNLOAD_RETRY_BASE_MS = 600;

function headerLocation(headers: http.IncomingHttpHeaders): string | undefined {
  const raw = headers['location'];
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

function isTransientNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const code = (err as NodeJS.ErrnoException).code;
  if (typeof code === 'string') {
    return (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'EPIPE' ||
      code === 'ENETUNREACH' ||
      code === 'EAI_AGAIN'
    );
  }
  return false;
}

type UrlFetchResult = {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
};

function requestUrlOnce(
  urlString: string,
  insecure: boolean,
): Promise<UrlFetchResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const target = new URL(urlString);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      reject(new Error(`unsupported URL protocol: ${target.protocol}`));
      return;
    }
    const isHttps = target.protocol === 'https:';
    const lib = isHttps ? https : http;
    const defaultPort = isHttps ? 443 : 80;
    const options: https.RequestOptions = {
      hostname: target.hostname,
      port: target.port || defaultPort,
      path: `${target.pathname}${target.search}`,
      method: 'GET',
      headers: {
        Accept: 'application/json, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': SPEC_DOWNLOAD_USER_AGENT,
      },
    };
    if (isHttps) {
      options.rejectUnauthorized = !insecure;
    }

    const req = lib.request(options, (incoming) => {
      const statusCode = incoming.statusCode ?? 0;
      const headers = incoming.headers;

      if (statusCode >= 300 && statusCode < 400 && headerLocation(headers)) {
        incoming.resume();
        settled = true;
        resolve({ statusCode, headers, body: '' });
        return;
      }

      if (!statusCode || statusCode >= 400) {
        incoming.resume();
        settled = true;
        resolve({ statusCode, headers, body: '' });
        return;
      }

      let body = '';
      incoming.setEncoding('utf-8');
      incoming.on('data', (chunk: string) => {
        body += chunk;
      });
      incoming.on('end', () => {
        settled = true;
        resolve({ statusCode, headers, body });
      });
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.setTimeout(SPEC_DOWNLOAD_TIMEOUT_MS, () => {
      req.destroy();
      if (!settled) {
        settled = true;
        reject(new Error('request timeout'));
      }
    });

    req.end();
  });
}

async function loadSpecFromRemoteUrl(
  initialUrl: string,
  insecure: boolean,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      const delay = SPEC_DOWNLOAD_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }

    let currentUrl = initialUrl;
    try {
      for (let hop = 0; hop < SPEC_DOWNLOAD_MAX_REDIRECTS; hop += 1) {
        const res = await requestUrlOnce(currentUrl, insecure);
        const { statusCode, headers } = res;

        const nextLocation = headerLocation(headers);
        if (statusCode >= 300 && statusCode < 400 && nextLocation) {
          currentUrl = new URL(nextLocation, currentUrl).toString();
          continue;
        }

        if (!statusCode || statusCode >= 400) {
          throw new Error(
            `failed to download spec: HTTP ${statusCode || 'unknown'}`,
          );
        }

        return res.body;
      }
      throw new Error(
        `too many redirects (max ${SPEC_DOWNLOAD_MAX_REDIRECTS})`,
      );
    } catch (err) {
      lastErr = err;
      const retriable =
        isTransientNetworkError(err) ||
        (err instanceof Error && err.message === 'request timeout');
      if (retriable && attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS - 1) {
        continue;
      }
      if (isTransientNetworkError(err)) {
        const code = (err as NodeJS.ErrnoException).code;
        throw new Error(
          `download spec failed (${code ?? 'network'}): ${
            err instanceof Error ? err.message : String(err)
          }. try: --insecure (TLS), retry, or curl the URL to --spec-path`,
        );
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function loadOpenApiSpec(options: CliOptions): Promise<OpenApiDocument> {
  const raw = options.specPath
    ? fs.readFileSync(path.resolve(process.cwd(), options.specPath), 'utf-8')
    : await loadSpecFromRemoteUrl(options.specUrl, options.insecure);
  const parsed = JSON.parse(raw) as OpenApiDocument;
  if (!parsed.paths || typeof parsed.paths !== 'object') {
    throw new Error('invalid openapi spec: missing paths');
  }
  return parsed;
}

function operationPrimaryTag(operation: OpenApiOperation): string {
  return operation.tags?.[0]?.trim() || 'misc';
}

function buildTagDescriptionMap(spec: OpenApiDocument): Map<string, string> {
  const map = new Map<string, string>();
  const rootTags = spec.tags;
  if (!Array.isArray(rootTags)) {
    return map;
  }
  for (const item of rootTags) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const desc =
      typeof item.description === 'string' ? item.description.trim() : '';
    if (name && desc) {
      map.set(name, desc);
    }
  }
  return map;
}

function listOperations(spec: OpenApiDocument): OperationMeta[] {
  const items: OperationMeta[] = [];
  for (const [urlPath, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      items.push({
        key: opKey(method, urlPath),
        method,
        urlPath,
        tag: operationPrimaryTag(operation),
        operation,
      });
    }
  }
  items.sort((a, b) => {
    const tagCmp = a.tag.localeCompare(b.tag);
    if (tagCmp !== 0) {
      return tagCmp;
    }
    const pathCmp = a.urlPath.localeCompare(b.urlPath);
    if (pathCmp !== 0) {
      return pathCmp;
    }
    return a.method.localeCompare(b.method);
  });
  return items;
}

function parseIndexSelection(input: string, max: number): Set<number> {
  const value = input.trim();
  if (/^(all|\*)$/i.test(value)) {
    return new Set(Array.from({ length: max }, (_, idx) => idx + 1));
  }
  const selected = new Set<number>();
  for (const part of value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)) {
    if (/^\d+\s*-\s*\d+$/.test(part)) {
      const [start, end] = part.split('-').map((item) => Number(item.trim()));
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end > max ||
        start > end
      ) {
        throw new Error(`invalid range: ${part}`);
      }
      for (let i = start; i <= end; i += 1) {
        selected.add(i);
      }
    } else {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 1 || index > max) {
        throw new Error(`invalid index: ${part}`);
      }
      selected.add(index);
    }
  }
  if (selected.size === 0) {
    throw new Error('no operations selected');
  }
  return selected;
}

async function promptSelectOperationKeys(
  operations: OperationMeta[],
): Promise<Set<string>> {
  // eslint-disable-next-line no-console
  console.log('\nSwagger directories (grouped by tag):');
  let currentTag = '';
  const indexToKey = new Map<number, string>();
  let idx = 0;
  for (const item of operations) {
    if (item.tag !== currentTag) {
      currentTag = item.tag;
      // eslint-disable-next-line no-console
      console.log(`\n- ${currentTag}`);
    }
    idx += 1;
    indexToKey.set(idx, item.key);
    const summary = item.operation.summary?.trim();
    // eslint-disable-next-line no-console
    console.log(
      `  ${idx}. [${item.method.toUpperCase()}] ${item.urlPath}${
        summary ? ` - ${summary}` : ''
      }`,
    );
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(
      '\nSelect operations (e.g. 1,3,5-8 or all): ',
    );
    const indexes = parseIndexSelection(answer, operations.length);
    const keys = new Set<string>();
    for (const index of indexes) {
      const key = indexToKey.get(index);
      if (key) {
        keys.add(key);
      }
    }
    return keys;
  } finally {
    rl.close();
  }
}

async function resolveSelectedOperationKeys(
  options: CliOptions,
  operations: OperationMeta[],
): Promise<Set<string>> {
  const allKeys = new Set(operations.map((item) => item.key));
  if (options.ops.size > 0) {
    const selected = new Set<string>();
    for (const raw of options.ops) {
      const normalized = normalizeOpSelector(raw);
      if (!allKeys.has(normalized)) {
        throw new Error(`operation not found in spec: ${normalized}`);
      }
      selected.add(normalized);
    }
    return selected;
  }

  if (options.tags.size > 0) {
    const availableTags = new Set(operations.map((item) => item.tag));
    for (const tag of options.tags) {
      if (!availableTags.has(tag)) {
        throw new Error(`tag not found in spec: ${tag}`);
      }
    }
    return new Set(
      operations
        .filter((item) => options.tags.has(item.tag))
        .map((item) => item.key),
    );
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'interactive selection requires TTY. use --tags or --ops in non-interactive mode',
    );
  }

  return promptSelectOperationKeys(operations);
}

function buildToolDrafts(
  spec: OpenApiDocument,
  options: CliOptions,
  selectedKeys: Set<string>,
): ToolDraft[] {
  const tagDescriptions = buildTagDescriptionMap(spec);
  const drafts: ToolDraft[] = [];
  for (const [urlPath, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      if (!selectedKeys.has(opKey(method, urlPath))) {
        continue;
      }

      const inputSchema = toInputJsonValue({
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody ?? null,
      });
      const outputSchema: Prisma.InputJsonValue | null = operation.responses
        ? toInputJsonValue(operation.responses)
        : null;

      const categoryLabel = operationPrimaryTag(operation);
      const categoryDescription = tagDescriptions.get(categoryLabel) ?? null;

      drafts.push({
        name: buildToolName(operation, method, urlPath),
        description: buildDescription(operation, method, urlPath),
        method: METHOD_ENUM_MAP[method],
        path: normalizePath(urlPath),
        riskLevel: options.riskLevel,
        schema: inputSchema,
        inputSchema,
        outputSchema,
        integrationId: options.integrationId,
        isActive: true,
        categoryLabel,
        categoryDescription,
      });
    }
  }
  return drafts;
}

function draftToToolWriteData(
  draft: ToolDraft,
  toolCategoryId: number,
): Prisma.ToolCreateInput {
  return {
    name: draft.name,
    description: draft.description,
    riskLevel: draft.riskLevel,
    schema: draft.schema,
    inputSchema: draft.inputSchema,
    outputSchema: draft.outputSchema,
    method: draft.method,
    path: draft.path,
    integration: { connect: { id: draft.integrationId } },
    toolCategory: { connect: { id: toolCategoryId } },
    isActive: draft.isActive,
  };
}

async function ensureToolCategoriesByDrafts(
  prisma: PrismaClient,
  drafts: ToolDraft[],
): Promise<Map<string, number>> {
  const labelToDescription = new Map<string, string | null>();
  for (const draft of drafts) {
    if (!labelToDescription.has(draft.categoryLabel)) {
      labelToDescription.set(draft.categoryLabel, draft.categoryDescription);
    }
  }

  const idByLabel = new Map<string, number>();
  for (const [label, specDescription] of labelToDescription) {
    let row = await prisma.toolCategory.findFirst({
      where: { label },
    });
    if (!row) {
      row = await prisma.toolCategory.create({
        data: {
          label,
          description: specDescription,
        },
      });
    } else if (specDescription && !row.description) {
      row = await prisma.toolCategory.update({
        where: { id: row.id },
        data: { description: specDescription },
      });
    }
    idByLabel.set(label, row.id);
  }
  return idByLabel;
}

async function applyTools(drafts: ToolDraft[]): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required when using --apply');
  }
  const adapter = new PrismaPg(new Pool({ connectionString }));
  const prisma = new PrismaClient({ adapter });
  try {
    const categoryIdByLabel = await ensureToolCategoriesByDrafts(
      prisma,
      drafts,
    );

    for (const draft of drafts) {
      const toolCategoryId = categoryIdByLabel.get(draft.categoryLabel);
      if (toolCategoryId === undefined) {
        throw new Error(
          `missing tool category id for label: ${draft.categoryLabel}`,
        );
      }
      const toolData = draftToToolWriteData(draft, toolCategoryId);
      const existing = await prisma.tool.findFirst({
        where: {
          integrationId: draft.integrationId,
          method: draft.method,
          path: draft.path,
        },
        orderBy: { id: 'asc' },
      });
      if (existing) {
        await prisma.tool.update({
          where: { id: existing.id },
          data: {
            name: toolData.name,
            description: toolData.description,
            riskLevel: toolData.riskLevel,
            schema: toolData.schema,
            inputSchema: toolData.inputSchema,
            outputSchema: toolData.outputSchema,
            isActive: toolData.isActive,
            toolCategory: toolData.toolCategory,
          },
        });
      } else {
        await prisma.tool.create({ data: toolData });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const spec = await loadOpenApiSpec(options);
  const operations = listOperations(spec);
  const selectedKeys = await resolveSelectedOperationKeys(options, operations);
  const drafts = buildToolDrafts(spec, options, selectedKeys);
  if (drafts.length === 0) {
    throw new Error('no operations matched filters');
  }

  const outputFullPath = path.resolve(process.cwd(), options.outputPath);
  fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
  fs.writeFileSync(outputFullPath, JSON.stringify(drafts, null, 2), 'utf-8');

  if (options.apply) {
    await applyTools(drafts);
  }

  // eslint-disable-next-line no-console
  console.log(`generated ${drafts.length} tools -> ${outputFullPath}`);
  // eslint-disable-next-line no-console
  console.log(options.apply ? 'database upsert completed' : 'dry-run only');
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
