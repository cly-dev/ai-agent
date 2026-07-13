import type { AgentRunResult } from '../main/types/agent-engine.types';
import type { RunWriteConfirmResumeInput, WriteConfirmResumeDeps } from './write-confirm-resume.types';
export declare function runWriteConfirmResume(input: RunWriteConfirmResumeInput): Promise<AgentRunResult | null>;
export declare function buildWriteConfirmResumeDeps(host: WriteConfirmResumeDeps['host'], services: Omit<WriteConfirmResumeDeps, 'host'>): WriteConfirmResumeDeps;
