"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRAFT_REVIEW_FIELD_WIDGETS = exports.DRAFT_REVIEW_FIELD_ROLES = exports.DRAFT_REVIEW_EDIT_MODES = exports.OPERATION_TYPES = exports.RESOURCE_TYPES = exports.TOOL_MODES = exports.OperationType = exports.ResourceType = exports.ToolMode = void 0;
exports.ToolMode = {
    READ: 'READ',
    WRITE: 'WRITE',
    ADMIN: 'ADMIN',
};
exports.ResourceType = {
    PRODUCT: 'PRODUCT',
    PRICE: 'PRICE',
    INVENTORY: 'INVENTORY',
    SEO: 'SEO',
    CATEGORY: 'CATEGORY',
    COLLECTION: 'COLLECTION',
    ORDER: 'ORDER',
    CUSTOMER: 'CUSTOMER',
    UNKNOWN: 'UNKNOWN',
};
exports.OperationType = {
    DETAIL: 'DETAIL',
    LIST: 'LIST',
    SEARCH: 'SEARCH',
    STATS: 'STATS',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    IMPORT: 'IMPORT',
    EXPORT: 'EXPORT',
    PUBLISH: 'PUBLISH',
    UNPUBLISH: 'UNPUBLISH',
};
exports.TOOL_MODES = Object.values(exports.ToolMode);
exports.RESOURCE_TYPES = Object.values(exports.ResourceType);
exports.OPERATION_TYPES = Object.values(exports.OperationType);
exports.DRAFT_REVIEW_EDIT_MODES = [
    'preview_only',
    'allowlisted_fields',
    'full',
];
exports.DRAFT_REVIEW_FIELD_ROLES = [
    'content',
    'identifier',
    'scenario',
    'enum',
    'system',
];
exports.DRAFT_REVIEW_FIELD_WIDGETS = [
    'text',
    'textarea',
    'select',
    'readonly',
    'hidden',
];
//# sourceMappingURL=tool-agent-metadata.types.js.map