export type HostToolDecisionDefinition = {
    id: number;
    name: string;
    description: string;
    argsSchema: Record<string, unknown>;
    hostPageScope?: string | null;
    isRequired?: boolean;
};
