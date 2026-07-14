import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import { type ResolvedPageActionHostTool } from './page-action-host-tool.util';
export type ResolvedPageActionSummarizeHostTool = {
    hostTool: ResolvedPageActionHostTool;
    builtin: boolean;
};
export declare function resolvePageActionSummarizeHostTool(prisma: PrismaService, input: {
    appClientId: number;
    nodeHostToolId?: unknown;
    pageContext: AgentChatPageContext | null | undefined;
    fallbackHostTool?: ResolvedPageActionHostTool | null;
}): Promise<ResolvedPageActionSummarizeHostTool>;
export declare function isPageActionBuiltinShowResultTool(hostTool: ResolvedPageActionHostTool): boolean;
