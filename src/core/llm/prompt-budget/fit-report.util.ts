import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FitReport, PromptBudgetHints } from './prompt-budget.types';
import {
  isAgentEngineDebugEnabled,
  isFileDebugLogEnabled,
} from '../../security/file-debug-log.util';

export function formatFitReportForLog(report: FitReport): string {
  const parts = [
    `fitted=${report.fitted}`,
    `skipped=${report.skipped}`,
    `budget=${report.budget}`,
    `tokensBefore=${report.tokensBefore}`,
    `tokensAfter=${report.tokensAfter}`,
    `degradations=${report.degradations.length}`,
  ];
  if (report.callKind) {
    parts.push(`callKind=${report.callKind}`);
  }
  if (report.warnings.length > 0) {
    parts.push(`warnings=${report.warnings.join('; ')}`);
  }
  return parts.join(' ');
}

export function writeFitReportDebugFile(input: {
  report: FitReport;
  hints?: PromptBudgetHints;
}): string | null {
  if (!isAgentEngineDebugEnabled() || !isFileDebugLogEnabled()) {
    return null;
  }
  const runId = input.hints?.runId;
  const sessionId = input.hints?.sessionId;
  if (runId == null || !sessionId) {
    return null;
  }
  const dir = path.join(
    process.cwd(),
    'logs',
    'agent-engine',
    'prompt-budget',
    sessionId,
  );
  try {
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `run-${runId}-fit-report.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          writtenAt: new Date().toISOString(),
          hints: input.hints ?? null,
          report: input.report,
        },
        null,
        2,
      ),
      'utf8',
    );
    return filePath;
  } catch {
    return null;
  }
}
