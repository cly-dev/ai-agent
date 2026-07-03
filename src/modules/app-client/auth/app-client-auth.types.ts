export type AppClientAuthProvider = 'http_profile' | 'jwt_shared_secret';

export type AppClientTokenPlacement =
  | 'authorization_bearer'
  | 'header_x_account_token'
  | 'query_token';

export type AppClientProfileFieldMapping = {
  /** 各字段均为可选点路径；未配置或响应无该字段时由服务端按 token 合成身份。 */
  employeeId?: string;
  email?: string;
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
  /**
   * 响应体根路径（点路径）。配置后 mapping 各字段相对此节点解析。
   * 例：本服务 `/admin/*` 经 ReqInterceptor 包装为 `{ data: {...} }` → `"data"`。
   */
  responseRoot?: string;
  /** 可选；不配或为空时仅以 HTTP 2xx 认定 token 有效，身份由 token 合成。 */
  mapping?: AppClientProfileFieldMapping;
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
