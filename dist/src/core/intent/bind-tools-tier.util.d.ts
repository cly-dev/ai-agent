import type { ResolvedIntentRecallConfig } from './intent-recall-config.types';
export type BindToolsTierRule = 'full' | 'recall';
export type BindToolsTierConfig = {
    fullBindMax: number;
    recallBindMax: number;
    hardCap: number;
};
export type BindToolsTierResult = {
    topK: number;
    tier: BindToolsTierRule;
    recallRequired: boolean;
};
export declare function readBindToolsTierConfig(recall: ResolvedIntentRecallConfig): BindToolsTierConfig;
export declare function resolveBindToolsTopK(candidateCount: number, cfg: BindToolsTierConfig): BindToolsTierResult;
