import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type PromptTemplateModel = runtime.Types.Result.DefaultSelection<Prisma.$PromptTemplatePayload>;
export type AggregatePromptTemplate = {
    _count: PromptTemplateCountAggregateOutputType | null;
    _avg: PromptTemplateAvgAggregateOutputType | null;
    _sum: PromptTemplateSumAggregateOutputType | null;
    _min: PromptTemplateMinAggregateOutputType | null;
    _max: PromptTemplateMaxAggregateOutputType | null;
};
export type PromptTemplateAvgAggregateOutputType = {
    id: number | null;
    version: number | null;
    appClientId: number | null;
    agentId: number | null;
};
export type PromptTemplateSumAggregateOutputType = {
    id: number | null;
    version: number | null;
    appClientId: number | null;
    agentId: number | null;
};
export type PromptTemplateMinAggregateOutputType = {
    id: number | null;
    key: string | null;
    version: number | null;
    appClientId: number | null;
    agentId: number | null;
    locale: string | null;
    category: string | null;
    title: string | null;
    description: string | null;
    content: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PromptTemplateMaxAggregateOutputType = {
    id: number | null;
    key: string | null;
    version: number | null;
    appClientId: number | null;
    agentId: number | null;
    locale: string | null;
    category: string | null;
    title: string | null;
    description: string | null;
    content: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PromptTemplateCountAggregateOutputType = {
    id: number;
    key: number;
    version: number;
    appClientId: number;
    agentId: number;
    locale: number;
    category: number;
    title: number;
    description: number;
    content: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type PromptTemplateAvgAggregateInputType = {
    id?: true;
    version?: true;
    appClientId?: true;
    agentId?: true;
};
export type PromptTemplateSumAggregateInputType = {
    id?: true;
    version?: true;
    appClientId?: true;
    agentId?: true;
};
export type PromptTemplateMinAggregateInputType = {
    id?: true;
    key?: true;
    version?: true;
    appClientId?: true;
    agentId?: true;
    locale?: true;
    category?: true;
    title?: true;
    description?: true;
    content?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PromptTemplateMaxAggregateInputType = {
    id?: true;
    key?: true;
    version?: true;
    appClientId?: true;
    agentId?: true;
    locale?: true;
    category?: true;
    title?: true;
    description?: true;
    content?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PromptTemplateCountAggregateInputType = {
    id?: true;
    key?: true;
    version?: true;
    appClientId?: true;
    agentId?: true;
    locale?: true;
    category?: true;
    title?: true;
    description?: true;
    content?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type PromptTemplateAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PromptTemplateWhereInput;
    orderBy?: Prisma.PromptTemplateOrderByWithRelationInput | Prisma.PromptTemplateOrderByWithRelationInput[];
    cursor?: Prisma.PromptTemplateWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PromptTemplateCountAggregateInputType;
    _avg?: PromptTemplateAvgAggregateInputType;
    _sum?: PromptTemplateSumAggregateInputType;
    _min?: PromptTemplateMinAggregateInputType;
    _max?: PromptTemplateMaxAggregateInputType;
};
export type GetPromptTemplateAggregateType<T extends PromptTemplateAggregateArgs> = {
    [P in keyof T & keyof AggregatePromptTemplate]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePromptTemplate[P]> : Prisma.GetScalarType<T[P], AggregatePromptTemplate[P]>;
};
export type PromptTemplateGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PromptTemplateWhereInput;
    orderBy?: Prisma.PromptTemplateOrderByWithAggregationInput | Prisma.PromptTemplateOrderByWithAggregationInput[];
    by: Prisma.PromptTemplateScalarFieldEnum[] | Prisma.PromptTemplateScalarFieldEnum;
    having?: Prisma.PromptTemplateScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PromptTemplateCountAggregateInputType | true;
    _avg?: PromptTemplateAvgAggregateInputType;
    _sum?: PromptTemplateSumAggregateInputType;
    _min?: PromptTemplateMinAggregateInputType;
    _max?: PromptTemplateMaxAggregateInputType;
};
export type PromptTemplateGroupByOutputType = {
    id: number;
    key: string;
    version: number;
    appClientId: number | null;
    agentId: number | null;
    locale: string;
    category: string | null;
    title: string | null;
    description: string | null;
    content: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: PromptTemplateCountAggregateOutputType | null;
    _avg: PromptTemplateAvgAggregateOutputType | null;
    _sum: PromptTemplateSumAggregateOutputType | null;
    _min: PromptTemplateMinAggregateOutputType | null;
    _max: PromptTemplateMaxAggregateOutputType | null;
};
export type GetPromptTemplateGroupByPayload<T extends PromptTemplateGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PromptTemplateGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PromptTemplateGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PromptTemplateGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PromptTemplateGroupByOutputType[P]>;
}>>;
export type PromptTemplateWhereInput = {
    AND?: Prisma.PromptTemplateWhereInput | Prisma.PromptTemplateWhereInput[];
    OR?: Prisma.PromptTemplateWhereInput[];
    NOT?: Prisma.PromptTemplateWhereInput | Prisma.PromptTemplateWhereInput[];
    id?: Prisma.IntFilter<"PromptTemplate"> | number;
    key?: Prisma.StringFilter<"PromptTemplate"> | string;
    version?: Prisma.IntFilter<"PromptTemplate"> | number;
    appClientId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    agentId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    locale?: Prisma.StringFilter<"PromptTemplate"> | string;
    category?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    title?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    description?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    content?: Prisma.StringFilter<"PromptTemplate"> | string;
    isActive?: Prisma.BoolFilter<"PromptTemplate"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientNullableScalarRelationFilter, Prisma.AppClientWhereInput> | null;
    agent?: Prisma.XOR<Prisma.AgentNullableScalarRelationFilter, Prisma.AgentWhereInput> | null;
};
export type PromptTemplateOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    key?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrderInput | Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    locale?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    content?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    agent?: Prisma.AgentOrderByWithRelationInput;
};
export type PromptTemplateWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    key_appClientId_agentId_locale_version?: Prisma.PromptTemplateKeyAppClientIdAgentIdLocaleVersionCompoundUniqueInput;
    AND?: Prisma.PromptTemplateWhereInput | Prisma.PromptTemplateWhereInput[];
    OR?: Prisma.PromptTemplateWhereInput[];
    NOT?: Prisma.PromptTemplateWhereInput | Prisma.PromptTemplateWhereInput[];
    key?: Prisma.StringFilter<"PromptTemplate"> | string;
    version?: Prisma.IntFilter<"PromptTemplate"> | number;
    appClientId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    agentId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    locale?: Prisma.StringFilter<"PromptTemplate"> | string;
    category?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    title?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    description?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    content?: Prisma.StringFilter<"PromptTemplate"> | string;
    isActive?: Prisma.BoolFilter<"PromptTemplate"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientNullableScalarRelationFilter, Prisma.AppClientWhereInput> | null;
    agent?: Prisma.XOR<Prisma.AgentNullableScalarRelationFilter, Prisma.AgentWhereInput> | null;
}, "id" | "key_appClientId_agentId_locale_version">;
export type PromptTemplateOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    key?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrderInput | Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    locale?: Prisma.SortOrder;
    category?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    content?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.PromptTemplateCountOrderByAggregateInput;
    _avg?: Prisma.PromptTemplateAvgOrderByAggregateInput;
    _max?: Prisma.PromptTemplateMaxOrderByAggregateInput;
    _min?: Prisma.PromptTemplateMinOrderByAggregateInput;
    _sum?: Prisma.PromptTemplateSumOrderByAggregateInput;
};
export type PromptTemplateScalarWhereWithAggregatesInput = {
    AND?: Prisma.PromptTemplateScalarWhereWithAggregatesInput | Prisma.PromptTemplateScalarWhereWithAggregatesInput[];
    OR?: Prisma.PromptTemplateScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PromptTemplateScalarWhereWithAggregatesInput | Prisma.PromptTemplateScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"PromptTemplate"> | number;
    key?: Prisma.StringWithAggregatesFilter<"PromptTemplate"> | string;
    version?: Prisma.IntWithAggregatesFilter<"PromptTemplate"> | number;
    appClientId?: Prisma.IntNullableWithAggregatesFilter<"PromptTemplate"> | number | null;
    agentId?: Prisma.IntNullableWithAggregatesFilter<"PromptTemplate"> | number | null;
    locale?: Prisma.StringWithAggregatesFilter<"PromptTemplate"> | string;
    category?: Prisma.StringNullableWithAggregatesFilter<"PromptTemplate"> | string | null;
    title?: Prisma.StringNullableWithAggregatesFilter<"PromptTemplate"> | string | null;
    description?: Prisma.StringNullableWithAggregatesFilter<"PromptTemplate"> | string | null;
    content?: Prisma.StringWithAggregatesFilter<"PromptTemplate"> | string;
    isActive?: Prisma.BoolWithAggregatesFilter<"PromptTemplate"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PromptTemplate"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"PromptTemplate"> | Date | string;
};
export type PromptTemplateCreateInput = {
    key: string;
    version: number;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient?: Prisma.AppClientCreateNestedOneWithoutPromptTemplatesInput;
    agent?: Prisma.AgentCreateNestedOneWithoutPromptTemplatesInput;
};
export type PromptTemplateUncheckedCreateInput = {
    id?: number;
    key: string;
    version: number;
    appClientId?: number | null;
    agentId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateUpdateInput = {
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneWithoutPromptTemplatesNestedInput;
    agent?: Prisma.AgentUpdateOneWithoutPromptTemplatesNestedInput;
};
export type PromptTemplateUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateCreateManyInput = {
    id?: number;
    key: string;
    version: number;
    appClientId?: number | null;
    agentId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateUpdateManyMutationInput = {
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateListRelationFilter = {
    every?: Prisma.PromptTemplateWhereInput;
    some?: Prisma.PromptTemplateWhereInput;
    none?: Prisma.PromptTemplateWhereInput;
};
export type PromptTemplateOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PromptTemplateKeyAppClientIdAgentIdLocaleVersionCompoundUniqueInput = {
    key: string;
    appClientId: number;
    agentId: number;
    locale: string;
    version: number;
};
export type PromptTemplateCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    key?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    locale?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PromptTemplateAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type PromptTemplateMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    key?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    locale?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PromptTemplateMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    key?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    locale?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PromptTemplateSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type PromptTemplateCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput> | Prisma.PromptTemplateCreateWithoutAppClientInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput | Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.PromptTemplateCreateManyAppClientInputEnvelope;
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
};
export type PromptTemplateUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput> | Prisma.PromptTemplateCreateWithoutAppClientInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput | Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.PromptTemplateCreateManyAppClientInputEnvelope;
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
};
export type PromptTemplateUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput> | Prisma.PromptTemplateCreateWithoutAppClientInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput | Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAppClientInput | Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.PromptTemplateCreateManyAppClientInputEnvelope;
    set?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    disconnect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    delete?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    update?: Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAppClientInput | Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.PromptTemplateUpdateManyWithWhereWithoutAppClientInput | Prisma.PromptTemplateUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
};
export type PromptTemplateUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput> | Prisma.PromptTemplateCreateWithoutAppClientInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput | Prisma.PromptTemplateCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAppClientInput | Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.PromptTemplateCreateManyAppClientInputEnvelope;
    set?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    disconnect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    delete?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    update?: Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAppClientInput | Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.PromptTemplateUpdateManyWithWhereWithoutAppClientInput | Prisma.PromptTemplateUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
};
export type PromptTemplateCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput> | Prisma.PromptTemplateCreateWithoutAgentInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAgentInput | Prisma.PromptTemplateCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.PromptTemplateCreateManyAgentInputEnvelope;
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
};
export type PromptTemplateUncheckedCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput> | Prisma.PromptTemplateCreateWithoutAgentInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAgentInput | Prisma.PromptTemplateCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.PromptTemplateCreateManyAgentInputEnvelope;
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
};
export type PromptTemplateUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput> | Prisma.PromptTemplateCreateWithoutAgentInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAgentInput | Prisma.PromptTemplateCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAgentInput | Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.PromptTemplateCreateManyAgentInputEnvelope;
    set?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    disconnect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    delete?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    update?: Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAgentInput | Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.PromptTemplateUpdateManyWithWhereWithoutAgentInput | Prisma.PromptTemplateUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
};
export type PromptTemplateUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput> | Prisma.PromptTemplateCreateWithoutAgentInput[] | Prisma.PromptTemplateUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.PromptTemplateCreateOrConnectWithoutAgentInput | Prisma.PromptTemplateCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAgentInput | Prisma.PromptTemplateUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.PromptTemplateCreateManyAgentInputEnvelope;
    set?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    disconnect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    delete?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    connect?: Prisma.PromptTemplateWhereUniqueInput | Prisma.PromptTemplateWhereUniqueInput[];
    update?: Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAgentInput | Prisma.PromptTemplateUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.PromptTemplateUpdateManyWithWhereWithoutAgentInput | Prisma.PromptTemplateUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
};
export type PromptTemplateCreateWithoutAppClientInput = {
    key: string;
    version: number;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agent?: Prisma.AgentCreateNestedOneWithoutPromptTemplatesInput;
};
export type PromptTemplateUncheckedCreateWithoutAppClientInput = {
    id?: number;
    key: string;
    version: number;
    agentId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateCreateOrConnectWithoutAppClientInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput>;
};
export type PromptTemplateCreateManyAppClientInputEnvelope = {
    data: Prisma.PromptTemplateCreateManyAppClientInput | Prisma.PromptTemplateCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type PromptTemplateUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    update: Prisma.XOR<Prisma.PromptTemplateUpdateWithoutAppClientInput, Prisma.PromptTemplateUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAppClientInput, Prisma.PromptTemplateUncheckedCreateWithoutAppClientInput>;
};
export type PromptTemplateUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateWithoutAppClientInput, Prisma.PromptTemplateUncheckedUpdateWithoutAppClientInput>;
};
export type PromptTemplateUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.PromptTemplateScalarWhereInput;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateManyMutationInput, Prisma.PromptTemplateUncheckedUpdateManyWithoutAppClientInput>;
};
export type PromptTemplateScalarWhereInput = {
    AND?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
    OR?: Prisma.PromptTemplateScalarWhereInput[];
    NOT?: Prisma.PromptTemplateScalarWhereInput | Prisma.PromptTemplateScalarWhereInput[];
    id?: Prisma.IntFilter<"PromptTemplate"> | number;
    key?: Prisma.StringFilter<"PromptTemplate"> | string;
    version?: Prisma.IntFilter<"PromptTemplate"> | number;
    appClientId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    agentId?: Prisma.IntNullableFilter<"PromptTemplate"> | number | null;
    locale?: Prisma.StringFilter<"PromptTemplate"> | string;
    category?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    title?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    description?: Prisma.StringNullableFilter<"PromptTemplate"> | string | null;
    content?: Prisma.StringFilter<"PromptTemplate"> | string;
    isActive?: Prisma.BoolFilter<"PromptTemplate"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PromptTemplate"> | Date | string;
};
export type PromptTemplateCreateWithoutAgentInput = {
    key: string;
    version: number;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient?: Prisma.AppClientCreateNestedOneWithoutPromptTemplatesInput;
};
export type PromptTemplateUncheckedCreateWithoutAgentInput = {
    id?: number;
    key: string;
    version: number;
    appClientId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateCreateOrConnectWithoutAgentInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput>;
};
export type PromptTemplateCreateManyAgentInputEnvelope = {
    data: Prisma.PromptTemplateCreateManyAgentInput | Prisma.PromptTemplateCreateManyAgentInput[];
    skipDuplicates?: boolean;
};
export type PromptTemplateUpsertWithWhereUniqueWithoutAgentInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    update: Prisma.XOR<Prisma.PromptTemplateUpdateWithoutAgentInput, Prisma.PromptTemplateUncheckedUpdateWithoutAgentInput>;
    create: Prisma.XOR<Prisma.PromptTemplateCreateWithoutAgentInput, Prisma.PromptTemplateUncheckedCreateWithoutAgentInput>;
};
export type PromptTemplateUpdateWithWhereUniqueWithoutAgentInput = {
    where: Prisma.PromptTemplateWhereUniqueInput;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateWithoutAgentInput, Prisma.PromptTemplateUncheckedUpdateWithoutAgentInput>;
};
export type PromptTemplateUpdateManyWithWhereWithoutAgentInput = {
    where: Prisma.PromptTemplateScalarWhereInput;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateManyMutationInput, Prisma.PromptTemplateUncheckedUpdateManyWithoutAgentInput>;
};
export type PromptTemplateCreateManyAppClientInput = {
    id?: number;
    key: string;
    version: number;
    agentId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateUpdateWithoutAppClientInput = {
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agent?: Prisma.AgentUpdateOneWithoutPromptTemplatesNestedInput;
};
export type PromptTemplateUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateCreateManyAgentInput = {
    id?: number;
    key: string;
    version: number;
    appClientId?: number | null;
    locale?: string;
    category?: string | null;
    title?: string | null;
    description?: string | null;
    content: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PromptTemplateUpdateWithoutAgentInput = {
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneWithoutPromptTemplatesNestedInput;
};
export type PromptTemplateUncheckedUpdateWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateUncheckedUpdateManyWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    key?: Prisma.StringFieldUpdateOperationsInput | string;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    locale?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PromptTemplateSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    key?: boolean;
    version?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    locale?: boolean;
    category?: boolean;
    title?: boolean;
    description?: boolean;
    content?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
}, ExtArgs["result"]["promptTemplate"]>;
export type PromptTemplateSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    key?: boolean;
    version?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    locale?: boolean;
    category?: boolean;
    title?: boolean;
    description?: boolean;
    content?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
}, ExtArgs["result"]["promptTemplate"]>;
export type PromptTemplateSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    key?: boolean;
    version?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    locale?: boolean;
    category?: boolean;
    title?: boolean;
    description?: boolean;
    content?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
}, ExtArgs["result"]["promptTemplate"]>;
export type PromptTemplateSelectScalar = {
    id?: boolean;
    key?: boolean;
    version?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    locale?: boolean;
    category?: boolean;
    title?: boolean;
    description?: boolean;
    content?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type PromptTemplateOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "key" | "version" | "appClientId" | "agentId" | "locale" | "category" | "title" | "description" | "content" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["promptTemplate"]>;
export type PromptTemplateInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
};
export type PromptTemplateIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
};
export type PromptTemplateIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.PromptTemplate$appClientArgs<ExtArgs>;
    agent?: boolean | Prisma.PromptTemplate$agentArgs<ExtArgs>;
};
export type $PromptTemplatePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PromptTemplate";
    objects: {
        appClient: Prisma.$AppClientPayload<ExtArgs> | null;
        agent: Prisma.$AgentPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        key: string;
        version: number;
        appClientId: number | null;
        agentId: number | null;
        locale: string;
        category: string | null;
        title: string | null;
        description: string | null;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["promptTemplate"]>;
    composites: {};
};
export type PromptTemplateGetPayload<S extends boolean | null | undefined | PromptTemplateDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload, S>;
export type PromptTemplateCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PromptTemplateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PromptTemplateCountAggregateInputType | true;
};
export interface PromptTemplateDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PromptTemplate'];
        meta: {
            name: 'PromptTemplate';
        };
    };
    findUnique<T extends PromptTemplateFindUniqueArgs>(args: Prisma.SelectSubset<T, PromptTemplateFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PromptTemplateFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PromptTemplateFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PromptTemplateFindFirstArgs>(args?: Prisma.SelectSubset<T, PromptTemplateFindFirstArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PromptTemplateFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PromptTemplateFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PromptTemplateFindManyArgs>(args?: Prisma.SelectSubset<T, PromptTemplateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PromptTemplateCreateArgs>(args: Prisma.SelectSubset<T, PromptTemplateCreateArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PromptTemplateCreateManyArgs>(args?: Prisma.SelectSubset<T, PromptTemplateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PromptTemplateCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PromptTemplateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PromptTemplateDeleteArgs>(args: Prisma.SelectSubset<T, PromptTemplateDeleteArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PromptTemplateUpdateArgs>(args: Prisma.SelectSubset<T, PromptTemplateUpdateArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PromptTemplateDeleteManyArgs>(args?: Prisma.SelectSubset<T, PromptTemplateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PromptTemplateUpdateManyArgs>(args: Prisma.SelectSubset<T, PromptTemplateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PromptTemplateUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PromptTemplateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PromptTemplateUpsertArgs>(args: Prisma.SelectSubset<T, PromptTemplateUpsertArgs<ExtArgs>>): Prisma.Prisma__PromptTemplateClient<runtime.Types.Result.GetResult<Prisma.$PromptTemplatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PromptTemplateCountArgs>(args?: Prisma.Subset<T, PromptTemplateCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PromptTemplateCountAggregateOutputType> : number>;
    aggregate<T extends PromptTemplateAggregateArgs>(args: Prisma.Subset<T, PromptTemplateAggregateArgs>): Prisma.PrismaPromise<GetPromptTemplateAggregateType<T>>;
    groupBy<T extends PromptTemplateGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PromptTemplateGroupByArgs['orderBy'];
    } : {
        orderBy?: PromptTemplateGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PromptTemplateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPromptTemplateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PromptTemplateFieldRefs;
}
export interface Prisma__PromptTemplateClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    appClient<T extends Prisma.PromptTemplate$appClientArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PromptTemplate$appClientArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    agent<T extends Prisma.PromptTemplate$agentArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PromptTemplate$agentArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PromptTemplateFieldRefs {
    readonly id: Prisma.FieldRef<"PromptTemplate", 'Int'>;
    readonly key: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly version: Prisma.FieldRef<"PromptTemplate", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"PromptTemplate", 'Int'>;
    readonly agentId: Prisma.FieldRef<"PromptTemplate", 'Int'>;
    readonly locale: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly category: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly title: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly description: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly content: Prisma.FieldRef<"PromptTemplate", 'String'>;
    readonly isActive: Prisma.FieldRef<"PromptTemplate", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"PromptTemplate", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"PromptTemplate", 'DateTime'>;
}
export type PromptTemplateFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    where: Prisma.PromptTemplateWhereUniqueInput;
};
export type PromptTemplateFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    where: Prisma.PromptTemplateWhereUniqueInput;
};
export type PromptTemplateFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PromptTemplateFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PromptTemplateFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PromptTemplateCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PromptTemplateCreateInput, Prisma.PromptTemplateUncheckedCreateInput>;
};
export type PromptTemplateCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PromptTemplateCreateManyInput | Prisma.PromptTemplateCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PromptTemplateCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    data: Prisma.PromptTemplateCreateManyInput | Prisma.PromptTemplateCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PromptTemplateIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PromptTemplateUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateInput, Prisma.PromptTemplateUncheckedUpdateInput>;
    where: Prisma.PromptTemplateWhereUniqueInput;
};
export type PromptTemplateUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PromptTemplateUpdateManyMutationInput, Prisma.PromptTemplateUncheckedUpdateManyInput>;
    where?: Prisma.PromptTemplateWhereInput;
    limit?: number;
};
export type PromptTemplateUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PromptTemplateUpdateManyMutationInput, Prisma.PromptTemplateUncheckedUpdateManyInput>;
    where?: Prisma.PromptTemplateWhereInput;
    limit?: number;
    include?: Prisma.PromptTemplateIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PromptTemplateUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    where: Prisma.PromptTemplateWhereUniqueInput;
    create: Prisma.XOR<Prisma.PromptTemplateCreateInput, Prisma.PromptTemplateUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PromptTemplateUpdateInput, Prisma.PromptTemplateUncheckedUpdateInput>;
};
export type PromptTemplateDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
    where: Prisma.PromptTemplateWhereUniqueInput;
};
export type PromptTemplateDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PromptTemplateWhereInput;
    limit?: number;
};
export type PromptTemplate$appClientArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AppClientSelect<ExtArgs> | null;
    omit?: Prisma.AppClientOmit<ExtArgs> | null;
    include?: Prisma.AppClientInclude<ExtArgs> | null;
    where?: Prisma.AppClientWhereInput;
};
export type PromptTemplate$agentArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSelect<ExtArgs> | null;
    omit?: Prisma.AgentOmit<ExtArgs> | null;
    include?: Prisma.AgentInclude<ExtArgs> | null;
    where?: Prisma.AgentWhereInput;
};
export type PromptTemplateDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PromptTemplateSelect<ExtArgs> | null;
    omit?: Prisma.PromptTemplateOmit<ExtArgs> | null;
    include?: Prisma.PromptTemplateInclude<ExtArgs> | null;
};
