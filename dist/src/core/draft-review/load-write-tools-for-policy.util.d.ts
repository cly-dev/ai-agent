import type { PrismaService } from '../../prisma/prisma.service';
import type { DraftReviewWriteToolLike } from './draft-review.types';
export type WriteToolPolicyRow = DraftReviewWriteToolLike & {
    id: number;
};
export declare function loadWriteToolsForPolicy(prisma: PrismaService, toolIds: number[]): Promise<Map<number, WriteToolPolicyRow>>;
