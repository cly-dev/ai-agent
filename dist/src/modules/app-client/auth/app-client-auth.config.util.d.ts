import type { AppClientAuthConfig, ResolvedAppClientAuthConfig } from './app-client-auth.types';
export declare function parseAppClientAuthConfig(raw: unknown): AppClientAuthConfig | null;
export declare function buildAuthConfigFromEnv(): AppClientAuthConfig | null;
export declare function resolveAgentServerPublicUrl(): string;
export declare function buildAgentServerAdminAuthConfig(input?: {
    publicBaseUrl?: string;
    autoBindRoleName?: string;
    propagateTokenToIntegrations?: boolean;
}): AppClientAuthConfig;
export declare function buildAppClient2AdminAuthConfig(): AppClientAuthConfig;
export declare function resolveAppClientAuthConfig(authConfig: unknown): ResolvedAppClientAuthConfig;
