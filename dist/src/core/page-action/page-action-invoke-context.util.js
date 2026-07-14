"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionInvokePageContext = void 0;
const host_bridge_1 = require("../host-bridge");
function resolvePageActionInvokePageContext(input) {
    const pageContext = input.pageContext;
    return (0, host_bridge_1.coalescePageContext)((0, host_bridge_1.parsePageContextFromMessageFields)({
        pageContext,
        page: pageContext === null || pageContext === void 0 ? void 0 : pageContext.page,
        routePath: pageContext === null || pageContext === void 0 ? void 0 : pageContext.routePath,
        routeParams: pageContext === null || pageContext === void 0 ? void 0 : pageContext.routeParams,
        flowId: pageContext === null || pageContext === void 0 ? void 0 : pageContext.flowId,
        programName: pageContext === null || pageContext === void 0 ? void 0 : pageContext.programName,
        entity: pageContext === null || pageContext === void 0 ? void 0 : pageContext.entity,
        metadata: pageContext === null || pageContext === void 0 ? void 0 : pageContext.metadata,
    }));
}
exports.resolvePageActionInvokePageContext = resolvePageActionInvokePageContext;
//# sourceMappingURL=page-action-invoke-context.util.js.map