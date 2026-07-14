import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type AgentModel = runtime.Types.Result.DefaultSelection<Prisma.$AgentPayload>;
export type AggregateAgent = {
    _count: AgentCountAggregateOutputType | null;
    _avg: AgentAvgAggregateOutputType | null;
    _sum: AgentSumAggregateOutputType | null;
    _min: AgentMinAggregateOutputType | null;
    _max: AgentMaxAggregateOutputType | null;
};
export type AgentAvgAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    maxSteps: number | null;
};
export type AgentSumAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    maxSteps: number | null;
};
export type AgentMinAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    name: string | null;
    description: string | null;
    systemPrompt: string | null;
    maxSteps: number | null;
    enableToolCall: boolean | null;
    restrictTools: boolean | null;
    restrictHostTools: boolean | null;
    restrictSkills: boolean | null;
    createdAt: Date | null;
};
export type AgentMaxAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    name: string | null;
    description: string | null;
    systemPrompt: string | null;
    maxSteps: number | null;
    enableToolCall: boolean | null;
    restrictTools: boolean | null;
    restrictHostTools: boolean | null;
    restrictSkills: boolean | null;
    createdAt: Date | null;
};
export type AgentCountAggregateOutputType = {
    id: number;
    appClientId: number;
    name: number;
    description: number;
    systemPrompt: number;
    maxSteps: number;
    enableToolCall: number;
    restrictTools: number;
    restrictHostTools: number;
    restrictSkills: number;
    config: number;
    createdAt: number;
    _all: number;
};
export type AgentAvgAggregateInputType = {
    id?: true;
    appClientId?: true;
    maxSteps?: true;
};
export type AgentSumAggregateInputType = {
    id?: true;
    appClientId?: true;
    maxSteps?: true;
};
export type AgentMinAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    description?: true;
    systemPrompt?: true;
    maxSteps?: true;
    enableToolCall?: true;
    restrictTools?: true;
    restrictHostTools?: true;
    restrictSkills?: true;
    createdAt?: true;
};
export type AgentMaxAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    description?: true;
    systemPrompt?: true;
    maxSteps?: true;
    enableToolCall?: true;
    restrictTools?: true;
    restrictHostTools?: true;
    restrictSkills?: true;
    createdAt?: true;
};
export type AgentCountAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    description?: true;
    systemPrompt?: true;
    maxSteps?: true;
    enableToolCall?: true;
    restrictTools?: true;
    restrictHostTools?: true;
    restrictSkills?: true;
    config?: true;
    createdAt?: true;
    _all?: true;
};
export type AgentAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput | Prisma.AgentOrderByWithRelationInput[];
    cursor?: Prisma.AgentWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AgentCountAggregateInputType;
    _avg?: AgentAvgAggregateInputType;
    _sum?: AgentSumAggregateInputType;
    _min?: AgentMinAggregateInputType;
    _max?: AgentMaxAggregateInputType;
};
export type GetAgentAggregateType<T extends AgentAggregateArgs> = {
    [P in keyof T & keyof AggregateAgent]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAgent[P]> : Prisma.GetScalarType<T[P], AggregateAgent[P]>;
};
export type AgentGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithAggregationInput | Prisma.AgentOrderByWithAggregationInput[];
    by: Prisma.AgentScalarFieldEnum[] | Prisma.AgentScalarFieldEnum;
    having?: Prisma.AgentScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AgentCountAggregateInputType | true;
    _avg?: AgentAvgAggregateInputType;
    _sum?: AgentSumAggregateInputType;
    _min?: AgentMinAggregateInputType;
    _max?: AgentMaxAggregateInputType;
};
export type AgentGroupByOutputType = {
    id: number;
    appClientId: number;
    name: string;
    description: string | null;
    systemPrompt: string;
    maxSteps: number;
    enableToolCall: boolean;
    restrictTools: boolean;
    restrictHostTools: boolean;
    restrictSkills: boolean;
    config: runtime.JsonValue | null;
    createdAt: Date;
    _count: AgentCountAggregateOutputType | null;
    _avg: AgentAvgAggregateOutputType | null;
    _sum: AgentSumAggregateOutputType | null;
    _min: AgentMinAggregateOutputType | null;
    _max: AgentMaxAggregateOutputType | null;
};
export type GetAgentGroupByPayload<T extends AgentGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AgentGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AgentGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AgentGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AgentGroupByOutputType[P]>;
}>>;
export type AgentWhereInput = {
    AND?: Prisma.AgentWhereInput | Prisma.AgentWhereInput[];
    OR?: Prisma.AgentWhereInput[];
    NOT?: Prisma.AgentWhereInput | Prisma.AgentWhereInput[];
    id?: Prisma.IntFilter<"Agent"> | number;
    appClientId?: Prisma.IntFilter<"Agent"> | number;
    name?: Prisma.StringFilter<"Agent"> | string;
    description?: Prisma.StringNullableFilter<"Agent"> | string | null;
    systemPrompt?: Prisma.StringFilter<"Agent"> | string;
    maxSteps?: Prisma.IntFilter<"Agent"> | number;
    enableToolCall?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictHostTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictSkills?: Prisma.BoolFilter<"Agent"> | boolean;
    config?: Prisma.JsonNullableFilter<"Agent">;
    createdAt?: Prisma.DateTimeFilter<"Agent"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    agentSkills?: Prisma.AgentSkillListRelationFilter;
    agentRuns?: Prisma.AgentRunListRelationFilter;
    agentTools?: Prisma.AgentToolListRelationFilter;
    agentHostTools?: Prisma.AgentHostToolListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    promptTemplates?: Prisma.PromptTemplateListRelationFilter;
};
export type AgentOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    systemPrompt?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
    enableToolCall?: Prisma.SortOrder;
    restrictTools?: Prisma.SortOrder;
    restrictHostTools?: Prisma.SortOrder;
    restrictSkills?: Prisma.SortOrder;
    config?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    agentSkills?: Prisma.AgentSkillOrderByRelationAggregateInput;
    agentRuns?: Prisma.AgentRunOrderByRelationAggregateInput;
    agentTools?: Prisma.AgentToolOrderByRelationAggregateInput;
    agentHostTools?: Prisma.AgentHostToolOrderByRelationAggregateInput;
    messageTurns?: Prisma.MessageTurnOrderByRelationAggregateInput;
    promptTemplates?: Prisma.PromptTemplateOrderByRelationAggregateInput;
};
export type AgentWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.AgentWhereInput | Prisma.AgentWhereInput[];
    OR?: Prisma.AgentWhereInput[];
    NOT?: Prisma.AgentWhereInput | Prisma.AgentWhereInput[];
    appClientId?: Prisma.IntFilter<"Agent"> | number;
    name?: Prisma.StringFilter<"Agent"> | string;
    description?: Prisma.StringNullableFilter<"Agent"> | string | null;
    systemPrompt?: Prisma.StringFilter<"Agent"> | string;
    maxSteps?: Prisma.IntFilter<"Agent"> | number;
    enableToolCall?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictHostTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictSkills?: Prisma.BoolFilter<"Agent"> | boolean;
    config?: Prisma.JsonNullableFilter<"Agent">;
    createdAt?: Prisma.DateTimeFilter<"Agent"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    agentSkills?: Prisma.AgentSkillListRelationFilter;
    agentRuns?: Prisma.AgentRunListRelationFilter;
    agentTools?: Prisma.AgentToolListRelationFilter;
    agentHostTools?: Prisma.AgentHostToolListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    promptTemplates?: Prisma.PromptTemplateListRelationFilter;
}, "id">;
export type AgentOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    systemPrompt?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
    enableToolCall?: Prisma.SortOrder;
    restrictTools?: Prisma.SortOrder;
    restrictHostTools?: Prisma.SortOrder;
    restrictSkills?: Prisma.SortOrder;
    config?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.AgentCountOrderByAggregateInput;
    _avg?: Prisma.AgentAvgOrderByAggregateInput;
    _max?: Prisma.AgentMaxOrderByAggregateInput;
    _min?: Prisma.AgentMinOrderByAggregateInput;
    _sum?: Prisma.AgentSumOrderByAggregateInput;
};
export type AgentScalarWhereWithAggregatesInput = {
    AND?: Prisma.AgentScalarWhereWithAggregatesInput | Prisma.AgentScalarWhereWithAggregatesInput[];
    OR?: Prisma.AgentScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AgentScalarWhereWithAggregatesInput | Prisma.AgentScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Agent"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"Agent"> | number;
    name?: Prisma.StringWithAggregatesFilter<"Agent"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Agent"> | string | null;
    systemPrompt?: Prisma.StringWithAggregatesFilter<"Agent"> | string;
    maxSteps?: Prisma.IntWithAggregatesFilter<"Agent"> | number;
    enableToolCall?: Prisma.BoolWithAggregatesFilter<"Agent"> | boolean;
    restrictTools?: Prisma.BoolWithAggregatesFilter<"Agent"> | boolean;
    restrictHostTools?: Prisma.BoolWithAggregatesFilter<"Agent"> | boolean;
    restrictSkills?: Prisma.BoolWithAggregatesFilter<"Agent"> | boolean;
    config?: Prisma.JsonNullableWithAggregatesFilter<"Agent">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Agent"> | Date | string;
};
export type AgentCreateInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentUpdateInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateManyInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type AgentUpdateManyMutationInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentListRelationFilter = {
    every?: Prisma.AgentWhereInput;
    some?: Prisma.AgentWhereInput;
    none?: Prisma.AgentWhereInput;
};
export type AgentOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AgentScalarRelationFilter = {
    is?: Prisma.AgentWhereInput;
    isNot?: Prisma.AgentWhereInput;
};
export type AgentCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    systemPrompt?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
    enableToolCall?: Prisma.SortOrder;
    restrictTools?: Prisma.SortOrder;
    restrictHostTools?: Prisma.SortOrder;
    restrictSkills?: Prisma.SortOrder;
    config?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
};
export type AgentMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    systemPrompt?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
    enableToolCall?: Prisma.SortOrder;
    restrictTools?: Prisma.SortOrder;
    restrictHostTools?: Prisma.SortOrder;
    restrictSkills?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    systemPrompt?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
    enableToolCall?: Prisma.SortOrder;
    restrictTools?: Prisma.SortOrder;
    restrictHostTools?: Prisma.SortOrder;
    restrictSkills?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    maxSteps?: Prisma.SortOrder;
};
export type AgentNullableScalarRelationFilter = {
    is?: Prisma.AgentWhereInput | null;
    isNot?: Prisma.AgentWhereInput | null;
};
export type AgentCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput> | Prisma.AgentCreateWithoutAppClientInput[] | Prisma.AgentUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAppClientInput | Prisma.AgentCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.AgentCreateManyAppClientInputEnvelope;
    connect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
};
export type AgentUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput> | Prisma.AgentCreateWithoutAppClientInput[] | Prisma.AgentUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAppClientInput | Prisma.AgentCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.AgentCreateManyAppClientInputEnvelope;
    connect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
};
export type AgentUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput> | Prisma.AgentCreateWithoutAppClientInput[] | Prisma.AgentUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAppClientInput | Prisma.AgentCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.AgentUpsertWithWhereUniqueWithoutAppClientInput | Prisma.AgentUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.AgentCreateManyAppClientInputEnvelope;
    set?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    disconnect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    delete?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    connect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    update?: Prisma.AgentUpdateWithWhereUniqueWithoutAppClientInput | Prisma.AgentUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.AgentUpdateManyWithWhereWithoutAppClientInput | Prisma.AgentUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.AgentScalarWhereInput | Prisma.AgentScalarWhereInput[];
};
export type AgentUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput> | Prisma.AgentCreateWithoutAppClientInput[] | Prisma.AgentUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAppClientInput | Prisma.AgentCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.AgentUpsertWithWhereUniqueWithoutAppClientInput | Prisma.AgentUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.AgentCreateManyAppClientInputEnvelope;
    set?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    disconnect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    delete?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    connect?: Prisma.AgentWhereUniqueInput | Prisma.AgentWhereUniqueInput[];
    update?: Prisma.AgentUpdateWithWhereUniqueWithoutAppClientInput | Prisma.AgentUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.AgentUpdateManyWithWhereWithoutAppClientInput | Prisma.AgentUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.AgentScalarWhereInput | Prisma.AgentScalarWhereInput[];
};
export type AgentCreateNestedOneWithoutAgentSkillsInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentSkillsInput, Prisma.AgentUncheckedCreateWithoutAgentSkillsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentSkillsInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneRequiredWithoutAgentSkillsNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentSkillsInput, Prisma.AgentUncheckedCreateWithoutAgentSkillsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentSkillsInput;
    upsert?: Prisma.AgentUpsertWithoutAgentSkillsInput;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutAgentSkillsInput, Prisma.AgentUpdateWithoutAgentSkillsInput>, Prisma.AgentUncheckedUpdateWithoutAgentSkillsInput>;
};
export type AgentCreateNestedOneWithoutPromptTemplatesInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutPromptTemplatesInput, Prisma.AgentUncheckedCreateWithoutPromptTemplatesInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutPromptTemplatesInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneWithoutPromptTemplatesNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutPromptTemplatesInput, Prisma.AgentUncheckedCreateWithoutPromptTemplatesInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutPromptTemplatesInput;
    upsert?: Prisma.AgentUpsertWithoutPromptTemplatesInput;
    disconnect?: Prisma.AgentWhereInput | boolean;
    delete?: Prisma.AgentWhereInput | boolean;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutPromptTemplatesInput, Prisma.AgentUpdateWithoutPromptTemplatesInput>, Prisma.AgentUncheckedUpdateWithoutPromptTemplatesInput>;
};
export type AgentCreateNestedOneWithoutMessageTurnsInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutMessageTurnsInput, Prisma.AgentUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutMessageTurnsInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneWithoutMessageTurnsNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutMessageTurnsInput, Prisma.AgentUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutMessageTurnsInput;
    upsert?: Prisma.AgentUpsertWithoutMessageTurnsInput;
    disconnect?: Prisma.AgentWhereInput | boolean;
    delete?: Prisma.AgentWhereInput | boolean;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutMessageTurnsInput, Prisma.AgentUpdateWithoutMessageTurnsInput>, Prisma.AgentUncheckedUpdateWithoutMessageTurnsInput>;
};
export type AgentCreateNestedOneWithoutAgentRunsInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentRunsInput, Prisma.AgentUncheckedCreateWithoutAgentRunsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentRunsInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneRequiredWithoutAgentRunsNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentRunsInput, Prisma.AgentUncheckedCreateWithoutAgentRunsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentRunsInput;
    upsert?: Prisma.AgentUpsertWithoutAgentRunsInput;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutAgentRunsInput, Prisma.AgentUpdateWithoutAgentRunsInput>, Prisma.AgentUncheckedUpdateWithoutAgentRunsInput>;
};
export type AgentCreateNestedOneWithoutAgentToolsInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentToolsInput, Prisma.AgentUncheckedCreateWithoutAgentToolsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentToolsInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneRequiredWithoutAgentToolsNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentToolsInput, Prisma.AgentUncheckedCreateWithoutAgentToolsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentToolsInput;
    upsert?: Prisma.AgentUpsertWithoutAgentToolsInput;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutAgentToolsInput, Prisma.AgentUpdateWithoutAgentToolsInput>, Prisma.AgentUncheckedUpdateWithoutAgentToolsInput>;
};
export type AgentCreateNestedOneWithoutAgentHostToolsInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentHostToolsInput, Prisma.AgentUncheckedCreateWithoutAgentHostToolsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentHostToolsInput;
    connect?: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateOneRequiredWithoutAgentHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.AgentCreateWithoutAgentHostToolsInput, Prisma.AgentUncheckedCreateWithoutAgentHostToolsInput>;
    connectOrCreate?: Prisma.AgentCreateOrConnectWithoutAgentHostToolsInput;
    upsert?: Prisma.AgentUpsertWithoutAgentHostToolsInput;
    connect?: Prisma.AgentWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AgentUpdateToOneWithWhereWithoutAgentHostToolsInput, Prisma.AgentUpdateWithoutAgentHostToolsInput>, Prisma.AgentUncheckedUpdateWithoutAgentHostToolsInput>;
};
export type AgentCreateWithoutAppClientInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutAppClientInput = {
    id?: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutAppClientInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput>;
};
export type AgentCreateManyAppClientInputEnvelope = {
    data: Prisma.AgentCreateManyAppClientInput | Prisma.AgentCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type AgentUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.AgentWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentUpdateWithoutAppClientInput, Prisma.AgentUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAppClientInput, Prisma.AgentUncheckedCreateWithoutAppClientInput>;
};
export type AgentUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.AgentWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutAppClientInput, Prisma.AgentUncheckedUpdateWithoutAppClientInput>;
};
export type AgentUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.AgentScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateManyMutationInput, Prisma.AgentUncheckedUpdateManyWithoutAppClientInput>;
};
export type AgentScalarWhereInput = {
    AND?: Prisma.AgentScalarWhereInput | Prisma.AgentScalarWhereInput[];
    OR?: Prisma.AgentScalarWhereInput[];
    NOT?: Prisma.AgentScalarWhereInput | Prisma.AgentScalarWhereInput[];
    id?: Prisma.IntFilter<"Agent"> | number;
    appClientId?: Prisma.IntFilter<"Agent"> | number;
    name?: Prisma.StringFilter<"Agent"> | string;
    description?: Prisma.StringNullableFilter<"Agent"> | string | null;
    systemPrompt?: Prisma.StringFilter<"Agent"> | string;
    maxSteps?: Prisma.IntFilter<"Agent"> | number;
    enableToolCall?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictHostTools?: Prisma.BoolFilter<"Agent"> | boolean;
    restrictSkills?: Prisma.BoolFilter<"Agent"> | boolean;
    config?: Prisma.JsonNullableFilter<"Agent">;
    createdAt?: Prisma.DateTimeFilter<"Agent"> | Date | string;
};
export type AgentCreateWithoutAgentSkillsInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutAgentSkillsInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutAgentSkillsInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentSkillsInput, Prisma.AgentUncheckedCreateWithoutAgentSkillsInput>;
};
export type AgentUpsertWithoutAgentSkillsInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutAgentSkillsInput, Prisma.AgentUncheckedUpdateWithoutAgentSkillsInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentSkillsInput, Prisma.AgentUncheckedCreateWithoutAgentSkillsInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutAgentSkillsInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutAgentSkillsInput, Prisma.AgentUncheckedUpdateWithoutAgentSkillsInput>;
};
export type AgentUpdateWithoutAgentSkillsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutAgentSkillsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateWithoutPromptTemplatesInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
};
export type AgentUncheckedCreateWithoutPromptTemplatesInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
};
export type AgentCreateOrConnectWithoutPromptTemplatesInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutPromptTemplatesInput, Prisma.AgentUncheckedCreateWithoutPromptTemplatesInput>;
};
export type AgentUpsertWithoutPromptTemplatesInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutPromptTemplatesInput, Prisma.AgentUncheckedUpdateWithoutPromptTemplatesInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutPromptTemplatesInput, Prisma.AgentUncheckedCreateWithoutPromptTemplatesInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutPromptTemplatesInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutPromptTemplatesInput, Prisma.AgentUncheckedUpdateWithoutPromptTemplatesInput>;
};
export type AgentUpdateWithoutPromptTemplatesInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutPromptTemplatesInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
};
export type AgentCreateWithoutMessageTurnsInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutMessageTurnsInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutMessageTurnsInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutMessageTurnsInput, Prisma.AgentUncheckedCreateWithoutMessageTurnsInput>;
};
export type AgentUpsertWithoutMessageTurnsInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutMessageTurnsInput, Prisma.AgentUncheckedUpdateWithoutMessageTurnsInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutMessageTurnsInput, Prisma.AgentUncheckedCreateWithoutMessageTurnsInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutMessageTurnsInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutMessageTurnsInput, Prisma.AgentUncheckedUpdateWithoutMessageTurnsInput>;
};
export type AgentUpdateWithoutMessageTurnsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutMessageTurnsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateWithoutAgentRunsInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutAgentRunsInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutAgentRunsInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentRunsInput, Prisma.AgentUncheckedCreateWithoutAgentRunsInput>;
};
export type AgentUpsertWithoutAgentRunsInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutAgentRunsInput, Prisma.AgentUncheckedUpdateWithoutAgentRunsInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentRunsInput, Prisma.AgentUncheckedCreateWithoutAgentRunsInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutAgentRunsInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutAgentRunsInput, Prisma.AgentUncheckedUpdateWithoutAgentRunsInput>;
};
export type AgentUpdateWithoutAgentRunsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutAgentRunsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateWithoutAgentToolsInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutAgentToolsInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutAgentToolsInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentToolsInput, Prisma.AgentUncheckedCreateWithoutAgentToolsInput>;
};
export type AgentUpsertWithoutAgentToolsInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutAgentToolsInput, Prisma.AgentUncheckedUpdateWithoutAgentToolsInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentToolsInput, Prisma.AgentUncheckedCreateWithoutAgentToolsInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutAgentToolsInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutAgentToolsInput, Prisma.AgentUncheckedUpdateWithoutAgentToolsInput>;
};
export type AgentUpdateWithoutAgentToolsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutAgentToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateWithoutAgentHostToolsInput = {
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutAgentsInput;
    agentSkills?: Prisma.AgentSkillCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateCreateNestedManyWithoutAgentInput;
};
export type AgentUncheckedCreateWithoutAgentHostToolsInput = {
    id?: number;
    appClientId: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedCreateNestedManyWithoutAgentInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutAgentInput;
    agentTools?: Prisma.AgentToolUncheckedCreateNestedManyWithoutAgentInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutPrimaryAgentInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedCreateNestedManyWithoutAgentInput;
};
export type AgentCreateOrConnectWithoutAgentHostToolsInput = {
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentHostToolsInput, Prisma.AgentUncheckedCreateWithoutAgentHostToolsInput>;
};
export type AgentUpsertWithoutAgentHostToolsInput = {
    update: Prisma.XOR<Prisma.AgentUpdateWithoutAgentHostToolsInput, Prisma.AgentUncheckedUpdateWithoutAgentHostToolsInput>;
    create: Prisma.XOR<Prisma.AgentCreateWithoutAgentHostToolsInput, Prisma.AgentUncheckedCreateWithoutAgentHostToolsInput>;
    where?: Prisma.AgentWhereInput;
};
export type AgentUpdateToOneWithWhereWithoutAgentHostToolsInput = {
    where?: Prisma.AgentWhereInput;
    data: Prisma.XOR<Prisma.AgentUpdateWithoutAgentHostToolsInput, Prisma.AgentUncheckedUpdateWithoutAgentHostToolsInput>;
};
export type AgentUpdateWithoutAgentHostToolsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutAgentsNestedInput;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutAgentHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentCreateManyAppClientInput = {
    id?: number;
    name: string;
    description?: string | null;
    systemPrompt: string;
    maxSteps?: number;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type AgentUpdateWithoutAppClientInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentSkills?: Prisma.AgentSkillUncheckedUpdateManyWithoutAgentNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutAgentNestedInput;
    agentTools?: Prisma.AgentToolUncheckedUpdateManyWithoutAgentNestedInput;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutPrimaryAgentNestedInput;
    promptTemplates?: Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput;
};
export type AgentUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    systemPrompt?: Prisma.StringFieldUpdateOperationsInput | string;
    maxSteps?: Prisma.IntFieldUpdateOperationsInput | number;
    enableToolCall?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictHostTools?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    restrictSkills?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentCountOutputType = {
    agentSkills: number;
    agentRuns: number;
    agentTools: number;
    agentHostTools: number;
    messageTurns: number;
    promptTemplates: number;
};
export type AgentCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agentSkills?: boolean | AgentCountOutputTypeCountAgentSkillsArgs;
    agentRuns?: boolean | AgentCountOutputTypeCountAgentRunsArgs;
    agentTools?: boolean | AgentCountOutputTypeCountAgentToolsArgs;
    agentHostTools?: boolean | AgentCountOutputTypeCountAgentHostToolsArgs;
    messageTurns?: boolean | AgentCountOutputTypeCountMessageTurnsArgs;
    promptTemplates?: boolean | AgentCountOutputTypeCountPromptTemplatesArgs;
};
export type AgentCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentCountOutputTypeSelect<ExtArgs> | null;
};
export type AgentCountOutputTypeCountAgentSkillsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentSkillWhereInput;
};
export type AgentCountOutputTypeCountAgentRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentRunWhereInput;
};
export type AgentCountOutputTypeCountAgentToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentToolWhereInput;
};
export type AgentCountOutputTypeCountAgentHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentHostToolWhereInput;
};
export type AgentCountOutputTypeCountMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageTurnWhereInput;
};
export type AgentCountOutputTypeCountPromptTemplatesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PromptTemplateWhereInput;
};
export type AgentSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    description?: boolean;
    systemPrompt?: boolean;
    maxSteps?: boolean;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: boolean;
    createdAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    agentSkills?: boolean | Prisma.Agent$agentSkillsArgs<ExtArgs>;
    agentRuns?: boolean | Prisma.Agent$agentRunsArgs<ExtArgs>;
    agentTools?: boolean | Prisma.Agent$agentToolsArgs<ExtArgs>;
    agentHostTools?: boolean | Prisma.Agent$agentHostToolsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Agent$messageTurnsArgs<ExtArgs>;
    promptTemplates?: boolean | Prisma.Agent$promptTemplatesArgs<ExtArgs>;
    _count?: boolean | Prisma.AgentCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agent"]>;
export type AgentSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    description?: boolean;
    systemPrompt?: boolean;
    maxSteps?: boolean;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: boolean;
    createdAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agent"]>;
export type AgentSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    description?: boolean;
    systemPrompt?: boolean;
    maxSteps?: boolean;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: boolean;
    createdAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agent"]>;
export type AgentSelectScalar = {
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    description?: boolean;
    systemPrompt?: boolean;
    maxSteps?: boolean;
    enableToolCall?: boolean;
    restrictTools?: boolean;
    restrictHostTools?: boolean;
    restrictSkills?: boolean;
    config?: boolean;
    createdAt?: boolean;
};
export type AgentOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "appClientId" | "name" | "description" | "systemPrompt" | "maxSteps" | "enableToolCall" | "restrictTools" | "restrictHostTools" | "restrictSkills" | "config" | "createdAt", ExtArgs["result"]["agent"]>;
export type AgentInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    agentSkills?: boolean | Prisma.Agent$agentSkillsArgs<ExtArgs>;
    agentRuns?: boolean | Prisma.Agent$agentRunsArgs<ExtArgs>;
    agentTools?: boolean | Prisma.Agent$agentToolsArgs<ExtArgs>;
    agentHostTools?: boolean | Prisma.Agent$agentHostToolsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Agent$messageTurnsArgs<ExtArgs>;
    promptTemplates?: boolean | Prisma.Agent$promptTemplatesArgs<ExtArgs>;
    _count?: boolean | Prisma.AgentCountOutputTypeDefaultArgs<ExtArgs>;
};
export type AgentIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type AgentIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type $AgentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Agent";
    objects: {
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        agentSkills: Prisma.$AgentSkillPayload<ExtArgs>[];
        agentRuns: Prisma.$AgentRunPayload<ExtArgs>[];
        agentTools: Prisma.$AgentToolPayload<ExtArgs>[];
        agentHostTools: Prisma.$AgentHostToolPayload<ExtArgs>[];
        messageTurns: Prisma.$MessageTurnPayload<ExtArgs>[];
        promptTemplates: Prisma.$PromptTemplatePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        appClientId: number;
        name: string;
        description: string | null;
        systemPrompt: string;
        maxSteps: number;
        enableToolCall: boolean;
        restrictTools: boolean;
        restrictHostTools: boolean;
        restrictSkills: boolean;
        config: runtime.JsonValue | null;
        createdAt: Date;
    }, ExtArgs["result"]["agent"]>;
    composites: {};
};
export type AgentGetPayload<S extends boolean | null | undefined | AgentDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AgentPayload, S>;
export type AgentCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AgentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AgentCountAggregateInputType | true;
};
export interface AgentDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Agent'];
        meta: {
            name: 'Agent';
        };
    };
    findUnique<T extends AgentFindUniqueArgs>(args: Prisma.SelectSubset<T, AgentFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AgentFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AgentFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AgentFindFirstArgs>(args?: Prisma.SelectSubset<T, AgentFindFirstArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AgentFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AgentFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AgentFindManyArgs>(args?: Prisma.SelectSubset<T, AgentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AgentCreateArgs>(args: Prisma.SelectSubset<T, AgentCreateArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AgentCreateManyArgs>(args?: Prisma.SelectSubset<T, AgentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AgentCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AgentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AgentDeleteArgs>(args: Prisma.SelectSubset<T, AgentDeleteArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AgentUpdateArgs>(args: Prisma.SelectSubset<T, AgentUpdateArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AgentDeleteManyArgs>(args?: Prisma.SelectSubset<T, AgentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AgentUpdateManyArgs>(args: Prisma.SelectSubset<T, AgentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AgentUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AgentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AgentUpsertArgs>(args: Prisma.SelectSubset<T, AgentUpsertArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AgentCountArgs>(args?: Prisma.Subset<T, AgentCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AgentCountAggregateOutputType> : number>;
    aggregate<T extends AgentAggregateArgs>(args: Prisma.Subset<T, AgentAggregateArgs>): Prisma.PrismaPromise<GetAgentAggregateType<T>>;
    groupBy<T extends AgentGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AgentGroupByArgs['orderBy'];
    } : {
        orderBy?: AgentGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AgentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AgentFieldRefs;
}
export interface Prisma__AgentClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    agentSkills<T extends Prisma.Agent$agentSkillsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$agentSkillsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    agentRuns<T extends Prisma.Agent$agentRunsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$agentRunsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    agentTools<T extends Prisma.Agent$agentToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$agentToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    agentHostTools<T extends Prisma.Agent$agentHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$agentHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messageTurns<T extends Prisma.Agent$messageTurnsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$messageTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    promptTemplates<T extends Prisma.Agent$promptTemplatesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Agent$promptTemplatesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AgentFieldRefs {
    readonly id: Prisma.FieldRef<"Agent", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"Agent", 'Int'>;
    readonly name: Prisma.FieldRef<"Agent", 'String'>;
    readonly description: Prisma.FieldRef<"Agent", 'String'>;
    readonly systemPrompt: Prisma.FieldRef<"Agent", 'String'>;
    readonly maxSteps: Prisma.FieldRef<"Agent", 'Int'>;
    readonly enableToolCall: Prisma.FieldRef<"Agent", 'Boolean'>;
    readonly restrictTools: Prisma.FieldRef<"Agent", 'Boolean'>;
    readonly restrictHostTools: Prisma.FieldRef<"Agent", 'Boolean'>;
    readonly restrictSkills: Prisma.FieldRef<"Agent", 'Boolean'>;
    readonly config: Prisma.FieldRef<"Agent", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"Agent", 'DateTime'>;
}
export type AgentFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where: Prisma.AgentWhereUniqueInput;
};
export type AgentFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where: Prisma.AgentWhereUniqueInput;
};
export type AgentFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput | Prisma.AgentOrderByWithRelationInput[];
    cursor?: Prisma.AgentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentScalarFieldEnum | Prisma.AgentScalarFieldEnum[];
};
export type AgentFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput | Prisma.AgentOrderByWithRelationInput[];
    cursor?: Prisma.AgentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentScalarFieldEnum | Prisma.AgentScalarFieldEnum[];
};
export type AgentFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput | Prisma.AgentOrderByWithRelationInput[];
    cursor?: Prisma.AgentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentScalarFieldEnum | Prisma.AgentScalarFieldEnum[];
};
export type AgentCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentCreateInput, Prisma.AgentUncheckedCreateInput>;
};
export type AgentCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AgentCreateManyInput | Prisma.AgentCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AgentCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    data: Prisma.AgentCreateManyInput | Prisma.AgentCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AgentIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AgentUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentUpdateInput, Prisma.AgentUncheckedUpdateInput>;
    where: Prisma.AgentWhereUniqueInput;
};
export type AgentUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AgentUpdateManyMutationInput, Prisma.AgentUncheckedUpdateManyInput>;
    where?: Prisma.AgentWhereInput;
    limit?: number;
};
export type AgentUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentUpdateManyMutationInput, Prisma.AgentUncheckedUpdateManyInput>;
    where?: Prisma.AgentWhereInput;
    limit?: number;
    include?: Prisma.AgentIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AgentUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where: Prisma.AgentWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentCreateInput, Prisma.AgentUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AgentUpdateInput, Prisma.AgentUncheckedUpdateInput>;
};
export type AgentDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where: Prisma.AgentWhereUniqueInput;
};
export type AgentDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentWhereInput;
    limit?: number;
};
export type Agent$agentSkillsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithRelationInput | Prisma.AgentSkillOrderByWithRelationInput[];
    cursor?: Prisma.AgentSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentSkillScalarFieldEnum | Prisma.AgentSkillScalarFieldEnum[];
};
export type Agent$agentRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentRunSelect<ExtArgs> | null;
    omit?: Prisma.AgentRunOmit<ExtArgs> | null;
    include?: Prisma.AgentRunInclude<ExtArgs> | null;
    where?: Prisma.AgentRunWhereInput;
    orderBy?: Prisma.AgentRunOrderByWithRelationInput | Prisma.AgentRunOrderByWithRelationInput[];
    cursor?: Prisma.AgentRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentRunScalarFieldEnum | Prisma.AgentRunScalarFieldEnum[];
};
export type Agent$agentToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    where?: Prisma.AgentToolWhereInput;
    orderBy?: Prisma.AgentToolOrderByWithRelationInput | Prisma.AgentToolOrderByWithRelationInput[];
    cursor?: Prisma.AgentToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentToolScalarFieldEnum | Prisma.AgentToolScalarFieldEnum[];
};
export type Agent$agentHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where?: Prisma.AgentHostToolWhereInput;
    orderBy?: Prisma.AgentHostToolOrderByWithRelationInput | Prisma.AgentHostToolOrderByWithRelationInput[];
    cursor?: Prisma.AgentHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentHostToolScalarFieldEnum | Prisma.AgentHostToolScalarFieldEnum[];
};
export type Agent$messageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageTurnSelect<ExtArgs> | null;
    omit?: Prisma.MessageTurnOmit<ExtArgs> | null;
    include?: Prisma.MessageTurnInclude<ExtArgs> | null;
    where?: Prisma.MessageTurnWhereInput;
    orderBy?: Prisma.MessageTurnOrderByWithRelationInput | Prisma.MessageTurnOrderByWithRelationInput[];
    cursor?: Prisma.MessageTurnWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageTurnScalarFieldEnum | Prisma.MessageTurnScalarFieldEnum[];
};
export type Agent$promptTemplatesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    where?: Prisma.PromptTemplateWhereInput;
    orderBy?: Prisma.PromptTemplateOrderByWithRelationInput | Prisma.PromptTemplateOrderByWithRelationInput[];
    cursor?: Prisma.PromptTemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PromptTemplateScalarFieldEnum | Prisma.PromptTemplateScalarFieldEnum[];
};
export type AgentDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
};
