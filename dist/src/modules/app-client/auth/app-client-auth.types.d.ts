export type AppClientAuthProvider = 'http_profile' | 'jwt_shared_secret';
export type AppClientTokenPlacement = 'authorization_bearer' | 'header_x_account_token' | 'query_token';
export type AppClientProfileFieldMapping = {
    employeeId?: string;
    email: string;
    username?: string;
    nickName?: string;
    cnName?: string;
    active?: string;
};
export type AppClientHttpAuthConfig = {
    baseUrl: string;
    profilePath: string;
    method?: 'GET' | 'POST';
    tokenPlacement?: AppClientTokenPlacement;
    responseRoot?: string;
    mapping: AppClientProfileFieldMapping;
    extraHeaders?: Record<string, string>;
};
export type AppClientJwtAuthConfig = {
    sharedSecret: string;
    issuer?: string;
    audience?: string;
};
export type AppClientAuthConfig = {
    provider: AppClientAuthProvider;
    http?: AppClientHttpAuthConfig;
    jwt?: AppClientJwtAuthConfig;
    autoBindRoleName?: string;
    propagateTokenToIntegrations?: boolean;
};
export type ResolvedAppClientAuthConfig = AppClientAuthConfig & {
    source: 'db' | 'env_fallback';
};
export type AppClientAuthTestResult = {
    ok: true;
    source: ResolvedAppClientAuthConfig['source'];
    profile: {
        employeeId?: string;
        email: string;
        username: string;
        active: boolean;
        nickName?: string;
        cnName?: string;
    };
};
