## ADDED Requirements

### 需求:破坏性 Admin API

创建/更新 Workflow 的 API 必须接受 `intent` 或 `preset`+`presetConfig`（Preset 展开为 Intent）。API 必须拒绝以旧原子图为真源的请求。列表/详情必须返回 `intent`；`ir` 可作为只读字段返回供排障。

#### 场景:Preset 产出 Intent

- **当** 使用场景 Preset 创建
- **那么** 服务端先得到 Intent，再编译 IR 保存；不得再走「Preset → 旧 nodes 真源」路径

#### 场景:详情含 Intent

- **当** GET Workflow 详情
- **那么** 必须包含 `intent`；若包含 `ir`/`nodes` 必须标注为只读编译产物
