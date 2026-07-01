import {
  buildWorkflowInitSkippedGuidance,
  buildWorkflowInitSkippedPendingRespond,
  guidanceForWorkflowInitSkippedReadinessReason,
  hasWorkflowInitSkippedStep,
  latestWorkflowInitSkipReason,
} from './workflow-init-skip.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';

describe('workflow-init-skip.util', () => {
  it('detects skipped init step and builds pendingRespond', () => {
    const steps = [
      {
        step: 2,
        type: 'workflow',
        name: 'workflow_init_skipped',
        output: { reason: 'compile_empty' },
      },
    ] as AgentGraphState['steps'];
    expect(hasWorkflowInitSkippedStep(steps)).toBe(true);
    expect(latestWorkflowInitSkipReason(steps)).toBe('compile_empty');
    const pending = buildWorkflowInitSkippedPendingRespond({
      reason: 'compile_empty',
      userMessage: 'help',
    });
    expect(pending?.mode).toBe('turn');
    expect(
      pending && pending.mode === 'turn' ? pending.request.kind : null,
    ).toBe('unsupported_scope');
  });

  it('builds workflow-specific guidance from readinessReason', () => {
    expect(
      guidanceForWorkflowInitSkippedReadinessReason(
        'workflow_init_skipped:db_load_failed',
      ),
    ).toBe(buildWorkflowInitSkippedGuidance('db_load_failed'));
    expect(
      guidanceForWorkflowInitSkippedReadinessReason('workflow_init_skipped:unknown'),
    ).toBeNull();
  });

  it('builds guidance for trigger permission denied', () => {
    expect(buildWorkflowInitSkippedGuidance('trigger_permission_denied')).toContain(
      '写操作',
    );
    const pending = buildWorkflowInitSkippedPendingRespond({
      reason: 'trigger_permission_denied',
      userMessage: 'run workflow',
    });
    expect(pending?.mode).toBe('turn');
  });
});
