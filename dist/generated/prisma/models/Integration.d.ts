import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type IntegrationModel = runtime.Types.Result.DefaultSelection<Prisma.$IntegrationPayload>;
export type AggregateIntegration = {
    _count: IntegrationCountAggregateOutputType | null;
    _avg: IntegrationAvgAggregateOutputType | null;
    _sum: IntegrationSumAggregateOutputType | null;
    _min: IntegrationMinAggregateOutputType | null;
    _max: IntegrationMaxAggregateOutputType | null;
};
export type IntegrationAvgAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
};
export type IntegrationSumAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
};
export type IntegrationMinAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    name: string | null;
    baseUrl: string | null;
    apiKey: string | null;
    authMode: $Enums.IntegrationAuthMode | null;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type IntegrationMaxAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    name: string | null;
    baseUrl: string | null;
    apiKey: string | null;
    authMode: $Enums.IntegrationAuthMode | null;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type IntegrationCountAggregateOutputType = {
    id: number;
    appClientId: number;
    name: number;
    baseUrl: number;
    apiKey: number;
    authMode: number;
    description: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type IntegrationAvgAggregateInputType = {
    id?: true;
    appClientId?: true;
};
export type IntegrationSumAggregateInputType = {
    id?: true;
    appClientId?: true;
};
export type IntegrationMinAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    baseUrl?: true;
    apiKey?: true;
    authMode?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type IntegrationMaxAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    baseUrl?: true;
    apiKey?: true;
    authMode?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type IntegrationCountAggregateInputType = {
    id?: true;
    appClientId?: true;
    name?: true;
    baseUrl?: true;
    apiKey?: true;
    authMode?: true;
    description?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type IntegrationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntegrationWhereInput;
    orderBy?: Prisma.IntegrationOrderByWithRelationInput | Prisma.IntegrationOrderByWithRelationInput[];
    cursor?: Prisma.IntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | IntegrationCountAggregateInputType;
    _avg?: IntegrationAvgAggregateInputType;
    _sum?: IntegrationSumAggregateInputType;
    _min?: IntegrationMinAggregateInputType;
    _max?: IntegrationMaxAggregateInputType;
};
export type GetIntegrationAggregateType<T extends IntegrationAggregateArgs> = {
    [P in keyof T & keyof AggregateIntegration]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateIntegration[P]> : Prisma.GetScalarType<T[P], AggregateIntegration[P]>;
};
export type IntegrationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntegrationWhereInput;
    orderBy?: Prisma.IntegrationOrderByWithAggregationInput | Prisma.IntegrationOrderByWithAggregationInput[];
    by: Prisma.IntegrationScalarFieldEnum[] | Prisma.IntegrationScalarFieldEnum;
    having?: Prisma.IntegrationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: IntegrationCountAggregateInputType | true;
    _avg?: IntegrationAvgAggregateInputType;
    _sum?: IntegrationSumAggregateInputType;
    _min?: IntegrationMinAggregateInputType;
    _max?: IntegrationMaxAggregateInputType;
};
export type IntegrationGroupByOutputType = {
    id: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey: string | null;
    authMode: $Enums.IntegrationAuthMode;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: IntegrationCountAggregateOutputType | null;
    _avg: IntegrationAvgAggregateOutputType | null;
    _sum: IntegrationSumAggregateOutputType | null;
    _min: IntegrationMinAggregateOutputType | null;
    _max: IntegrationMaxAggregateOutputType | null;
};
export type GetIntegrationGroupByPayload<T extends IntegrationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<IntegrationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof IntegrationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], IntegrationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], IntegrationGroupByOutputType[P]>;
}>>;
export type IntegrationWhereInput = {
    AND?: Prisma.IntegrationWhereInput | Prisma.IntegrationWhereInput[];
    OR?: Prisma.IntegrationWhereInput[];
    NOT?: Prisma.IntegrationWhereInput | Prisma.IntegrationWhereInput[];
    id?: Prisma.IntFilter<"Integration"> | number;
    appClientId?: Prisma.IntFilter<"Integration"> | number;
    name?: Prisma.StringFilter<"Integration"> | string;
    baseUrl?: Prisma.StringFilter<"Integration"> | string;
    apiKey?: Prisma.StringNullableFilter<"Integration"> | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFilter<"Integration"> | $Enums.IntegrationAuthMode;
    description?: Prisma.StringNullableFilter<"Integration"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    tools?: Prisma.ToolListRelationFilter;
    userIntegrations?: Prisma.UserIntegrationListRelationFilter;
};
export type IntegrationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    authMode?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    tools?: Prisma.ToolOrderByRelationAggregateInput;
    userIntegrations?: Prisma.UserIntegrationOrderByRelationAggregateInput;
};
export type IntegrationWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.IntegrationWhereInput | Prisma.IntegrationWhereInput[];
    OR?: Prisma.IntegrationWhereInput[];
    NOT?: Prisma.IntegrationWhereInput | Prisma.IntegrationWhereInput[];
    appClientId?: Prisma.IntFilter<"Integration"> | number;
    name?: Prisma.StringFilter<"Integration"> | string;
    baseUrl?: Prisma.StringFilter<"Integration"> | string;
    apiKey?: Prisma.StringNullableFilter<"Integration"> | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFilter<"Integration"> | $Enums.IntegrationAuthMode;
    description?: Prisma.StringNullableFilter<"Integration"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    tools?: Prisma.ToolListRelationFilter;
    userIntegrations?: Prisma.UserIntegrationListRelationFilter;
}, "id">;
export type IntegrationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    authMode?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.IntegrationCountOrderByAggregateInput;
    _avg?: Prisma.IntegrationAvgOrderByAggregateInput;
    _max?: Prisma.IntegrationMaxOrderByAggregateInput;
    _min?: Prisma.IntegrationMinOrderByAggregateInput;
    _sum?: Prisma.IntegrationSumOrderByAggregateInput;
};
export type IntegrationScalarWhereWithAggregatesInput = {
    AND?: Prisma.IntegrationScalarWhereWithAggregatesInput | Prisma.IntegrationScalarWhereWithAggregatesInput[];
    OR?: Prisma.IntegrationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.IntegrationScalarWhereWithAggregatesInput | Prisma.IntegrationScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Integration"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"Integration"> | number;
    name?: Prisma.StringWithAggregatesFilter<"Integration"> | string;
    baseUrl?: Prisma.StringWithAggregatesFilter<"Integration"> | string;
    apiKey?: Prisma.StringNullableWithAggregatesFilter<"Integration"> | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeWithAggregatesFilter<"Integration"> | $Enums.IntegrationAuthMode;
    description?: Prisma.StringNullableWithAggregatesFilter<"Integration"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Integration"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Integration"> | Date | string;
};
export type IntegrationCreateInput = {
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutIntegrationsInput;
    tools?: Prisma.ToolCreateNestedManyWithoutIntegrationInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationUncheckedCreateInput = {
    id?: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolUncheckedCreateNestedManyWithoutIntegrationInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationUpdateInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutIntegrationsNestedInput;
    tools?: Prisma.ToolUpdateManyWithoutIntegrationNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUncheckedUpdateManyWithoutIntegrationNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationCreateManyInput = {
    id?: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type IntegrationUpdateManyMutationInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntegrationUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntegrationListRelationFilter = {
    every?: Prisma.IntegrationWhereInput;
    some?: Prisma.IntegrationWhereInput;
    none?: Prisma.IntegrationWhereInput;
};
export type IntegrationOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type IntegrationScalarRelationFilter = {
    is?: Prisma.IntegrationWhereInput;
    isNot?: Prisma.IntegrationWhereInput;
};
export type IntegrationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    authMode?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntegrationAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
};
export type IntegrationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    authMode?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntegrationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    authMode?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntegrationSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
};
export type IntegrationCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput> | Prisma.IntegrationCreateWithoutAppClientInput[] | Prisma.IntegrationUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutAppClientInput | Prisma.IntegrationCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.IntegrationCreateManyAppClientInputEnvelope;
    connect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
};
export type IntegrationUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput> | Prisma.IntegrationCreateWithoutAppClientInput[] | Prisma.IntegrationUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutAppClientInput | Prisma.IntegrationCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.IntegrationCreateManyAppClientInputEnvelope;
    connect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
};
export type IntegrationUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput> | Prisma.IntegrationCreateWithoutAppClientInput[] | Prisma.IntegrationUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutAppClientInput | Prisma.IntegrationCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.IntegrationUpsertWithWhereUniqueWithoutAppClientInput | Prisma.IntegrationUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.IntegrationCreateManyAppClientInputEnvelope;
    set?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    disconnect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    delete?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    connect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    update?: Prisma.IntegrationUpdateWithWhereUniqueWithoutAppClientInput | Prisma.IntegrationUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.IntegrationUpdateManyWithWhereWithoutAppClientInput | Prisma.IntegrationUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.IntegrationScalarWhereInput | Prisma.IntegrationScalarWhereInput[];
};
export type IntegrationUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput> | Prisma.IntegrationCreateWithoutAppClientInput[] | Prisma.IntegrationUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutAppClientInput | Prisma.IntegrationCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.IntegrationUpsertWithWhereUniqueWithoutAppClientInput | Prisma.IntegrationUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.IntegrationCreateManyAppClientInputEnvelope;
    set?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    disconnect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    delete?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    connect?: Prisma.IntegrationWhereUniqueInput | Prisma.IntegrationWhereUniqueInput[];
    update?: Prisma.IntegrationUpdateWithWhereUniqueWithoutAppClientInput | Prisma.IntegrationUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.IntegrationUpdateManyWithWhereWithoutAppClientInput | Prisma.IntegrationUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.IntegrationScalarWhereInput | Prisma.IntegrationScalarWhereInput[];
};
export type IntegrationCreateNestedOneWithoutToolsInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutToolsInput, Prisma.IntegrationUncheckedCreateWithoutToolsInput>;
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutToolsInput;
    connect?: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationUpdateOneRequiredWithoutToolsNestedInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutToolsInput, Prisma.IntegrationUncheckedCreateWithoutToolsInput>;
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutToolsInput;
    upsert?: Prisma.IntegrationUpsertWithoutToolsInput;
    connect?: Prisma.IntegrationWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.IntegrationUpdateToOneWithWhereWithoutToolsInput, Prisma.IntegrationUpdateWithoutToolsInput>, Prisma.IntegrationUncheckedUpdateWithoutToolsInput>;
};
export type EnumIntegrationAuthModeFieldUpdateOperationsInput = {
    set?: $Enums.IntegrationAuthMode;
};
export type IntegrationCreateNestedOneWithoutUserIntegrationsInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedCreateWithoutUserIntegrationsInput>;
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutUserIntegrationsInput;
    connect?: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationUpdateOneRequiredWithoutUserIntegrationsNestedInput = {
    create?: Prisma.XOR<Prisma.IntegrationCreateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedCreateWithoutUserIntegrationsInput>;
    connectOrCreate?: Prisma.IntegrationCreateOrConnectWithoutUserIntegrationsInput;
    upsert?: Prisma.IntegrationUpsertWithoutUserIntegrationsInput;
    connect?: Prisma.IntegrationWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.IntegrationUpdateToOneWithWhereWithoutUserIntegrationsInput, Prisma.IntegrationUpdateWithoutUserIntegrationsInput>, Prisma.IntegrationUncheckedUpdateWithoutUserIntegrationsInput>;
};
export type IntegrationCreateWithoutAppClientInput = {
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolCreateNestedManyWithoutIntegrationInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationUncheckedCreateWithoutAppClientInput = {
    id?: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolUncheckedCreateNestedManyWithoutIntegrationInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationCreateOrConnectWithoutAppClientInput = {
    where: Prisma.IntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput>;
};
export type IntegrationCreateManyAppClientInputEnvelope = {
    data: Prisma.IntegrationCreateManyAppClientInput | Prisma.IntegrationCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type IntegrationUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.IntegrationWhereUniqueInput;
    update: Prisma.XOR<Prisma.IntegrationUpdateWithoutAppClientInput, Prisma.IntegrationUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutAppClientInput, Prisma.IntegrationUncheckedCreateWithoutAppClientInput>;
};
export type IntegrationUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.IntegrationWhereUniqueInput;
    data: Prisma.XOR<Prisma.IntegrationUpdateWithoutAppClientInput, Prisma.IntegrationUncheckedUpdateWithoutAppClientInput>;
};
export type IntegrationUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.IntegrationScalarWhereInput;
    data: Prisma.XOR<Prisma.IntegrationUpdateManyMutationInput, Prisma.IntegrationUncheckedUpdateManyWithoutAppClientInput>;
};
export type IntegrationScalarWhereInput = {
    AND?: Prisma.IntegrationScalarWhereInput | Prisma.IntegrationScalarWhereInput[];
    OR?: Prisma.IntegrationScalarWhereInput[];
    NOT?: Prisma.IntegrationScalarWhereInput | Prisma.IntegrationScalarWhereInput[];
    id?: Prisma.IntFilter<"Integration"> | number;
    appClientId?: Prisma.IntFilter<"Integration"> | number;
    name?: Prisma.StringFilter<"Integration"> | string;
    baseUrl?: Prisma.StringFilter<"Integration"> | string;
    apiKey?: Prisma.StringNullableFilter<"Integration"> | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFilter<"Integration"> | $Enums.IntegrationAuthMode;
    description?: Prisma.StringNullableFilter<"Integration"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Integration"> | Date | string;
};
export type IntegrationCreateWithoutToolsInput = {
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutIntegrationsInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationUncheckedCreateWithoutToolsInput = {
    id?: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationCreateOrConnectWithoutToolsInput = {
    where: Prisma.IntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutToolsInput, Prisma.IntegrationUncheckedCreateWithoutToolsInput>;
};
export type IntegrationUpsertWithoutToolsInput = {
    update: Prisma.XOR<Prisma.IntegrationUpdateWithoutToolsInput, Prisma.IntegrationUncheckedUpdateWithoutToolsInput>;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutToolsInput, Prisma.IntegrationUncheckedCreateWithoutToolsInput>;
    where?: Prisma.IntegrationWhereInput;
};
export type IntegrationUpdateToOneWithWhereWithoutToolsInput = {
    where?: Prisma.IntegrationWhereInput;
    data: Prisma.XOR<Prisma.IntegrationUpdateWithoutToolsInput, Prisma.IntegrationUncheckedUpdateWithoutToolsInput>;
};
export type IntegrationUpdateWithoutToolsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutIntegrationsNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationUncheckedUpdateWithoutToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationCreateWithoutUserIntegrationsInput = {
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutIntegrationsInput;
    tools?: Prisma.ToolCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationUncheckedCreateWithoutUserIntegrationsInput = {
    id?: number;
    appClientId: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolUncheckedCreateNestedManyWithoutIntegrationInput;
};
export type IntegrationCreateOrConnectWithoutUserIntegrationsInput = {
    where: Prisma.IntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedCreateWithoutUserIntegrationsInput>;
};
export type IntegrationUpsertWithoutUserIntegrationsInput = {
    update: Prisma.XOR<Prisma.IntegrationUpdateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedUpdateWithoutUserIntegrationsInput>;
    create: Prisma.XOR<Prisma.IntegrationCreateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedCreateWithoutUserIntegrationsInput>;
    where?: Prisma.IntegrationWhereInput;
};
export type IntegrationUpdateToOneWithWhereWithoutUserIntegrationsInput = {
    where?: Prisma.IntegrationWhereInput;
    data: Prisma.XOR<Prisma.IntegrationUpdateWithoutUserIntegrationsInput, Prisma.IntegrationUncheckedUpdateWithoutUserIntegrationsInput>;
};
export type IntegrationUpdateWithoutUserIntegrationsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutIntegrationsNestedInput;
    tools?: Prisma.ToolUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationUncheckedUpdateWithoutUserIntegrationsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUncheckedUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationCreateManyAppClientInput = {
    id?: number;
    name: string;
    baseUrl: string;
    apiKey?: string | null;
    authMode?: $Enums.IntegrationAuthMode;
    description?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type IntegrationUpdateWithoutAppClientInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUpdateManyWithoutIntegrationNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUncheckedUpdateManyWithoutIntegrationNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutIntegrationNestedInput;
};
export type IntegrationUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    authMode?: Prisma.EnumIntegrationAuthModeFieldUpdateOperationsInput | $Enums.IntegrationAuthMode;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntegrationCountOutputType = {
    tools: number;
    userIntegrations: number;
};
export type IntegrationCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tools?: boolean | IntegrationCountOutputTypeCountToolsArgs;
    userIntegrations?: boolean | IntegrationCountOutputTypeCountUserIntegrationsArgs;
};
export type IntegrationCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationCountOutputTypeSelect<ExtArgs> | null;
};
export type IntegrationCountOutputTypeCountToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ToolWhereInput;
};
export type IntegrationCountOutputTypeCountUserIntegrationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserIntegrationWhereInput;
};
export type IntegrationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    baseUrl?: boolean;
    apiKey?: boolean;
    authMode?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    tools?: boolean | Prisma.Integration$toolsArgs<ExtArgs>;
    userIntegrations?: boolean | Prisma.Integration$userIntegrationsArgs<ExtArgs>;
    _count?: boolean | Prisma.IntegrationCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["integration"]>;
export type IntegrationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    baseUrl?: boolean;
    apiKey?: boolean;
    authMode?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["integration"]>;
export type IntegrationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    baseUrl?: boolean;
    apiKey?: boolean;
    authMode?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["integration"]>;
export type IntegrationSelectScalar = {
    id?: boolean;
    appClientId?: boolean;
    name?: boolean;
    baseUrl?: boolean;
    apiKey?: boolean;
    authMode?: boolean;
    description?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type IntegrationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "appClientId" | "name" | "baseUrl" | "apiKey" | "authMode" | "description" | "createdAt" | "updatedAt", ExtArgs["result"]["integration"]>;
export type IntegrationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    tools?: boolean | Prisma.Integration$toolsArgs<ExtArgs>;
    userIntegrations?: boolean | Prisma.Integration$userIntegrationsArgs<ExtArgs>;
    _count?: boolean | Prisma.IntegrationCountOutputTypeDefaultArgs<ExtArgs>;
};
export type IntegrationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type IntegrationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type $IntegrationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Integration";
    objects: {
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        tools: Prisma.$ToolPayload<ExtArgs>[];
        userIntegrations: Prisma.$UserIntegrationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        appClientId: number;
        name: string;
        baseUrl: string;
        apiKey: string | null;
        authMode: $Enums.IntegrationAuthMode;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["integration"]>;
    composites: {};
};
export type IntegrationGetPayload<S extends boolean | null | undefined | IntegrationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$IntegrationPayload, S>;
export type IntegrationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<IntegrationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: IntegrationCountAggregateInputType | true;
};
export interface IntegrationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Integration'];
        meta: {
            name: 'Integration';
        };
    };
    findUnique<T extends IntegrationFindUniqueArgs>(args: Prisma.SelectSubset<T, IntegrationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends IntegrationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, IntegrationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends IntegrationFindFirstArgs>(args?: Prisma.SelectSubset<T, IntegrationFindFirstArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends IntegrationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, IntegrationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends IntegrationFindManyArgs>(args?: Prisma.SelectSubset<T, IntegrationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends IntegrationCreateArgs>(args: Prisma.SelectSubset<T, IntegrationCreateArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends IntegrationCreateManyArgs>(args?: Prisma.SelectSubset<T, IntegrationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends IntegrationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, IntegrationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends IntegrationDeleteArgs>(args: Prisma.SelectSubset<T, IntegrationDeleteArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends IntegrationUpdateArgs>(args: Prisma.SelectSubset<T, IntegrationUpdateArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends IntegrationDeleteManyArgs>(args?: Prisma.SelectSubset<T, IntegrationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends IntegrationUpdateManyArgs>(args: Prisma.SelectSubset<T, IntegrationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends IntegrationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, IntegrationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends IntegrationUpsertArgs>(args: Prisma.SelectSubset<T, IntegrationUpsertArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends IntegrationCountArgs>(args?: Prisma.Subset<T, IntegrationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], IntegrationCountAggregateOutputType> : number>;
    aggregate<T extends IntegrationAggregateArgs>(args: Prisma.Subset<T, IntegrationAggregateArgs>): Prisma.PrismaPromise<GetIntegrationAggregateType<T>>;
    groupBy<T extends IntegrationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: IntegrationGroupByArgs['orderBy'];
    } : {
        orderBy?: IntegrationGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, IntegrationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntegrationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: IntegrationFieldRefs;
}
export interface Prisma__IntegrationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tools<T extends Prisma.Integration$toolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Integration$toolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    userIntegrations<T extends Prisma.Integration$userIntegrationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Integration$userIntegrationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface IntegrationFieldRefs {
    readonly id: Prisma.FieldRef<"Integration", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"Integration", 'Int'>;
    readonly name: Prisma.FieldRef<"Integration", 'String'>;
    readonly baseUrl: Prisma.FieldRef<"Integration", 'String'>;
    readonly apiKey: Prisma.FieldRef<"Integration", 'String'>;
    readonly authMode: Prisma.FieldRef<"Integration", 'IntegrationAuthMode'>;
    readonly description: Prisma.FieldRef<"Integration", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Integration", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Integration", 'DateTime'>;
}
export type IntegrationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where?: Prisma.IntegrationWhereInput;
    orderBy?: Prisma.IntegrationOrderByWithRelationInput | Prisma.IntegrationOrderByWithRelationInput[];
    cursor?: Prisma.IntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntegrationScalarFieldEnum | Prisma.IntegrationScalarFieldEnum[];
};
export type IntegrationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where?: Prisma.IntegrationWhereInput;
    orderBy?: Prisma.IntegrationOrderByWithRelationInput | Prisma.IntegrationOrderByWithRelationInput[];
    cursor?: Prisma.IntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntegrationScalarFieldEnum | Prisma.IntegrationScalarFieldEnum[];
};
export type IntegrationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where?: Prisma.IntegrationWhereInput;
    orderBy?: Prisma.IntegrationOrderByWithRelationInput | Prisma.IntegrationOrderByWithRelationInput[];
    cursor?: Prisma.IntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntegrationScalarFieldEnum | Prisma.IntegrationScalarFieldEnum[];
};
export type IntegrationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntegrationCreateInput, Prisma.IntegrationUncheckedCreateInput>;
};
export type IntegrationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.IntegrationCreateManyInput | Prisma.IntegrationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type IntegrationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    data: Prisma.IntegrationCreateManyInput | Prisma.IntegrationCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.IntegrationIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type IntegrationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntegrationUpdateInput, Prisma.IntegrationUncheckedUpdateInput>;
    where: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.IntegrationUpdateManyMutationInput, Prisma.IntegrationUncheckedUpdateManyInput>;
    where?: Prisma.IntegrationWhereInput;
    limit?: number;
};
export type IntegrationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntegrationUpdateManyMutationInput, Prisma.IntegrationUncheckedUpdateManyInput>;
    where?: Prisma.IntegrationWhereInput;
    limit?: number;
    include?: Prisma.IntegrationIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type IntegrationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where: Prisma.IntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.IntegrationCreateInput, Prisma.IntegrationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.IntegrationUpdateInput, Prisma.IntegrationUncheckedUpdateInput>;
};
export type IntegrationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
    where: Prisma.IntegrationWhereUniqueInput;
};
export type IntegrationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntegrationWhereInput;
    limit?: number;
};
export type Integration$toolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolSelect<ExtArgs> | null;
    omit?: Prisma.ToolOmit<ExtArgs> | null;
    include?: Prisma.ToolInclude<ExtArgs> | null;
    where?: Prisma.ToolWhereInput;
    orderBy?: Prisma.ToolOrderByWithRelationInput | Prisma.ToolOrderByWithRelationInput[];
    cursor?: Prisma.ToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ToolScalarFieldEnum | Prisma.ToolScalarFieldEnum[];
};
export type Integration$userIntegrationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithRelationInput | Prisma.UserIntegrationOrderByWithRelationInput[];
    cursor?: Prisma.UserIntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserIntegrationScalarFieldEnum | Prisma.UserIntegrationScalarFieldEnum[];
};
export type IntegrationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntegrationSelect<ExtArgs> | null;
    omit?: Prisma.IntegrationOmit<ExtArgs> | null;
    include?: Prisma.IntegrationInclude<ExtArgs> | null;
};
