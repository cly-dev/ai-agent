import type { Prisma } from '../../../generated/prisma/client';
export declare const INTEGRATION_DETAIL_INCLUDE: {
    _count: {
        select: {
            tools: true;
        };
    };
};
export type IntegrationDetailRow = Prisma.IntegrationGetPayload<{
    include: typeof INTEGRATION_DETAIL_INCLUDE;
}>;
export type IntegrationResponse = Omit<IntegrationDetailRow, 'apiKey'> & {
    systemConfigured: boolean;
    toolCount: number;
};
export type IntegrationConnectionTestResult = {
    reachable: boolean;
    url: string;
    method: 'GET' | 'HEAD';
    statusCode?: number;
    statusText?: string;
    durationMs: number;
    error?: string;
};
