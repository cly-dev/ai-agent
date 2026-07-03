import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExternalAccountProfile } from '../../user/user.service';
import type {
  AppClientHttpAuthConfig,
  AppClientProfileFieldMapping,
  AppClientTokenPlacement,
} from './app-client-auth.types';
import { normalizeExternalAccountProfile } from './app-client-auth-profile.util';

export function pickMappedField(
  source: Record<string, unknown>,
  path: string,
): unknown {
  const trimmed = path.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!trimmed.includes('.')) {
    return source[trimmed];
  }
  let current: unknown = source;
  for (const segment of trimmed.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** 定位 profile JSON 根节点；未配置 responseRoot 时从响应顶层读取。 */
export function resolveProfilePayloadRoot(
  payload: unknown,
  responseRoot?: string,
): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new UnauthorizedException('invalid external account response');
  }
  const row = payload as Record<string, unknown>;
  const rootPath = responseRoot?.trim();
  if (!rootPath) {
    return row;
  }
  const nested = pickMappedField(row, rootPath);
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    throw new UnauthorizedException(
      `external account response root "${rootPath}" not found`,
    );
  }
  return nested as Record<string, unknown>;
}

export function mapHttpProfileResponse(
  payload: unknown,
  mapping: AppClientProfileFieldMapping | undefined,
  responseRoot?: string,
): Partial<ExternalAccountProfile> & { active: boolean } {
  if (!mapping || Object.keys(mapping).length === 0) {
    return { active: true };
  }

  const row =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? resolveProfilePayloadRoot(payload, responseRoot)
      : ({} as Record<string, unknown>);
  const employeeId = mapping.employeeId
    ? asTrimmedString(pickMappedField(row, mapping.employeeId))
    : undefined;
  const email = mapping.email
    ? asTrimmedString(pickMappedField(row, mapping.email))
    : undefined;
  const nickName = mapping.nickName
    ? asTrimmedString(pickMappedField(row, mapping.nickName))
    : undefined;
  const cnName = mapping.cnName
    ? asTrimmedString(pickMappedField(row, mapping.cnName))
    : undefined;
  const usernameFromMapping = mapping.username
    ? asTrimmedString(pickMappedField(row, mapping.username))
    : undefined;
  const activeRaw = mapping.active
    ? pickMappedField(row, mapping.active)
    : undefined;
  return {
    ...(employeeId ? { employeeId } : {}),
    ...(email ? { email } : {}),
    ...(usernameFromMapping ? { username: usernameFromMapping } : {}),
    nickName,
    cnName,
    active: activeRaw !== false,
  };
}

export async function parseFetchBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code =
      'code' in cause && typeof cause.code === 'string' ? cause.code : '';
    return code ? `${cause.message} (${code})` : cause.message;
  }
  return error.message;
}

export function buildBrowserLikeHeaders(
  origin: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  const host = new URL(origin).host;
  return {
    Host: host,
    Connection: 'keep-alive',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    ...extra,
  };
}

function applyTokenPlacement(
  url: URL,
  headers: Record<string, string>,
  accountToken: string,
  placement: AppClientTokenPlacement,
): void {
  switch (placement) {
    case 'authorization_bearer':
      headers.Authorization = `Bearer ${accountToken}`;
      return;
    case 'header_x_account_token':
      headers['x-account-token'] = accountToken;
      return;
    case 'query_token':
      url.searchParams.set('token', accountToken);
      return;
    default:
      headers.Authorization = `Bearer ${accountToken}`;
  }
}

function joinProfileUrl(baseUrl: string, profilePath: string): URL {
  const base = baseUrl.replace(/\/+$/, '');
  const path = profilePath.startsWith('/') ? profilePath : `/${profilePath}`;
  return new URL(`${base}${path}`);
}

export async function fetchHttpProfileAccount(
  http: AppClientHttpAuthConfig,
  accountToken: string,
  appClientId: number,
): Promise<ExternalAccountProfile> {
  const accountUrl = joinProfileUrl(http.baseUrl, http.profilePath);
  const headers = buildBrowserLikeHeaders(
    accountUrl.origin,
    http.extraHeaders ?? {},
  );
  applyTokenPlacement(
    accountUrl,
    headers,
    accountToken,
    http.tokenPlacement ?? 'authorization_bearer',
  );

  let accountResponse: Response;
  try {
    accountResponse = await fetch(accountUrl, {
      method: http.method ?? 'GET',
      headers,
    });
  } catch (error) {
    const detail = formatFetchError(error);
    throw new ServiceUnavailableException(
      `无法连接外部账号服务 ${accountUrl.origin}：${detail}。请检查 authConfig.http、VPN/内网连通性及 x-account-token 是否有效。`,
    );
  }

  const account = await parseFetchBody(accountResponse);
  if (!accountResponse.ok) {
    throw new UnauthorizedException(
      `external account verification failed: ${accountResponse.status}`,
    );
  }
  const partial = mapHttpProfileResponse(
    account,
    http.mapping,
    http.responseRoot,
  );
  return normalizeExternalAccountProfile(partial, { appClientId, accountToken });
}
