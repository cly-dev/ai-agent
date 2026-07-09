# B 端删除接口对接（PageAction / Workflow）

> **受众**：B 端管理台前端、BFF、联调同学。  
> **目标**：对接 `PageAction` 与 `Workflow` 删除接口，并正确处理权限与错误返回。

---

## 1. 接口总览

| 资源 | 方法 | 路径 | 说明 |
|------|------|------|------|
| PageAction | `DELETE` | `/admin/page-action/:id` | 删除指定 PageAction |
| Workflow | `DELETE` | `/admin/workflow/:id` | 删除指定 Workflow |

成功响应：

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "ok": true,
    "id": 123
  }
}
```

---

## 2. 鉴权与权限

删除接口要求：

1. `Authorization: Bearer <admin_jwt>`（B 端 admin-user JWT）
2. 命中 `/admin/*` 路由，走全局 `AdminPrefixJwtGuard + AdminRoleGuard`
3. 删除接口要求 `AdminRoles(OPERATOR)`（即仅 `OPERATOR/SUPER_ADMIN` 可删）

> 说明：这两个接口属于 B 端 admin 域，不走 C 端 `UserJwtAuthGuard`，因此不需要 `x-app-dsn`。

---

## 3. 请求示例

### 3.1 删除 PageAction

```bash
curl -X DELETE "https://<host>/admin/page-action/101" \
  -H "Authorization: Bearer <admin_jwt>"
```

### 3.2 删除 Workflow

```bash
curl -X DELETE "https://<host>/admin/workflow/88" \
  -H "Authorization: Bearer <admin_jwt>"
```

---

## 4. 失败场景与前端处理建议

| 场景 | HTTP | 特征 | 建议文案 |
|------|------|------|----------|
| 未登录或 token 无效 | `401` | `invalid user token` 等 | 请重新登录 |
| admin 角色不足（VIEWER） | `403` | `insufficient admin permissions` | 权限不足，请联系管理员（需 OPERATOR/SUPER_ADMIN） |
| 资源不存在 | `404` | `PageAction xxx not found` / `Workflow xxx not found` | 资源不存在或已被删除 |
| 删除受引用/约束影响 | `409/400` | 业务约束错误（如外键/引用） | 请先解除关联后再删除 |

前端建议：

- 删除按钮点击后走二次确认弹窗。
- 403 显示“无权限”，不重试。
- 404 视为幂等成功（列表里移除该行）。
- 409/400 展示服务端 message，并引导先清理关联。

---

## 5. 前端最小对接代码（TypeScript）

```ts
type DeleteResult = { ok: true; id: number };

async function removePageAction(id: number): Promise<DeleteResult> {
  const res = await api.delete(`/page-action/${id}`); // baseUrl 已含 /admin
  return res.data;
}

async function removeWorkflow(id: number): Promise<DeleteResult> {
  const res = await api.delete(`/workflow/${id}`); // baseUrl 已含 /admin
  return res.data;
}
```

> 这两个删除接口只需要 `Authorization`（admin JWT），无需 `x-app-dsn`。

---

## 6. 联调检查清单

- [ ] 删除请求走 `/admin` 前缀
- [ ] Header 带 `Authorization`（admin JWT）
- [ ] admin 账号角色为 `OPERATOR` 或 `SUPER_ADMIN`
- [ ] UI 对 403/404/409 分别有提示
- [ ] 删除成功后列表即时移除并刷新分页计数

---

## 7. 备注

- 本文档只覆盖 B 端删除接口，不涉及 C 端 `invoke` 及 SSE。
- 若后续角色模型新增（例如 `editor`），删除权限以服务端实际等级映射为准。
