import type { HttpMethod } from '../../../generated/prisma/client';
import {
  collectOpenApiParameterSpecs,
  formatQueryScalar,
  type OpenApiParamSpec,
} from './tool-input-sanitize.util';

export type ToolHttpParameterPlacement = {
  header: Record<string, unknown>;
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
};

export type ToolHttpRequestLayout = {
  method: string;
  pathTemplate: string;
  resolvedPath: string;
  baseUrl: string;
  url: string;
  parameters: ToolHttpParameterPlacement;
  bodyJson?: string;
};

function isGetMethod(method: string): boolean {
  return method.toUpperCase() === 'GET';
}

function loadSpecs(inputSchema: unknown, fallbackSchema: unknown): OpenApiParamSpec[] {
  const fromInput = collectOpenApiParameterSpecs(inputSchema);
  if (fromInput.length > 0) {
    return fromInput;
  }
  return collectOpenApiParameterSpecs(fallbackSchema);
}

function applyPathPlaceholders(
  pathTemplate: string,
  input: Record<string, unknown>,
): string {
  return pathTemplate.replace(/\{([^/{}]+)\}/g, (_match, rawName: string) => {
    const key =
      typeof rawName === 'string' ? rawName.trim() : String(rawName);
    const value = input[key];
    if (value === undefined || value === null) {
      return `{${key}}`;
    }
    return encodeURIComponent(formatQueryScalar(value));
  });
}

function collectPathTemplateKeys(pathTemplate: string): Set<string> {
  const keys = new Set<string>();
  const re = /\{([^/{}]+)\}/g;
  let match: RegExpExecArray | null = re.exec(pathTemplate);
  while (match !== null) {
    keys.add(match[1].trim());
    match = re.exec(pathTemplate);
  }
  return keys;
}

function reservedBodyKeys(
  specs: OpenApiParamSpec[],
  pathTemplate: string,
): Set<string> {
  const reserved = collectPathTemplateKeys(pathTemplate);
  for (const spec of specs) {
    if (spec.in === 'header' || spec.in === 'query' || spec.in === 'path') {
      reserved.add(spec.name);
    }
  }
  return reserved;
}

function appendQueryParam(
  url: URL,
  name: string,
  value: unknown,
  spec?: Pick<OpenApiParamSpec, 'type' | 'collectionFormat'>,
): void {
  if (value === undefined || value === null) {
    return;
  }
  const useMulti =
    spec?.collectionFormat === 'multi' || spec?.type === 'array';
  if (useMulti && Array.isArray(value)) {
    for (const item of value) {
      if (item === undefined || item === null) {
        continue;
      }
      url.searchParams.append(name, formatQueryScalar(item));
    }
    return;
  }
  if (Array.isArray(value)) {
    url.searchParams.set(
      name,
      value.map((item) => formatQueryScalar(item)).join(','),
    );
    return;
  }
  url.searchParams.set(name, formatQueryScalar(value));
}

function resolveUrl(
  baseUrl: string,
  resolvedPath: string,
  method: HttpMethod,
  input: Record<string, unknown>,
  specs: OpenApiParamSpec[],
): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const normalizedPath = resolvedPath.startsWith('/')
    ? resolvedPath
    : `/${resolvedPath}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (!isGetMethod(method)) {
    return url.toString();
  }

  if (specs.length === 0) {
    for (const [key, value] of Object.entries(input)) {
      appendQueryParam(url, key, value);
    }
    return url.toString();
  }

  for (const spec of specs) {
    if (spec.in !== 'query') {
      continue;
    }
    appendQueryParam(url, spec.name, input[spec.name], spec);
  }
  return url.toString();
}

function buildBodyPayload(
  method: HttpMethod,
  input: Record<string, unknown>,
  specs: OpenApiParamSpec[],
  pathTemplate: string,
): { body: Record<string, unknown>; bodyJson?: string } {
  if (isGetMethod(method)) {
    return { body: {} };
  }
  if (specs.length === 0) {
    const bodyJson = JSON.stringify(input);
    return { body: { ...input }, bodyJson };
  }
  const reserved = reservedBodyKeys(specs, pathTemplate);
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (reserved.has(key)) {
      continue;
    }
    body[key] = value;
  }
  const bodyJson = JSON.stringify(body, (_key, value) =>
    value === undefined ? undefined : value,
  );
  return { body, bodyJson };
}

/** 按 OpenAPI `in` 与 path 模板，拆分 header / path / query / body 参数（与 HTTP 执行逻辑一致）。 */
export function buildToolHttpRequestLayout(
  def: {
    method: HttpMethod;
    path: string;
    inputSchema?: unknown;
    schema?: unknown;
    baseUrl: string;
  },
  input: Record<string, unknown>,
): ToolHttpRequestLayout {
  const specs = loadSpecs(def.inputSchema, def.schema);
  const pathTemplate = def.path;
  const resolvedPath = applyPathPlaceholders(pathTemplate, input);
  const pathTemplateKeys = collectPathTemplateKeys(pathTemplate);

  const header: Record<string, unknown> = {};
  const pathParams: Record<string, unknown> = {};
  const query: Record<string, unknown> = {};

  for (const spec of specs) {
    const value = input[spec.name];
    if (value === undefined || value === null) {
      continue;
    }
    if (spec.in === 'header') {
      header[spec.name] = value;
      continue;
    }
    if (spec.in === 'path') {
      pathParams[spec.name] = value;
      continue;
    }
    if (spec.in === 'query') {
      query[spec.name] = value;
    }
  }

  for (const key of pathTemplateKeys) {
    const value = input[key];
    if (value !== undefined && value !== null) {
      pathParams[key] = value;
    }
  }

  if (isGetMethod(def.method) && specs.length === 0) {
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null) {
        continue;
      }
      query[key] = value;
    }
  }

  const { body, bodyJson } = buildBodyPayload(
    def.method,
    input,
    specs,
    pathTemplate,
  );
  const url = resolveUrl(
    def.baseUrl,
    resolvedPath,
    def.method,
    input,
    specs,
  );

  return {
    method: def.method,
    pathTemplate,
    resolvedPath,
    baseUrl: def.baseUrl.trim().replace(/\/+$/, ''),
    url,
    parameters: {
      header,
      path: pathParams,
      query,
      body,
    },
    ...(bodyJson !== undefined ? { bodyJson } : {}),
  };
}
