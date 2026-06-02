/** 单个输出字段的裁剪与语义说明。 */
export type ToolResponseFieldSpec = {
  /** JSON 路径，如 id / list / data.items */
  path: string;
  /** 业务中文名，供 summarize 使用 */
  label: string;
  /** 字段详细说明，供 AI 理解语义 */
  description?: string;
  /** 用户问题命中这些词时追加该字段 */
  keywords?: string[];
  /** 枚举值 -> 展示文案 */
  enumLabels?: Record<string, string>;
};

/** Tool.responseProfile：工具响应裁剪配置（落库前经 tool-response-profile.spec.util 规范化与校验）。 */
export type ToolResponseProfile = {
  /** 无论用户问什么，都保留的字段 */
  coreFields: ToolResponseFieldSpec[];
  /** 按用户问题关键词动态追加的字段 */
  optionalFields?: ToolResponseFieldSpec[];
  /** 数组字段最大保留条数，key 为 listPath 末段或嵌套数组字段名（如 data、skus） */
  arrayLimits?: Record<string, number>;
  /**
   * 列表数据路径（相对响应根），如 data / list。
   * 设置后 core/optional 的 path 必须相对每个列表元素（写 id，不要写 data.id）。
   */
  listPath?: string;
  /** listPath 存在时，列表容器上的根级字段（如 total、page），不要放进 coreFields */
  listMetaFields?: ToolResponseFieldSpec[];
};

export type ProjectedToolOutput = {
  data: unknown;
  /** 本次选中字段 path -> label */
  fieldLabels: Record<string, string>;
  /** 选中字段 path -> description */
  fieldDescriptions: Record<string, string>;
  /** 选中字段 path -> enumLabels */
  enumLabelsByPath: Record<string, Record<string, string>>;
};
