export type PageContextDataSufficiency = 'inline' | 'entity_only' | 'none';
export type PageContextDataAssessment = {
    page: string | null;
    entityType: string | null;
    entityId: string | null;
    dataSufficiency: PageContextDataSufficiency;
    inlineContentKinds: string[];
};
export type PageContextUsage = PageContextDataAssessment & {
    applies: boolean;
};
export type PageContextTaskKind = 'analyze' | 'answer' | 'mutation' | 'none';
export type TurnPageReadKind = 'analyze' | 'answer' | 'none';
export type PageContextPlanKind = 'none' | 'inline_answer' | 'entity_read_detail';
