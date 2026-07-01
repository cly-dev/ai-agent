"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOrProvisionPageActionHostTool = exports.buildDefaultFillArgsSchema = exports.derivePageActionHostToolName = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
function derivePageActionHostToolName(actionKey) {
    const trimmed = actionKey.trim();
    const lastDot = trimmed.lastIndexOf('.');
    const segment = lastDot >= 0 ? trimmed.slice(lastDot + 1) : trimmed;
    const normalized = segment.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 120);
    return normalized.length > 0 ? normalized : 'fill';
}
exports.derivePageActionHostToolName = derivePageActionHostToolName;
function buildDefaultFillArgsSchema(fillField = 'text') {
    return {
        type: 'object',
        properties: {
            [fillField]: {
                type: 'string',
                description: 'Generated content to fill into the page field',
            },
        },
        required: [fillField],
    };
}
exports.buildDefaultFillArgsSchema = buildDefaultFillArgsSchema;
async function ensureHostPageForScope(prisma, appClientId, scope) {
    const existing = await prisma.hostPage.findUnique({
        where: { appClientId_scope: { appClientId, scope } },
        select: { id: true },
    });
    if (existing) {
        return existing.id;
    }
    const created = await prisma.hostPage.create({
        data: {
            appClientId,
            scope,
            label: scope,
        },
    });
    return created.id;
}
async function resolveOrProvisionPageActionHostTool(prisma, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (input.hostToolId != null) {
        const row = await prisma.hostTool.findFirst({
            where: { id: input.hostToolId, appClientId: input.appClientId },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.BadRequestException(`HostTool ${input.hostToolId} not found for AppClient ${input.appClientId}`);
        }
        return row;
    }
    const name = ((_b = (_a = input.hostTool) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.trim()) ||
        derivePageActionHostToolName(input.actionKey);
    const description = ((_d = (_c = input.hostTool) === null || _c === void 0 ? void 0 : _c.description) === null || _d === void 0 ? void 0 : _d.trim()) ||
        ((_e = input.pageActionDescription) === null || _e === void 0 ? void 0 : _e.trim()) ||
        input.pageActionName.trim();
    const fillField = ((_g = (_f = input.hostTool) === null || _f === void 0 ? void 0 : _f.fillField) === null || _g === void 0 ? void 0 : _g.trim()) || 'text';
    const pageScope = ((_h = input.pageScope) === null || _h === void 0 ? void 0 : _h.trim()) || null;
    const definitionKey = pageScope
        ? `${pageScope}.${name}`
        : input.actionKey.trim();
    const expectedSchema = buildDefaultFillArgsSchema(fillField);
    const byDefinitionKey = await prisma.hostTool.findUnique({
        where: {
            appClientId_definitionKey: { appClientId: input.appClientId, definitionKey },
        },
        include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
    });
    if (byDefinitionKey) {
        return byDefinitionKey;
    }
    const byName = await prisma.hostTool.findUnique({
        where: {
            appClientId_name: { appClientId: input.appClientId, name },
        },
        include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
    });
    if (byName) {
        if (byName.definitionKey !== definitionKey) {
            throw new common_1.BadRequestException({
                code: 'HOST_TOOL_NAME_COLLISION',
                message: `HostTool name "${name}" is already used by definitionKey "${byName.definitionKey}"; ` +
                    `use hostToolId or a different hostTool.name / actionKey`,
            });
        }
        return byName;
    }
    let hostPageId = null;
    if (pageScope) {
        hostPageId = await ensureHostPageForScope(prisma, input.appClientId, pageScope);
    }
    try {
        return await prisma.hostTool.create({
            data: {
                appClientId: input.appClientId,
                hostPageId,
                definitionKey,
                name,
                description,
                argsSchema: expectedSchema,
                isActive: true,
            },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002') {
            const raced = await prisma.hostTool.findFirst({
                where: {
                    appClientId: input.appClientId,
                    OR: [{ definitionKey }, { name }],
                },
                include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
            });
            if (raced) {
                return raced;
            }
        }
        throw error;
    }
}
exports.resolveOrProvisionPageActionHostTool = resolveOrProvisionPageActionHostTool;
//# sourceMappingURL=page-action-host-tool-provision.util.js.map