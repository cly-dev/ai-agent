## 新增需求

### 需求:omnix-page 必须承载 PageAction 与 PageAgent 对外 API

`omnix-page` 必须监听 `:3040`，必须提供 `/page-action/**` 与 `/page-agent/compatible-mode/v1/**` 路由，且不得使用 globalPrefix `/admin`。

#### 场景:PageAgent LLM Proxy

- **当** C 端 SDK 请求 `POST /page-agent/compatible-mode/v1/chat/completions` 并携带 User JWT 与 `X-App-Dsn`
- **那么** page 服务必须校验鉴权、从 DB 或缓存读取 `LlmModelConfig(kind=chat)` 并代理至上游 LLM，且禁止向前端暴露 provider API key

#### 场景:PageAction Invoke

- **当** 宿主调用 `POST /page-action/invoke`
- **那么** page 服务必须校验权限并触发 page workflow；若需长时间执行或审批挂起，必须通过 BullMQ 或 `ApprovalRequest` 与 worker/runtime 协作，而非阻塞 HTTP 直至完成

### 需求:omnix-page 必须独立部署

page 必须拥有独立 Git 仓库、Docker 镜像与 Gateway 路由条目，且必须可在不影响 chat/runtime 的情况下独立发版。

#### 场景:PageAgent 代理超时配置变更

- **当** 仅修改 page 服务的 `PAGE_AGENT_PROXY_TIMEOUT_MS` 并重新部署 page
- **那么** runtime 与 worker 服务不得需要同步重启
