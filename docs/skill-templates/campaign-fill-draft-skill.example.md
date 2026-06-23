# Campaign 文案填框 Skill · 模板样例

> B 端对接总览：[skill-admin-frontend.md](../skill-admin-frontend.md)  
> Host Tool 配置：[host-tool-admin-frontend.md](../host-tool-admin-frontend.md)

适用：用户要求「根据当前 campaign 生成文案，并填入页面输入框（先不提交）」。

---

## 1. 与其它 Skill 的分工

| 维度 | 本 Skill | 评论分析 / 回复 |
|------|----------|-----------------|
| capabilityKey | `campaign.fill-draft` | `review-analyze` / `review-reply` |
| 用户意图 | 生成营销文案 + **页面填框** | 评论数据 / HTTP 回复 |
| HTTP Tool | 通常 **不需要** | 列表 / 详情 / 写接口 |
| Host Tool | **fillNoteDraft**（`exposure=LLM`） | 可选 completion 刷新 |
| deliverable | `answer` | `analysis` / `mutation` |
| riskLevel | `L1` | L1 / L2+ |
| 关键配置 | **`config.workflow` 含 host_tool 步** | 规则模板或 mutation workflow |

---

## 2. 前置条件（Agent 级）

在创建 Skill 之前，在同一 Agent 下完成：

1. C 端 `registerHostTool('fillNoteDraft', handler)` 或 B 端创建 HostTool。
2. **`POST /admin/agent/:agentId/app-client/:appClientId/host-tools`** 绑定 `fillNoteDraft`。
3. HostTool 字段：
   - `exposure`: `LLM` 或 `BOTH`
   - `hostPage.scope`: 与 campaign 页一致（如 `campaign-detail`）
   - `argsSchema`: `{ "type": "object", "properties": { "text": { "type": "string" } }, "required": ["text"] }`

---

## 3. 创建 Skill

**`POST /admin/agent/:agentId/app-client/:appClientId/skills`**

```json
{
  "name": "Campaign 文案填框",
  "capabilityKey": "campaign.fill-draft",
  "description": "根据当前 campaign 页面上下文生成营销文案，并通过 fillNoteDraft 填入页面输入框；不提交表单。适用：生成文案、填入输入框、先预览再提交；不适用：评论分析、HTTP 提交 campaign。",
  "riskLevel": "L1",
  "isActive": true,
  "prompt": "你是 campaign 营销文案助手。仅在用户需要为当前 campaign 生成文案并填入页面输入框（不提交）时遵循本技能。\n\n## 目标\n1. 根据 pageContext 与 user 意图生成完整营销文案（标题、卖点、行动号召等）。\n2. 文案生成后，由 Plan 的 host_tool 步调用 fillNoteDraft 写入页面；**禁止**在 summarize 中声称已填框，除非 host_tool 步已执行。\n3. 用户未要求提交时，不得调用任何 HTTP 写接口。\n\n## 工具纪律\n- 本技能主要依赖 Host Tool fillNoteDraft；HTTP 工具通常不需要。\n- 填框参数 text 必须来自上一步生成的文案正文。\n- 若 pageContext.page 缺失或与工具 scope 不一致，说明无法填框并提示用户检查页面上下文。",
  "config": {
    "deliverable": "answer",
    "workflow": {
      "steps": [
        {
          "id": "generate_content",
          "phase": "answer",
          "kind": "summarize",
          "objective": "Generate campaign marketing copy from page context and user intent. Output the full text only; do NOT claim the UI input was updated.",
          "stopWhen": "always"
        },
        {
          "id": "fill_input",
          "phase": "answer",
          "kind": "host_tool",
          "hostToolNames": ["fillNoteDraft"],
          "objective": "Call fillNoteDraft with the generated copy as the text argument. Fill the page input; do not submit the form.",
          "stopWhen": "always"
        }
      ]
    }
  }
}
```

> 创建时可不带 `tools`（无 HTTP 依赖）。若仍需只读 HTTP 拉 campaign 元数据，在创建后 `PUT /skill/:id/tools` 绑定 read 类 Tool，并在 workflow 最前增加 `kind=tool` gather 步。

---

## 4. 绑定 Host Tool

**`PUT /admin/skill/:skillId/host-tools`**

```json
{
  "tools": [
    {
      "hostToolId": 12,
      "trigger": "ON_PLAN_STEP",
      "priority": 0,
      "isRequired": true
    }
  ]
}
```

| 项 | 说明 |
|----|------|
| `trigger` | 必须 `ON_PLAN_STEP` 或 `LLM_SCOPED` |
| `isRequired` | 建议 `true`：LLM 未调 fillNoteDraft 则不推进 plan |
| `hostToolId` | 替换为环境中 `fillNoteDraft` 的 ID |

---

## 5. C 端发消息

```json
{
  "input": "请根据当前 campaign 生成一段文案，并填入页面上的输入框（先不要提交）。",
  "skillId": 8,
  "pageContext": {
    "page": "campaign-detail",
    "entity": {
      "type": "campaign",
      "id": "cmp_123"
    }
  }
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `skillId` | **强烈建议** | 固定 workflow，避免 Plan LLM 只 summarize |
| `pageContext.page` | **是** | 与 HostTool `pageScope` 一致 |

---

## 6. 预期 Run 轨迹

```text
intent → plan（hostToolRunStatus: "planned", plannedHostToolStepIds: ["fill_input"]）
      → readiness → summarize(generate_content)
      → llm(host_tool) → host_tool（status: dispatched, sseDispatched: true）
      → …
```

**失败对照：**

| plan.hostToolRunStatus | 原因 |
|------------------------|------|
| `available_not_planned` | 未传 `skillId` 且无 workflow → 需按本文配置 |
| `none` | 未绑 AgentHostTool 或 `page` 不匹配 |

---

## 7. 更新已有 Skill

仅改 workflow / prompt：

```http
PATCH /admin/skill/:skillId
Content-Type: application/json

{
  "config": { /* §3 config */ },
  "prompt": "…"
}
```

仅改 Host Tool 绑定：用 §4 的 PUT。

---

## 8. B 端验收清单

- [ ] Agent 已绑 `fillNoteDraft`（AgentHostTool）
- [ ] Skill `config.workflow` 含 `summarize` → `host_tool` 两步
- [ ] SkillHostTool：`ON_PLAN_STEP` + `isRequired: true`
- [ ] C 端 register + handler 写入输入框
- [ ] 发消息带 `skillId` + `pageContext.page`
- [ ] Run 中出现 `type: host_tool`, `status: dispatched`
- [ ] 未出现 dispatched 时，UI **不**展示「已填入输入框」
