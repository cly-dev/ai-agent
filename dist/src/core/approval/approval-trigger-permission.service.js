"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalTriggerPermissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_client_access_util_1 = require("../../modules/agent/util/agent-client-access.util");
const agent_tool_catalog_service_1 = require("../runtime-cache/agent-tool-catalog.service");
const workflow_trigger_permission_util_1 = require("../workflow/workflow-trigger-permission.util");
let ApprovalTriggerPermissionService = class ApprovalTriggerPermissionService {
    constructor(prisma, agentToolCatalog) {
        this.prisma = prisma;
        this.agentToolCatalog = agentToolCatalog;
    }
    async resolveUserAllowedToolIds(input) {
        const tools = await this.agentToolCatalog.resolveAllowedTools(input.agentId, input.userId, input.appClientId);
        return tools.map((tool) => tool.id);
    }
    async resolveUserAllowedToolIdsForApp(input) {
        const roleCtx = await this.resolveRoleToolContext(input);
        if (!roleCtx) {
            return [];
        }
        const tools = await this.prisma.tool.findMany({
            where: (0, agent_client_access_util_1.buildRoleAccessibleToolWhere)(input.appClientId, roleCtx, {
                isActive: true,
            }),
            select: { id: true },
        });
        return tools.map((tool) => tool.id);
    }
    async resolveRoleToolContext(input) {
        const userApp = await this.prisma.userApp.findUnique({
            where: {
                userId_appId: { userId: input.userId, appId: input.appClientId },
            },
            include: {
                role: {
                    include: { roleTools: { select: { toolId: true } } },
                },
            },
        });
        if (!(userApp === null || userApp === void 0 ? void 0 : userApp.role)) {
            return null;
        }
        return {
            roleId: userApp.role.id,
            maxLevel: userApp.role.allowToolLevel,
            roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
        };
    }
    evaluateForNodes(input) {
        var _a;
        const decision = (0, workflow_trigger_permission_util_1.evaluateWorkflowTriggerPermissionForNodes)({
            nodes: input.nodes,
            allowedToolIds: input.allowedToolIds,
            enabled: (_a = input.enabled) !== null && _a !== void 0 ? _a : (0, workflow_trigger_permission_util_1.isWorkflowTriggerPermissionEnabled)(),
        });
        if (decision.allowed) {
            return { allowed: true, skipped: decision.skipped };
        }
        return {
            allowed: false,
            missingToolIds: decision.missingToolIds,
            skipped: false,
        };
    }
};
ApprovalTriggerPermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_tool_catalog_service_1.AgentToolCatalogService])
], ApprovalTriggerPermissionService);
exports.ApprovalTriggerPermissionService = ApprovalTriggerPermissionService;
//# sourceMappingURL=approval-trigger-permission.service.js.map