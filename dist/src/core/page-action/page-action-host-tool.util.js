"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionHostTool = exports.assertPageActionScopeMatch = exports.hostToolRowToDecisionDefinition = void 0;
const common_1 = require("@nestjs/common");
const host_bridge_1 = require("../host-bridge");
function hostToolRowToDecisionDefinition(row) {
    var _a, _b;
    const argsSchema = row.argsSchema &&
        typeof row.argsSchema === 'object' &&
        !Array.isArray(row.argsSchema)
        ? row.argsSchema
        : {};
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        argsSchema,
        hostPageScope: (_b = (_a = row.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
        isRequired: false,
    };
}
exports.hostToolRowToDecisionDefinition = hostToolRowToDecisionDefinition;
function assertPageActionScopeMatch(input) {
    var _a, _b, _c, _d;
    const ctxPage = (_b = (_a = input.pageContext) === null || _a === void 0 ? void 0 : _a.page) === null || _b === void 0 ? void 0 : _b.trim();
    const requiredScope = ((_c = input.pageScope) === null || _c === void 0 ? void 0 : _c.trim()) || ((_d = input.hostPageScope) === null || _d === void 0 ? void 0 : _d.trim());
    if (!requiredScope) {
        return;
    }
    if (!ctxPage) {
        throw new common_1.BadRequestException({
            code: 'INVALID_PAGE_CONTEXT',
            message: `pageContext.page is required for action scope "${requiredScope}"`,
        });
    }
    if (ctxPage !== requiredScope) {
        throw new common_1.BadRequestException({
            code: 'PAGE_SCOPE_MISMATCH',
            message: `pageContext.page "${ctxPage}" does not match required scope "${requiredScope}"`,
        });
    }
}
exports.assertPageActionScopeMatch = assertPageActionScopeMatch;
function resolvePageActionHostTool(hostTool, pageContext) {
    var _a, _b;
    if (!hostTool.isActive) {
        throw new common_1.NotFoundException({
            code: 'HOST_TOOL_INACTIVE',
            message: `HostTool "${hostTool.name}" is not active`,
        });
    }
    const definition = hostToolRowToDecisionDefinition(hostTool);
    const contract = (0, host_bridge_1.resolveHostToolDeliveryContract)(definition);
    const hostPageScope = (_b = (_a = hostTool.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null;
    if (!(0, host_bridge_1.canDispatchHostAction)({
        pageContext: pageContext !== null && pageContext !== void 0 ? pageContext : null,
        hostPageScopes: [hostPageScope],
    })) {
        throw new common_1.BadRequestException({
            code: 'HOST_ACTION_UNDISPATCHABLE',
            message: 'pageContext anchor is insufficient to dispatch host action',
        });
    }
    return {
        definition,
        streamablePath: contract.streamablePath,
        delivery: contract.delivery,
        produceMode: contract.produceMode,
    };
}
exports.resolvePageActionHostTool = resolvePageActionHostTool;
//# sourceMappingURL=page-action-host-tool.util.js.map