import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';

/** C 端内置：历史 host_action 展示锚点；新总结流走 page_action phase=stream。 */
export const PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME =
  'page_action.show_result' as const;

export const PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH = 'text' as const;

export function buildPageActionBuiltinShowResultHostTool(): ResolvedPageActionHostTool {
  return {
    definition: {
      id: 0,
      name: PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME,
      description: 'Builtin PageAction result panel stream target',
      argsSchema: {
        type: 'object',
        properties: {
          [PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH]: { type: 'string' },
        },
      },
      hostPageScope: null,
      isRequired: false,
    },
    streamablePath: PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH,
    delivery: 'fill_stream',
    produceMode: 'prose_stream',
  };
}
