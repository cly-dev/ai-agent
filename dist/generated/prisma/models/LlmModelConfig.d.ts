import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type LlmModelConfigModel = runtime.Types.Result.DefaultSelection<Prisma.$LlmModelConfigPayload>;
export type AggregateLlmModelConfig = {
    _count: LlmModelConfigCountAggregateOutputType | null;
    _avg: LlmModelConfigAvgAggregateOutputType | null;
    _sum: LlmModelConfigSumAggregateOutputType | null;
    _min: LlmModelConfigMinAggregateOutputType | null;
    _max: LlmModelConfigMaxAggregateOutputType | null;
};
export type LlmModelConfigAvgAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    maxTokens: number | null;
    temperature: number | null;
};
export type LlmModelConfigSumAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    maxTokens: number | null;
    temperature: number | null;
};
export type LlmModelConfigMinAggregateOutputType = {
    id: number | null;
    kind: $Enums.LlmModelKind | null;
    singletonKey: number | null;
    provider: string | null;
    model: string | null;
    apiKey: string | null;
    baseUrl: string | null;
    chatPath: string | null;
    stream: boolean | null;
    maxTokens: number | null;
    temperature: number | null;
    enabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type LlmModelConfigMaxAggregateOutputType = {
    id: number | null;
    kind: $Enums.LlmModelKind | null;
    singletonKey: number | null;
    provider: string | null;
    model: string | null;
    apiKey: string | null;
    baseUrl: string | null;
    chatPath: string | null;
    stream: boolean | null;
    maxTokens: number | null;
    temperature: number | null;
    enabled: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type LlmModelConfigCountAggregateOutputType = {
    id: number;
    kind: number;
    singletonKey: number;
    provider: number;
    model: number;
    apiKey: number;
    baseUrl: number;
    chatPath: number;
    parameters: number;
    stream: number;
    maxTokens: number;
    temperature: number;
    enabled: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type LlmModelConfigAvgAggregateInputType = {
    id?: true;
    singletonKey?: true;
    maxTokens?: true;
    temperature?: true;
};
export type LlmModelConfigSumAggregateInputType = {
    id?: true;
    singletonKey?: true;
    maxTokens?: true;
    temperature?: true;
};
export type LlmModelConfigMinAggregateInputType = {
    id?: true;
    kind?: true;
    singletonKey?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    chatPath?: true;
    stream?: true;
    maxTokens?: true;
    temperature?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type LlmModelConfigMaxAggregateInputType = {
    id?: true;
    kind?: true;
    singletonKey?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    chatPath?: true;
    stream?: true;
    maxTokens?: true;
    temperature?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type LlmModelConfigCountAggregateInputType = {
    id?: true;
    kind?: true;
    singletonKey?: true;
    provider?: true;
    model?: true;
    apiKey?: true;
    baseUrl?: true;
    chatPath?: true;
    parameters?: true;
    stream?: true;
    maxTokens?: true;
    temperature?: true;
    enabled?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type LlmModelConfigAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.LlmModelConfigWhereInput;
    orderBy?: Prisma.LlmModelConfigOrderByWithRelationInput | Prisma.LlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.LlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | LlmModelConfigCountAggregateInputType;
    _avg?: LlmModelConfigAvgAggregateInputType;
    _sum?: LlmModelConfigSumAggregateInputType;
    _min?: LlmModelConfigMinAggregateInputType;
    _max?: LlmModelConfigMaxAggregateInputType;
};
export type GetLlmModelConfigAggregateType<T extends LlmModelConfigAggregateArgs> = {
    [P in keyof T & keyof AggregateLlmModelConfig]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateLlmModelConfig[P]> : Prisma.GetScalarType<T[P], AggregateLlmModelConfig[P]>;
};
export type LlmModelConfigGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.LlmModelConfigWhereInput;
    orderBy?: Prisma.LlmModelConfigOrderByWithAggregationInput | Prisma.LlmModelConfigOrderByWithAggregationInput[];
    by: Prisma.LlmModelConfigScalarFieldEnum[] | Prisma.LlmModelConfigScalarFieldEnum;
    having?: Prisma.LlmModelConfigScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: LlmModelConfigCountAggregateInputType | true;
    _avg?: LlmModelConfigAvgAggregateInputType;
    _sum?: LlmModelConfigSumAggregateInputType;
    _min?: LlmModelConfigMinAggregateInputType;
    _max?: LlmModelConfigMaxAggregateInputType;
};
export type LlmModelConfigGroupByOutputType = {
    id: number;
    kind: $Enums.LlmModelKind;
    singletonKey: number | null;
    provider: string;
    model: string;
    apiKey: string | null;
    baseUrl: string;
    chatPath: string;
    parameters: runtime.JsonValue | null;
    stream: boolean;
    maxTokens: number | null;
    temperature: number | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: LlmModelConfigCountAggregateOutputType | null;
    _avg: LlmModelConfigAvgAggregateOutputType | null;
    _sum: LlmModelConfigSumAggregateOutputType | null;
    _min: LlmModelConfigMinAggregateOutputType | null;
    _max: LlmModelConfigMaxAggregateOutputType | null;
};
export type GetLlmModelConfigGroupByPayload<T extends LlmModelConfigGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<LlmModelConfigGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof LlmModelConfigGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], LlmModelConfigGroupByOutputType[P]> : Prisma.GetScalarType<T[P], LlmModelConfigGroupByOutputType[P]>;
}>>;
export type LlmModelConfigWhereInput = {
    AND?: Prisma.LlmModelConfigWhereInput | Prisma.LlmModelConfigWhereInput[];
    OR?: Prisma.LlmModelConfigWhereInput[];
    NOT?: Prisma.LlmModelConfigWhereInput | Prisma.LlmModelConfigWhereInput[];
    id?: Prisma.IntFilter<"LlmModelConfig"> | number;
    kind?: Prisma.EnumLlmModelKindFilter<"LlmModelConfig"> | $Enums.LlmModelKind;
    singletonKey?: Prisma.IntNullableFilter<"LlmModelConfig"> | number | null;
    provider?: Prisma.StringFilter<"LlmModelConfig"> | string;
    model?: Prisma.StringFilter<"LlmModelConfig"> | string;
    apiKey?: Prisma.StringNullableFilter<"LlmModelConfig"> | string | null;
    baseUrl?: Prisma.StringFilter<"LlmModelConfig"> | string;
    chatPath?: Prisma.StringFilter<"LlmModelConfig"> | string;
    parameters?: Prisma.JsonNullableFilter<"LlmModelConfig">;
    stream?: Prisma.BoolFilter<"LlmModelConfig"> | boolean;
    maxTokens?: Prisma.IntNullableFilter<"LlmModelConfig"> | number | null;
    temperature?: Prisma.FloatNullableFilter<"LlmModelConfig"> | number | null;
    enabled?: Prisma.BoolFilter<"LlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"LlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"LlmModelConfig"> | Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditListRelationFilter;
};
export type LlmModelConfigOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    kind?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    chatPath?: Prisma.SortOrder;
    parameters?: Prisma.SortOrderInput | Prisma.SortOrder;
    stream?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    temperature?: Prisma.SortOrderInput | Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditOrderByRelationAggregateInput;
};
export type LlmModelConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.LlmModelConfigWhereInput | Prisma.LlmModelConfigWhereInput[];
    OR?: Prisma.LlmModelConfigWhereInput[];
    NOT?: Prisma.LlmModelConfigWhereInput | Prisma.LlmModelConfigWhereInput[];
    kind?: Prisma.EnumLlmModelKindFilter<"LlmModelConfig"> | $Enums.LlmModelKind;
    singletonKey?: Prisma.IntNullableFilter<"LlmModelConfig"> | number | null;
    provider?: Prisma.StringFilter<"LlmModelConfig"> | string;
    model?: Prisma.StringFilter<"LlmModelConfig"> | string;
    apiKey?: Prisma.StringNullableFilter<"LlmModelConfig"> | string | null;
    baseUrl?: Prisma.StringFilter<"LlmModelConfig"> | string;
    chatPath?: Prisma.StringFilter<"LlmModelConfig"> | string;
    parameters?: Prisma.JsonNullableFilter<"LlmModelConfig">;
    stream?: Prisma.BoolFilter<"LlmModelConfig"> | boolean;
    maxTokens?: Prisma.IntNullableFilter<"LlmModelConfig"> | number | null;
    temperature?: Prisma.FloatNullableFilter<"LlmModelConfig"> | number | null;
    enabled?: Prisma.BoolFilter<"LlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"LlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"LlmModelConfig"> | Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditListRelationFilter;
}, "id">;
export type LlmModelConfigOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    kind?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrderInput | Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    chatPath?: Prisma.SortOrder;
    parameters?: Prisma.SortOrderInput | Prisma.SortOrder;
    stream?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    temperature?: Prisma.SortOrderInput | Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.LlmModelConfigCountOrderByAggregateInput;
    _avg?: Prisma.LlmModelConfigAvgOrderByAggregateInput;
    _max?: Prisma.LlmModelConfigMaxOrderByAggregateInput;
    _min?: Prisma.LlmModelConfigMinOrderByAggregateInput;
    _sum?: Prisma.LlmModelConfigSumOrderByAggregateInput;
};
export type LlmModelConfigScalarWhereWithAggregatesInput = {
    AND?: Prisma.LlmModelConfigScalarWhereWithAggregatesInput | Prisma.LlmModelConfigScalarWhereWithAggregatesInput[];
    OR?: Prisma.LlmModelConfigScalarWhereWithAggregatesInput[];
    NOT?: Prisma.LlmModelConfigScalarWhereWithAggregatesInput | Prisma.LlmModelConfigScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"LlmModelConfig"> | number;
    kind?: Prisma.EnumLlmModelKindWithAggregatesFilter<"LlmModelConfig"> | $Enums.LlmModelKind;
    singletonKey?: Prisma.IntNullableWithAggregatesFilter<"LlmModelConfig"> | number | null;
    provider?: Prisma.StringWithAggregatesFilter<"LlmModelConfig"> | string;
    model?: Prisma.StringWithAggregatesFilter<"LlmModelConfig"> | string;
    apiKey?: Prisma.StringNullableWithAggregatesFilter<"LlmModelConfig"> | string | null;
    baseUrl?: Prisma.StringWithAggregatesFilter<"LlmModelConfig"> | string;
    chatPath?: Prisma.StringWithAggregatesFilter<"LlmModelConfig"> | string;
    parameters?: Prisma.JsonNullableWithAggregatesFilter<"LlmModelConfig">;
    stream?: Prisma.BoolWithAggregatesFilter<"LlmModelConfig"> | boolean;
    maxTokens?: Prisma.IntNullableWithAggregatesFilter<"LlmModelConfig"> | number | null;
    temperature?: Prisma.FloatNullableWithAggregatesFilter<"LlmModelConfig"> | number | null;
    enabled?: Prisma.BoolWithAggregatesFilter<"LlmModelConfig"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"LlmModelConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"LlmModelConfig"> | Date | string;
};
export type LlmModelConfigCreateInput = {
    kind?: $Enums.LlmModelKind;
    singletonKey?: number | null;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditCreateNestedManyWithoutModelConfigInput;
};
export type LlmModelConfigUncheckedCreateInput = {
    id?: number;
    kind?: $Enums.LlmModelKind;
    singletonKey?: number | null;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditUncheckedCreateNestedManyWithoutModelConfigInput;
};
export type LlmModelConfigUpdateInput = {
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditUpdateManyWithoutModelConfigNestedInput;
};
export type LlmModelConfigUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    pageAgentLlmProxyAudits?: Prisma.PageAgentLlmProxyAuditUncheckedUpdateManyWithoutModelConfigNestedInput;
};
export type LlmModelConfigCreateManyInput = {
    id?: number;
    kind?: $Enums.LlmModelKind;
    singletonKey?: number | null;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type LlmModelConfigUpdateManyMutationInput = {
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type LlmModelConfigUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type LlmModelConfigCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    kind?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    chatPath?: Prisma.SortOrder;
    parameters?: Prisma.SortOrder;
    stream?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type LlmModelConfigAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
};
export type LlmModelConfigMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    kind?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    chatPath?: Prisma.SortOrder;
    stream?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type LlmModelConfigMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    kind?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    model?: Prisma.SortOrder;
    apiKey?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    chatPath?: Prisma.SortOrder;
    stream?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
    enabled?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type LlmModelConfigSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    maxTokens?: Prisma.SortOrder;
    temperature?: Prisma.SortOrder;
};
export type LlmModelConfigNullableScalarRelationFilter = {
    is?: Prisma.LlmModelConfigWhereInput | null;
    isNot?: Prisma.LlmModelConfigWhereInput | null;
};
export type EnumLlmModelKindFieldUpdateOperationsInput = {
    set?: $Enums.LlmModelKind;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type LlmModelConfigCreateNestedOneWithoutPageAgentLlmProxyAuditsInput = {
    create?: Prisma.XOR<Prisma.LlmModelConfigCreateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedCreateWithoutPageAgentLlmProxyAuditsInput>;
    connectOrCreate?: Prisma.LlmModelConfigCreateOrConnectWithoutPageAgentLlmProxyAuditsInput;
    connect?: Prisma.LlmModelConfigWhereUniqueInput;
};
export type LlmModelConfigUpdateOneWithoutPageAgentLlmProxyAuditsNestedInput = {
    create?: Prisma.XOR<Prisma.LlmModelConfigCreateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedCreateWithoutPageAgentLlmProxyAuditsInput>;
    connectOrCreate?: Prisma.LlmModelConfigCreateOrConnectWithoutPageAgentLlmProxyAuditsInput;
    upsert?: Prisma.LlmModelConfigUpsertWithoutPageAgentLlmProxyAuditsInput;
    disconnect?: Prisma.LlmModelConfigWhereInput | boolean;
    delete?: Prisma.LlmModelConfigWhereInput | boolean;
    connect?: Prisma.LlmModelConfigWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.LlmModelConfigUpdateToOneWithWhereWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUpdateWithoutPageAgentLlmProxyAuditsInput>, Prisma.LlmModelConfigUncheckedUpdateWithoutPageAgentLlmProxyAuditsInput>;
};
export type LlmModelConfigCreateWithoutPageAgentLlmProxyAuditsInput = {
    kind?: $Enums.LlmModelKind;
    singletonKey?: number | null;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type LlmModelConfigUncheckedCreateWithoutPageAgentLlmProxyAuditsInput = {
    id?: number;
    kind?: $Enums.LlmModelKind;
    singletonKey?: number | null;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type LlmModelConfigCreateOrConnectWithoutPageAgentLlmProxyAuditsInput = {
    where: Prisma.LlmModelConfigWhereUniqueInput;
    create: Prisma.XOR<Prisma.LlmModelConfigCreateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedCreateWithoutPageAgentLlmProxyAuditsInput>;
};
export type LlmModelConfigUpsertWithoutPageAgentLlmProxyAuditsInput = {
    update: Prisma.XOR<Prisma.LlmModelConfigUpdateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedUpdateWithoutPageAgentLlmProxyAuditsInput>;
    create: Prisma.XOR<Prisma.LlmModelConfigCreateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedCreateWithoutPageAgentLlmProxyAuditsInput>;
    where?: Prisma.LlmModelConfigWhereInput;
};
export type LlmModelConfigUpdateToOneWithWhereWithoutPageAgentLlmProxyAuditsInput = {
    where?: Prisma.LlmModelConfigWhereInput;
    data: Prisma.XOR<Prisma.LlmModelConfigUpdateWithoutPageAgentLlmProxyAuditsInput, Prisma.LlmModelConfigUncheckedUpdateWithoutPageAgentLlmProxyAuditsInput>;
};
export type LlmModelConfigUpdateWithoutPageAgentLlmProxyAuditsInput = {
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type LlmModelConfigUncheckedUpdateWithoutPageAgentLlmProxyAuditsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    kind?: Prisma.EnumLlmModelKindFieldUpdateOperationsInput | $Enums.LlmModelKind;
    singletonKey?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.StringFieldUpdateOperationsInput | string;
    model?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKey?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    baseUrl?: Prisma.StringFieldUpdateOperationsInput | string;
    chatPath?: Prisma.StringFieldUpdateOperationsInput | string;
    parameters?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    stream?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    maxTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    temperature?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    enabled?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type LlmModelConfigCountOutputType = {
    pageAgentLlmProxyAudits: number;
};
export type LlmModelConfigCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    pageAgentLlmProxyAudits?: boolean | LlmModelConfigCountOutputTypeCountPageAgentLlmProxyAuditsArgs;
};
export type LlmModelConfigCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigCountOutputTypeSelect<ExtArgs> | null;
};
export type LlmModelConfigCountOutputTypeCountPageAgentLlmProxyAuditsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PageAgentLlmProxyAuditWhereInput;
};
export type LlmModelConfigSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    kind?: boolean;
    singletonKey?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    chatPath?: boolean;
    parameters?: boolean;
    stream?: boolean;
    maxTokens?: boolean;
    temperature?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    pageAgentLlmProxyAudits?: boolean | Prisma.LlmModelConfig$pageAgentLlmProxyAuditsArgs<ExtArgs>;
    _count?: boolean | Prisma.LlmModelConfigCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["llmModelConfig"]>;
export type LlmModelConfigSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    kind?: boolean;
    singletonKey?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    chatPath?: boolean;
    parameters?: boolean;
    stream?: boolean;
    maxTokens?: boolean;
    temperature?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["llmModelConfig"]>;
export type LlmModelConfigSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    kind?: boolean;
    singletonKey?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    chatPath?: boolean;
    parameters?: boolean;
    stream?: boolean;
    maxTokens?: boolean;
    temperature?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["llmModelConfig"]>;
export type LlmModelConfigSelectScalar = {
    id?: boolean;
    kind?: boolean;
    singletonKey?: boolean;
    provider?: boolean;
    model?: boolean;
    apiKey?: boolean;
    baseUrl?: boolean;
    chatPath?: boolean;
    parameters?: boolean;
    stream?: boolean;
    maxTokens?: boolean;
    temperature?: boolean;
    enabled?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type LlmModelConfigOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "kind" | "singletonKey" | "provider" | "model" | "apiKey" | "baseUrl" | "chatPath" | "parameters" | "stream" | "maxTokens" | "temperature" | "enabled" | "createdAt" | "updatedAt", ExtArgs["result"]["llmModelConfig"]>;
export type LlmModelConfigInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    pageAgentLlmProxyAudits?: boolean | Prisma.LlmModelConfig$pageAgentLlmProxyAuditsArgs<ExtArgs>;
    _count?: boolean | Prisma.LlmModelConfigCountOutputTypeDefaultArgs<ExtArgs>;
};
export type LlmModelConfigIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type LlmModelConfigIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $LlmModelConfigPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "LlmModelConfig";
    objects: {
        pageAgentLlmProxyAudits: Prisma.$PageAgentLlmProxyAuditPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        kind: $Enums.LlmModelKind;
        singletonKey: number | null;
        provider: string;
        model: string;
        apiKey: string | null;
        baseUrl: string;
        chatPath: string;
        parameters: runtime.JsonValue | null;
        stream: boolean;
        maxTokens: number | null;
        temperature: number | null;
        enabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["llmModelConfig"]>;
    composites: {};
};
export type LlmModelConfigGetPayload<S extends boolean | null | undefined | LlmModelConfigDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload, S>;
export type LlmModelConfigCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<LlmModelConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: LlmModelConfigCountAggregateInputType | true;
};
export interface LlmModelConfigDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['LlmModelConfig'];
        meta: {
            name: 'LlmModelConfig';
        };
    };
    findUnique<T extends LlmModelConfigFindUniqueArgs>(args: Prisma.SelectSubset<T, LlmModelConfigFindUniqueArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends LlmModelConfigFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, LlmModelConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends LlmModelConfigFindFirstArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigFindFirstArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends LlmModelConfigFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends LlmModelConfigFindManyArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends LlmModelConfigCreateArgs>(args: Prisma.SelectSubset<T, LlmModelConfigCreateArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends LlmModelConfigCreateManyArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends LlmModelConfigCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends LlmModelConfigDeleteArgs>(args: Prisma.SelectSubset<T, LlmModelConfigDeleteArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends LlmModelConfigUpdateArgs>(args: Prisma.SelectSubset<T, LlmModelConfigUpdateArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends LlmModelConfigDeleteManyArgs>(args?: Prisma.SelectSubset<T, LlmModelConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends LlmModelConfigUpdateManyArgs>(args: Prisma.SelectSubset<T, LlmModelConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends LlmModelConfigUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, LlmModelConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends LlmModelConfigUpsertArgs>(args: Prisma.SelectSubset<T, LlmModelConfigUpsertArgs<ExtArgs>>): Prisma.Prisma__LlmModelConfigClient<runtime.Types.Result.GetResult<Prisma.$LlmModelConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends LlmModelConfigCountArgs>(args?: Prisma.Subset<T, LlmModelConfigCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], LlmModelConfigCountAggregateOutputType> : number>;
    aggregate<T extends LlmModelConfigAggregateArgs>(args: Prisma.Subset<T, LlmModelConfigAggregateArgs>): Prisma.PrismaPromise<GetLlmModelConfigAggregateType<T>>;
    groupBy<T extends LlmModelConfigGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: LlmModelConfigGroupByArgs['orderBy'];
    } : {
        orderBy?: LlmModelConfigGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, LlmModelConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLlmModelConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: LlmModelConfigFieldRefs;
}
export interface Prisma__LlmModelConfigClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    pageAgentLlmProxyAudits<T extends Prisma.LlmModelConfig$pageAgentLlmProxyAuditsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.LlmModelConfig$pageAgentLlmProxyAuditsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PageAgentLlmProxyAuditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface LlmModelConfigFieldRefs {
    readonly id: Prisma.FieldRef<"LlmModelConfig", 'Int'>;
    readonly kind: Prisma.FieldRef<"LlmModelConfig", 'LlmModelKind'>;
    readonly singletonKey: Prisma.FieldRef<"LlmModelConfig", 'Int'>;
    readonly provider: Prisma.FieldRef<"LlmModelConfig", 'String'>;
    readonly model: Prisma.FieldRef<"LlmModelConfig", 'String'>;
    readonly apiKey: Prisma.FieldRef<"LlmModelConfig", 'String'>;
    readonly baseUrl: Prisma.FieldRef<"LlmModelConfig", 'String'>;
    readonly chatPath: Prisma.FieldRef<"LlmModelConfig", 'String'>;
    readonly parameters: Prisma.FieldRef<"LlmModelConfig", 'Json'>;
    readonly stream: Prisma.FieldRef<"LlmModelConfig", 'Boolean'>;
    readonly maxTokens: Prisma.FieldRef<"LlmModelConfig", 'Int'>;
    readonly temperature: Prisma.FieldRef<"LlmModelConfig", 'Float'>;
    readonly enabled: Prisma.FieldRef<"LlmModelConfig", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"LlmModelConfig", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"LlmModelConfig", 'DateTime'>;
}
export type LlmModelConfigFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.LlmModelConfigWhereUniqueInput;
};
export type LlmModelConfigFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.LlmModelConfigWhereUniqueInput;
};
export type LlmModelConfigFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.LlmModelConfigWhereInput;
    orderBy?: Prisma.LlmModelConfigOrderByWithRelationInput | Prisma.LlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.LlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.LlmModelConfigScalarFieldEnum | Prisma.LlmModelConfigScalarFieldEnum[];
};
export type LlmModelConfigFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.LlmModelConfigWhereInput;
    orderBy?: Prisma.LlmModelConfigOrderByWithRelationInput | Prisma.LlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.LlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.LlmModelConfigScalarFieldEnum | Prisma.LlmModelConfigScalarFieldEnum[];
};
export type LlmModelConfigFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.LlmModelConfigWhereInput;
    orderBy?: Prisma.LlmModelConfigOrderByWithRelationInput | Prisma.LlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.LlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.LlmModelConfigScalarFieldEnum | Prisma.LlmModelConfigScalarFieldEnum[];
};
export type LlmModelConfigCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.LlmModelConfigCreateInput, Prisma.LlmModelConfigUncheckedCreateInput>;
};
export type LlmModelConfigCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.LlmModelConfigCreateManyInput | Prisma.LlmModelConfigCreateManyInput[];
    skipDuplicates?: boolean;
};
export type LlmModelConfigCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    data: Prisma.LlmModelConfigCreateManyInput | Prisma.LlmModelConfigCreateManyInput[];
    skipDuplicates?: boolean;
};
export type LlmModelConfigUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.LlmModelConfigUpdateInput, Prisma.LlmModelConfigUncheckedUpdateInput>;
    where: Prisma.LlmModelConfigWhereUniqueInput;
};
export type LlmModelConfigUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.LlmModelConfigUpdateManyMutationInput, Prisma.LlmModelConfigUncheckedUpdateManyInput>;
    where?: Prisma.LlmModelConfigWhereInput;
    limit?: number;
};
export type LlmModelConfigUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.LlmModelConfigUpdateManyMutationInput, Prisma.LlmModelConfigUncheckedUpdateManyInput>;
    where?: Prisma.LlmModelConfigWhereInput;
    limit?: number;
};
export type LlmModelConfigUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.LlmModelConfigWhereUniqueInput;
    create: Prisma.XOR<Prisma.LlmModelConfigCreateInput, Prisma.LlmModelConfigUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.LlmModelConfigUpdateInput, Prisma.LlmModelConfigUncheckedUpdateInput>;
};
export type LlmModelConfigDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
    where: Prisma.LlmModelConfigWhereUniqueInput;
};
export type LlmModelConfigDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.LlmModelConfigWhereInput;
    limit?: number;
};
export type LlmModelConfig$pageAgentLlmProxyAuditsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PageAgentLlmProxyAuditSelect<ExtArgs> | null;
    omit?: Prisma.PageAgentLlmProxyAuditOmit<ExtArgs> | null;
    include?: Prisma.PageAgentLlmProxyAuditInclude<ExtArgs> | null;
    where?: Prisma.PageAgentLlmProxyAuditWhereInput;
    orderBy?: Prisma.PageAgentLlmProxyAuditOrderByWithRelationInput | Prisma.PageAgentLlmProxyAuditOrderByWithRelationInput[];
    cursor?: Prisma.PageAgentLlmProxyAuditWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PageAgentLlmProxyAuditScalarFieldEnum | Prisma.PageAgentLlmProxyAuditScalarFieldEnum[];
};
export type LlmModelConfigDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.LlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.LlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.LlmModelConfigInclude<ExtArgs> | null;
};
