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
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const workflow_preset_util_1 = require("../../core/workflow/workflow-preset.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const workflow_mapper_1 = require("./workflow.mapper");
const workflow_types_1 = require("./workflow.types");
let WorkflowService = class WorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPresets(profile) {
        return (0, workflow_preset_util_1.listWorkflowPresetCatalog)(profile);
    }
    async findOne(id) {
        const row = await this.findEntityOrThrow(id);
        return (0, workflow_mapper_1.toWorkflowResponse)(row);
    }
    async remove(id) {
        await this.findEntityOrThrow(id);
        await this.prisma.workflow.delete({ where: { id } });
        return { ok: true, id };
    }
    async findPage(query) {
        var _a;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.appClientId != null ? { appClientId: query.appClientId } : {})), (query.profile != null ? { profile: query.profile } : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_a = query.keyword) === null || _a === void 0 ? void 0 : _a.trim())
            ? {
                OR: [
                    { workflowKey: { contains: query.keyword.trim() } },
                    { name: { contains: query.keyword.trim() } },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.workflow.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: workflow_types_1.WORKFLOW_LIST_INCLUDE,
            }),
            this.prisma.workflow.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(workflow_mapper_1.toWorkflowListItem), total, page, pageSize);
    }
    async listRevisions(workflowId, query = {}) {
        var _a;
        const workflow = await this.findEntityOrThrow(workflowId);
        const limit = Math.min(Math.max((_a = query.limit) !== null && _a !== void 0 ? _a : 20, 1), 100);
        if (query.summary) {
            const rows = await this.prisma.workflowRevision.findMany({
                where: { workflowId },
                orderBy: { version: 'desc' },
                take: limit,
                select: {
                    id: true,
                    workflowId: true,
                    version: true,
                    deliverable: true,
                    changeNote: true,
                    createdAt: true,
                },
            });
            return rows.map((row) => (0, workflow_mapper_1.toWorkflowRevisionSummaryResponse)(row, workflow.version));
        }
        const rows = await this.prisma.workflowRevision.findMany({
            where: { workflowId },
            orderBy: { version: 'desc' },
            take: limit,
        });
        return rows.map((row) => (0, workflow_mapper_1.toWorkflowRevisionResponse)(row, workflow.version));
    }
    async findRevision(workflowId, version) {
        const workflow = await this.findEntityOrThrow(workflowId);
        const row = await this.prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: {
                    workflowId,
                    version,
                },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException({
                code: 'WORKFLOW_REVISION_NOT_FOUND',
                message: `Workflow ${workflowId} revision version=${version} not found`,
            });
        }
        return (0, workflow_mapper_1.toWorkflowRevisionResponse)(row, workflow.version);
    }
    async assertWorkflowReferenceCompatible(input) {
        void input.entry;
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
        });
        if (!workflow) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} is not found or inactive for this AppClient`);
        }
    }
    async assertSkillWorkflowBindingsCompatible(input) {
        var _a;
        void input.skillToolIds;
        void input.skillHostToolIds;
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true, version: true },
        });
        if (!workflow) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} is not found or inactive for this AppClient`);
        }
        const pinVersion = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : null;
        if (pinVersion != null && pinVersion !== workflow.version) {
            const revision = await this.prisma.workflowRevision.findUnique({
                where: {
                    workflowId_version: {
                        workflowId: workflow.id,
                        version: pinVersion,
                    },
                },
            });
            if (!revision) {
                throw new common_1.BadRequestException(`Workflow ${input.workflowId} revision version=${pinVersion} not found`);
            }
        }
    }
    async assertPageActionWorkflowBindingsCompatible(input) {
        var _a;
        void input.pageActionHostToolId;
        await this.assertWorkflowReferenceCompatible({
            workflowId: input.workflowId,
            appClientId: input.appClientId,
            entry: 'page_action',
        });
        const pinVersion = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : null;
        if (pinVersion == null) {
            return;
        }
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true, version: true },
        });
        if (!workflow || pinVersion === workflow.version) {
            return;
        }
        const revision = await this.prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: {
                    workflowId: workflow.id,
                    version: pinVersion,
                },
            },
        });
        if (!revision) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} revision version=${pinVersion} not found`);
        }
    }
    async findEntityOrThrow(id) {
        const row = await this.prisma.workflow.findUnique({
            where: { id },
            include: workflow_types_1.WORKFLOW_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`Workflow ${id} not found`);
        }
        return row;
    }
};
WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowService);
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflow.service.js.map