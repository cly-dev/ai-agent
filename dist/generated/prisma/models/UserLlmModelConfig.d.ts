import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type UserLlmModelConfigModel = runtime.Types.Result.DefaultSelection<Prisma.$UserLlmModelConfigPayload>;
export type AggregateUserLlmModelConfig = {
    _count: UserLlmModelConfigCountAggregateOutputType | null;
    _avg: UserLlmModelConfigAvgAggregateOutputType | null;
    _sum: UserLlmModelConfigSumAggregateOutputType | null;
    _min: UserLlmModelConfigMinAggregateOutputType | null;
    _max: UserLlmModelConfigMaxAggregateOutputType | null;
};
export type UserLlmModelConfigAvgAggregateOutputType = {
    id: number | null;
    userId: number | null;
    temperature: number | null;
    maxTokens: number | null;
};
export type UserLlmModelConfigSumAggregateOutputType = {
    id: number | null;
    userId: number | null;
    temperature: number | null;
    maxTokens: number | null;
};
export type UserLlmModelConfigMinAggregateOutputType = {
    id: number | null;
    userId: number | null;
    provider: string | null;
    model: string | null;
    apiKey: string | null;
    baseUrl: string | null;
    temperature: number | null;
    maxTokens: number | null;
    enabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserLlmModelConfigMaxAggregateOutputType = {
    id: number | null;
    userId: number | null;
    provider: string | null;
    model: string | null;
    apiKey: string | null;
    baseUrl: string | null;
    temperature: number | null;
    maxTokens: number | null;
    enabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserLlmModelConfigCountAggregateOutputType = {
    id: number;
    userId: number;
    provider: number;
    model: number;
    apiKey: number;
    baseUrl: number;
    temperature: number;
    maxTokens: number;
    enabled: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type UserLlmModelConfigAvgAggregateInputType = {
    id?: true;
    userId?: true;
    temperature?: true;
    maxTokens?: true;
};
export type UserLlmModelConfigSumAggregateInputType = {
    id?: true;
    userId?: true;
    temperature?: true;
    maxTokens?: true;
};
export type UserLlmModelConfigMinAggregateInputType = {
    id?: true;
    userId?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    temperature?: true;
    maxTokens?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserLlmModelConfigMaxAggregateInputType = {
    id?: true;
    userId?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    temperature?: true;
    maxTokens?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserLlmModelConfigCountAggregateInputType = {
    id?: true;
    userId?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    temperature?: true;
    maxTokens?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type UserLlmModelConfigAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithRelationInput | Prisma.UserLlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.UserLlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UserLlmModelConfigCountAggregateInputType;
    _avg?: UserLlmModelConfigAvgAggregateInputType;
    _sum?: UserLlmModelConfigSumAggregateInputType;
    _min?: UserLlmModelConfigMinAggregateInputType;
    _max?: UserLlmModelConfigMaxAggregateInputType;
};
export type GetUserLlmModelConfigAggregateType<T extends UserLlmModelConfigAggregateArgs> = {
    [P in keyof T & keyof AggregateUserLlmModelConfig]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUserLlmModelConfig[P]> : Prisma.GetScalarType<T[P], AggregateUserLlmModelConfig[P]>;
};
export type UserLlmModelConfigGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithAggregationInput | Prisma.UserLlmModelConfigOrderByWithAggregationInput[];
    by: Prisma.UserLlmModelConfigScalarFieldEnum[] | Prisma.UserLlmModelConfigScalarFieldEnum;
    having?: Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserLlmModelConfigCountAggregateInputType | true;
    _avg?: UserLlmModelConfigAvgAggregateInputType;
    _sum?: UserLlmModelConfigSumAggregateInputType;
    _min?: UserLlmModelConfigMinAggregateInputType;
    _max?: UserLlmModelConfigMaxAggregateInputType;
};
export type UserLlmModelConfigGroupByOutputType = {
    id: number;
    userId: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl: string | null;
    temperature: number | null;
    maxTokens: number | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: UserLlmModelConfigCountAggregateOutputType | null;
    _avg: UserLlmModelConfigAvgAggregateOutputType | null;
    _sum: UserLlmModelConfigSumAggregateOutputType | null;
    _min: UserLlmModelConfigMinAggregateOutputType | null;
    _max: UserLlmModelConfigMaxAggregateOutputType | null;
};
export type GetUserLlmModelConfigGroupByPayload<T extends UserLlmModelConfigGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserLlmModelConfigGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserLlmModelConfigGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserLlmModelConfigGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserLlmModelConfigGroupByOutputType[P]>;
}>>;
export type UserLlmModelConfigWhereInput = {
    AND?: Prisma.UserLlmModelConfigWhereInput | Prisma.UserLlmModelConfigWhereInput[];
    OR?: Prisma.UserLlmModelConfigWhereInput[];
    NOT?: Prisma.UserLlmModelConfigWhereInput | Prisma.UserLlmModelConfigWhereInput[];
    id?: Prisma.IntFilter<"UserLlmModelConfig"> | number;
    userId?: Prisma.IntFilter<"UserLlmModelConfig"> | number;
    provider?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    model?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    apiKey?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    baseUrl?: Prisma.StringNullableFilter<"UserLlmModelConfig"> | string | null;
    temperature?: Prisma.FloatNullableFilter<"UserLlmModelConfig"> | number | null;
    maxTokens?: Prisma.IntNullableFilter<"UserLlmModelConfig"> | number | null;
    enabled?: Prisma.BoolFilter<"UserLlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type UserLlmModelConfigOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    temperature?: Prisma.SortOrderInput | Prisma.SortOrder;
    maxTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type UserLlmModelConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.UserLlmModelConfigWhereInput | Prisma.UserLlmModelConfigWhereInput[];
    OR?: Prisma.UserLlmModelConfigWhereInput[];
    NOT?: Prisma.UserLlmModelConfigWhereInput | Prisma.UserLlmModelConfigWhereInput[];
    userId?: Prisma.IntFilter<"UserLlmModelConfig"> | number;
    provider?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    model?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    apiKey?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    baseUrl?: Prisma.StringNullableFilter<"UserLlmModelConfig"> | string | null;
    temperature?: Prisma.FloatNullableFilter<"UserLlmModelConfig"> | number | null;
    maxTokens?: Prisma.IntNullableFilter<"UserLlmModelConfig"> | number | null;
    enabled?: Prisma.BoolFilter<"UserLlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type UserLlmModelConfigOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    temperature?: Prisma.SortOrderInput | Prisma.SortOrder;
    maxTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.UserLlmModelConfigCountOrderByAggregateInput;
    _avg?: Prisma.UserLlmModelConfigAvgOrderByAggregateInput;
    _max?: Prisma.UserLlmModelConfigMaxOrderByAggregateInput;
    _min?: Prisma.UserLlmModelConfigMinOrderByAggregateInput;
    _sum?: Prisma.UserLlmModelConfigSumOrderByAggregateInput;
};
export type UserLlmModelConfigScalarWhereWithAggregatesInput = {
    AND?: Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput | Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput[];
    OR?: Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput | Prisma.UserLlmModelConfigScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"UserLlmModelConfig"> | number;
    userId?: Prisma.IntWithAggregatesFilter<"UserLlmModelConfig"> | number;
    provider?: Prisma.StringWithAggregatesFilter<"UserLlmModelConfig"> | string;
    model?: Prisma.StringWithAggregatesFilter<"UserLlmModelConfig"> | string;
    apiKey?: Prisma.StringWithAggregatesFilter<"UserLlmModelConfig"> | string;
    baseUrl?: Prisma.StringNullableWithAggregatesFilter<"UserLlmModelConfig"> | string | null;
    temperature?: Prisma.FloatNullableWithAggregatesFilter<"UserLlmModelConfig"> | number | null;
    maxTokens?: Prisma.IntNullableWithAggregatesFilter<"UserLlmModelConfig"> | number | null;
    enabled?: Prisma.BoolWithAggregatesFilter<"UserLlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"UserLlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"UserLlmModelConfig"> | Date | string;
};
export type UserLlmModelConfigCreateInput = {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutLlmModelConfigsInput;
};
export type UserLlmModelConfigUncheckedCreateInput = {
    id?: number;
    userId: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserLlmModelConfigUpdateInput = {
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutLlmModelConfigsNestedInput;
};
export type UserLlmModelConfigUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigCreateManyInput = {
    id?: number;
    userId: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserLlmModelConfigUpdateManyMutationInput = {
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigListRelationFilter = {
    every?: Prisma.UserLlmModelConfigWhereInput;
    some?: Prisma.UserLlmModelConfigWhereInput;
    none?: Prisma.UserLlmModelConfigWhereInput;
};
export type UserLlmModelConfigOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type UserLlmModelConfigCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserLlmModelConfigAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
};
export type UserLlmModelConfigMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserLlmModelConfigMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserLlmModelConfigSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
};
export type UserLlmModelConfigCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput> | Prisma.UserLlmModelConfigCreateWithoutUserInput[] | Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput | Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserLlmModelConfigCreateManyUserInputEnvelope;
    connect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
};
export type UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput> | Prisma.UserLlmModelConfigCreateWithoutUserInput[] | Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput | Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserLlmModelConfigCreateManyUserInputEnvelope;
    connect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
};
export type UserLlmModelConfigUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput> | Prisma.UserLlmModelConfigCreateWithoutUserInput[] | Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput | Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserLlmModelConfigUpsertWithWhereUniqueWithoutUserInput | Prisma.UserLlmModelConfigUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserLlmModelConfigCreateManyUserInputEnvelope;
    set?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    disconnect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    delete?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    connect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    update?: Prisma.UserLlmModelConfigUpdateWithWhereUniqueWithoutUserInput | Prisma.UserLlmModelConfigUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserLlmModelConfigUpdateManyWithWhereWithoutUserInput | Prisma.UserLlmModelConfigUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserLlmModelConfigScalarWhereInput | Prisma.UserLlmModelConfigScalarWhereInput[];
};
export type UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput> | Prisma.UserLlmModelConfigCreateWithoutUserInput[] | Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput | Prisma.UserLlmModelConfigCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserLlmModelConfigUpsertWithWhereUniqueWithoutUserInput | Prisma.UserLlmModelConfigUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserLlmModelConfigCreateManyUserInputEnvelope;
    set?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    disconnect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    delete?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    connect?: Prisma.UserLlmModelConfigWhereUniqueInput | Prisma.UserLlmModelConfigWhereUniqueInput[];
    update?: Prisma.UserLlmModelConfigUpdateWithWhereUniqueWithoutUserInput | Prisma.UserLlmModelConfigUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserLlmModelConfigUpdateManyWithWhereWithoutUserInput | Prisma.UserLlmModelConfigUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserLlmModelConfigScalarWhereInput | Prisma.UserLlmModelConfigScalarWhereInput[];
};
export type UserLlmModelConfigCreateWithoutUserInput = {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserLlmModelConfigUncheckedCreateWithoutUserInput = {
    id?: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserLlmModelConfigCreateOrConnectWithoutUserInput = {
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput>;
};
export type UserLlmModelConfigCreateManyUserInputEnvelope = {
    data: Prisma.UserLlmModelConfigCreateManyUserInput | Prisma.UserLlmModelConfigCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type UserLlmModelConfigUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserLlmModelConfigUpdateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.UserLlmModelConfigCreateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedCreateWithoutUserInput>;
};
export type UserLlmModelConfigUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserLlmModelConfigUpdateWithoutUserInput, Prisma.UserLlmModelConfigUncheckedUpdateWithoutUserInput>;
};
export type UserLlmModelConfigUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.UserLlmModelConfigScalarWhereInput;
    data: Prisma.XOR<Prisma.UserLlmModelConfigUpdateManyMutationInput, Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserInput>;
};
export type UserLlmModelConfigScalarWhereInput = {
    AND?: Prisma.UserLlmModelConfigScalarWhereInput | Prisma.UserLlmModelConfigScalarWhereInput[];
    OR?: Prisma.UserLlmModelConfigScalarWhereInput[];
    NOT?: Prisma.UserLlmModelConfigScalarWhereInput | Prisma.UserLlmModelConfigScalarWhereInput[];
    id?: Prisma.IntFilter<"UserLlmModelConfig"> | number;
    userId?: Prisma.IntFilter<"UserLlmModelConfig"> | number;
    provider?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    model?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    apiKey?: Prisma.StringFilter<"UserLlmModelConfig"> | string;
    baseUrl?: Prisma.StringNullableFilter<"UserLlmModelConfig"> | string | null;
    temperature?: Prisma.FloatNullableFilter<"UserLlmModelConfig"> | number | null;
    maxTokens?: Prisma.IntNullableFilter<"UserLlmModelConfig"> | number | null;
    enabled?: Prisma.BoolFilter<"UserLlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserLlmModelConfig"> | Date | string;
};
export type UserLlmModelConfigCreateManyUserInput = {
    id?: number;
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserLlmModelConfigUpdateWithoutUserInput = {
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigUncheckedUpdateWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserLlmModelConfigSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    temperature?: boolean;
    maxTokens?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userLlmModelConfig"]>;
export type UserLlmModelConfigSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    temperature?: boolean;
    maxTokens?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userLlmModelConfig"]>;
export type UserLlmModelConfigSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    temperature?: boolean;
    maxTokens?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userLlmModelConfig"]>;
export type UserLlmModelConfigSelectScalar = {
    id?: boolean;
    userId?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    temperature?: boolean;
    maxTokens?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type UserLlmModelConfigOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "provider" | "model" | "apiKey" | "baseUrl" | "temperature" | "maxTokens" | "enabled" | "createdAt" | "updatedAt", ExtArgs["result"]["userLlmModelConfig"]>;
export type UserLlmModelConfigInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type UserLlmModelConfigIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type UserLlmModelConfigIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $UserLlmModelConfigPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserLlmModelConfig";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        userId: number;
        provider: string;
        model: string;
        apiKey: string;
        baseUrl: string | null;
        temperature: number | null;
        maxTokens: number | null;
        enabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["userLlmModelConfig"]>;
    composites: {};
};
export type UserLlmModelConfigGetPayload<S extends boolean | null | undefined | UserLlmModelConfigDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload, S>;
export type UserLlmModelConfigCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UserLlmModelConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserLlmModelConfigCountAggregateInputType | true;
};
export interface UserLlmModelConfigDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['UserLlmModelConfig'];
        meta: {
            name: 'UserLlmModelConfig';
        };
    };
    findUnique<T extends UserLlmModelConfigFindUniqueArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends UserLlmModelConfigFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends UserLlmModelConfigFindFirstArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigFindFirstArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends UserLlmModelConfigFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends UserLlmModelConfigFindManyArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends UserLlmModelConfigCreateArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigCreateArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends UserLlmModelConfigCreateManyArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends UserLlmModelConfigCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends UserLlmModelConfigDeleteArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigDeleteArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends UserLlmModelConfigUpdateArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigUpdateArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends UserLlmModelConfigDeleteManyArgs>(args?: Prisma.SelectSubset<T, UserLlmModelConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends UserLlmModelConfigUpdateManyArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends UserLlmModelConfigUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends UserLlmModelConfigUpsertArgs>(args: Prisma.SelectSubset<T, UserLlmModelConfigUpsertArgs<ExtArgs>>): Prisma.Prisma__UserLlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends UserLlmModelConfigCountArgs>(args?: Prisma.Subset<T, UserLlmModelConfigCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserLlmModelConfigCountAggregateOutputType> : number>;
    aggregate<T extends UserLlmModelConfigAggregateArgs>(args: Prisma.Subset<T, UserLlmModelConfigAggregateArgs>): Prisma.PrismaPromise<GetUserLlmModelConfigAggregateType<T>>;
    groupBy<T extends UserLlmModelConfigGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UserLlmModelConfigGroupByArgs['orderBy'];
    } : {
        orderBy?: UserLlmModelConfigGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UserLlmModelConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserLlmModelConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: UserLlmModelConfigFieldRefs;
}
export interface Prisma__UserLlmModelConfigClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface UserLlmModelConfigFieldRefs {
    readonly id: Prisma.FieldRef<"UserLlmModelConfig", 'Int'>;
    readonly userId: Prisma.FieldRef<"UserLlmModelConfig", 'Int'>;
    readonly provider: Prisma.FieldRef<"UserLlmModelConfig", 'String'>;
    readonly model: Prisma.FieldRef<"UserLlmModelConfig", 'String'>;
    readonly apiKey: Prisma.FieldRef<"UserLlmModelConfig", 'String'>;
    readonly baseUrl: Prisma.FieldRef<"UserLlmModelConfig", 'String'>;
    readonly temperature: Prisma.FieldRef<"UserLlmModelConfig", 'Float'>;
    readonly maxTokens: Prisma.FieldRef<"UserLlmModelConfig", 'Int'>;
    readonly enabled: Prisma.FieldRef<"UserLlmModelConfig", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"UserLlmModelConfig", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"UserLlmModelConfig", 'DateTime'>;
}
export type UserLlmModelConfigFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
};
export type UserLlmModelConfigFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
};
export type UserLlmModelConfigFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithRelationInput | Prisma.UserLlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.UserLlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserLlmModelConfigScalarFieldEnum | Prisma.UserLlmModelConfigScalarFieldEnum[];
};
export type UserLlmModelConfigFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithRelationInput | Prisma.UserLlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.UserLlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserLlmModelConfigScalarFieldEnum | Prisma.UserLlmModelConfigScalarFieldEnum[];
};
export type UserLlmModelConfigFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithRelationInput | Prisma.UserLlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.UserLlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserLlmModelConfigScalarFieldEnum | Prisma.UserLlmModelConfigScalarFieldEnum[];
};
export type UserLlmModelConfigCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserLlmModelConfigCreateInput, Prisma.UserLlmModelConfigUncheckedCreateInput>;
};
export type UserLlmModelConfigCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.UserLlmModelConfigCreateManyInput | Prisma.UserLlmModelConfigCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UserLlmModelConfigCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    data: Prisma.UserLlmModelConfigCreateManyInput | Prisma.UserLlmModelConfigCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.UserLlmModelConfigIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type UserLlmModelConfigUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserLlmModelConfigUpdateInput, Prisma.UserLlmModelConfigUncheckedUpdateInput>;
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
};
export type UserLlmModelConfigUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.UserLlmModelConfigUpdateManyMutationInput, Prisma.UserLlmModelConfigUncheckedUpdateManyInput>;
    where?: Prisma.UserLlmModelConfigWhereInput;
    limit?: number;
};
export type UserLlmModelConfigUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserLlmModelConfigUpdateManyMutationInput, Prisma.UserLlmModelConfigUncheckedUpdateManyInput>;
    where?: Prisma.UserLlmModelConfigWhereInput;
    limit?: number;
    include?: Prisma.UserLlmModelConfigIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type UserLlmModelConfigUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserLlmModelConfigCreateInput, Prisma.UserLlmModelConfigUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.UserLlmModelConfigUpdateInput, Prisma.UserLlmModelConfigUncheckedUpdateInput>;
};
export type UserLlmModelConfigDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.UserLlmModelConfigWhereUniqueInput;
};
export type UserLlmModelConfigDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserLlmModelConfigWhereInput;
    limit?: number;
};
export type UserLlmModelConfigDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
};
