## ADDED Requirements

### 需求:策略键驱动编译

系统必须按 `profile`、已用 operations、evidence/confirm 等策略键选择编译路径，而不仅是 1:1 节点模板映射。

#### 场景:无图不插入识图 IR

- **当** Intent 的 read 未启用 `evidence.images`
- **那么** 编译结果禁止包含 `summarize_images`

#### 场景:page_action 禁止 mutate IR

- **当** profile 为 `page_action` 且 Intent 含 `mutate`
- **那么** 校验必须失败（保存前）
