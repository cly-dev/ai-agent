"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMigratedWorkflowKeyConflict = exports.stripLegacySkillConfigWorkflow = exports.buildSkillWorkflowMigrationPlan = exports.enrichMigratedWorkflowNodes = exports.mapLegacyDeliverableToWorkflowDeliverable = exports.buildMigratedWorkflowKey = exports.hasLegacySkillConfigWorkflow = void 0;
const client_1 = require("../../../../generated/prisma/client");
const import_skill_config_workflow_util_1 = require("./import-skill-config-workflow.util");
const validate_workflow_util_1 = require("../validate-workflow.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function readNonEmptyString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function hasLegacySkillConfigWorkflow(config) {
    return (0, import_skill_config_workflow_util_1.importSkillConfigWorkflowNodes)(config).length > 0;
}
exports.hasLegacySkillConfigWorkflow = hasLegacySkillConfigWorkflow;
function buildMigratedWorkflowKey(input) {
    var _a;
    const fromCapability = (_a = input.capabilityKey) === null || _a === void 0 ? void 0 : _a.trim();
    if (fromCapability) {
        const sanitized = fromCapability
            .replace(/[^a-zA-Z0-9._-]+/g, '.')
            .replace(/\.{2,}/g, '.')
            .replace(/^\.+|\.+$/g, '');
        if (sanitized.length > 0) {
            return `skill.${sanitized}`.slice(0, 200);
        }
    }
    const fromName = input.skillName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '');
    if (fromName.length > 0) {
        return `skill.${fromName}`.slice(0, 180) + `.${input.skillId}`;
    }
    return `skill.migrated.${input.skillId}`;
}
exports.buildMigratedWorkflowKey = buildMigratedWorkflowKey;
function mapLegacyDeliverableToWorkflowDeliverable(deliverable) {
    switch (deliverable === null || deliverable === void 0 ? void 0 : deliverable.trim().toLowerCase()) {
        case 'mutation':
            return client_1.WorkflowDeliverable.mutation;
        case 'analysis':
        case 'list':
            return client_1.WorkflowDeliverable.analysis;
        case 'answer':
        case 'detail':
        default:
            return client_1.WorkflowDeliverable.answer;
    }
}
exports.mapLegacyDeliverableToWorkflowDeliverable = mapLegacyDeliverableToWorkflowDeliverable;
function sortBindingsByRequired(rows) {
    return [...rows].sort((left, right) => {
        if (left.isRequired === right.isRequired) {
            return 0;
        }
        return left.isRequired ? -1 : 1;
    });
}
function toBindingRefs(tools, hostTools) {
    return {
        toolIds: tools.map((row) => row.toolId),
        hostToolIds: hostTools.map((row) => row.hostToolId),
    };
}
function enrichMigratedWorkflowNodes(nodes, bindings) {
    const toolIds = bindings.toolIds.filter((id) => id > 0);
    const hostToolIds = bindings.hostToolIds.filter((id) => id > 0);
    let toolCursor = 0;
    const pickToolId = () => {
        if (toolIds.length === 0) {
            return undefined;
        }
        const picked = toolIds[Math.min(toolCursor, toolIds.length - 1)];
        toolCursor += 1;
        return picked;
    };
    return nodes.map((node) => {
        const rawInput = isRecord(node.input)
            ? Object.assign({}, node.input) : {};
        if (node.action === 'fetch_data' ||
            node.action === 'compose_mutation' ||
            node.action === 'write_data') {
            const hasToolId = typeof rawInput.toolId === 'number' && rawInput.toolId > 0;
            const hasDefinitionKey = typeof rawInput.definitionKey === 'string' &&
                rawInput.definitionKey.trim().length > 0;
            if (!hasToolId && !hasDefinitionKey) {
                const toolId = pickToolId();
                if (toolId != null) {
                    rawInput.toolId = toolId;
                }
            }
        }
        if (node.action === 'generate_and_push') {
            const hostToolId = rawInput.hostToolId;
            const missingHostToolId = typeof hostToolId !== 'number' || !Number.isInteger(hostToolId) || hostToolId <= 0;
            if (missingHostToolId && hostToolIds[0] != null) {
                rawInput.hostToolId = hostToolIds[0];
            }
        }
        return Object.assign(Object.assign({}, node), { input: rawInput });
    });
}
exports.enrichMigratedWorkflowNodes = enrichMigratedWorkflowNodes;
function readMigrationGoal(config) {
    var _a;
    if (!isRecord(config)) {
        return null;
    }
    const workflow = isRecord(config.workflow) ? config.workflow : null;
    return (_a = readNonEmptyString(config.goal)) !== null && _a !== void 0 ? _a : readNonEmptyString(workflow === null || workflow === void 0 ? void 0 : workflow.goal);
}
function buildSkillWorkflowMigrationPlan(input) {
    const baseNodes = (0, import_skill_config_workflow_util_1.importSkillConfigWorkflowNodes)(input.config);
    if (baseNodes.length === 0) {
        return null;
    }
    const tools = sortBindingsByRequired(input.toolBindings);
    const hostTools = sortBindingsByRequired(input.hostToolBindings);
    const bindings = toBindingRefs(tools, hostTools);
    const nodes = enrichMigratedWorkflowNodes(baseNodes, bindings);
    const workflowKey = buildMigratedWorkflowKey({
        skillId: input.skillId,
        capabilityKey: input.capabilityKey,
        skillName: input.skillName,
    });
    const deliverable = mapLegacyDeliverableToWorkflowDeliverable((0, import_skill_config_workflow_util_1.importSkillConfigWorkflowDeliverable)(input.config));
    const validationIssues = (0, validate_workflow_util_1.validateWorkflowDefinition)({
        definition: {
            workflowKey,
            name: input.skillName.trim() || `Skill ${input.skillId}`,
            profile: 'chat_skill',
            goal: readMigrationGoal(input.config),
            constraints: [],
            nodes,
        },
        bindings,
    });
    return {
        workflowKey,
        name: input.skillName.trim() || `Skill ${input.skillId}`,
        goal: readMigrationGoal(input.config),
        deliverable,
        nodes,
        tools,
        hostTools,
        validationIssues,
    };
}
exports.buildSkillWorkflowMigrationPlan = buildSkillWorkflowMigrationPlan;
function stripLegacySkillConfigWorkflow(config) {
    if (!isRecord(config)) {
        return null;
    }
    if (!('workflow' in config)) {
        return Object.assign({}, config);
    }
    const next = Object.assign({}, config);
    delete next.workflow;
    return next;
}
exports.stripLegacySkillConfigWorkflow = stripLegacySkillConfigWorkflow;
function resolveMigratedWorkflowKeyConflict(workflowKey, skillId) {
    const suffix = `.skill${skillId}`;
    const maxBase = 200 - suffix.length;
    const base = workflowKey.slice(0, Math.max(1, maxBase));
    return `${base}${suffix}`;
}
exports.resolveMigratedWorkflowKeyConflict = resolveMigratedWorkflowKeyConflict;
//# sourceMappingURL=migrate-skill-config-workflow.util.js.map