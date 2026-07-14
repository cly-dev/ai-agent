import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type SkillToolModel = runtime.Types.Result.DefaultSelection<Prisma.$SkillToolPayload>;
export type AggregateSkillTool = {
    _count: SkillToolCountAggregateOutputType | null;
    _avg: SkillToolAvgAggregateOutputType | null;
    _sum: SkillToolSumAggregateOutputType | null;
    _min: SkillToolMinAggregateOutputType | null;
    _max: SkillToolMaxAggregateOutputType | null;
};
export type SkillToolAvgAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    toolId: number | null;
};
export type SkillToolSumAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    toolId: number | null;
};
export type SkillToolMinAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type SkillToolMaxAggregateOutputType = {
    id: number | null;
    skillId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type SkillToolCountAggregateOutputType = {
    id: number;
    skillId: number;
    toolId: number;
    isRequired: number;
    _all: number;
};
export type SkillToolAvgAggregateInputType = {
    id?: true;
    skillId?: true;
    toolId?: true;
};
export type SkillToolSumAggregateInputType = {
    id?: true;
    skillId?: true;
    toolId?: true;
};
export type SkillToolMinAggregateInputType = {
    id?: true;
    skillId?: true;
    toolId?: true;
    isRequired?: true;
};
export type SkillToolMaxAggregateInputType = {
    id?: true;
    skillId?: true;
    toolId?: true;
    isRequired?: true;
};
export type SkillToolCountAggregateInputType = {
    id?: true;
    skillId?: true;
    toolId?: true;
    isRequired?: true;
    _all?: true;
};
export type SkillToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillToolWhereInput;
    orderBy?: Prisma.SkillToolOrderByWithRelationInput | Prisma.SkillToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SkillToolCountAggregateInputType;
    _avg?: SkillToolAvgAggregateInputType;
    _sum?: SkillToolSumAggregateInputType;
    _min?: SkillToolMinAggregateInputType;
    _max?: SkillToolMaxAggregateInputType;
};
export type GetSkillToolAggregateType<T extends SkillToolAggregateArgs> = {
    [P in keyof T & keyof AggregateSkillTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSkillTool[P]> : Prisma.GetScalarType<T[P], AggregateSkillTool[P]>;
};
export type SkillToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillToolWhereInput;
    orderBy?: Prisma.SkillToolOrderByWithAggregationInput | Prisma.SkillToolOrderByWithAggregationInput[];
    by: Prisma.SkillToolScalarFieldEnum[] | Prisma.SkillToolScalarFieldEnum;
    having?: Prisma.SkillToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SkillToolCountAggregateInputType | true;
    _avg?: SkillToolAvgAggregateInputType;
    _sum?: SkillToolSumAggregateInputType;
    _min?: SkillToolMinAggregateInputType;
    _max?: SkillToolMaxAggregateInputType;
};
export type SkillToolGroupByOutputType = {
    id: number;
    skillId: number;
    toolId: number;
    isRequired: boolean;
    _count: SkillToolCountAggregateOutputType | null;
    _avg: SkillToolAvgAggregateOutputType | null;
    _sum: SkillToolSumAggregateOutputType | null;
    _min: SkillToolMinAggregateOutputType | null;
    _max: SkillToolMaxAggregateOutputType | null;
};
export type GetSkillToolGroupByPayload<T extends SkillToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SkillToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SkillToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SkillToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SkillToolGroupByOutputType[P]>;
}>>;
export type SkillToolWhereInput = {
    AND?: Prisma.SkillToolWhereInput | Prisma.SkillToolWhereInput[];
    OR?: Prisma.SkillToolWhereInput[];
    NOT?: Prisma.SkillToolWhereInput | Prisma.SkillToolWhereInput[];
    id?: Prisma.IntFilter<"SkillTool"> | number;
    skillId?: Prisma.IntFilter<"SkillTool"> | number;
    toolId?: Prisma.IntFilter<"SkillTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillTool"> | boolean;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
};
export type SkillToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    skill?: Prisma.SkillOrderByWithRelationInput;
    tool?: Prisma.ToolOrderByWithRelationInput;
};
export type SkillToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    skillId_toolId?: Prisma.SkillToolSkillIdToolIdCompoundUniqueInput;
    AND?: Prisma.SkillToolWhereInput | Prisma.SkillToolWhereInput[];
    OR?: Prisma.SkillToolWhereInput[];
    NOT?: Prisma.SkillToolWhereInput | Prisma.SkillToolWhereInput[];
    skillId?: Prisma.IntFilter<"SkillTool"> | number;
    toolId?: Prisma.IntFilter<"SkillTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillTool"> | boolean;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
}, "id" | "skillId_toolId">;
export type SkillToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    _count?: Prisma.SkillToolCountOrderByAggregateInput;
    _avg?: Prisma.SkillToolAvgOrderByAggregateInput;
    _max?: Prisma.SkillToolMaxOrderByAggregateInput;
    _min?: Prisma.SkillToolMinOrderByAggregateInput;
    _sum?: Prisma.SkillToolSumOrderByAggregateInput;
};
export type SkillToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.SkillToolScalarWhereWithAggregatesInput | Prisma.SkillToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.SkillToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SkillToolScalarWhereWithAggregatesInput | Prisma.SkillToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"SkillTool"> | number;
    skillId?: Prisma.IntWithAggregatesFilter<"SkillTool"> | number;
    toolId?: Prisma.IntWithAggregatesFilter<"SkillTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"SkillTool"> | boolean;
};
export type SkillToolCreateInput = {
    isRequired?: boolean;
    skill: Prisma.SkillCreateNestedOneWithoutSkillToolsInput;
    tool: Prisma.ToolCreateNestedOneWithoutSkillToolsInput;
};
export type SkillToolUncheckedCreateInput = {
    id?: number;
    skillId: number;
    toolId: number;
    isRequired?: boolean;
};
export type SkillToolUpdateInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    skill?: Prisma.SkillUpdateOneRequiredWithoutSkillToolsNestedInput;
    tool?: Prisma.ToolUpdateOneRequiredWithoutSkillToolsNestedInput;
};
export type SkillToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolCreateManyInput = {
    id?: number;
    skillId: number;
    toolId: number;
    isRequired?: boolean;
};
export type SkillToolUpdateManyMutationInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolListRelationFilter = {
    every?: Prisma.SkillToolWhereInput;
    some?: Prisma.SkillToolWhereInput;
    none?: Prisma.SkillToolWhereInput;
};
export type SkillToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type SkillToolSkillIdToolIdCompoundUniqueInput = {
    skillId: number;
    toolId: number;
};
export type SkillToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type SkillToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type SkillToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type SkillToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type SkillToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type SkillToolCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput> | Prisma.SkillToolCreateWithoutToolInput[] | Prisma.SkillToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutToolInput | Prisma.SkillToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.SkillToolCreateManyToolInputEnvelope;
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
};
export type SkillToolUncheckedCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput> | Prisma.SkillToolCreateWithoutToolInput[] | Prisma.SkillToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutToolInput | Prisma.SkillToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.SkillToolCreateManyToolInputEnvelope;
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
};
export type SkillToolUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput> | Prisma.SkillToolCreateWithoutToolInput[] | Prisma.SkillToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutToolInput | Prisma.SkillToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.SkillToolUpsertWithWhereUniqueWithoutToolInput | Prisma.SkillToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.SkillToolCreateManyToolInputEnvelope;
    set?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    disconnect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    delete?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    update?: Prisma.SkillToolUpdateWithWhereUniqueWithoutToolInput | Prisma.SkillToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.SkillToolUpdateManyWithWhereWithoutToolInput | Prisma.SkillToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
};
export type SkillToolUncheckedUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput> | Prisma.SkillToolCreateWithoutToolInput[] | Prisma.SkillToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutToolInput | Prisma.SkillToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.SkillToolUpsertWithWhereUniqueWithoutToolInput | Prisma.SkillToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.SkillToolCreateManyToolInputEnvelope;
    set?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    disconnect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    delete?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    update?: Prisma.SkillToolUpdateWithWhereUniqueWithoutToolInput | Prisma.SkillToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.SkillToolUpdateManyWithWhereWithoutToolInput | Prisma.SkillToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
};
export type SkillToolCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput> | Prisma.SkillToolCreateWithoutSkillInput[] | Prisma.SkillToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutSkillInput | Prisma.SkillToolCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.SkillToolCreateManySkillInputEnvelope;
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
};
export type SkillToolUncheckedCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput> | Prisma.SkillToolCreateWithoutSkillInput[] | Prisma.SkillToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutSkillInput | Prisma.SkillToolCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.SkillToolCreateManySkillInputEnvelope;
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
};
export type SkillToolUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput> | Prisma.SkillToolCreateWithoutSkillInput[] | Prisma.SkillToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutSkillInput | Prisma.SkillToolCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.SkillToolUpsertWithWhereUniqueWithoutSkillInput | Prisma.SkillToolUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.SkillToolCreateManySkillInputEnvelope;
    set?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    disconnect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    delete?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    update?: Prisma.SkillToolUpdateWithWhereUniqueWithoutSkillInput | Prisma.SkillToolUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.SkillToolUpdateManyWithWhereWithoutSkillInput | Prisma.SkillToolUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
};
export type SkillToolUncheckedUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput> | Prisma.SkillToolCreateWithoutSkillInput[] | Prisma.SkillToolUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.SkillToolCreateOrConnectWithoutSkillInput | Prisma.SkillToolCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.SkillToolUpsertWithWhereUniqueWithoutSkillInput | Prisma.SkillToolUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.SkillToolCreateManySkillInputEnvelope;
    set?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    disconnect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    delete?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    connect?: Prisma.SkillToolWhereUniqueInput | Prisma.SkillToolWhereUniqueInput[];
    update?: Prisma.SkillToolUpdateWithWhereUniqueWithoutSkillInput | Prisma.SkillToolUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.SkillToolUpdateManyWithWhereWithoutSkillInput | Prisma.SkillToolUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
};
export type SkillToolCreateWithoutToolInput = {
    isRequired?: boolean;
    skill: Prisma.SkillCreateNestedOneWithoutSkillToolsInput;
};
export type SkillToolUncheckedCreateWithoutToolInput = {
    id?: number;
    skillId: number;
    isRequired?: boolean;
};
export type SkillToolCreateOrConnectWithoutToolInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput>;
};
export type SkillToolCreateManyToolInputEnvelope = {
    data: Prisma.SkillToolCreateManyToolInput | Prisma.SkillToolCreateManyToolInput[];
    skipDuplicates?: boolean;
};
export type SkillToolUpsertWithWhereUniqueWithoutToolInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.SkillToolUpdateWithoutToolInput, Prisma.SkillToolUncheckedUpdateWithoutToolInput>;
    create: Prisma.XOR<Prisma.SkillToolCreateWithoutToolInput, Prisma.SkillToolUncheckedCreateWithoutToolInput>;
};
export type SkillToolUpdateWithWhereUniqueWithoutToolInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.SkillToolUpdateWithoutToolInput, Prisma.SkillToolUncheckedUpdateWithoutToolInput>;
};
export type SkillToolUpdateManyWithWhereWithoutToolInput = {
    where: Prisma.SkillToolScalarWhereInput;
    data: Prisma.XOR<Prisma.SkillToolUpdateManyMutationInput, Prisma.SkillToolUncheckedUpdateManyWithoutToolInput>;
};
export type SkillToolScalarWhereInput = {
    AND?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
    OR?: Prisma.SkillToolScalarWhereInput[];
    NOT?: Prisma.SkillToolScalarWhereInput | Prisma.SkillToolScalarWhereInput[];
    id?: Prisma.IntFilter<"SkillTool"> | number;
    skillId?: Prisma.IntFilter<"SkillTool"> | number;
    toolId?: Prisma.IntFilter<"SkillTool"> | number;
    isRequired?: Prisma.BoolFilter<"SkillTool"> | boolean;
};
export type SkillToolCreateWithoutSkillInput = {
    isRequired?: boolean;
    tool: Prisma.ToolCreateNestedOneWithoutSkillToolsInput;
};
export type SkillToolUncheckedCreateWithoutSkillInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type SkillToolCreateOrConnectWithoutSkillInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput>;
};
export type SkillToolCreateManySkillInputEnvelope = {
    data: Prisma.SkillToolCreateManySkillInput | Prisma.SkillToolCreateManySkillInput[];
    skipDuplicates?: boolean;
};
export type SkillToolUpsertWithWhereUniqueWithoutSkillInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.SkillToolUpdateWithoutSkillInput, Prisma.SkillToolUncheckedUpdateWithoutSkillInput>;
    create: Prisma.XOR<Prisma.SkillToolCreateWithoutSkillInput, Prisma.SkillToolUncheckedCreateWithoutSkillInput>;
};
export type SkillToolUpdateWithWhereUniqueWithoutSkillInput = {
    where: Prisma.SkillToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.SkillToolUpdateWithoutSkillInput, Prisma.SkillToolUncheckedUpdateWithoutSkillInput>;
};
export type SkillToolUpdateManyWithWhereWithoutSkillInput = {
    where: Prisma.SkillToolScalarWhereInput;
    data: Prisma.XOR<Prisma.SkillToolUpdateManyMutationInput, Prisma.SkillToolUncheckedUpdateManyWithoutSkillInput>;
};
export type SkillToolCreateManyToolInput = {
    id?: number;
    skillId: number;
    isRequired?: boolean;
};
export type SkillToolUpdateWithoutToolInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    skill?: Prisma.SkillUpdateOneRequiredWithoutSkillToolsNestedInput;
};
export type SkillToolUncheckedUpdateWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolUncheckedUpdateManyWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolCreateManySkillInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type SkillToolUpdateWithoutSkillInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tool?: Prisma.ToolUpdateOneRequiredWithoutSkillToolsNestedInput;
};
export type SkillToolUncheckedUpdateWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolUncheckedUpdateManyWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type SkillToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillTool"]>;
export type SkillToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillTool"]>;
export type SkillToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    skillId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["skillTool"]>;
export type SkillToolSelectScalar = {
    id?: boolean;
    skillId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
};
export type SkillToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "skillId" | "toolId" | "isRequired", ExtArgs["result"]["skillTool"]>;
export type SkillToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type SkillToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type SkillToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type $SkillToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SkillTool";
    objects: {
        skill: Prisma.$SkillPayload<ExtArgs>;
        tool: Prisma.$ToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        skillId: number;
        toolId: number;
        isRequired: boolean;
    }, ExtArgs["result"]["skillTool"]>;
    composites: {};
};
export type SkillToolGetPayload<S extends boolean | null | undefined | SkillToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SkillToolPayload, S>;
export type SkillToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SkillToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SkillToolCountAggregateInputType | true;
};
export interface SkillToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SkillTool'];
        meta: {
            name: 'SkillTool';
        };
    };
    findUnique<T extends SkillToolFindUniqueArgs>(args: Prisma.SelectSubset<T, SkillToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SkillToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SkillToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SkillToolFindFirstArgs>(args?: Prisma.SelectSubset<T, SkillToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SkillToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SkillToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SkillToolFindManyArgs>(args?: Prisma.SelectSubset<T, SkillToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SkillToolCreateArgs>(args: Prisma.SelectSubset<T, SkillToolCreateArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SkillToolCreateManyArgs>(args?: Prisma.SelectSubset<T, SkillToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SkillToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SkillToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SkillToolDeleteArgs>(args: Prisma.SelectSubset<T, SkillToolDeleteArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SkillToolUpdateArgs>(args: Prisma.SelectSubset<T, SkillToolUpdateArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SkillToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, SkillToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SkillToolUpdateManyArgs>(args: Prisma.SelectSubset<T, SkillToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SkillToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SkillToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SkillToolUpsertArgs>(args: Prisma.SelectSubset<T, SkillToolUpsertArgs<ExtArgs>>): Prisma.Prisma__SkillToolClient<runtime.Types.Result.GetResult<Prisma.$SkillToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SkillToolCountArgs>(args?: Prisma.Subset<T, SkillToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SkillToolCountAggregateOutputType> : number>;
    aggregate<T extends SkillToolAggregateArgs>(args: Prisma.Subset<T, SkillToolAggregateArgs>): Prisma.PrismaPromise<GetSkillToolAggregateType<T>>;
    groupBy<T extends SkillToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SkillToolGroupByArgs['orderBy'];
    } : {
        orderBy?: SkillToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SkillToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSkillToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SkillToolFieldRefs;
}
export interface Prisma__SkillToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    skill<T extends Prisma.SkillDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SkillDefaultArgs<ExtArgs>>): Prisma.Prisma__SkillClient<runtime.Types.Result.GetResult<Prisma.$SkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tool<T extends Prisma.ToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolDefaultArgs<ExtArgs>>): Prisma.Prisma__ToolClient<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SkillToolFieldRefs {
    readonly id: Prisma.FieldRef<"SkillTool", 'Int'>;
    readonly skillId: Prisma.FieldRef<"SkillTool", 'Int'>;
    readonly toolId: Prisma.FieldRef<"SkillTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"SkillTool", 'Boolean'>;
}
export type SkillToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where: Prisma.SkillToolWhereUniqueInput;
};
export type SkillToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where: Prisma.SkillToolWhereUniqueInput;
};
export type SkillToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where?: Prisma.SkillToolWhereInput;
    orderBy?: Prisma.SkillToolOrderByWithRelationInput | Prisma.SkillToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillToolScalarFieldEnum | Prisma.SkillToolScalarFieldEnum[];
};
export type SkillToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where?: Prisma.SkillToolWhereInput;
    orderBy?: Prisma.SkillToolOrderByWithRelationInput | Prisma.SkillToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillToolScalarFieldEnum | Prisma.SkillToolScalarFieldEnum[];
};
export type SkillToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where?: Prisma.SkillToolWhereInput;
    orderBy?: Prisma.SkillToolOrderByWithRelationInput | Prisma.SkillToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillToolScalarFieldEnum | Prisma.SkillToolScalarFieldEnum[];
};
export type SkillToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillToolCreateInput, Prisma.SkillToolUncheckedCreateInput>;
};
export type SkillToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SkillToolCreateManyInput | Prisma.SkillToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SkillToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    data: Prisma.SkillToolCreateManyInput | Prisma.SkillToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.SkillToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type SkillToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillToolUpdateInput, Prisma.SkillToolUncheckedUpdateInput>;
    where: Prisma.SkillToolWhereUniqueInput;
};
export type SkillToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SkillToolUpdateManyMutationInput, Prisma.SkillToolUncheckedUpdateManyInput>;
    where?: Prisma.SkillToolWhereInput;
    limit?: number;
};
export type SkillToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SkillToolUpdateManyMutationInput, Prisma.SkillToolUncheckedUpdateManyInput>;
    where?: Prisma.SkillToolWhereInput;
    limit?: number;
    include?: Prisma.SkillToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type SkillToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where: Prisma.SkillToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.SkillToolCreateInput, Prisma.SkillToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SkillToolUpdateInput, Prisma.SkillToolUncheckedUpdateInput>;
};
export type SkillToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
    where: Prisma.SkillToolWhereUniqueInput;
};
export type SkillToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillToolWhereInput;
    limit?: number;
};
export type SkillToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillToolOmit<ExtArgs> | null;
    include?: Prisma.SkillToolInclude<ExtArgs> | null;
};
