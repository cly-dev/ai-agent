import {
  coalescePageContext,
  parsePageContextFromMessageFields,
  type AgentChatPageContext,
} from '../host-bridge';

/** C 端 invoke 请求中的 pageContext 字段归一化（与 Chat prepare 协议一致）。 */
export function resolvePageActionInvokePageContext(input: {
  pageContext?: AgentChatPageContext | null;
}): AgentChatPageContext | null {
  const pageContext = input.pageContext;
  return coalescePageContext(
    parsePageContextFromMessageFields({
      pageContext,
      page: pageContext?.page,
      routePath: pageContext?.routePath,
      routeParams: pageContext?.routeParams,
      flowId: pageContext?.flowId,
      programName: pageContext?.programName,
      entity: pageContext?.entity,
      metadata: pageContext?.metadata,
    }),
  );
}
