"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwaggerImportResponseProfile = exports.inferDecisionRoleFromHttpMethod = exports.deriveDecisionRoleFromAgentMetadata = exports.parseConfiguredToolDecisionRole = exports.TOOL_DECISION_ROLE_META = exports.TOOL_DECISION_ROLES = exports.CONFIGURED_TOOL_DECISION_ROLES = exports.ToolDecisionRoleEnum = void 0;
exports.ToolDecisionRoleEnum = {
    ReadDetail: 'read-detail',
    ReadList: 'read-list',
    ReadStats: 'read-stats',
    WriteBatch: 'write-batch',
    WriteSingle: 'write-single',
    WriteMeta: 'write-meta',
    Admin: 'admin',
};
exports.CONFIGURED_TOOL_DECISION_ROLES = [
    exports.ToolDecisionRoleEnum.ReadDetail,
    exports.ToolDecisionRoleEnum.ReadList,
    exports.ToolDecisionRoleEnum.ReadStats,
    exports.ToolDecisionRoleEnum.WriteBatch,
    exports.ToolDecisionRoleEnum.WriteSingle,
    exports.ToolDecisionRoleEnum.WriteMeta,
    exports.ToolDecisionRoleEnum.Admin,
];
exports.TOOL_DECISION_ROLES = [
    ...exports.CONFIGURED_TOOL_DECISION_ROLES,
    'unknown',
];
exports.TOOL_DECISION_ROLE_META = [
    {
        value: exports.ToolDecisionRoleEnum.ReadDetail,
        label: '单条读取',
        description: '按 id 等获取单实体详情（GET 默认）',
        defaultHttpMethods: ['GET'],
    },
    {
        value: exports.ToolDecisionRoleEnum.ReadList,
        label: '列表/条件查询',
        description: '多实体、分页、条件检索（需手工覆盖 GET 默认时）',
        defaultHttpMethods: [],
    },
    {
        value: exports.ToolDecisionRoleEnum.ReadStats,
        label: '统计/计数',
        description: '聚合、数量统计，非完整记录',
        defaultHttpMethods: [],
    },
    {
        value: exports.ToolDecisionRoleEnum.WriteBatch,
        label: '批量写入',
        description: '批量改价、库存、状态等（PUT 默认）',
        defaultHttpMethods: ['PUT'],
    },
    {
        value: exports.ToolDecisionRoleEnum.WriteSingle,
        label: '单条新增/更新',
        description: '创建或更新单实体（POST 默认；PATCH/DELETE 亦映射到此）',
        defaultHttpMethods: ['POST', 'PATCH', 'DELETE'],
    },
    {
        value: exports.ToolDecisionRoleEnum.WriteMeta,
        label: '附属元数据',
        description: '关联、备注、集合等侧属性，非核心读详情',
        defaultHttpMethods: [],
    },
    {
        value: exports.ToolDecisionRoleEnum.Admin,
        label: '运维/缓存',
        description: '清缓存、测试数据等，非用户业务答复',
        defaultHttpMethods: [],
    },
];
function parseConfiguredToolDecisionRole(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    return exports.CONFIGURED_TOOL_DECISION_ROLES.includes(value)
        ? value
        : undefined;
}
exports.parseConfiguredToolDecisionRole = parseConfiguredToolDecisionRole;
function deriveDecisionRoleFromAgentMetadata(meta) {
    var _a, _b, _c;
    if (!meta) {
        return undefined;
    }
    const mode = (_a = meta.mode) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    const operation = (_b = meta.operation) === null || _b === void 0 ? void 0 : _b.toUpperCase();
    const resource = (_c = meta.resource) === null || _c === void 0 ? void 0 : _c.toUpperCase();
    if (mode === 'ADMIN') {
        return exports.ToolDecisionRoleEnum.Admin;
    }
    if (mode === 'READ') {
        if (operation === 'LIST' || operation === 'SEARCH') {
            return exports.ToolDecisionRoleEnum.ReadList;
        }
        if (operation === 'STATS') {
            return exports.ToolDecisionRoleEnum.ReadStats;
        }
        return exports.ToolDecisionRoleEnum.ReadDetail;
    }
    if (mode === 'WRITE') {
        if (resource === 'COLLECTION' ||
            operation === 'IMPORT' ||
            operation === 'EXPORT') {
            return exports.ToolDecisionRoleEnum.WriteMeta;
        }
        if (operation === 'CREATE') {
            return exports.ToolDecisionRoleEnum.WriteSingle;
        }
        if (operation === 'DELETE') {
            return exports.ToolDecisionRoleEnum.WriteSingle;
        }
        if (operation === 'UPDATE' || operation === 'PUBLISH' || operation === 'UNPUBLISH') {
            if (resource === 'PRICE' || resource === 'INVENTORY') {
                return exports.ToolDecisionRoleEnum.WriteBatch;
            }
            return exports.ToolDecisionRoleEnum.WriteSingle;
        }
        return exports.ToolDecisionRoleEnum.WriteSingle;
    }
    return undefined;
}
exports.deriveDecisionRoleFromAgentMetadata = deriveDecisionRoleFromAgentMetadata;
function inferDecisionRoleFromHttpMethod(method) {
    const normalized = method.trim().toLowerCase();
    switch (normalized) {
        case 'get':
            return exports.ToolDecisionRoleEnum.ReadDetail;
        case 'post':
            return exports.ToolDecisionRoleEnum.WriteSingle;
        case 'put':
            return exports.ToolDecisionRoleEnum.WriteBatch;
        case 'patch':
            return exports.ToolDecisionRoleEnum.WriteSingle;
        case 'delete':
            return exports.ToolDecisionRoleEnum.WriteSingle;
        default:
            return undefined;
    }
}
exports.inferDecisionRoleFromHttpMethod = inferDecisionRoleFromHttpMethod;
function buildSwaggerImportResponseProfile(method, agentMetadata) {
    var _a, _b;
    const decisionRole = (_b = (_a = deriveDecisionRoleFromAgentMetadata(agentMetadata)) !== null && _a !== void 0 ? _a : inferDecisionRoleFromHttpMethod(method)) !== null && _b !== void 0 ? _b : exports.ToolDecisionRoleEnum.ReadDetail;
    return {
        decisionRole,
        coreFields: [
            {
                path: 'id',
                label: '标识',
                description: '资源唯一标识（Swagger 导入占位；调试推断 schema 后可覆盖 coreFields）',
            },
        ],
    };
}
exports.buildSwaggerImportResponseProfile = buildSwaggerImportResponseProfile;
//# sourceMappingURL=tool-decision-role.enum.js.map