# Skill 两阶段召回（Solo → Contextual）

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关代码：`src/core/skill/skill-recall.service.ts`、`skill-recall-session.util.ts`

---

## 1. 背景

多轮对话常见路径：

| 轮次 | 用户意图 | Skill 期望 |
|------|----------|------------|
| 1 | 获取评论数据 | **不命中**（纯读取） |
| 2 | 对上面的数据分析/回复 | **命中** 分析/回复 skill |
| 3 | 再查另一条评论 | **不命中** 分析 skill（新任务） |

若始终把 GOA 会话上下文拼进召回 query，skill 会在多轮中**粘连**。本方案采用 **Solo 优先 + 条件性 Contextual 补救**。

---

## 2. 流程

```text
用户消息
    │
    ▼
Stage A: Solo 召回（query = 仅本轮 userMessage）
    │
    ├─ 命中（score ≥ 阈值 且 gap OK）──► 绑定 skill，recallPhase=solo
    │
    └─ miss
         │
         ▼
    Context Gate（结构信号，无硬编码词表、不按字数）
         ├─ 上下文开关关闭 ──────────────► miss
         ├─ 无 prior episode ─────────────► miss
         └─ 通过
              │
              ▼
         Topic Gate：embed(本轮) vs embed(上轮 goal)
              ├─ 相似度 < TOPIC_MIN_SIM ──► miss（新话题）
              └─ 通过
                   │
                   ▼
              Stage B: Contextual 召回
              query = 本轮 + Prior turn goal + deliverable（可选）
                   │
                   ├─ miss ─────────────────► miss
                   ├─ hit 但 lift < MIN_LIFT ─► miss（防粘连）
                   └─ hit 且 lift OK ────────► 绑定 skill，recallPhase=contextual
```

Stage A / B 各自走 **L0 router → L1 prompt_excerpt**（与既有渐进召回一致）。

---

## 3. Contextual query 拼什么

**拼：**

- 本轮 `userMessage`
- `Prior turn goal`（最近 1 轮 `recentEpisodes[].goal`）
- `Session deliverable`（`activeTask.plan.deliverable`，若有）

**不拼：**

- 多轮 episode 堆叠（由 `EPISODE_TAIL` 控制，默认 1）
- `outcome` 全文
- observation JSON
- `originalUserRequest` 长文

---

## 4. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `SKILL_RECALL_SESSION_CONTEXT` | `1` | `0` 关闭 Stage B，仅 solo |
| `SKILL_RECALL_CONTEXT_MODE` | `two_stage` | `always` 为遗留全量拼上下文 |
| `SKILL_RECALL_CONTEXT_EPISODE_TAIL` | `1` | GOA 取最近 N 轮 goal |
| `SKILL_RECALL_CONTEXT_MIN_LIFT` | `0.06` | B 命中需 `contextual_top - solo_top ≥` 此值 |
| `SKILL_RECALL_CONTEXT_TOPIC_MIN_SIM` | `0.35` | 与上轮 goal 向量相似度下限 |
| `SKILL_RECALL_QUERY_MAX_CHARS` | `1200` | contextual query 截断 |
| `SKILL_VECTOR_MIN_SCORE` | — | Solo / Contextual 共用向量阈值 |
| `SKILL_RECALL_MIN_GAP` | `0.08` | 多 skill 时 Top-1 领先分差 |
| `SKILL_VECTOR_NAME_BOOST` | `0.15` | 标题加分（仅 `titleQuery`=本轮短句） |

---

## 5. Run step 可观测字段

`step.type = skill` 的 `output` 含：

| 字段 | 说明 |
|------|------|
| `recallPhase` | `solo` \| `contextual` |
| `soloTopScore` | Stage A Top-1 分数 |
| `contextualTopScore` | Stage B Top-1 分数（未跑 B 时为 null） |
| `contextLift` | `contextualTop - soloTop` |
| `contextGateReason` | 见下表 |
| `sessionContextUsed` | 仅 contextual 真正参与命中时为 `true` |
| `recallQuery` | 最终阶段使用的 query（截断展示） |

### contextGateReason

| 值 | 含义 |
|----|------|
| `solo_hit` | Stage A 已命中 |
| `context_disabled` | `SKILL_RECALL_SESSION_CONTEXT=0` 或 query 被 skip |
| `no_prior_episode` | 无上一轮 episode |
| `new_topic` | 与上轮 goal 相似度不足 |
| `lift_insufficient` | B 过线但 lift 不够 |
| `contextual_miss` | B 未过阈值 / gap 不足 |
| `contextual_hit` | B 命中且 lift 够 |

---

## 6. 典型场景预期

### 获取数据（轮 1）

```
solo: "帮我获取评论43505的数据" → 低分 miss
gate: no_prior_episode（首轮尚无 episode）
→ 不绑 skill ✓
```

### 分析上文（轮 2）

```
solo: "帮我对上面的数据分析" → 低分 miss
gate: solo miss + 有 episode → 通过
topic: 与「获取评论43505」相似 → 通过
contextual: query 含 prior goal → 分析 skill 命中，lift ≥ 0.06 ✓
```

### 新查询（轮 3）

```
solo: "再查评论12345" → 可能低分
gate: solo miss + 有 episode → 通过
topic: 与上轮 goal 相似度可能仍 ≥ 0.35（都含「评论」）→ 存在误触发 B 的风险
若 topic 通过且 lift 够 → 可能误绑分析 skill（边界 case，可调高 TOPIC_MIN_SIM）
若 topic 不足 → new_topic，不绑 skill ✓
```

---

## 7. 与标题加分的关系

- `SKILL_VECTOR_NAME_BOOST` / `SKILL_NAME_KEYWORD_WEIGHT` 仅作用于 **`titleQuery`（本轮 userMessage）**。
- Contextual 长 query 不做标题加分，避免历史文本污染标题匹配。

---

## 8. 调参建议

1. **follow-up 仍 miss**：略降 `SKILL_VECTOR_MIN_SCORE` 或 `MIN_LIFT`（如 `0.05`）。
2. **仍粘连**：提高 `MIN_LIFT`（如 `0.08`）或 `TOPIC_MIN_SIM`（如 `0.40`）。
3. **description 互斥**：分析/回复 skill 的 `description` 写清边界（见 skill 模板文档）。

---

## 9. 相关文档

- [skill-data-model.md](./skill-data-model.md) — Skill 数据模型与运行时总览
- [plan-node.md](./plan-node.md) — Plan 节点（skill 未命中时的通用路径）
