import type { PageActionRunStatus } from '../../../generated/prisma/client';

/** C 端任务中心 / B 端运行记录共用的对外状态枚举。 */
export type PageActionTaskStatus =
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export function mapPageActionRunStatusToTaskStatus(
  status: PageActionRunStatus,
): PageActionTaskStatus {
  switch (status) {
    case 'running':
      return 'running';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'failed';
  }
}

export function resolvePageActionRunOutcome(input: {
  status: PageActionRunStatus;
  errorCode?: string | null;
}): {
  taskStatus: PageActionTaskStatus;
  /** 仅当 run 终态 completed 且无 errorCode 时为 true；审批通过不等于成功。 */
  succeeded: boolean;
} {
  const taskStatus = mapPageActionRunStatusToTaskStatus(input.status);
  return {
    taskStatus,
    succeeded: input.status === 'completed' && !input.errorCode?.trim(),
  };
}
