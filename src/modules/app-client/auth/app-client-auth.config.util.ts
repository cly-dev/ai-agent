import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import type {
  AppClientAuthConfig,
  ResolvedAppClientAuthConfig,
} from './app-client-auth.types';

const tokenPlacementSchema = z.enum([
  'authorization_bearer',
  'header_x_account_token',
  'query_token',
]);

const profileFieldMappingSchema = z
  .object({
    employeeId: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    nickName: z.string().min(1).optional(),
    cnName: z.string().min(1).optional(),
    active: z.string().min(1).optional(),
  })
  .strict();

const httpAuthConfigSchema = z
  .object({
    baseUrl: z.string().url(),
    profilePath: z.string().min(1),
    method: z.enum(['GET', 'POST']).optional(),
    tokenPlacement: tokenPlacementSchema.optional(),
    responseRoot: z.string().min(1).optional(),
    mapping: profileFieldMappingSchema.optional(),
    extraHeaders: z.record(z.string(), z.string()).optional(),
  })
  .strict();

const jwtAuthConfigSchema = z
  .object({
    sharedSecret: z.string().min(1),
    issuer: z.string().min(1).optional(),
    audience: z.string().min(1).optional(),
  })
  .strict();

const authConfigSchema = z
  .object({
    provider: z.enum(['http_profile', 'jwt_shared_secret']),
    http: httpAuthConfigSchema.optional(),
    jwt: jwtAuthConfigSchema.optional(),
    autoBindRoleName: z.string().min(1).optional(),
    propagateTokenToIntegrations: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.provider === 'http_profile' && !value.http) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'http is required when provider is http_profile',
        path: ['http'],
      });
    }
    if (value.provider === 'jwt_shared_secret' && !value.jwt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'jwt is required when provider is jwt_shared_secret',
        path: ['jwt'],
      });
    }
  });

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path =
        issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');
}

export function parseAppClientAuthConfig(
  raw: unknown,
): AppClientAuthConfig | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const parsed = authConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BadRequestException(
      `invalid authConfig: ${formatZodIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

export function buildAuthConfigFromEnv(): AppClientAuthConfig | null {
  const host = process.env.APP_CLIENT_HOST?.trim();
  if (!host) {
    return null;
  }
  return {
    provider: 'http_profile',
    http: {
      baseUrl: host.endsWith('/') ? host.slice(0, -1) : host,
      profilePath:
        process.env.APP_CLIENT_AUTH_PROFILE_PATH?.trim() ||
        '/account/seller/account/current',
      method: 'GET',
      tokenPlacement: 'authorization_bearer',
      mapping: {
        employeeId: 'employeeId',
        email: 'email',
        username: 'nickName',
        nickName: 'nickName',
        cnName: 'cnName',
        active: 'active',
      },
    },
    autoBindRoleName:
      process.env.APP_CLIENT_AUTO_BIND_ROLE?.trim().toLowerCase() ||
      'operator',
    propagateTokenToIntegrations: true,
  };
}

/** 本服务对外可访问根 URL（无尾部斜杠），用于 AppClient 回调 profile。 */
export function resolveAgentServerPublicUrl(): string {
  const raw =
    process.env.AGENT_SERVER_PUBLIC_URL?.trim() ||
    process.env.APP_CLIENT_AGENT_SERVER_URL?.trim() ||
    'http://localhost:3030';
  return raw.replace(/\/+$/, '');
}

/**
 * B 端管理台接入：用管理员 JWT 调 `GET /admin/admin-user/me` 校验账号。
 * 适用于 appClientId=2 等「运营助手 / 管理 B 端」场景。
 */
export function buildAgentServerAdminAuthConfig(input?: {
  publicBaseUrl?: string;
  autoBindRoleName?: string;
  propagateTokenToIntegrations?: boolean;
}): AppClientAuthConfig {
  const base = (input?.publicBaseUrl ?? resolveAgentServerPublicUrl()).replace(
    /\/+$/,
    '',
  );
  return {
    provider: 'http_profile',
    http: {
      baseUrl: `${base}/admin`,
      profilePath: '/admin-user/me',
      method: 'GET',
      tokenPlacement: 'authorization_bearer',
      mapping: {
        employeeId: 'data.employeeId',
        email: 'data.email',
        username: 'data.username',
        nickName: 'data.nickName',
        active: 'data.active',
      },
    },
    autoBindRoleName: input?.autoBindRoleName?.trim().toLowerCase() || 'operator',
    propagateTokenToIntegrations: input?.propagateTokenToIntegrations ?? false,
  };
}

/** appClientId=2 默认使用的 authConfig（管理 B 端 · 本服务 admin profile）。 */
export function buildAppClient2AdminAuthConfig(): AppClientAuthConfig {
  return buildAgentServerAdminAuthConfig();
}

function envFallbackAuthConfig(): AppClientAuthConfig | null {
  return buildAuthConfigFromEnv();
}

export function resolveAppClientAuthConfig(
  authConfig: unknown,
): ResolvedAppClientAuthConfig {
  const parsed = parseAppClientAuthConfig(authConfig);
  if (parsed) {
    return {
      ...withAuthDefaults(parsed),
      source: 'db',
    };
  }
  const fallback = envFallbackAuthConfig();
  if (!fallback) {
    throw new BadRequestException(
      'AppClient authConfig is not configured and APP_CLIENT_HOST is unset',
    );
  }
  return {
    ...withAuthDefaults(fallback),
    source: 'env_fallback',
  };
}

function withAuthDefaults(config: AppClientAuthConfig): AppClientAuthConfig {
  return {
    ...config,
    autoBindRoleName:
      config.autoBindRoleName?.trim().toLowerCase() || 'operator',
    propagateTokenToIntegrations: config.propagateTokenToIntegrations ?? true,
    http:
      config.provider === 'http_profile' && config.http
        ? {
            ...config.http,
            method: config.http.method ?? 'GET',
            tokenPlacement:
              config.http.tokenPlacement ?? 'authorization_bearer',
          }
        : config.http,
  };
}
