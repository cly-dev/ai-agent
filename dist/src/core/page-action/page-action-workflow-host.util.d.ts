import type { PrismaService } from '../../prisma/prisma.service';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';
import type { PageActionDetailRow } from '../../modules/page-action/page-action.types';
import { type ResolvedPageActionHostTool } from './page-action-host-tool.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
export declare function resolvePageActionHostToolRow(prisma: PrismaService, pageAction: PageActionDetailRow): Promise<HostToolDetailRow | null>;
export declare function resolvePageActionHostToolResolved(prisma: PrismaService, pageAction: PageActionDetailRow, pageContext: AgentChatPageContext | null | undefined): Promise<ResolvedPageActionHostTool | null>;
export declare function resolvePageActionHostToolForPushNode(prisma: PrismaService, input: {
    appClientId: number;
    hostToolId: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
}): Promise<ResolvedPageActionHostTool>;
