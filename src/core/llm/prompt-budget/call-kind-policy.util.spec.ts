import {
  applyCallKindPolicyToBlock,
  resolveCallKindPolicy,
} from './call-kind-policy.util';
import { BLOCK_MAX_DEGRADE } from './prompt-budget.constants';

describe('call-kind-policy', () => {
  it('skips fit for compression and gather_page_summary', () => {
    expect(resolveCallKindPolicy('compression').skipFit).toBe(true);
    expect(resolveCallKindPolicy('gather_page_summary').skipFit).toBe(true);
    expect(resolveCallKindPolicy('schema_inference').skipFit).toBe(true);
    expect(resolveCallKindPolicy(undefined, true).skipFit).toBe(true);
  });

  it('caps summarize degradation for protected kinds', () => {
    const policy = resolveCallKindPolicy('summarize');

    expect(
      applyCallKindPolicyToBlock(
        'current_user_request',
        BLOCK_MAX_DEGRADE.current_user_request,
        policy,
      ),
    ).toBe(0);
    expect(
      applyCallKindPolicyToBlock(
        'plan_context',
        BLOCK_MAX_DEGRADE.plan_context,
        policy,
      ),
    ).toBe(1);
    expect(
      applyCallKindPolicyToBlock(
        'current_run_observations',
        BLOCK_MAX_DEGRADE.current_run_observations,
        policy,
      ),
    ).toBe(2);
    expect(
      applyCallKindPolicyToBlock(
        'pending_write_tool_call',
        BLOCK_MAX_DEGRADE.pending_write_tool_call,
        policy,
      ),
    ).toBe(0);
    expect(
      applyCallKindPolicyToBlock(
        'tool_schema',
        BLOCK_MAX_DEGRADE.tool_schema,
        policy,
      ),
    ).toBe(2);
    expect(
      applyCallKindPolicyToBlock(
        'summarize_context',
        BLOCK_MAX_DEGRADE.summarize_context,
        policy,
      ),
    ).toBe(2);
  });

  it('allows decision path to degrade current_run to L2', () => {
    const policy = resolveCallKindPolicy('decision');
    expect(
      applyCallKindPolicyToBlock(
        'current_run_observations',
        BLOCK_MAX_DEGRADE.current_run_observations,
        policy,
      ),
    ).toBe(2);
  });
});
