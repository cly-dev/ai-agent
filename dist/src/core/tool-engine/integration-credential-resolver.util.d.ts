import type { PrismaService } from '../../prisma/prisma.service';
export declare function integrationCredentialCacheKey(userId: number, integrationId: number): string;
export declare function warmupIntegrationCredentials(input: {
    prisma: PrismaService;
    userId: number;
    integrationIds: number[];
}): Promise<Map<string, string>>;
