import type { DetectClueItemResult, DetectCluesOutput } from '../workflow.types';
export declare function normalizeDetectCluesOutput(input: {
    configuredKeys: string[];
    rawClues: Array<Partial<DetectClueItemResult> & {
        key?: string;
    }>;
}): DetectCluesOutput;
