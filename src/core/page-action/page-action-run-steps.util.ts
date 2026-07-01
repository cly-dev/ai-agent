import type { HostActionSsePayload } from '../host-bridge/host-action.types';
import { isHostActionStreamPayload } from '../host-bridge/host-tool-stream.types';

export type PageActionRunStepType = 'lifecycle' | 'llm' | 'dsl' | 'workflow' | 'harness';

export type PageActionRunStep = {
  step: number;
  type: PageActionRunStepType;
  name: string;
  at: string;
  status?: 'ok' | 'failed' | 'skipped';
  detail?: Record<string, unknown>;
};

export class PageActionRunStepRecorder {
  private nextStep = 1;

  constructor(private readonly steps: PageActionRunStep[] = []) {
    if (steps.length > 0) {
      this.nextStep = Math.max(...steps.map((row) => row.step)) + 1;
    }
  }

  static fromJson(value: unknown): PageActionRunStepRecorder {
    if (!Array.isArray(value)) {
      return new PageActionRunStepRecorder();
    }
    const steps = value.filter(
      (row): row is PageActionRunStep =>
        typeof row === 'object' &&
        row != null &&
        typeof (row as PageActionRunStep).step === 'number' &&
        typeof (row as PageActionRunStep).type === 'string' &&
        typeof (row as PageActionRunStep).name === 'string',
    );
    return new PageActionRunStepRecorder(steps);
  }

  record(input: {
    type: PageActionRunStepType;
    name: string;
    status?: PageActionRunStep['status'];
    detail?: Record<string, unknown>;
  }): PageActionRunStep {
    const row: PageActionRunStep = {
      step: this.nextStep,
      type: input.type,
      name: input.name,
      at: new Date().toISOString(),
      ...(input.status ? { status: input.status } : {}),
      ...(input.detail ? { detail: input.detail } : {}),
    };
    this.nextStep += 1;
    this.steps.push(row);
    return row;
  }

  recordLifecycle(
    phase: string,
    detail?: Record<string, unknown>,
    status?: PageActionRunStep['status'],
  ): PageActionRunStep {
    return this.record({
      type: 'lifecycle',
      name: phase,
      status,
      detail,
    });
  }

  recordLlm(
    name: string,
    detail?: Record<string, unknown>,
    status: PageActionRunStep['status'] = 'ok',
  ): PageActionRunStep {
    return this.record({ type: 'llm', name, detail, status });
  }

  recordHostActionPayload(payload: HostActionSsePayload): PageActionRunStep | null {
    if (!isHostActionStreamPayload(payload)) {
      return this.record({
        type: 'dsl',
        name: 'host_action.batch',
        detail: {
          hostToolCount: payload.hostTools?.length ?? 0,
          reason: payload.reason ?? null,
        },
      });
    }
    const op = payload.dsl?.op ?? `stream.${payload.stream.mode}`;
    const detail: Record<string, unknown> = {
      streamMode: payload.stream.mode,
      seq: payload.stream.seq,
      reason: payload.reason ?? null,
      streamId:
        payload.dsl && 'streamId' in payload.dsl
          ? payload.dsl.streamId
          : null,
    };
    if (payload.dsl?.op === 'arg.append') {
      detail.appendChunkLength = payload.dsl.chunk.length;
    }
    if (payload.stream.mode === 'full') {
      detail.hostToolCount = payload.hostTools?.length ?? 0;
      detail.generation = payload.generation ?? null;
    }
    return this.record({
      type: 'dsl',
      name: op,
      detail,
      status: payload.stream.mode === 'full' ? 'ok' : undefined,
    });
  }

  toJson(): PageActionRunStep[] {
    return [...this.steps];
  }
}
