"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowPresetConfig = exports.expandWorkflowPreset = exports.validateWorkflowPresetInput = exports.isWorkflowPresetKind = exports.listWorkflowPresetCatalog = exports.WORKFLOW_PRESET_CATALOG = void 0;
const ALL_WORKFLOW_PROFILES = [
    'page_action',
    'chat_skill',
    'shared',
];
const PRESET_PROFILES = {
    page_auto_fill: ALL_WORKFLOW_PROFILES,
    page_context_push: ALL_WORKFLOW_PROFILES,
    fetch_push_summarize: ALL_WORKFLOW_PROFILES,
    fetch_and_answer: ALL_WORKFLOW_PROFILES,
    mutation_submit: ALL_WORKFLOW_PROFILES,
    page_context_mutation_submit: ALL_WORKFLOW_PROFILES,
};
const DEFAULT_OBJECTIVES = {
    loadPage: 'Load page context and materialize observations required for this turn.',
    fetch: 'Fetch data from the bound read tool using identifiers from user intent.',
    push: 'Generate user-facing content and push to the page via the bound host tool.',
    compose: 'Compose write parameters only from read observations; do not execute HTTP write yet.',
    present: 'Present the pending mutation draft to the user; quote composed arguments verbatim.',
    write: 'Execute the bound write tool using composed parameters after user confirmation.',
    summarize: 'Summarize the outcome for the user in concise language.',
};
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function objective(config, key) {
    var _a;
    const fromConfig = (_a = config.objectives) === null || _a === void 0 ? void 0 : _a[key];
    if (typeof fromConfig === 'string' && fromConfig.trim()) {
        return fromConfig.trim();
    }
    return DEFAULT_OBJECTIVES[key];
}
function loadPageNode(config) {
    return {
        id: 'load_page',
        action: 'load_page_context',
        name: '加载页上下文',
        objective: objective(config, 'loadPage'),
        input: {
            materialize: config.materializePageContext !== false,
        },
    };
}
function fetchNode(config, toolId, id = 'fetch_data') {
    var _a;
    return {
        id,
        action: 'fetch_data',
        name: '获取数据',
        objective: objective(config, 'fetch'),
        input: {
            toolIds: [toolId],
            completeWhen: (_a = config.fetchCompleteWhen) !== null && _a !== void 0 ? _a : 'first_success',
        },
    };
}
function pushNode(config, hostToolId, id = 'generate_push') {
    return {
        id,
        action: 'generate_and_push',
        name: '生成并推送',
        objective: objective(config, 'push'),
        input: {
            hostToolIds: [hostToolId],
        },
    };
}
function summarizeNode(config, name = '说明总结') {
    var _a;
    return {
        id: 'summarize',
        action: 'summarize',
        name,
        objective: objective(config, 'summarize'),
        input: {
            mode: (_a = config.summarizeMode) !== null && _a !== void 0 ? _a : 'final',
        },
    };
}
function expandMutationWriteConfirmChain(config, writeToolId, labels) {
    var _a, _b, _c, _d, _e, _f;
    return [
        {
            id: 'compose_mutation',
            action: 'compose_mutation',
            name: (_a = labels === null || labels === void 0 ? void 0 : labels.compose) !== null && _a !== void 0 ? _a : '组装变更参数',
            objective: objective(config, 'compose'),
            input: { toolId: writeToolId },
        },
        {
            id: 'present_mutation',
            action: 'present_mutation',
            name: (_b = labels === null || labels === void 0 ? void 0 : labels.present) !== null && _b !== void 0 ? _b : '展示变更草稿',
            objective: objective(config, 'present'),
            input: { mode: (_c = config.presentMode) !== null && _c !== void 0 ? _c : 'brief' },
        },
        {
            id: 'await_confirm',
            action: 'await_user_confirm',
            name: (_d = labels === null || labels === void 0 ? void 0 : labels.await) !== null && _d !== void 0 ? _d : '等待用户确认',
            objective: 'Wait for user confirmation before executing the write.',
            input: { confirmKind: (_e = config.confirmKind) !== null && _e !== void 0 ? _e : 'mutation' },
        },
        {
            id: 'write_data',
            action: 'write_data',
            name: (_f = labels === null || labels === void 0 ? void 0 : labels.write) !== null && _f !== void 0 ? _f : '提交变更',
            objective: objective(config, 'write'),
            input: { toolId: writeToolId, useComposedArgs: true },
        },
        summarizeNode(config, labels === null || labels === void 0 ? void 0 : labels.summarize),
    ];
}
function expandPageAutoFill(config) {
    const hostToolId = config.hostToolId;
    const nodes = [loadPageNode(config)];
    if (config.readToolId != null) {
        nodes.push(fetchNode(config, config.readToolId));
    }
    nodes.push(pushNode(config, hostToolId), summarizeNode(config));
    return nodes;
}
function expandPageContextPush(config) {
    return [
        loadPageNode(config),
        pushNode(config, config.hostToolId),
        summarizeNode(config),
    ];
}
function expandFetchPushSummarize(config) {
    return [
        fetchNode(config, config.readToolId),
        pushNode(config, config.hostToolId),
        summarizeNode(config),
    ];
}
function expandFetchAndAnswer(config) {
    return [fetchNode(config, config.readToolId), summarizeNode(config)];
}
function expandMutationSubmit(config) {
    const writeToolId = config.writeToolId;
    const nodes = [];
    if (config.readToolId != null) {
        nodes.push(fetchNode(config, config.readToolId, 'fetch_before_write'));
    }
    nodes.push(...expandMutationWriteConfirmChain(config, writeToolId));
    return nodes;
}
function expandPageContextMutationSubmit(config) {
    const writeToolId = config.writeToolId;
    const nodes = [loadPageNode(config)];
    if (config.readToolId != null) {
        nodes.push(fetchNode(config, config.readToolId, 'fetch_before_write'));
    }
    nodes.push(...expandMutationWriteConfirmChain(config, writeToolId, {
        compose: '生成参数',
        present: '草稿说明',
        await: '确认读写',
        write: '执行读写',
        summarize: '总结说明',
    }));
    return nodes;
}
exports.WORKFLOW_PRESET_CATALOG = [
    {
        kind: 'page_auto_fill',
        label: '页内自动回填',
        description: '加载页上下文 →（可选）拉取数据 → Host Tool 推送 → 总结说明。PageAction 最常用场景。',
        profiles: PRESET_PROFILES.page_auto_fill,
        requiredConfig: ['hostToolId'],
        optionalConfig: [
            'readToolId',
            'fetchCompleteWhen',
            'summarizeMode',
            'materializePageContext',
            'objectives',
        ],
        expandedActions: [
            'load_page_context',
            'fetch_data?',
            'generate_and_push',
            'summarize',
        ],
    },
    {
        kind: 'page_context_push',
        label: '页内推送',
        description: '加载页上下文 → Host Tool 推送 → 总结说明（不拉 HTTP 读接口）。',
        profiles: PRESET_PROFILES.page_context_push,
        requiredConfig: ['hostToolId'],
        optionalConfig: ['summarizeMode', 'materializePageContext', 'objectives'],
        expandedActions: ['load_page_context', 'generate_and_push', 'summarize'],
    },
    {
        kind: 'fetch_push_summarize',
        label: '拉数并推送',
        description: 'HTTP 拉数 → Host Tool 推送 → 总结说明。',
        profiles: PRESET_PROFILES.fetch_push_summarize,
        requiredConfig: ['readToolId', 'hostToolId'],
        optionalConfig: [
            'fetchCompleteWhen',
            'summarizeMode',
            'objectives',
        ],
        expandedActions: ['fetch_data', 'generate_and_push', 'summarize'],
    },
    {
        kind: 'fetch_and_answer',
        label: '拉数作答',
        description: 'HTTP 拉数 → 文字总结。Chat 只读问答。',
        profiles: PRESET_PROFILES.fetch_and_answer,
        requiredConfig: ['readToolId'],
        optionalConfig: ['fetchCompleteWhen', 'summarizeMode', 'objectives'],
        expandedActions: ['fetch_data', 'summarize'],
    },
    {
        kind: 'mutation_submit',
        label: '变更提交',
        description: '（可选）拉数 → 组装写参数 → 展示草稿 → 用户确认 → 执行写 → 总结。',
        profiles: PRESET_PROFILES.mutation_submit,
        requiredConfig: ['writeToolId'],
        optionalConfig: [
            'readToolId',
            'presentMode',
            'confirmKind',
            'summarizeMode',
            'objectives',
        ],
        expandedActions: [
            'fetch_data?',
            'compose_mutation',
            'present_mutation',
            'await_user_confirm',
            'write_data',
            'summarize',
        ],
    },
    {
        kind: 'page_context_mutation_submit',
        label: '页内写确认',
        description: '加载页上下文 → 生成参数 → 草稿说明 → 确认读写 → 执行读写 → 总结说明。适合带 pageContext 的 Chat 写操作。',
        profiles: PRESET_PROFILES.page_context_mutation_submit,
        requiredConfig: ['writeToolId'],
        optionalConfig: [
            'readToolId',
            'presentMode',
            'confirmKind',
            'summarizeMode',
            'materializePageContext',
            'objectives',
        ],
        expandedActions: [
            'load_page_context',
            'fetch_data?',
            'compose_mutation',
            'present_mutation',
            'await_user_confirm',
            'write_data',
            'summarize',
        ],
    },
];
function listWorkflowPresetCatalog(_profile) {
    return exports.WORKFLOW_PRESET_CATALOG;
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
    if (!input.config || typeof input.config !== 'object' || Array.isArray(input.config)) {
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
function expandWorkflowPreset(input) {
    const issues = validateWorkflowPresetInput({
        preset: input.preset,
        profile: input.profile,
        config: input.config,
    });
    if (issues.length > 0) {
        throw new Error(`Workflow preset validation failed: ${issues.map((row) => row.message).join('; ')}`);
    }
    let nodes;
    switch (input.preset) {
        case 'page_auto_fill':
            nodes = expandPageAutoFill(input.config);
            break;
        case 'page_context_push':
            nodes = expandPageContextPush(input.config);
            break;
        case 'fetch_push_summarize':
            nodes = expandFetchPushSummarize(input.config);
            break;
        case 'fetch_and_answer':
            nodes = expandFetchAndAnswer(input.config);
            break;
        case 'mutation_submit':
            nodes = expandMutationSubmit(input.config);
            break;
        case 'page_context_mutation_submit':
            nodes = expandPageContextMutationSubmit(input.config);
            break;
        default:
            throw new Error(`Unsupported workflow preset: ${input.preset}`);
    }
    return nodes;
}
exports.expandWorkflowPreset = expandWorkflowPreset;
function parseWorkflowPresetConfig(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value;
}
exports.parseWorkflowPresetConfig = parseWorkflowPresetConfig;
//# sourceMappingURL=workflow-preset.util.js.map