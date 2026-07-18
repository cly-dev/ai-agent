# C 端 PageAction 流式对接规范（简版）

> 目标：C 端 SDK 能正确处理 PageAction SSE，不重复渲染、不漏执行 HostTool。

---

## 1. 先记住三句话

1. **没用 HostTool**：只看 `page_action.text`。
2. **用了 HostTool**：执行 `host_action.hostTools` 或 `tool.flush.args`。
3. **`dslOutcome: null` 不是失败**，只是表示本次没有 HostTool DSL。

---

## 2. SSE 事件类型

订阅：

```http
GET /page-action/runs/:runId/stream
Accept: text/event-stream
```

服务端会推三类事件：

| event | 前端用途 |
|------|----------|
| `page_action` | PageAction 生命周期、纯文本流 |
| `host_action` | HostTool 执行参数 |
| `page_workflow` | 节点进度，可选展示 |

前端 SDK 至少要监听：

```ts
on('page_action', handlePageAction);
on('host_action', handleHostAction);
```

`page_workflow` 只做进度展示，不参与正文拼接，也不执行 HostTool。

---

## 3. 没有 HostTool：用 `page_action.text`

纯总结节点、纯分析节点都走这条。

### 事件顺序

```text
page_action started
page_action stream      // 多次，text 是增量
page_action completed   // 一次，text 是最终全文
```

### 示例

```json
{
  "phase": "completed",
  "actionRunId": 250,
  "actionKey": "blog-article-edit.applyblogsummary",
  "generation": 250,
  "streamId": "pa-250-blog-article-edit.applyblogsummary",
  "text": "Discover the 4 mechanical causes...",
  "dslOutcome": null
}
```

### 前端规则

```ts
let text = '';

function handlePageAction(e: PageActionEvent) {
  switch (e.phase) {
    case 'started':
      text = '';
      break;

    case 'stream':
      text += e.text ?? '';
      render(text);
      break;

    case 'completed':
      // completed.text 是最终全文，不要再 append
      text = e.text ?? text;
      render(text);
      finish();
      break;

    case 'failed':
      showError(e.errorMessage || e.errorCode || '执行失败');
      break;
  }
}
```

### 注意

- `stream.text` 是增量，追加。
- `completed.text` 是最终全文，覆盖。
- `dslOutcome === null` 是正常结果。
- 不要等待 `host_action`。

---

## 4. 有 HostTool：用 `host_action`

如果 PageAction 需要写页面、填表、调用宿主工具，就会推 `host_action`。

### 当前主要形态：结构化输出

注册 HostTool（id > 0）都是结构化输出，典型事件：

```text
host_action tool.flush   // 带完整 args
host_action full         // 带完整 hostTools[]
page_action completed    // dslOutcome = dispatched
```

### 前端执行规则

收到 `tool.flush` 可以立即执行：

```ts
function handleHostAction(e: HostActionEvent) {
  if ('stream' in e && e.dsl?.op === 'tool.flush') {
    executeHostTool({
      name: e.dsl.name,
      args: e.dsl.args,
    });
    return;
  }

  // full 是最终快照，也要支持；用于补偿、迟订阅、重连恢复
  if ('stream' in e && e.stream.mode === 'full') {
    for (const tool of e.hostTools ?? []) {
      executeHostTool(tool);
    }
    return;
  }

  // 兼容老 batch 形态
  if (!('stream' in e)) {
    for (const tool of e.hostTools ?? []) {
      executeHostTool(tool);
    }
  }
}
```

### 幂等要求

`tool.flush` 和 `full` 可能表达同一份结果，前端必须去重。

推荐 key：

```ts
const key = `${generation}:${streamId}:${toolName}:${callId ?? 'full'}`;
```

同一个 key 只执行一次。

---

## 5. `page_action.completed` 怎么判断

| `dslOutcome` | 含义 | 前端动作 |
|-------------|------|----------|
| `null` | 没有 HostTool | 使用 `completed.text` |
| `dispatched` | HostTool 已派发 | 以 `host_action` 为准 |
| `failed` | HostTool 派发失败 | 展示失败，不执行工具 |
| `skipped` | 未派发 HostTool | 只展示外层状态 |

不要写成：

```ts
if (!dslOutcome) throw new Error('失败');
```

应该写成：

```ts
if (event.phase === 'completed') {
  if (event.dslOutcome === null) {
    render(event.text ?? '');
  } else if (event.dslOutcome === 'dispatched') {
    finishHostToolRun();
  } else if (event.dslOutcome === 'failed') {
    showError('HostTool 派发失败');
  }
}
```

---

## 6. 最小类型

```ts
type PageActionEvent = {
  phase: 'started' | 'stream' | 'completed' | 'failed' | 'awaiting_approval';
  actionRunId: number;
  actionKey: string;
  generation: number;
  streamId?: string | null;
  clientActionId?: string | null;
  text?: string;
  dslOutcome?: 'dispatched' | 'failed' | 'skipped' | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

type HostToolInvocation = {
  name: string;
  args: Record<string, unknown>;
};

type HostActionEvent =
  | {
      action: 'host_action';
      generation?: number;
      hostTools: HostToolInvocation[];
    }
  | {
      action: 'host_action';
      generation?: number;
      stream: {
        mode: 'begin' | 'delta' | 'commit' | 'end' | 'full';
        seq: number;
      };
      dsl?: {
        op:
          | 'session.begin'
          | 'tool.begin'
          | 'arg.append'
          | 'tool.flush'
          | 'tool.commit'
          | 'session.end';
        streamId?: string;
        callId?: string;
        name?: string;
        args?: Record<string, unknown>;
        path?: string;
        chunk?: string;
      };
      hostTools?: HostToolInvocation[];
    };
```

---

## 7. SDK 对齐清单

- [x] 监听 `page_action`
- [x] 监听 `host_action`
- [x] `page_action.stream.text` 追加（v2.2.6+ `consumePageActionRunStream` 增量追加并触发 `onChunk`）
- [x] `page_action.completed.text` 覆盖
- [x] `dslOutcome: null` 当正常纯文本结果
- [x] `host_action.tool.flush` 可执行 HostTool
- [x] `host_action.full.hostTools` 必须支持（stream reducer 幂等处理）
- [x] HostTool 执行要幂等去重（`generation:streamId:toolName:callId` key 去重）
- [x] `page_workflow` 只展示进度，不拼正文、不执行工具（SDK 直接忽略该事件类型）

---

## 8. 服务端代码对应

- `src/core/page-action/page-action-inline-sse.util.ts`
- `src/core/host-bridge/host-tool-stream.types.ts`
- `src/core/host-bridge/host-tool-delivery-contract.util.ts`

