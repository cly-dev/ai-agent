"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRuntimeRevisionEqual = exports.buildHostToolCatalogRevision = exports.buildSkillsRuntimeRevision = exports.buildToolsRuntimeRevision = exports.buildEntityRevisionsFingerprint = exports.toRevisionIso = void 0;
function toRevisionIso(value) {
    if (value == null) {
        return '';
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}
exports.toRevisionIso = toRevisionIso;
function buildEntityRevisionsFingerprint(rows) {
    return [...rows]
        .map((row) => `${row.id}:${toRevisionIso(row.updatedAt)}`)
        .sort()
        .join(',');
}
exports.buildEntityRevisionsFingerprint = buildEntityRevisionsFingerprint;
function buildToolsRuntimeRevision(tools) {
    const toolsPart = buildEntityRevisionsFingerprint(tools);
    const integrationById = new Map();
    for (const tool of tools) {
        const integration = tool.integration;
        if (integration) {
            integrationById.set(integration.id, {
                id: integration.id,
                updatedAt: integration.updatedAt,
            });
        }
    }
    const integrationsPart = buildEntityRevisionsFingerprint([
        ...integrationById.values(),
    ]);
    return { tools: toolsPart, integrations: integrationsPart };
}
exports.buildToolsRuntimeRevision = buildToolsRuntimeRevision;
function buildSkillsRuntimeRevision(skills) {
    return buildEntityRevisionsFingerprint(skills);
}
exports.buildSkillsRuntimeRevision = buildSkillsRuntimeRevision;
function buildHostToolCatalogRevision(input) {
    const hostPart = buildEntityRevisionsFingerprint(input.hostTools.map((row) => ({ id: row.id, updatedAt: row.updatedAt })));
    const skillPart = buildEntityRevisionsFingerprint(input.skillBindings);
    const bindPart = [...input.agentBoundHostToolIds].sort((a, b) => a - b).join(',');
    return `h:${hostPart}|s:${skillPart}|b:${bindPart}`;
}
exports.buildHostToolCatalogRevision = buildHostToolCatalogRevision;
function isRuntimeRevisionEqual(left, right) {
    if (!left || !right) {
        return false;
    }
    return (left.tools === right.tools &&
        left.skills === right.skills &&
        left.hostTools === right.hostTools &&
        left.integrations === right.integrations);
}
exports.isRuntimeRevisionEqual = isRuntimeRevisionEqual;
//# sourceMappingURL=runtime-revision.util.js.map