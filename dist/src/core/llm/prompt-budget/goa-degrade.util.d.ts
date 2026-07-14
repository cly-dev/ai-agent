import type { SessionGoaSection } from './prompt-budget.types';
export declare function detectSessionGoaSection(text: string): SessionGoaSection;
export declare function degradeSessionGoaText(text: string, section: SessionGoaSection, level: 1 | 2 | 3): string | null;
export declare function degradeSessionHistorySummary(text: string, level: 1 | 2): string | null;
export declare function degradePageContext(text: string, level: 1 | 2): string;
