import type { PrismaService } from '../../prisma/prisma.service';
import type { DraftReviewWriteToolLike } from './draft-review.types';

export type WriteToolPolicyRow = DraftReviewWriteToolLike & { id: number };

export async function loadWriteToolsForPolicy(
  prisma: PrismaService,
  toolIds: number[],
): Promise<Map<number, WriteToolPolicyRow>> {
  const uniqueIds = [...new Set(toolIds.filter((id) => id > 0))];
  if (uniqueIds.length === 0) {
    return new Map();
  }
  const rows = await prisma.tool.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      name: true,
      inputSchema: true,
      schema: true,
      agentMetadata: true,
    },
  });
  return new Map(rows.map((row) => [row.id, row]));
}
