"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PromptBudgetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.fitPromptToBudget = exports.PromptBudgetService = void 0;
const common_1 = require("@nestjs/common");
const fit_prompt_to_budget_util_1 = require("./fit-prompt-to-budget.util");
const fit_report_util_1 = require("./fit-report.util");
let PromptBudgetService = PromptBudgetService_1 = class PromptBudgetService {
    constructor() {
        this.logger = new common_1.Logger(PromptBudgetService_1.name);
    }
    fitMessages(messages, budget, hints) {
        var _a, _b;
        const result = (0, fit_prompt_to_budget_util_1.fitPromptToBudget)(messages, budget, hints);
        const { report } = result;
        if (!report.skipped && report.degradations.length > 0) {
            const level = report.fitted ? 'debug' : 'warn';
            this.logger[level](`prompt budget fit ${(0, fit_report_util_1.formatFitReportForLog)(report)} sessionId=${(_a = hints === null || hints === void 0 ? void 0 : hints.sessionId) !== null && _a !== void 0 ? _a : '-'} runId=${(_b = hints === null || hints === void 0 ? void 0 : hints.runId) !== null && _b !== void 0 ? _b : '-'}`);
        }
        if (!report.skipped && !report.fitted) {
            this.logger.warn(`prompt budget not fully fitted ${(0, fit_report_util_1.formatFitReportForLog)(report)}`);
        }
        (0, fit_report_util_1.writeFitReportDebugFile)({ report, hints });
        return result;
    }
};
PromptBudgetService = PromptBudgetService_1 = __decorate([
    (0, common_1.Injectable)()
], PromptBudgetService);
exports.PromptBudgetService = PromptBudgetService;
var fit_prompt_to_budget_util_2 = require("./fit-prompt-to-budget.util");
Object.defineProperty(exports, "fitPromptToBudget", { enumerable: true, get: function () { return fit_prompt_to_budget_util_2.fitPromptToBudget; } });
//# sourceMappingURL=prompt-budget.service.js.map