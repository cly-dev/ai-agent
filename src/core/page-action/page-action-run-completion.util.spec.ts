import { completeWorkflowNode, initWorkflowRun } from '../workflow/workflow-run.util';
import type { WorkflowNodeDef } from '../workflow/workflow.types';
import {
  completionFromSummarizeText,
  resolvePageWorkflowCompletion,
} from './page-action-run-completion.util';

const writeWorkflowNodes: WorkflowNodeDef[] = [
  {
    id: 'compose',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose',
    input: { toolId: 1 },
  },
  {
    id: 'await',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Confirm',
    input: {},
  },
  {
    id: 'write',
    action: 'write_data',
    name: 'Write',
    objective: 'Write',
    input: { toolId: 1 },
  },
];

function completedWriteWorkflowRun() {
  let run = initWorkflowRun({
    workflowId: 1,
    version: 1,
    nodes: writeWorkflowNodes,
    compiledFrom: 'workflow_db',
  });
  for (const node of writeWorkflowNodes) {
    run = completeWorkflowNode(run, node.id);
  }
  return { ...run, status: 'completed' as const, currentNodeId: null };
}

describe('page-action-run-completion.util', () => {
  describe('completionFromSummarizeText', () => {
    it('returns text when summary is non-empty', () => {
      expect(completionFromSummarizeText('hello')).toEqual({
        kind: 'text',
        fillText: 'hello',
        dslOutcome: null,
      });
    });

    it('returns STREAM_EMPTY when summary is blank', () => {
      expect(completionFromSummarizeText('   ')).toEqual({
        kind: 'failed',
        errorCode: 'STREAM_EMPTY',
        errorMessage: 'LLM produced empty summary text',
      });
    });
  });

  describe('resolvePageWorkflowCompletion', () => {
    it('returns http_write when last node is write_data and fillText is empty', () => {
      const workflowRun = completedWriteWorkflowRun();
      const completion = resolvePageWorkflowCompletion({
        workflowNodes: writeWorkflowNodes,
        workflowRun,
        runtime: {
          fillText: '',
          dslOutcome: null,
          nodeOutputs: {
            write: { tool: 'review.autoReply', output: { ok: true } },
          },
        },
      });

      expect(completion).toEqual({
        kind: 'http_write',
        nodeId: 'write',
        toolName: 'review.autoReply',
      });
    });

    it('prefers http_write over stale fillText when workflow ends with write_data', () => {
      const workflowRun = completedWriteWorkflowRun();
      const completion = resolvePageWorkflowCompletion({
        workflowNodes: writeWorkflowNodes,
        workflowRun,
        runtime: {
          fillText: 'Earlier summary text',
          dslOutcome: null,
          nodeOutputs: {
            write: { tool: 'review.autoReply', output: { ok: true } },
          },
        },
      });

      expect(completion).toEqual({
        kind: 'http_write',
        nodeId: 'write',
        toolName: 'review.autoReply',
      });
    });

    it('returns suspended when approval gate paused the workflow', () => {
      const completion = resolvePageWorkflowCompletion({
        workflowNodes: writeWorkflowNodes,
        workflowRun: initWorkflowRun({
          workflowId: 1,
          version: 1,
          nodes: writeWorkflowNodes,
          compiledFrom: 'workflow_db',
        }),
        runtime: { fillText: '', dslOutcome: null, nodeOutputs: {} },
        suspended: true,
        approvalRequestId: 42,
      });

      expect(completion).toEqual({
        kind: 'suspended',
        approvalRequestId: 42,
      });
    });

    it('returns STREAM_EMPTY when last node is summarize and fillText is empty', () => {
      const nodes: WorkflowNodeDef[] = [
        {
          id: 'summarize',
          action: 'summarize',
          name: 'Summarize',
          objective: 'Summarize',
          input: { mode: 'final' },
        },
      ];
      let workflowRun = initWorkflowRun({
        workflowId: 1,
        version: 1,
        nodes,
        compiledFrom: 'workflow_db',
      });
      workflowRun = completeWorkflowNode(workflowRun, 'summarize');
      workflowRun = { ...workflowRun, status: 'completed', currentNodeId: null };

      const completion = resolvePageWorkflowCompletion({
        workflowNodes: nodes,
        workflowRun,
        runtime: { fillText: '', dslOutcome: null, nodeOutputs: {} },
      });

      expect(completion).toEqual({
        kind: 'failed',
        errorCode: 'STREAM_EMPTY',
        errorMessage: 'Expected text output but none was produced',
      });
    });

    it('returns text when fillText is present and last node is not http terminal', () => {
      const nodes: WorkflowNodeDef[] = [
        {
          id: 'summarize',
          action: 'summarize',
          name: 'Summarize',
          objective: 'Summarize',
          input: { mode: 'final' },
        },
      ];
      let workflowRun = initWorkflowRun({
        workflowId: 1,
        version: 1,
        nodes,
        compiledFrom: 'workflow_db',
      });
      workflowRun = completeWorkflowNode(workflowRun, 'summarize');
      workflowRun = { ...workflowRun, status: 'completed', currentNodeId: null };

      const completion = resolvePageWorkflowCompletion({
        workflowNodes: nodes,
        workflowRun,
        runtime: {
          fillText: 'Final answer',
          dslOutcome: null,
          nodeOutputs: {},
        },
      });

      expect(completion).toEqual({
        kind: 'text',
        fillText: 'Final answer',
        dslOutcome: null,
      });
    });
  });
});
