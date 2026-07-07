import { PageActionRunStatus } from '../../../generated/prisma/client';
import type { PageActionSsePhase } from './page-action-inline-sse.util';

export function mapPageActionRunStatusToLifecyclePhase(
  status: PageActionRunStatus,
): PageActionSsePhase {
  switch (status) {
    case PageActionRunStatus.awaiting_approval:
      return 'awaiting_approval';
    case PageActionRunStatus.failed:
      return 'failed';
    case PageActionRunStatus.completed:
      return 'completed';
    default:
      return 'started';
  }
}
