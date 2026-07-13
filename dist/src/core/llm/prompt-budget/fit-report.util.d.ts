import type { FitReport, PromptBudgetHints } from './prompt-budget.types';
export declare function formatFitReportForLog(report: FitReport): string;
export declare function writeFitReportDebugFile(input: {
    report: FitReport;
    hints?: PromptBudgetHints;
}): string | null;
