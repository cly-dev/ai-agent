"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWriteDraftEditPolicyForToolCall = exports.resolveWriteDraftEditPolicy = void 0;
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
const tool_decision_input_util_1 = require("../tool-engine/tool-decision-input.util");
const tool_param_path_alias_util_1 = require("../tool-engine/tool-param-path-alias.util");
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
function lastPathSegment(path) {
    var _a;
    const normalized = path.replace(/\[\]/g, '');
    const parts = normalized.split('.');
    return (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : path;
}
function isStringParamType(type) {
    if (!type) {
        return false;
    }
    const normalized = type.trim().toLowerCase();
    return normalized === 'string' || normalized.startsWith('string(');
}
function isIdentifierLeaf(leaf) {
    return /(?:^|_)(id|Id|ID)$/.test(leaf) || leaf.toLowerCase().endsWith('id');
}
function resolveConfiguredPolicy(writeTool) {
    var _a;
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(writeTool.agentMetadata);
    return (_a = meta === null || meta === void 0 ? void 0 : meta.draftReview) !== null && _a !== void 0 ? _a : {};
}
function resolveEditMode(policy) {
    var _a;
    return (_a = policy.editMode) !== null && _a !== void 0 ? _a : 'preview_only';
}
function resolveAllowArgumentsPatch(policy, editMode) {
    if (typeof policy.allowArgumentsPatch === 'boolean') {
        return policy.allowArgumentsPatch;
    }
    return editMode === 'allowlisted_fields' || editMode === 'full';
}
function buildOverrideMap(overrides) {
    return new Map((overrides !== null && overrides !== void 0 ? overrides : []).map((row) => [row.path, row]));
}
function inferFieldRole(input) {
    var _a, _b, _c;
    if ((_a = input.override) === null || _a === void 0 ? void 0 : _a.role) {
        return input.override.role;
    }
    const leaf = lastPathSegment(input.path);
    if (((_b = input.policy.lockedPaths) === null || _b === void 0 ? void 0 : _b.includes(input.path)) ||
        input.businessFields.has(leaf) ||
        input.businessFields.has(input.path) ||
        input.identifierLeaves.has(leaf) ||
        isIdentifierLeaf(leaf)) {
        return 'identifier';
    }
    if ((_c = input.row.enum) === null || _c === void 0 ? void 0 : _c.length) {
        return 'enum';
    }
    if (isStringParamType(input.row.type)) {
        return 'content';
    }
    return 'system';
}
function isFieldEditable(input) {
    var _a, _b;
    if (input.role === 'identifier' || input.role === 'system') {
        return false;
    }
    if ((_a = input.policy.lockedPaths) === null || _a === void 0 ? void 0 : _a.includes(input.path)) {
        return false;
    }
    switch (input.editMode) {
        case 'preview_only':
            return false;
        case 'allowlisted_fields':
            return ((_b = input.policy.editablePaths) !== null && _b !== void 0 ? _b : []).includes(input.path);
        case 'full':
            return input.role === 'content' || input.role === 'enum';
        default:
            return false;
    }
}
function resolveWidget(input) {
    var _a, _b;
    if (!input.editable) {
        return ((_a = input.override) === null || _a === void 0 ? void 0 : _a.widget) === 'hidden' ? 'hidden' : 'readonly';
    }
    if ((_b = input.override) === null || _b === void 0 ? void 0 : _b.widget) {
        return input.override.widget;
    }
    if (input.role === 'enum') {
        return 'select';
    }
    return 'textarea';
}
function defaultReason(role) {
    switch (role) {
        case 'identifier':
            return '业务标识由系统自动带入，不可修改';
        case 'scenario':
            return '场景固定参数，不可修改';
        case 'system':
            return '系统字段，不可修改';
        default:
            return undefined;
    }
}
function buildEnumOptions(row) {
    var _a;
    if (!((_a = row.enum) === null || _a === void 0 ? void 0 : _a.length)) {
        return undefined;
    }
    return row.enum.map((value) => ({ label: value, value }));
}
function filterContainerCompactParams(compactParams) {
    const names = compactParams.map((row) => row.name);
    return compactParams.filter((row) => {
        const prefixDot = `${row.name}.`;
        const prefixArray = `${row.name}[].`;
        const hasExpandedChild = names.some((name) => name !== row.name &&
            (name.startsWith(prefixDot) || name.startsWith(prefixArray)));
        return !hasExpandedChild;
    });
}
function normalizeDraftReviewPolicyPathsForRuntime(policy, paramPaths) {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, policy), (policy.submitPath
        ? {
            submitPath: (0, tool_param_path_alias_util_1.resolveArrayItemParamPathAlias)(policy.submitPath.trim(), paramPaths),
        }
        : {})), (policy.editablePaths
        ? {
            editablePaths: (0, tool_param_path_alias_util_1.normalizeParamPathListAliases)(policy.editablePaths, paramPaths),
        }
        : {})), (policy.lockedPaths
        ? {
            lockedPaths: (0, tool_param_path_alias_util_1.normalizeParamPathListAliases)(policy.lockedPaths, paramPaths),
        }
        : {})), (policy.fieldOverrides
        ? {
            fieldOverrides: policy.fieldOverrides.map((row) => (Object.assign(Object.assign({}, row), { path: (0, tool_param_path_alias_util_1.resolveArrayItemParamPathAlias)(row.path, paramPaths) }))),
        }
        : {}));
}
function resolveWriteDraftEditPolicy(input) {
    var _a;
    const rawPolicy = resolveConfiguredPolicy(input.writeTool);
    const allCompactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(input.writeTool.inputSchema, input.writeTool.schema);
    const paramPaths = new Set(allCompactParams.map((row) => row.name));
    const policy = normalizeDraftReviewPolicyPathsForRuntime(rawPolicy, paramPaths);
    const editMode = resolveEditMode(policy);
    const allowArgumentsPatch = resolveAllowArgumentsPatch(policy, editMode);
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(input.writeTool.agentMetadata);
    const businessFields = new Set((0, tool_param_path_alias_util_1.normalizeParamPathListAliases)((_a = meta === null || meta === void 0 ? void 0 : meta.businessFields) !== null && _a !== void 0 ? _a : [], paramPaths));
    const submitPaths = (0, write_tool_draft_injection_util_1.resolveWriteToolSubmitPaths)(input.writeTool);
    const identifierLeaves = submitPaths.identifierLeaves;
    const overrideMap = buildOverrideMap(policy.fieldOverrides);
    const compactParams = filterContainerCompactParams(allCompactParams);
    const submitPath = (0, write_tool_draft_injection_util_1.resolveEffectiveWriteToolSubmitPath)(input.writeTool);
    const fields = compactParams.map((row) => {
        var _a, _b, _c;
        const override = overrideMap.get(row.name);
        const role = inferFieldRole({
            path: row.name,
            row,
            policy,
            businessFields,
            identifierLeaves,
            override,
        });
        const editable = isFieldEditable({
            path: row.name,
            role,
            editMode,
            policy,
        });
        const widget = resolveWidget({ role, editable, override });
        return {
            path: row.name,
            label: ((_a = override === null || override === void 0 ? void 0 : override.label) === null || _a === void 0 ? void 0 : _a.trim()) ||
                ((_b = row.description) === null || _b === void 0 ? void 0 : _b.trim()) ||
                row.name,
            role,
            widget,
            editable,
            required: row.required,
            value: (0, write_tool_draft_injection_util_1.readValueAtWriteToolParamPath)(input.arguments, row.name),
            enumOptions: buildEnumOptions(row),
            reason: (_c = override === null || override === void 0 ? void 0 : override.reason) !== null && _c !== void 0 ? _c : defaultReason(role),
        };
    });
    return {
        editMode,
        submitPath: submitPath !== null && submitPath !== void 0 ? submitPath : null,
        allowArgumentsPatch,
        fields,
    };
}
exports.resolveWriteDraftEditPolicy = resolveWriteDraftEditPolicy;
function resolveWriteDraftEditPolicyForToolCall(input) {
    if (!input.writeTool) {
        return null;
    }
    return resolveWriteDraftEditPolicy({
        writeTool: input.writeTool,
        arguments: input.arguments,
    });
}
exports.resolveWriteDraftEditPolicyForToolCall = resolveWriteDraftEditPolicyForToolCall;
//# sourceMappingURL=resolve-write-draft-edit-policy.util.js.map