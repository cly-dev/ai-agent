import {
  buildGatherPipelineAudit,
  pendingClarificationFromRespond,
} from './gather-pipeline-audit.util';
import { CLARIFICATION_REQUEST_OBSERVATION_NAME } from './turn-respond.util';
import type { AgentRunStep } from '../main/types/agent-engine.types';

describe('gather-pipeline-audit.util', () => {
  it('flags premature clarification without tool execution', () => {
    const steps: AgentRunStep[] = [
      {
        step: 1,
        type: 'tool_resolve',
        output: {
          strategy: 'plan_pinned_tool',
          candidateCount: 1,
          candidateNames: ['listRecords'],
        },
      },
      {
        step: 2,
        type: 'llm',
        output: { toolCalls: [] },
      },
      {
        step: 3,
        type: 'param_gate',
        output: { status: 'ready', missingFieldCount: 0 },
      },
    ];
    const audit = buildGatherPipelineAudit({
      steps,
      planStepId: 'fetch',
      pendingClarification: true,
    });
    expect(audit.prematureClarification).toBe(true);
    expect(audit.toolsStepCount).toBe(0);
    expect(audit.invariantViolations).toContain(
      'clarification_without_tools_execution',
    );
    expect(audit.invariantViolations).toContain(
      'clarification_without_tool_calls_or_param_gate',
    );
  });

  it('accepts param_gate clarification as valid invariant path', () => {
    const steps: AgentRunStep[] = [
      {
        step: 1,
        type: 'llm',
        output: {
          toolCalls: [{ name: 'listRecords', args: {} }],
        },
      },
      {
        step: 2,
        type: 'param_gate',
        output: { status: 'clarify', missingFieldCount: 1 },
      },
    ];
    const audit = buildGatherPipelineAudit({
      steps,
      pendingClarification: true,
    });
    expect(audit.invariantViolations).not.toContain(
      'clarification_without_tool_calls_or_param_gate',
    );
  });

  it('detects pending clarification from turn respond', () => {
    expect(
      pendingClarificationFromRespond({
        mode: 'turn',
        request: { kind: 'clarification', userMessage: 'need sku' },
      }),
    ).toBe(true);
    expect(
      pendingClarificationFromRespond({
        mode: 'observation',
        observation: {
          name: CLARIFICATION_REQUEST_OBSERVATION_NAME,
          output: {},
        },
      }),
    ).toBe(true);
  });
});
