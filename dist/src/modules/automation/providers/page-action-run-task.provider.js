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
exports.PageActionRunTaskProvider = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const automation_task_mapper_1 = require("../automation-task.mapper");
let PageActionRunTaskProvider = class PageActionRunTaskProvider {
    constructor(prisma) {
        this.prisma = prisma;
        this.triggerSource = 'page_action';
    }
    async list(filter) {
        var _a, _b, _c, _d, _e, _f;
        const limit = Math.min((_a = filter.limit) !== null && _a !== void 0 ? _a : 20, 100);
        const offset = (_b = filter.offset) !== null && _b !== void 0 ? _b : 0;
        const where = Object.assign({ appClientId: filter.appClientId, userId: filter.userId, status: (0, automation_task_mapper_1.resolvePageActionRunStatusWhere)(filter.status) }, (((_c = filter.actionKey) === null || _c === void 0 ? void 0 : _c.trim()) || ((_d = filter.workflowKey) === null || _d === void 0 ? void 0 : _d.trim())
            ? {
                pageAction: Object.assign(Object.assign({}, (((_e = filter.actionKey) === null || _e === void 0 ? void 0 : _e.trim())
                    ? { actionKey: { contains: filter.actionKey.trim() } }
                    : {})), (((_f = filter.workflowKey) === null || _f === void 0 ? void 0 : _f.trim())
                    ? { workflow: { workflowKey: filter.workflowKey.trim() } }
                    : {})),
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageActionRun.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                include: automation_task_mapper_1.AUTOMATION_PAGE_ACTION_RUN_INCLUDE,
            }),
            this.prisma.pageActionRun.count({ where }),
        ]);
        return {
            items: rows.map(automation_task_mapper_1.toAutomationTaskFromPageActionRun),
            total,
        };
    }
    async getDetail(input) {
        const row = await this.prisma.pageActionRun.findFirst({
            where: {
                id: input.id,
                appClientId: input.appClientId,
                userId: input.userId,
            },
            include: automation_task_mapper_1.AUTOMATION_PAGE_ACTION_RUN_INCLUDE,
        });
        if (!row) {
            return null;
        }
        return (0, automation_task_mapper_1.toAutomationTaskDetailFromPageActionRun)(row);
    }
};
PageActionRunTaskProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PageActionRunTaskProvider);
exports.PageActionRunTaskProvider = PageActionRunTaskProvider;
//# sourceMappingURL=page-action-run-task.provider.js.map