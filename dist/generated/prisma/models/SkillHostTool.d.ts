import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type SkillHostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$SkillHostToolPayload>;
export type AggregateSkillHostTool = {
    _count: SkillHostToolCountAggregateOutputType | null;
    _avg: SkillHostToolAvgAggregateOutputType | null;
    _sum: SkillHostToolSumAggregateOutputType | null;
    _min: SkillHostToolMinAggregateOutputType | null;
    _max: SkillHostToolMaxAggregateOutputType | null;
};
export type SkillHostToolAvgAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    hostToolId: number | null;
    priority: number | null;
};
export type SkillHostToolSumAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    hostToolId: number | null;
    priority: number | null;
};
export type SkillHostToolMinAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    hostToolId: number | null;
    trigger: $Enums.HostToolSkillTrigger | null;
    priority: number | null;
    isRequired: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SkillHostToolMaxAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    hostToolId: number | null;
    trigger: $Enums.HostToolSkillTrigger | null;
    priority: number | null;
    isRequired: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SkillHostToolCountAggregateOutputType = {
    id: number;
    skillId: number;
    hostToolId: number;
    trigger: number;
    argsTemplate: number;
    priority: number;
    isRequired: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type SkillHostToolAvgAggregateInputType = {
    id?: true;
    skillId?: true;
    hostToolId?: true;
    priority?: true;
};
export type SkillHostToolSumAggregateInputType = {
    id?: true;
    skillId?: true;
    hostToolId?: true;
    priority?: true;
};
export type SkillHostToolMinAggregateInputType = {
    id?: true;
    skillId?: true;
    hostToolId?: true;
    trigger?: true;
    priority?: true;
    isRequired?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SkillHostToolMaxAggregateInputType = {
    id?: true;
    skillId?: true;
    hostToolId?: true;
    trigger?: true;
    priority?: true;
    isRequired?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SkillHostToolCountAggregateInputType = {
    id?: true;
    skillId?: true;
    hostToolId?: true;
    trigger?: true;
    argsTemplate?: true;
    priority?: true;
    isRequired?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type SkillHostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithRelationInput | Prisma.SkillHostToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SkillHostToolCountAggregateInputType;
    _avg?: SkillHostToolAvgAggregateInputType;
    _sum?: SkillHostToolSumAggregateInputType;
    _min?: SkillHostToolMinAggregateInputType;
    _max?: SkillHostToolMaxAggregateInputType;
};
export type GetSkillHostToolAggregateType<T extends SkillHostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateSkillHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSkillHostTool[P]> : Prisma.GetScalarType<T[P], AggregateSkillHostTool[P]>;
};
export type SkillHostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithAggregationInput | Prisma.SkillHostToolOrderByWithAggregationInput[];
    by: Prisma.SkillHostToolScalarFieldEnum[] | Prisma.SkillHostToolScalarFieldEnum;
    having?: Prisma.SkillHostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SkillHostToolCountAggregateInputType | true;
    _avg?: SkillHostToolAvgAggregateInputType;
    _sum?: SkillHostToolSumAggregateInputType;
    _min?: SkillHostToolMinAggregateInputType;
    _max?: SkillHostToolMaxAggregateInputType;
};
export type SkillHostToolGroupByOutputType = {
    id: number;
    skillId: number;
    hostToolId: number;
    trigger: $Enums.HostToolSkillTrigger;
    argsTemplate: runtime.JsonValue | null;
    priority: number;
    isRequired: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: SkillHostToolCountAggregateOutputType | null;
    _avg: SkillHostToolAvgAggregateOutputType | null;
    _sum: SkillHostToolSumAggregateOutputType | null;
    _min: SkillHostToolMinAggregateOutputType | null;
    _max: SkillHostToolMaxAggregateOutputType | null;
};
export type GetSkillHostToolGroupByPayload<T extends SkillHostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SkillHostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SkillHostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SkillHostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SkillHostToolGroupByOutputType[P]>;
}>>;
export type SkillHostToolWhereInput = {
    AND?: Prisma.SkillHostToolWhereInput | Prisma.SkillHostToolWhereInput[];
    OR?: Prisma.SkillHostToolWhereInput[];
    NOT?: Prisma.SkillHostToolWhereInput | Prisma.SkillHostToolWhereInput[];
    id?: Prisma.IntFilter<"SkillHostTool"> | number;
    skillId?: Prisma.IntFilter<"SkillHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"SkillHostTool"> | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFilter<"SkillHostTool"> | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.JsonNullableFilter<"SkillHostTool">;
    priority?: Prisma.IntFilter<"SkillHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillHostTool"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
};
export type SkillHostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    trigger?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrderInput | Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    skill?: Prisma.SkillOrderByWithRelationInput;
    hostTool?: Prisma.HostToolOrderByWithRelationInput;
};
export type SkillHostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    skillId_hostToolId?: Prisma.SkillHostToolSkillIdHostToolIdCompoundUniqueInput;
    AND?: Prisma.SkillHostToolWhereInput | Prisma.SkillHostToolWhereInput[];
    OR?: Prisma.SkillHostToolWhereInput[];
    NOT?: Prisma.SkillHostToolWhereInput | Prisma.SkillHostToolWhereInput[];
    skillId?: Prisma.IntFilter<"SkillHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"SkillHostTool"> | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFilter<"SkillHostTool"> | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.JsonNullableFilter<"SkillHostTool">;
    priority?: Prisma.IntFilter<"SkillHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillHostTool"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
}, "id" | "skillId_hostToolId">;
export type SkillHostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    trigger?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrderInput | Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.SkillHostToolCountOrderByAggregateInput;
    _avg?: Prisma.SkillHostToolAvgOrderByAggregateInput;
    _max?: Prisma.SkillHostToolMaxOrderByAggregateInput;
    _min?: Prisma.SkillHostToolMinOrderByAggregateInput;
    _sum?: Prisma.SkillHostToolSumOrderByAggregateInput;
};
export type SkillHostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.SkillHostToolScalarWhereWithAggregatesInput | Prisma.SkillHostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.SkillHostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SkillHostToolScalarWhereWithAggregatesInput | Prisma.SkillHostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"SkillHostTool"> | number;
    skillId?: Prisma.IntWithAggregatesFilter<"SkillHostTool"> | number;
    hostToolId?: Prisma.IntWithAggregatesFilter<"SkillHostTool"> | number;
    trigger?: Prisma.EnumHostToolSkillTriggerWithAggregatesFilter<"SkillHostTool"> | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.JsonNullableWithAggregatesFilter<"SkillHostTool">;
    priority?: Prisma.IntWithAggregatesFilter<"SkillHostTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"SkillHostTool"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SkillHostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"SkillHostTool"> | Date | string;
};
export type SkillHostToolCreateInput = {
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    skill: Prisma.SkillCreateNestedOneWithoutSkillHostToolsInput;
    hostTool: Prisma.HostToolCreateNestedOneWithoutSkillHostToolsInput;
};
export type SkillHostToolUncheckedCreateInput = {
    id?: number;
    skillId: number;
    hostToolId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolUpdateInput = {
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    skill?: Prisma.SkillUpdateOneRequiredWithoutSkillHostToolsNestedInput;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutSkillHostToolsNestedInput;
};
export type SkillHostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolCreateManyInput = {
    id?: number;
    skillId: number;
    hostToolId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolUpdateManyMutationInput = {
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolListRelationFilter = {
    every?: Prisma.SkillHostToolWhereInput;
    some?: Prisma.SkillHostToolWhereInput;
    none?: Prisma.SkillHostToolWhereInput;
};
export type SkillHostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type SkillHostToolSkillIdHostToolIdCompoundUniqueInput = {
    skillId: number;
    hostToolId: number;
};
export type SkillHostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    trigger?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SkillHostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
};
export type SkillHostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    trigger?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SkillHostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    trigger?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SkillHostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    priority?: Prisma.SortOrder;
};
export type SkillHostToolCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput> | Prisma.SkillHostToolCreateWithoutSkillInput[] | Prisma.SkillHostToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutSkillInput | Prisma.SkillHostToolCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.SkillHostToolCreateManySkillInputEnvelope;
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
};
export type SkillHostToolUncheckedCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput> | Prisma.SkillHostToolCreateWithoutSkillInput[] | Prisma.SkillHostToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutSkillInput | Prisma.SkillHostToolCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.SkillHostToolCreateManySkillInputEnvelope;
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
};
export type SkillHostToolUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput> | Prisma.SkillHostToolCreateWithoutSkillInput[] | Prisma.SkillHostToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutSkillInput | Prisma.SkillHostToolCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.SkillHostToolUpsertWithWhereUniqueWithoutSkillInput | Prisma.SkillHostToolUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.SkillHostToolCreateManySkillInputEnvelope;
    set?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    disconnect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    delete?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    update?: Prisma.SkillHostToolUpdateWithWhereUniqueWithoutSkillInput | Prisma.SkillHostToolUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.SkillHostToolUpdateManyWithWhereWithoutSkillInput | Prisma.SkillHostToolUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
};
export type SkillHostToolUncheckedUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput> | Prisma.SkillHostToolCreateWithoutSkillInput[] | Prisma.SkillHostToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutSkillInput | Prisma.SkillHostToolCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.SkillHostToolUpsertWithWhereUniqueWithoutSkillInput | Prisma.SkillHostToolUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.SkillHostToolCreateManySkillInputEnvelope;
    set?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    disconnect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    delete?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    update?: Prisma.SkillHostToolUpdateWithWhereUniqueWithoutSkillInput | Prisma.SkillHostToolUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.SkillHostToolUpdateManyWithWhereWithoutSkillInput | Prisma.SkillHostToolUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
};
export type SkillHostToolCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput> | Prisma.SkillHostToolCreateWithoutHostToolInput[] | Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput | Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.SkillHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
};
export type SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput> | Prisma.SkillHostToolCreateWithoutHostToolInput[] | Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput | Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.SkillHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
};
export type SkillHostToolUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput> | Prisma.SkillHostToolCreateWithoutHostToolInput[] | Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput | Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.SkillHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.SkillHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.SkillHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    disconnect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    delete?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    update?: Prisma.SkillHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.SkillHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.SkillHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.SkillHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
};
export type SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput> | Prisma.SkillHostToolCreateWithoutHostToolInput[] | Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput | Prisma.SkillHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.SkillHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.SkillHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.SkillHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    disconnect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    delete?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    connect?: Prisma.SkillHostToolWhereUniqueInput | Prisma.SkillHostToolWhereUniqueInput[];
    update?: Prisma.SkillHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.SkillHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.SkillHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.SkillHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
};
export type EnumHostToolSkillTriggerFieldUpdateOperationsInput = {
    set?: $Enums.HostToolSkillTrigger;
};
export type SkillHostToolCreateWithoutSkillInput = {
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    hostTool: Prisma.HostToolCreateNestedOneWithoutSkillHostToolsInput;
};
export type SkillHostToolUncheckedCreateWithoutSkillInput = {
    id?: number;
    hostToolId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolCreateOrConnectWithoutSkillInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput>;
};
export type SkillHostToolCreateManySkillInputEnvelope = {
    data: Prisma.SkillHostToolCreateManySkillInput | Prisma.SkillHostToolCreateManySkillInput[];
    skipDuplicates?: boolean;
};
export type SkillHostToolUpsertWithWhereUniqueWithoutSkillInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.SkillHostToolUpdateWithoutSkillInput, Prisma.SkillHostToolUncheckedUpdateWithoutSkillInput>;
    create: Prisma.XOR<Prisma.SkillHostToolCreateWithoutSkillInput, Prisma.SkillHostToolUncheckedCreateWithoutSkillInput>;
};
export type SkillHostToolUpdateWithWhereUniqueWithoutSkillInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateWithoutSkillInput, Prisma.SkillHostToolUncheckedUpdateWithoutSkillInput>;
};
export type SkillHostToolUpdateManyWithWhereWithoutSkillInput = {
    where: Prisma.SkillHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateManyMutationInput, Prisma.SkillHostToolUncheckedUpdateManyWithoutSkillInput>;
};
export type SkillHostToolScalarWhereInput = {
    AND?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
    OR?: Prisma.SkillHostToolScalarWhereInput[];
    NOT?: Prisma.SkillHostToolScalarWhereInput | Prisma.SkillHostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"SkillHostTool"> | number;
    skillId?: Prisma.IntFilter<"SkillHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"SkillHostTool"> | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFilter<"SkillHostTool"> | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.JsonNullableFilter<"SkillHostTool">;
    priority?: Prisma.IntFilter<"SkillHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillHostTool"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SkillHostTool"> | Date | string;
};
export type SkillHostToolCreateWithoutHostToolInput = {
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    skill: Prisma.SkillCreateNestedOneWithoutSkillHostToolsInput;
};
export type SkillHostToolUncheckedCreateWithoutHostToolInput = {
    id?: number;
    skillId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolCreateOrConnectWithoutHostToolInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput>;
};
export type SkillHostToolCreateManyHostToolInputEnvelope = {
    data: Prisma.SkillHostToolCreateManyHostToolInput | Prisma.SkillHostToolCreateManyHostToolInput[];
    skipDuplicates?: boolean;
};
export type SkillHostToolUpsertWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.SkillHostToolUpdateWithoutHostToolInput, Prisma.SkillHostToolUncheckedUpdateWithoutHostToolInput>;
    create: Prisma.XOR<Prisma.SkillHostToolCreateWithoutHostToolInput, Prisma.SkillHostToolUncheckedCreateWithoutHostToolInput>;
};
export type SkillHostToolUpdateWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.SkillHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateWithoutHostToolInput, Prisma.SkillHostToolUncheckedUpdateWithoutHostToolInput>;
};
export type SkillHostToolUpdateManyWithWhereWithoutHostToolInput = {
    where: Prisma.SkillHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateManyMutationInput, Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolInput>;
};
export type SkillHostToolCreateManySkillInput = {
    id?: number;
    hostToolId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolUpdateWithoutSkillInput = {
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutSkillHostToolsNestedInput;
};
export type SkillHostToolUncheckedUpdateWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolUncheckedUpdateManyWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolCreateManyHostToolInput = {
    id?: number;
    skillId: number;
    trigger?: $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: number;
    isRequired?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SkillHostToolUpdateWithoutHostToolInput = {
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    skill?: Prisma.SkillUpdateOneRequiredWithoutSkillHostToolsNestedInput;
};
export type SkillHostToolUncheckedUpdateWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolUncheckedUpdateManyWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    trigger?: Prisma.EnumHostToolSkillTriggerFieldUpdateOperationsInput | $Enums.HostToolSkillTrigger;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    priority?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SkillHostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    hostToolId?: boolean;
    trigger?: boolean;
    argsTemplate?: boolean;
    priority?: boolean;
    isRequired?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillHostTool"]>;
export type SkillHostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    hostToolId?: boolean;
    trigger?: boolean;
    argsTemplate?: boolean;
    priority?: boolean;
    isRequired?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillHostTool"]>;
export type SkillHostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    hostToolId?: boolean;
    trigger?: boolean;
    argsTemplate?: boolean;
    priority?: boolean;
    isRequired?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillHostTool"]>;
export type SkillHostToolSelectScalar = {
    id?: boolean;
    skillId?: boolean;
    hostToolId?: boolean;
    trigger?: boolean;
    argsTemplate?: boolean;
    priority?: boolean;
    isRequired?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type SkillHostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "skillId" | "hostToolId" | "trigger" | "argsTemplate" | "priority" | "isRequired" | "createdAt" | "updatedAt", ExtArgs["result"]["skillHostTool"]>;
export type SkillHostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type SkillHostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type SkillHostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type $SkillHostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SkillHostTool";
    objects: {
        skill: Prisma.$SkillPayload<ExtArgs>;
        hostTool: Prisma.$HostToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        skillId: number;
        hostToolId: number;
        trigger: $Enums.HostToolSkillTrigger;
        argsTemplate: runtime.JsonValue | null;
        priority: number;
        isRequired: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["skillHostTool"]>;
    composites: {};
};
export type SkillHostToolGetPayload<S extends boolean | null | undefined | SkillHostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload, S>;
export type SkillHostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SkillHostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SkillHostToolCountAggregateInputType | true;
};
export interface SkillHostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SkillHostTool'];
        meta: {
            name: 'SkillHostTool';
        };
    };
    findUnique<T extends SkillHostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, SkillHostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SkillHostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SkillHostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SkillHostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, SkillHostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SkillHostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SkillHostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SkillHostToolFindManyArgs>(args?: Prisma.SelectSubset<T, SkillHostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SkillHostToolCreateArgs>(args: Prisma.SelectSubset<T, SkillHostToolCreateArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SkillHostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, SkillHostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SkillHostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SkillHostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SkillHostToolDeleteArgs>(args: Prisma.SelectSubset<T, SkillHostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SkillHostToolUpdateArgs>(args: Prisma.SelectSubset<T, SkillHostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SkillHostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, SkillHostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SkillHostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, SkillHostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SkillHostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SkillHostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SkillHostToolUpsertArgs>(args: Prisma.SelectSubset<T, SkillHostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__SkillHostToolClient<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SkillHostToolCountArgs>(args?: Prisma.Subset<T, SkillHostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SkillHostToolCountAggregateOutputType> : number>;
    aggregate<T extends SkillHostToolAggregateArgs>(args: Prisma.Subset<T, SkillHostToolAggregateArgs>): Prisma.PrismaPromise<GetSkillHostToolAggregateType<T>>;
    groupBy<T extends SkillHostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SkillHostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: SkillHostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SkillHostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSkillHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SkillHostToolFieldRefs;
}
export interface Prisma__SkillHostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    skill<T extends Prisma.SkillDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SkillDefaultArgs<ExtArgs>>): Prisma.Prisma__SkillClient<runtime.Types.Result.GetResult<Prisma.$SkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTool<T extends Prisma.HostToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostToolDefaultArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SkillHostToolFieldRefs {
    readonly id: Prisma.FieldRef<"SkillHostTool", 'Int'>;
    readonly skillId: Prisma.FieldRef<"SkillHostTool", 'Int'>;
    readonly hostToolId: Prisma.FieldRef<"SkillHostTool", 'Int'>;
    readonly trigger: Prisma.FieldRef<"SkillHostTool", 'HostToolSkillTrigger'>;
    readonly argsTemplate: Prisma.FieldRef<"SkillHostTool", 'Json'>;
    readonly priority: Prisma.FieldRef<"SkillHostTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"SkillHostTool", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"SkillHostTool", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"SkillHostTool", 'DateTime'>;
}
export type SkillHostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where: Prisma.SkillHostToolWhereUniqueInput;
};
export type SkillHostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where: Prisma.SkillHostToolWhereUniqueInput;
};
export type SkillHostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithRelationInput | Prisma.SkillHostToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillHostToolScalarFieldEnum | Prisma.SkillHostToolScalarFieldEnum[];
};
export type SkillHostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithRelationInput | Prisma.SkillHostToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillHostToolScalarFieldEnum | Prisma.SkillHostToolScalarFieldEnum[];
};
export type SkillHostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithRelationInput | Prisma.SkillHostToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillHostToolScalarFieldEnum | Prisma.SkillHostToolScalarFieldEnum[];
};
export type SkillHostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillHostToolCreateInput, Prisma.SkillHostToolUncheckedCreateInput>;
};
export type SkillHostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SkillHostToolCreateManyInput | Prisma.SkillHostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SkillHostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    data: Prisma.SkillHostToolCreateManyInput | Prisma.SkillHostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.SkillHostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type SkillHostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateInput, Prisma.SkillHostToolUncheckedUpdateInput>;
    where: Prisma.SkillHostToolWhereUniqueInput;
};
export type SkillHostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SkillHostToolUpdateManyMutationInput, Prisma.SkillHostToolUncheckedUpdateManyInput>;
    where?: Prisma.SkillHostToolWhereInput;
    limit?: number;
};
export type SkillHostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillHostToolUpdateManyMutationInput, Prisma.SkillHostToolUncheckedUpdateManyInput>;
    where?: Prisma.SkillHostToolWhereInput;
    limit?: number;
    include?: Prisma.SkillHostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type SkillHostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where: Prisma.SkillHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillHostToolCreateInput, Prisma.SkillHostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SkillHostToolUpdateInput, Prisma.SkillHostToolUncheckedUpdateInput>;
};
export type SkillHostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where: Prisma.SkillHostToolWhereUniqueInput;
};
export type SkillHostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillHostToolWhereInput;
    limit?: number;
};
export type SkillHostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
};
