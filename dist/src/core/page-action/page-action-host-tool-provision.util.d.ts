import { type PrismaClient } from '../../../generated/prisma/client';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';
export type PageActionHostToolInlineSpec = {
    name?: string | null;
    description?: string | null;
    fillField?: 'text' | 'content' | 'value' | null;
};
export declare function derivePageActionHostToolName(actionKey: string): string;
export declare function buildDefaultFillArgsSchema(fillField?: string): Record<string, unknown>;
export declare function resolveOrProvisionPageActionHostTool(prisma: PrismaClient, input: {
    appClientId: number;
    actionKey: string;
    pageActionName: string;
    pageActionDescription?: string | null;
    pageScope?: string | null;
    hostToolId?: number | null;
    hostTool?: PageActionHostToolInlineSpec | null;
}): Promise<HostToolDetailRow>;
