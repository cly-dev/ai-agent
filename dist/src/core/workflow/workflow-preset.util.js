"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowPresetConfig = exports.validateWorkflowPresetInput = exports.isWorkflowPresetKind = exports.listWorkflowPresetCatalog = exports.WORKFLOW_PRESET_CATALOG = exports.expandWorkflowPresetToIntent = void 0;
const workflow_intent_types_1 = require("./workflow-intent.types");
const validate_workflow_intent_util_1 = require("./validate-workflow-intent.util");
const ALL_WORKFLOW_PROFILES = [
    'page_action',
    'chat_skill',
    'shared',
];
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function linearAlwaysEdges(stepIds) {
    const edges = [];
    for (let i = 0; i < stepIds.length - 1; i++) {
        edges.push({
            id: `e_${stepIds[i]}_${stepIds[i + 1]}`,
            from: stepIds[i],
            to: stepIds[i + 1],
            kind: 'always',
        });
    }
    return edges;
}
function buildIntent(profile, steps) {
    const stepIds = steps.map((s) => s.id);
    return {
        version: workflow_intent_types_1.WORKFLOW_INTENT_VERSION,
        profile,
        entryStepId: stepIds[0],
        steps,
        edges: linearAlwaysEdges(stepIds),
    };
}
function expandWorkflowPresetToIntent(input) {
    const issues = validateWorkflowPresetInput({
        preset: input.preset,
        profile: input.profile,
        config: input.config,
    });
    if (issues.length > 0) {
        throw new Error(`Workflow preset validation failed: ${issues.map((row) => row.message).join('; ')}`);
    }
    const { profile, config } = input;
    let intent;
    switch (input.preset) {
        case 'page_auto_fill': {
            const steps = [];
            if (config.readToolId != null) {
                steps.push({
                    id: 'read',
                    operation: 'read',
                    name: '获取数据',
                    slots: { readToolIds: [config.readToolId] },
                });
            }
            steps.push({
                id: 'fill',
                operation: 'deliver',
                channel: 'fill',
                name: '生成并推送',
                slots: { fillHostToolIds: [config.hostToolId] },
            });
            intent = buildIntent(profile, steps);
            break;
        }
        case 'fetch_and_answer':
            intent = buildIntent(profile, [
                {
                    id: 'read',
                    operation: 'read',
                    name: '获取数据',
                    slots: { readToolIds: [config.readToolId] },
                },
                {
                    id: 'speak',
                    operation: 'deliver',
                    channel: 'speak',
                    name: '说明总结',
                },
            ]);
            break;
        case 'mutation_submit': {
            const mutateSlots = { writeToolId: config.writeToolId };
            if (config.readToolId != null) {
                mutateSlots.readToolIds = [config.readToolId];
            }
            intent = buildIntent(profile, [
                {
                    id: 'mutate',
                    operation: 'mutate',
                    name: '变更提交',
                    slots: mutateSlots,
                },
            ]);
            break;
        }
        default:
            throw new Error(`Unsupported workflow preset: ${input.preset}`);
    }
    const intentIssues = (0, validate_workflow_intent_util_1.validateWorkflowIntent)(intent);
    if (intentIssues.length > 0) {
        throw new Error(`Preset-produced intent invalid: ${intentIssues.map((i) => i.message).join('; ')}`);
    }
    return intent;
}
exports.expandWorkflowPresetToIntent = expandWorkflowPresetToIntent;
exports.WORKFLOW_PRESET_CATALOG = [
    {
        kind: 'page_auto_fill',
        label: '页内回填',
        description: '（可选）拉数 → Host 填页。页内标准无口头说明。',
        profiles: ALL_WORKFLOW_PROFILES,
        requiredConfig: ['hostToolId'],
        optionalConfig: ['readToolId'],
        expandedOperations: ['read?', 'deliver(fill)'],
    },
    {
        kind: 'fetch_and_answer',
        label: '拉数作答',
        description: 'HTTP 拉数 → 口头说明（Chat）。',
        profiles: ALL_WORKFLOW_PROFILES,
        requiredConfig: ['readToolId'],
        optionalConfig: [],
        expandedOperations: ['read', 'deliver(speak)'],
    },
    {
        kind: 'mutation_submit',
        label: '变更提交',
        description: 'Chat/Skill：组参 → 必确认 → 执行。勿绑 PageAction（页内写用 deliver fill）。',
        profiles: ALL_WORKFLOW_PROFILES,
        requiredConfig: ['writeToolId'],
        optionalConfig: ['readToolId'],
        expandedOperations: ['mutate'],
    },
];
function listWorkflowPresetCatalog(profile) {
    if (profile == null) {
        return exports.WORKFLOW_PRESET_CATALOG;
    }
    return exports.WORKFLOW_PRESET_CATALOG.filter((row) => row.profiles.includes(profile));
}
exports.listWorkflowPresetCatalog = listWorkflowPresetCatalog;
function isWorkflowPresetKind(value) {
    return (typeof value === 'string' &&
        exports.WORKFLOW_PRESET_CATALOG.some((row) => row.kind === value));
}
exports.isWorkflowPresetKind = isWorkflowPresetKind;
function validateWorkflowPresetInput(input) {
    const issues = [];
    const catalog = exports.WORKFLOW_PRESET_CATALOG.find((row) => row.kind === input.preset);
    if (!catalog) {
        issues.push({
            path: 'preset',
            code: 'unknown_preset',
            message: `Unknown workflow preset: ${input.preset}`,
        });
        return issues;
    }
    if (!catalog.profiles.includes(input.profile)) {
        issues.push({
            path: 'profile',
            code: 'preset_profile_mismatch',
            message: `preset ${input.preset} is not allowed for profile ${input.profile}`,
        });
    }
    if (!input.config ||
        typeof input.config !== 'object' ||
        Array.isArray(input.config)) {
        issues.push({
            path: 'presetConfig',
            code: 'invalid_preset_config',
            message: 'presetConfig must be an object',
        });
        return issues;
    }
    const config = input.config;
    for (const key of catalog.requiredConfig) {
        const value = config[key];
        if (key.endsWith('ToolId') || key.endsWith('Id')) {
            if (!isPositiveInt(value)) {
                issues.push({
                    path: `presetConfig.${key}`,
                    code: 'missing_required',
                    message: `${key} is required for preset ${input.preset}`,
                });
            }
        }
    }
    if (config.readToolId != null && !isPositiveInt(config.readToolId)) {
        issues.push({
            path: 'presetConfig.readToolId',
            code: 'invalid_tool_id',
            message: 'readToolId must be a positive integer',
        });
    }
    if (config.writeToolId != null && !isPositiveInt(config.writeToolId)) {
        issues.push({
            path: 'presetConfig.writeToolId',
            code: 'invalid_tool_id',
            message: 'writeToolId must be a positive integer',
        });
    }
    if (config.hostToolId != null && !isPositiveInt(config.hostToolId)) {
        issues.push({
            path: 'presetConfig.hostToolId',
            code: 'invalid_host_tool_id',
            message: 'hostToolId must be a positive integer',
        });
    }
    return issues;
}
exports.validateWorkflowPresetInput = validateWorkflowPresetInput;
function parseWorkflowPresetConfig(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value;
}
exports.parseWorkflowPresetConfig = parseWorkflowPresetConfig;
//# sourceMappingURL=workflow-preset.util.js.map