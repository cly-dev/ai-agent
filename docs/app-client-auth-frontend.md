# AppClient 外部鉴权配置 · B 端前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关模块：`AppClient.authConfig`、`POST /app-client/auth`（C 端）、管理端配置与测试接口

---

## 1. 总览

每个 **AppClient（租户/业务系统）** 可单独配置外部账号鉴权方式。C 端 SDK 调用 `POST /app-client/auth` 时：

1. 通过 `X-App-Dsn` 定位 AppClient
2. 用 `x-account-token` 按该 App 的 `authConfig` 调用外部账号服务校验
3. 校验通过后自动建档/复用 `User`，必要时创建 `UserApp` 绑定与 Integration token

```text
C 端 SDK
  X-App-Dsn + x-account-token
        │
        ▼
POST /app-client/auth          （无 /admin 前缀）
        │
        ├─► 读取 AppClient.authConfig
        │     └─ 为空 → 回退 APP_CLIENT_HOST 等环境变量
        │
        ├─► http_profile：请求外部 profile API
        │
        ├─► findOrCreateByExternalAccount
        ├─► ensureUserApp（autoBindRoleName）
        ├─► bindUserIntegrations（可选）
        └─► 返回本系统 accessToken + user
```

| 能力 | 说明 |
|------|------|
| 按 App 配置 | `authConfig` 存于 `AppClient` 表 JSON 字段 |
| 环境回退 | `authConfig` 为 `null` 时使用 `APP_CLIENT_HOST` + 默认 seller profile 路径 |
| 管理端 | `PATCH /admin/app-client/:id` 更新配置；`POST .../auth/test` 联调 |
| C 端鉴权 | 路由不变，仍 `POST /app-client/auth` |

**路由前缀**：管理端接口带 `/admin` 前缀；C 端 `POST /app-client/auth` **无** `/admin`。本地默认 `http://localhost:3030`。

---

## 2. 数据模型：`authConfig`

```ts
type AppClientAuthConfig = {
  provider: 'http_profile' | 'jwt_shared_secret';
  http?: {
    baseUrl: string;
    profilePath: string;
    method?: 'GET' | 'POST';
    tokenPlacement?:
      | 'authorization_bearer'
      | 'header_x_account_token'
      | 'query_token';
    mapping: {
      employeeId: string;
      email: string;
      username?: string;
      nickName?: string;
      cnName?: string;
      active?: string;
    };
    extraHeaders?: Record<string, string>;
  };
  jwt?: {
    sharedSecret: string;
    issuer?: string;
    audience?: string;
  };
  autoBindRoleName?: string;
  propagateTokenToIntegrations?: boolean;
};
```

### 2.1 `http_profile` 示例

```json
{
  "provider": "http_profile",
  "http": {
    "baseUrl": "https://admin.example.com",
    "profilePath": "/account/seller/account/current",
    "method": "GET",
    "tokenPlacement": "authorization_bearer",
    "mapping": {
      "employeeId": "employeeId",
      "email": "email",
      "username": "nickName",
      "nickName": "nickName",
      "cnName": "cnName",
      "active": "active"
    }
  },
  "autoBindRoleName": "operator",
  "propagateTokenToIntegrations": true
}
```

### 2.2 `jwt_shared_secret`

类型已预留，**当前后端未实现**；配置后测试/鉴权会返回 400。

---

## 3. 管理端 API

鉴权：`Authorization: Bearer <管理员 JWT>`。

### 3.1 更新 authConfig

```http
PATCH /admin/app-client/:id
```

| 场景 | body |
|------|------|
| 设置配置 | `"authConfig": { ... }` |
| 清空并回退环境变量 | `"authConfig": null` |

### 3.2 测试鉴权

```http
POST /admin/app-client/:id/auth/test
{ "accountToken": "<业务方 token>" }
```

成功返回解析后的 `profile` 与 `source`（`db` | `env_fallback`），不建档、不签发 JWT。

---

## 4. C 端鉴权（不变）

```http
POST /app-client/auth
X-App-Dsn: <dsn>
x-account-token: <业务 token>
```

---

## 5. 环境变量回退

| 变量 | 默认 |
|------|------|
| `APP_CLIENT_HOST` | 必填 |
| `APP_CLIENT_AUTH_PROFILE_PATH` | `/account/seller/account/current` |
| `APP_CLIENT_AUTO_BIND_ROLE` | `operator` |

---

## 6. 迁移

```bash
npx prisma migrate deploy
```

迁移：`20260617120000_app_client_auth_config`。
