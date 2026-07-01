import { Injectable, Logger } from '@nestjs/common';
import type { LlmChatMessage } from '../llm.types';
import type {
  FitMessagesResult,
  PromptBudgetHints,
} from './prompt-budget.types';
import { fitPromptToBudget } from './fit-prompt-to-budget.util';
import {
  formatFitReportForLog,
  writeFitReportDebugFile,
} from './fit-report.util';

@Injectable()
export class PromptBudgetService {
  private readonly logger = new Logger(PromptBudgetService.name);

  fitMessages(
    messages: LlmChatMessage[],
    budget: number,
    hints?: PromptBudgetHints,
  ): FitMessagesResult {
    const result = fitPromptToBudget(messages, budget, hints);
    const { report } = result;

    if (!report.skipped && report.degradations.length > 0) {
      const level =
        report.fitted ? 'debug' : 'warn';
      this.logger[level](
        `prompt budget fit ${formatFitReportForLog(report)} sessionId=${hints?.sessionId ?? '-'} runId=${hints?.runId ?? '-'}`,
      );
    }

    if (!report.skipped && !report.fitted) {
      this.logger.warn(
        `prompt budget not fully fitted ${formatFitReportForLog(report)}`,
      );
    }

    writeFitReportDebugFile({ report, hints });

    return result;
  }
}

export { fitPromptToBudget } from './fit-prompt-to-budget.util';
