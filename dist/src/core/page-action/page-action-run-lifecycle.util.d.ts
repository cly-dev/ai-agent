import { PageActionRunStatus } from '../../../generated/prisma/client';
import type { PageActionSsePhase } from './page-action-inline-sse.util';
export declare function mapPageActionRunStatusToLifecyclePhase(status: PageActionRunStatus): PageActionSsePhase;
