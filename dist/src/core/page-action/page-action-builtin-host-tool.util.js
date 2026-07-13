"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageActionBuiltinShowResultHostTool = exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH = exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME = void 0;
exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME = 'page_action.show_result';
exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH = 'text';
function buildPageActionBuiltinShowResultHostTool() {
    return {
        definition: {
            id: 0,
            name: exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME,
            description: 'Builtin PageAction result panel stream target',
            argsSchema: {
                type: 'object',
                properties: {
                    [exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH]: { type: 'string' },
                },
            },
            hostPageScope: null,
            isRequired: false,
        },
        streamablePath: exports.PAGE_ACTION_BUILTIN_SHOW_RESULT_TEXT_PATH,
    };
}
exports.buildPageActionBuiltinShowResultHostTool = buildPageActionBuiltinShowResultHostTool;
//# sourceMappingURL=page-action-builtin-host-tool.util.js.map