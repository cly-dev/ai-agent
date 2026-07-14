import type { Prisma } from '../../../generated/prisma/client';
export declare const AGENT_TOOL_CATALOG_INCLUDE: {
    integration: {
        select: {
            id: true;
            name: true;
            baseUrl: true;
            authMode: true;
            apiKey: true;
            updatedAt: true;
        };
    };
};
export type AgentToolCatalogRow = Prisma.ToolGetPayload<{
    include: typeof AGENT_TOOL_CATALOG_INCLUDE;
}>;
