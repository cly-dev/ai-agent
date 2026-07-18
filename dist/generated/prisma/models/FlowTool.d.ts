import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type FlowToolModel = runtime.Types.Result.DefaultSelection<Prisma.$FlowToolPayload>;
export type AggregateFlowTool = {
    _count: FlowToolCountAggregateOutputType | null;
    _avg: FlowToolAvgAggregateOutputType | null;
    _sum: FlowToolSumAggregateOutputType | null;
    _min: FlowToolMinAggregateOutputType | null;
    _max: FlowToolMaxAggregateOutputType | null;
};
export type FlowToolAvgAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    toolId: number | null;
};
export type FlowToolSumAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    toolId: number | null;
};
export type FlowToolMinAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type FlowToolMaxAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type FlowToolCountAggregateOutputType = {
    id: number;
    flowId: number;
    toolId: number;
    isRequired: number;
    _all: number;
};
export type FlowToolAvgAggregateInputType = {
    id?: true;
    flowId?: true;
    toolId?: true;
};
export type FlowToolSumAggregateInputType = {
    id?: true;
    flowId?: true;
    toolId?: true;
};
export type FlowToolMinAggregateInputType = {
    id?: true;
    flowId?: true;
    toolId?: true;
    isRequired?: true;
};
export type FlowToolMaxAggregateInputType = {
    id?: true;
    flowId?: true;
    toolId?: true;
    isRequired?: true;
};
export type FlowToolCountAggregateInputType = {
    id?: true;
    flowId?: true;
    toolId?: true;
    isRequired?: true;
    _all?: true;
};
export type FlowToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowToolWhereInput;
    orderBy?: Prisma.FlowToolOrderByWithRelationInput | Prisma.FlowToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FlowToolCountAggregateInputType;
    _avg?: FlowToolAvgAggregateInputType;
    _sum?: FlowToolSumAggregateInputType;
    _min?: FlowToolMinAggregateInputType;
    _max?: FlowToolMaxAggregateInputType;
};
export type GetFlowToolAggregateType<T extends FlowToolAggregateArgs> = {
    [P in keyof T & keyof AggregateFlowTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFlowTool[P]> : Prisma.GetScalarType<T[P], AggregateFlowTool[P]>;
};
export type FlowToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowToolWhereInput;
    orderBy?: Prisma.FlowToolOrderByWithAggregationInput | Prisma.FlowToolOrderByWithAggregationInput[];
    by: Prisma.FlowToolScalarFieldEnum[] | Prisma.FlowToolScalarFieldEnum;
    having?: Prisma.FlowToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FlowToolCountAggregateInputType | true;
    _avg?: FlowToolAvgAggregateInputType;
    _sum?: FlowToolSumAggregateInputType;
    _min?: FlowToolMinAggregateInputType;
    _max?: FlowToolMaxAggregateInputType;
};
export type FlowToolGroupByOutputType = {
    id: number;
    flowId: number;
    toolId: number;
    isRequired: boolean;
    _count: FlowToolCountAggregateOutputType | null;
    _avg: FlowToolAvgAggregateOutputType | null;
    _sum: FlowToolSumAggregateOutputType | null;
    _min: FlowToolMinAggregateOutputType | null;
    _max: FlowToolMaxAggregateOutputType | null;
};
export type GetFlowToolGroupByPayload<T extends FlowToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FlowToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FlowToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FlowToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FlowToolGroupByOutputType[P]>;
}>>;
export type FlowToolWhereInput = {
    AND?: Prisma.FlowToolWhereInput | Prisma.FlowToolWhereInput[];
    OR?: Prisma.FlowToolWhereInput[];
    NOT?: Prisma.FlowToolWhereInput | Prisma.FlowToolWhereInput[];
    id?: Prisma.IntFilter<"FlowTool"> | number;
    flowId?: Prisma.IntFilter<"FlowTool"> | number;
    toolId?: Prisma.IntFilter<"FlowTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowTool"> | boolean;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
};
export type FlowToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    flow?: Prisma.FlowOrderByWithRelationInput;
    tool?: Prisma.ToolOrderByWithRelationInput;
};
export type FlowToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    flowId_toolId?: Prisma.FlowToolFlowIdToolIdCompoundUniqueInput;
    AND?: Prisma.FlowToolWhereInput | Prisma.FlowToolWhereInput[];
    OR?: Prisma.FlowToolWhereInput[];
    NOT?: Prisma.FlowToolWhereInput | Prisma.FlowToolWhereInput[];
    flowId?: Prisma.IntFilter<"FlowTool"> | number;
    toolId?: Prisma.IntFilter<"FlowTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowTool"> | boolean;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
}, "id" | "flowId_toolId">;
export type FlowToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    _count?: Prisma.FlowToolCountOrderByAggregateInput;
    _avg?: Prisma.FlowToolAvgOrderByAggregateInput;
    _max?: Prisma.FlowToolMaxOrderByAggregateInput;
    _min?: Prisma.FlowToolMinOrderByAggregateInput;
    _sum?: Prisma.FlowToolSumOrderByAggregateInput;
};
export type FlowToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.FlowToolScalarWhereWithAggregatesInput | Prisma.FlowToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.FlowToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FlowToolScalarWhereWithAggregatesInput | Prisma.FlowToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"FlowTool"> | number;
    flowId?: Prisma.IntWithAggregatesFilter<"FlowTool"> | number;
    toolId?: Prisma.IntWithAggregatesFilter<"FlowTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"FlowTool"> | boolean;
};
export type FlowToolCreateInput = {
    isRequired?: boolean;
    flow: Prisma.FlowCreateNestedOneWithoutFlowToolsInput;
    tool: Prisma.ToolCreateNestedOneWithoutFlowToolsInput;
};
export type FlowToolUncheckedCreateInput = {
    id?: number;
    flowId: number;
    toolId: number;
    isRequired?: boolean;
};
export type FlowToolUpdateInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    flow?: Prisma.FlowUpdateOneRequiredWithoutFlowToolsNestedInput;
    tool?: Prisma.ToolUpdateOneRequiredWithoutFlowToolsNestedInput;
};
export type FlowToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolCreateManyInput = {
    id?: number;
    flowId: number;
    toolId: number;
    isRequired?: boolean;
};
export type FlowToolUpdateManyMutationInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolListRelationFilter = {
    every?: Prisma.FlowToolWhereInput;
    some?: Prisma.FlowToolWhereInput;
    none?: Prisma.FlowToolWhereInput;
};
export type FlowToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FlowToolFlowIdToolIdCompoundUniqueInput = {
    flowId: number;
    toolId: number;
};
export type FlowToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type FlowToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type FlowToolCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput> | Prisma.FlowToolCreateWithoutToolInput[] | Prisma.FlowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutToolInput | Prisma.FlowToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.FlowToolCreateManyToolInputEnvelope;
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
};
export type FlowToolUncheckedCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput> | Prisma.FlowToolCreateWithoutToolInput[] | Prisma.FlowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutToolInput | Prisma.FlowToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.FlowToolCreateManyToolInputEnvelope;
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
};
export type FlowToolUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput> | Prisma.FlowToolCreateWithoutToolInput[] | Prisma.FlowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutToolInput | Prisma.FlowToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.FlowToolUpsertWithWhereUniqueWithoutToolInput | Prisma.FlowToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.FlowToolCreateManyToolInputEnvelope;
    set?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    disconnect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    delete?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    update?: Prisma.FlowToolUpdateWithWhereUniqueWithoutToolInput | Prisma.FlowToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.FlowToolUpdateManyWithWhereWithoutToolInput | Prisma.FlowToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
};
export type FlowToolUncheckedUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput> | Prisma.FlowToolCreateWithoutToolInput[] | Prisma.FlowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutToolInput | Prisma.FlowToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.FlowToolUpsertWithWhereUniqueWithoutToolInput | Prisma.FlowToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.FlowToolCreateManyToolInputEnvelope;
    set?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    disconnect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    delete?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    update?: Prisma.FlowToolUpdateWithWhereUniqueWithoutToolInput | Prisma.FlowToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.FlowToolUpdateManyWithWhereWithoutToolInput | Prisma.FlowToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
};
export type FlowToolCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput> | Prisma.FlowToolCreateWithoutFlowInput[] | Prisma.FlowToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutFlowInput | Prisma.FlowToolCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowToolCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
};
export type FlowToolUncheckedCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput> | Prisma.FlowToolCreateWithoutFlowInput[] | Prisma.FlowToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutFlowInput | Prisma.FlowToolCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowToolCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
};
export type FlowToolUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput> | Prisma.FlowToolCreateWithoutFlowInput[] | Prisma.FlowToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutFlowInput | Prisma.FlowToolCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowToolUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowToolUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowToolCreateManyFlowInputEnvelope;
    set?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    disconnect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    delete?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    update?: Prisma.FlowToolUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowToolUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowToolUpdateManyWithWhereWithoutFlowInput | Prisma.FlowToolUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
};
export type FlowToolUncheckedUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput> | Prisma.FlowToolCreateWithoutFlowInput[] | Prisma.FlowToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowToolCreateOrConnectWithoutFlowInput | Prisma.FlowToolCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowToolUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowToolUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowToolCreateManyFlowInputEnvelope;
    set?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    disconnect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    delete?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    connect?: Prisma.FlowToolWhereUniqueInput | Prisma.FlowToolWhereUniqueInput[];
    update?: Prisma.FlowToolUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowToolUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowToolUpdateManyWithWhereWithoutFlowInput | Prisma.FlowToolUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
};
export type FlowToolCreateWithoutToolInput = {
    isRequired?: boolean;
    flow: Prisma.FlowCreateNestedOneWithoutFlowToolsInput;
};
export type FlowToolUncheckedCreateWithoutToolInput = {
    id?: number;
    flowId: number;
    isRequired?: boolean;
};
export type FlowToolCreateOrConnectWithoutToolInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput>;
};
export type FlowToolCreateManyToolInputEnvelope = {
    data: Prisma.FlowToolCreateManyToolInput | Prisma.FlowToolCreateManyToolInput[];
    skipDuplicates?: boolean;
};
export type FlowToolUpsertWithWhereUniqueWithoutToolInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.FlowToolUpdateWithoutToolInput, Prisma.FlowToolUncheckedUpdateWithoutToolInput>;
    create: Prisma.XOR<Prisma.FlowToolCreateWithoutToolInput, Prisma.FlowToolUncheckedCreateWithoutToolInput>;
};
export type FlowToolUpdateWithWhereUniqueWithoutToolInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.FlowToolUpdateWithoutToolInput, Prisma.FlowToolUncheckedUpdateWithoutToolInput>;
};
export type FlowToolUpdateManyWithWhereWithoutToolInput = {
    where: Prisma.FlowToolScalarWhereInput;
    data: Prisma.XOR<Prisma.FlowToolUpdateManyMutationInput, Prisma.FlowToolUncheckedUpdateManyWithoutToolInput>;
};
export type FlowToolScalarWhereInput = {
    AND?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
    OR?: Prisma.FlowToolScalarWhereInput[];
    NOT?: Prisma.FlowToolScalarWhereInput | Prisma.FlowToolScalarWhereInput[];
    id?: Prisma.IntFilter<"FlowTool"> | number;
    flowId?: Prisma.IntFilter<"FlowTool"> | number;
    toolId?: Prisma.IntFilter<"FlowTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowTool"> | boolean;
};
export type FlowToolCreateWithoutFlowInput = {
    isRequired?: boolean;
    tool: Prisma.ToolCreateNestedOneWithoutFlowToolsInput;
};
export type FlowToolUncheckedCreateWithoutFlowInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type FlowToolCreateOrConnectWithoutFlowInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput>;
};
export type FlowToolCreateManyFlowInputEnvelope = {
    data: Prisma.FlowToolCreateManyFlowInput | Prisma.FlowToolCreateManyFlowInput[];
    skipDuplicates?: boolean;
};
export type FlowToolUpsertWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.FlowToolUpdateWithoutFlowInput, Prisma.FlowToolUncheckedUpdateWithoutFlowInput>;
    create: Prisma.XOR<Prisma.FlowToolCreateWithoutFlowInput, Prisma.FlowToolUncheckedCreateWithoutFlowInput>;
};
export type FlowToolUpdateWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.FlowToolUpdateWithoutFlowInput, Prisma.FlowToolUncheckedUpdateWithoutFlowInput>;
};
export type FlowToolUpdateManyWithWhereWithoutFlowInput = {
    where: Prisma.FlowToolScalarWhereInput;
    data: Prisma.XOR<Prisma.FlowToolUpdateManyMutationInput, Prisma.FlowToolUncheckedUpdateManyWithoutFlowInput>;
};
export type FlowToolCreateManyToolInput = {
    id?: number;
    flowId: number;
    isRequired?: boolean;
};
export type FlowToolUpdateWithoutToolInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    flow?: Prisma.FlowUpdateOneRequiredWithoutFlowToolsNestedInput;
};
export type FlowToolUncheckedUpdateWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolUncheckedUpdateManyWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolCreateManyFlowInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type FlowToolUpdateWithoutFlowInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tool?: Prisma.ToolUpdateOneRequiredWithoutFlowToolsNestedInput;
};
export type FlowToolUncheckedUpdateWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolUncheckedUpdateManyWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowTool"]>;
export type FlowToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowTool"]>;
export type FlowToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowTool"]>;
export type FlowToolSelectScalar = {
    id?: boolean;
    flowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
};
export type FlowToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "flowId" | "toolId" | "isRequired", ExtArgs["result"]["flowTool"]>;
export type FlowToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type FlowToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type FlowToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type $FlowToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FlowTool";
    objects: {
        flow: Prisma.$FlowPayload<ExtArgs>;
        tool: Prisma.$ToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        flowId: number;
        toolId: number;
        isRequired: boolean;
    }, ExtArgs["result"]["flowTool"]>;
    composites: {};
};
export type FlowToolGetPayload<S extends boolean | null | undefined | FlowToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FlowToolPayload, S>;
export type FlowToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FlowToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FlowToolCountAggregateInputType | true;
};
export interface FlowToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FlowTool'];
        meta: {
            name: 'FlowTool';
        };
    };
    findUnique<T extends FlowToolFindUniqueArgs>(args: Prisma.SelectSubset<T, FlowToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FlowToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FlowToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FlowToolFindFirstArgs>(args?: Prisma.SelectSubset<T, FlowToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FlowToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FlowToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FlowToolFindManyArgs>(args?: Prisma.SelectSubset<T, FlowToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FlowToolCreateArgs>(args: Prisma.SelectSubset<T, FlowToolCreateArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FlowToolCreateManyArgs>(args?: Prisma.SelectSubset<T, FlowToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FlowToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FlowToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FlowToolDeleteArgs>(args: Prisma.SelectSubset<T, FlowToolDeleteArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FlowToolUpdateArgs>(args: Prisma.SelectSubset<T, FlowToolUpdateArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FlowToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, FlowToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FlowToolUpdateManyArgs>(args: Prisma.SelectSubset<T, FlowToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FlowToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FlowToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FlowToolUpsertArgs>(args: Prisma.SelectSubset<T, FlowToolUpsertArgs<ExtArgs>>): Prisma.Prisma__FlowToolClient<runtime.Types.Result.GetResult<Prisma.$FlowToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FlowToolCountArgs>(args?: Prisma.Subset<T, FlowToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FlowToolCountAggregateOutputType> : number>;
    aggregate<T extends FlowToolAggregateArgs>(args: Prisma.Subset<T, FlowToolAggregateArgs>): Prisma.PrismaPromise<GetFlowToolAggregateType<T>>;
    groupBy<T extends FlowToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FlowToolGroupByArgs['orderBy'];
    } : {
        orderBy?: FlowToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FlowToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFlowToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FlowToolFieldRefs;
}
export interface Prisma__FlowToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    flow<T extends Prisma.FlowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.FlowDefaultArgs<ExtArgs>>): Prisma.Prisma__FlowClient<runtime.Types.Result.GetResult<Prisma.$FlowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tool<T extends Prisma.ToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolDefaultArgs<ExtArgs>>): Prisma.Prisma__ToolClient<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FlowToolFieldRefs {
    readonly id: Prisma.FieldRef<"FlowTool", 'Int'>;
    readonly flowId: Prisma.FieldRef<"FlowTool", 'Int'>;
    readonly toolId: Prisma.FieldRef<"FlowTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"FlowTool", 'Boolean'>;
}
export type FlowToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where: Prisma.FlowToolWhereUniqueInput;
};
export type FlowToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where: Prisma.FlowToolWhereUniqueInput;
};
export type FlowToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where?: Prisma.FlowToolWhereInput;
    orderBy?: Prisma.FlowToolOrderByWithRelationInput | Prisma.FlowToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowToolScalarFieldEnum | Prisma.FlowToolScalarFieldEnum[];
};
export type FlowToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where?: Prisma.FlowToolWhereInput;
    orderBy?: Prisma.FlowToolOrderByWithRelationInput | Prisma.FlowToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowToolScalarFieldEnum | Prisma.FlowToolScalarFieldEnum[];
};
export type FlowToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where?: Prisma.FlowToolWhereInput;
    orderBy?: Prisma.FlowToolOrderByWithRelationInput | Prisma.FlowToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowToolScalarFieldEnum | Prisma.FlowToolScalarFieldEnum[];
};
export type FlowToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowToolCreateInput, Prisma.FlowToolUncheckedCreateInput>;
};
export type FlowToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FlowToolCreateManyInput | Prisma.FlowToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FlowToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    data: Prisma.FlowToolCreateManyInput | Prisma.FlowToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FlowToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FlowToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowToolUpdateInput, Prisma.FlowToolUncheckedUpdateInput>;
    where: Prisma.FlowToolWhereUniqueInput;
};
export type FlowToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FlowToolUpdateManyMutationInput, Prisma.FlowToolUncheckedUpdateManyInput>;
    where?: Prisma.FlowToolWhereInput;
    limit?: number;
};
export type FlowToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowToolUpdateManyMutationInput, Prisma.FlowToolUncheckedUpdateManyInput>;
    where?: Prisma.FlowToolWhereInput;
    limit?: number;
    include?: Prisma.FlowToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FlowToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where: Prisma.FlowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowToolCreateInput, Prisma.FlowToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FlowToolUpdateInput, Prisma.FlowToolUncheckedUpdateInput>;
};
export type FlowToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
    where: Prisma.FlowToolWhereUniqueInput;
};
export type FlowToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowToolWhereInput;
    limit?: number;
};
export type FlowToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowToolOmit<ExtArgs> | null;
    include?: Prisma.FlowToolInclude<ExtArgs> | null;
};
