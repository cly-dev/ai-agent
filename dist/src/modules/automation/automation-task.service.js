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
exports.AutomationTaskService = void 0;
const common_1 = require("@nestjs/common");
const page_action_run_task_provider_1 = require("./providers/page-action-run-task.provider");
let AutomationTaskService = class AutomationTaskService {
    constructor(pageActionRunTaskProvider) {
        this.providers = [pageActionRunTaskProvider];
    }
    async list(filter) {
        var _a;
        const triggerSource = (_a = filter.triggerSource) !== null && _a !== void 0 ? _a : 'all';
        if (triggerSource === 'webhook') {
            return { items: [], total: 0 };
        }
        const pageActionProvider = this.providers.find((row) => row.triggerSource === 'page_action');
        if (!pageActionProvider) {
            return { items: [], total: 0 };
        }
        return pageActionProvider.list(filter);
    }
    async getDetail(input) {
        if (input.kind === 'webhook_approval') {
            throw new common_1.NotFoundException('Webhook automation tasks are not available yet');
        }
        const provider = this.providers.find((row) => row.triggerSource === 'page_action');
        const detail = await (provider === null || provider === void 0 ? void 0 : provider.getDetail(input));
        if (!detail) {
            throw new common_1.NotFoundException('Automation task not found');
        }
        return detail;
    }
};
AutomationTaskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [page_action_run_task_provider_1.PageActionRunTaskProvider])
], AutomationTaskService);
exports.AutomationTaskService = AutomationTaskService;
//# sourceMappingURL=automation-task.service.js.map