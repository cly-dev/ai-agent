import type { PrismaService } from '../../prisma/prisma.service';

export function integrationCredentialCacheKey(
  userId: number,
  integrationId: number,
): string {
  return `${userId}:${integrationId}`;
}

export async function warmupIntegrationCredentials(input: {
  prisma: PrismaService;
  userId: number;
  integrationIds: number[];
}): Promise<Map<string, string>> {
  const integrationCredentialCache = new Map<string, string>();
  const integrationIds = [...new Set(input.integrationIds)];
  if (integrationIds.length === 0) {
    return integrationCredentialCache;
  }

  const userIntegrations = await input.prisma.userIntegration.findMany({
    where: {
      userId: input.userId,
      integrationId: { in: integrationIds },
      isActive: true,
    },
    select: {
      integrationId: true,
      userApiKey: true,
    },
  });
  for (const row of userIntegrations) {
    integrationCredentialCache.set(
      integrationCredentialCacheKey(input.userId, row.integrationId),
      row.userApiKey?.trim() ?? '',
    );
  }
  return integrationCredentialCache;
}
