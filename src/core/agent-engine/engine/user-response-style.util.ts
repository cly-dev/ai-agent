/** 识别用户是否要「全量 / 详细」回答（影响 summarize 与输出格式）。 */

const FULL_DETAIL_HINTS = [
  '全部',
  '全量',
  '完整',
  '详细',
  '详情',
  '所有字段',
  '全部字段',
  '每一项',
  '不要省略',
  '别省略',
  '信息要全',
  '尽量全',
  'full detail',
  'all fields',
  'complete info',
];

export function isUserRequestingFullDetail(userMessage: string): boolean {
  const text = userMessage.trim().toLowerCase();
  if (!text) {
    return false;
  }
  return FULL_DETAIL_HINTS.some((hint) => text.includes(hint.toLowerCase()));
}

const WRITE_OPERATION_HINTS = [
  '修改',
  '更新',
  '创建',
  '新增',
  '删除',
  '批量',
  '上架',
  '下架',
  '回滚',
  '提交',
  '保存',
  '启用',
  '禁用',
  'set',
  'update',
  'create',
  'delete',
  'rollback',
  'post',
  'put',
  'patch',
];

const READ_OPERATION_HINTS = [
  '查',
  '查询',
  '详情',
  '信息',
  '库存',
  '状态',
  '多少',
  '是什么',
  '列表',
  'get',
  'detail',
  'status',
  'inventory',
  'search',
  'find',
];

/** 写操作类用户意图（用于 ACTION summarize 模板）。 */
export function isLikelyWriteOperation(userMessage: string): boolean {
  const text = userMessage.trim().toLowerCase();
  if (!text) {
    return false;
  }
  return WRITE_OPERATION_HINTS.some((hint) => text.includes(hint));
}

/** 查数 / 只读类用户意图（用于 READ summarize 模板）。 */
export function isLikelyReadOnlyQuestion(userMessage: string): boolean {
  const text = userMessage.trim().toLowerCase();
  if (!text) {
    return false;
  }
  if (isLikelyWriteOperation(userMessage)) {
    return false;
  }
  return READ_OPERATION_HINTS.some((hint) => text.includes(hint));
}

export type SummarizeScenario = 'read' | 'action';

/** 选择 summarize 场景：写操作优先，否则查数。 */
export function classifySummarizeScenario(userMessage: string): SummarizeScenario {
  if (isLikelyWriteOperation(userMessage)) {
    return 'action';
  }
  return 'read';
}

