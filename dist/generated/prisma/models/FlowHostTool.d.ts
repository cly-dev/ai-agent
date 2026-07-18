import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type FlowHostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$FlowHostToolPayload>;
export type AggregateFlowHostTool = {
    _count: FlowHostToolCountAggregateOutputType | null;
    _avg: FlowHostToolAvgAggregateOutputType | null;
    _sum: FlowHostToolSumAggregateOutputType | null;
    _min: FlowHostToolMinAggregateOutputType | null;
    _max: FlowHostToolMaxAggregateOutputType | null;
};
export type FlowHostToolAvgAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    hostToolId: number | null;
};
export type FlowHostToolSumAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    hostToolId: number | null;
};
export type FlowHostToolMinAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    hostToolId: number | null;
    isRequired: boolean | null;
};
export type FlowHostToolMaxAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    hostToolId: number | null;
    isRequired: boolean | null;
};
export type FlowHostToolCountAggregateOutputType = {
    id: number;
    flowId: number;
    hostToolId: number;
    isRequired: number;
    _all: number;
};
export type FlowHostToolAvgAggregateInputType = {
    id?: true;
    flowId?: true;
    hostToolId?: true;
};
export type FlowHostToolSumAggregateInputType = {
    id?: true;
    flowId?: true;
    hostToolId?: true;
};
export type FlowHostToolMinAggregateInputType = {
    id?: true;
    flowId?: true;
    hostToolId?: true;
    isRequired?: true;
};
export type FlowHostToolMaxAggregateInputType = {
    id?: true;
    flowId?: true;
    hostToolId?: true;
    isRequired?: true;
};
export type FlowHostToolCountAggregateInputType = {
    id?: true;
    flowId?: true;
    hostToolId?: true;
    isRequired?: true;
    _all?: true;
};
export type FlowHostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithRelationInput | Prisma.FlowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FlowHostToolCountAggregateInputType;
    _avg?: FlowHostToolAvgAggregateInputType;
    _sum?: FlowHostToolSumAggregateInputType;
    _min?: FlowHostToolMinAggregateInputType;
    _max?: FlowHostToolMaxAggregateInputType;
};
export type GetFlowHostToolAggregateType<T extends FlowHostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateFlowHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFlowHostTool[P]> : Prisma.GetScalarType<T[P], AggregateFlowHostTool[P]>;
};
export type FlowHostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithAggregationInput | Prisma.FlowHostToolOrderByWithAggregationInput[];
    by: Prisma.FlowHostToolScalarFieldEnum[] | Prisma.FlowHostToolScalarFieldEnum;
    having?: Prisma.FlowHostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FlowHostToolCountAggregateInputType | true;
    _avg?: FlowHostToolAvgAggregateInputType;
    _sum?: FlowHostToolSumAggregateInputType;
    _min?: FlowHostToolMinAggregateInputType;
    _max?: FlowHostToolMaxAggregateInputType;
};
export type FlowHostToolGroupByOutputType = {
    id: number;
    flowId: number;
    hostToolId: number;
    isRequired: boolean;
    _count: FlowHostToolCountAggregateOutputType | null;
    _avg: FlowHostToolAvgAggregateOutputType | null;
    _sum: FlowHostToolSumAggregateOutputType | null;
    _min: FlowHostToolMinAggregateOutputType | null;
    _max: FlowHostToolMaxAggregateOutputType | null;
};
export type GetFlowHostToolGroupByPayload<T extends FlowHostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FlowHostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FlowHostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FlowHostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FlowHostToolGroupByOutputType[P]>;
}>>;
export type FlowHostToolWhereInput = {
    AND?: Prisma.FlowHostToolWhereInput | Prisma.FlowHostToolWhereInput[];
    OR?: Prisma.FlowHostToolWhereInput[];
    NOT?: Prisma.FlowHostToolWhereInput | Prisma.FlowHostToolWhereInput[];
    id?: Prisma.IntFilter<"FlowHostTool"> | number;
    flowId?: Prisma.IntFilter<"FlowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"FlowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowHostTool"> | boolean;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
};
export type FlowHostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    flow?: Prisma.FlowOrderByWithRelationInput;
    hostTool?: Prisma.HostToolOrderByWithRelationInput;
};
export type FlowHostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    flowId_hostToolId?: Prisma.FlowHostToolFlowIdHostToolIdCompoundUniqueInput;
    AND?: Prisma.FlowHostToolWhereInput | Prisma.FlowHostToolWhereInput[];
    OR?: Prisma.FlowHostToolWhereInput[];
    NOT?: Prisma.FlowHostToolWhereInput | Prisma.FlowHostToolWhereInput[];
    flowId?: Prisma.IntFilter<"FlowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"FlowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowHostTool"> | boolean;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
}, "id" | "flowId_hostToolId">;
export type FlowHostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    _count?: Prisma.FlowHostToolCountOrderByAggregateInput;
    _avg?: Prisma.FlowHostToolAvgOrderByAggregateInput;
    _max?: Prisma.FlowHostToolMaxOrderByAggregateInput;
    _min?: Prisma.FlowHostToolMinOrderByAggregateInput;
    _sum?: Prisma.FlowHostToolSumOrderByAggregateInput;
};
export type FlowHostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.FlowHostToolScalarWhereWithAggregatesInput | Prisma.FlowHostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.FlowHostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FlowHostToolScalarWhereWithAggregatesInput | Prisma.FlowHostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"FlowHostTool"> | number;
    flowId?: Prisma.IntWithAggregatesFilter<"FlowHostTool"> | number;
    hostToolId?: Prisma.IntWithAggregatesFilter<"FlowHostTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"FlowHostTool"> | boolean;
};
export type FlowHostToolCreateInput = {
    isRequired?: boolean;
    flow: Prisma.FlowCreateNestedOneWithoutFlowHostToolsInput;
    hostTool: Prisma.HostToolCreateNestedOneWithoutFlowHostToolsInput;
};
export type FlowHostToolUncheckedCreateInput = {
    id?: number;
    flowId: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type FlowHostToolUpdateInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    flow?: Prisma.FlowUpdateOneRequiredWithoutFlowHostToolsNestedInput;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutFlowHostToolsNestedInput;
};
export type FlowHostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolCreateManyInput = {
    id?: number;
    flowId: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type FlowHostToolUpdateManyMutationInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolListRelationFilter = {
    every?: Prisma.FlowHostToolWhereInput;
    some?: Prisma.FlowHostToolWhereInput;
    none?: Prisma.FlowHostToolWhereInput;
};
export type FlowHostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FlowHostToolFlowIdHostToolIdCompoundUniqueInput = {
    flowId: number;
    hostToolId: number;
};
export type FlowHostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowHostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type FlowHostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowHostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type FlowHostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type FlowHostToolCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.FlowHostToolCreateWithoutHostToolInput[] | Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput | Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.FlowHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
};
export type FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.FlowHostToolCreateWithoutHostToolInput[] | Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput | Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.FlowHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
};
export type FlowHostToolUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.FlowHostToolCreateWithoutHostToolInput[] | Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput | Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.FlowHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.FlowHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.FlowHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    disconnect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    delete?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    update?: Prisma.FlowHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.FlowHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.FlowHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.FlowHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
};
export type FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.FlowHostToolCreateWithoutHostToolInput[] | Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput | Prisma.FlowHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.FlowHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.FlowHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.FlowHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    disconnect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    delete?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    update?: Prisma.FlowHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.FlowHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.FlowHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.FlowHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
};
export type FlowHostToolCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput> | Prisma.FlowHostToolCreateWithoutFlowInput[] | Prisma.FlowHostToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutFlowInput | Prisma.FlowHostToolCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowHostToolCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
};
export type FlowHostToolUncheckedCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput> | Prisma.FlowHostToolCreateWithoutFlowInput[] | Prisma.FlowHostToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutFlowInput | Prisma.FlowHostToolCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowHostToolCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
};
export type FlowHostToolUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput> | Prisma.FlowHostToolCreateWithoutFlowInput[] | Prisma.FlowHostToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutFlowInput | Prisma.FlowHostToolCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowHostToolUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowHostToolUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowHostToolCreateManyFlowInputEnvelope;
    set?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    disconnect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    delete?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    update?: Prisma.FlowHostToolUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowHostToolUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowHostToolUpdateManyWithWhereWithoutFlowInput | Prisma.FlowHostToolUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
};
export type FlowHostToolUncheckedUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput> | Prisma.FlowHostToolCreateWithoutFlowInput[] | Prisma.FlowHostToolUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowHostToolCreateOrConnectWithoutFlowInput | Prisma.FlowHostToolCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowHostToolUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowHostToolUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowHostToolCreateManyFlowInputEnvelope;
    set?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    disconnect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    delete?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    connect?: Prisma.FlowHostToolWhereUniqueInput | Prisma.FlowHostToolWhereUniqueInput[];
    update?: Prisma.FlowHostToolUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowHostToolUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowHostToolUpdateManyWithWhereWithoutFlowInput | Prisma.FlowHostToolUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
};
export type FlowHostToolCreateWithoutHostToolInput = {
    isRequired?: boolean;
    flow: Prisma.FlowCreateNestedOneWithoutFlowHostToolsInput;
};
export type FlowHostToolUncheckedCreateWithoutHostToolInput = {
    id?: number;
    flowId: number;
    isRequired?: boolean;
};
export type FlowHostToolCreateOrConnectWithoutHostToolInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput>;
};
export type FlowHostToolCreateManyHostToolInputEnvelope = {
    data: Prisma.FlowHostToolCreateManyHostToolInput | Prisma.FlowHostToolCreateManyHostToolInput[];
    skipDuplicates?: boolean;
};
export type FlowHostToolUpsertWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.FlowHostToolUpdateWithoutHostToolInput, Prisma.FlowHostToolUncheckedUpdateWithoutHostToolInput>;
    create: Prisma.XOR<Prisma.FlowHostToolCreateWithoutHostToolInput, Prisma.FlowHostToolUncheckedCreateWithoutHostToolInput>;
};
export type FlowHostToolUpdateWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateWithoutHostToolInput, Prisma.FlowHostToolUncheckedUpdateWithoutHostToolInput>;
};
export type FlowHostToolUpdateManyWithWhereWithoutHostToolInput = {
    where: Prisma.FlowHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateManyMutationInput, Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolInput>;
};
export type FlowHostToolScalarWhereInput = {
    AND?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
    OR?: Prisma.FlowHostToolScalarWhereInput[];
    NOT?: Prisma.FlowHostToolScalarWhereInput | Prisma.FlowHostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"FlowHostTool"> | number;
    flowId?: Prisma.IntFilter<"FlowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"FlowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"FlowHostTool"> | boolean;
};
export type FlowHostToolCreateWithoutFlowInput = {
    isRequired?: boolean;
    hostTool: Prisma.HostToolCreateNestedOneWithoutFlowHostToolsInput;
};
export type FlowHostToolUncheckedCreateWithoutFlowInput = {
    id?: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type FlowHostToolCreateOrConnectWithoutFlowInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput>;
};
export type FlowHostToolCreateManyFlowInputEnvelope = {
    data: Prisma.FlowHostToolCreateManyFlowInput | Prisma.FlowHostToolCreateManyFlowInput[];
    skipDuplicates?: boolean;
};
export type FlowHostToolUpsertWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.FlowHostToolUpdateWithoutFlowInput, Prisma.FlowHostToolUncheckedUpdateWithoutFlowInput>;
    create: Prisma.XOR<Prisma.FlowHostToolCreateWithoutFlowInput, Prisma.FlowHostToolUncheckedCreateWithoutFlowInput>;
};
export type FlowHostToolUpdateWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateWithoutFlowInput, Prisma.FlowHostToolUncheckedUpdateWithoutFlowInput>;
};
export type FlowHostToolUpdateManyWithWhereWithoutFlowInput = {
    where: Prisma.FlowHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateManyMutationInput, Prisma.FlowHostToolUncheckedUpdateManyWithoutFlowInput>;
};
export type FlowHostToolCreateManyHostToolInput = {
    id?: number;
    flowId: number;
    isRequired?: boolean;
};
export type FlowHostToolUpdateWithoutHostToolInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    flow?: Prisma.FlowUpdateOneRequiredWithoutFlowHostToolsNestedInput;
};
export type FlowHostToolUncheckedUpdateWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolUncheckedUpdateManyWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolCreateManyFlowInput = {
    id?: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type FlowHostToolUpdateWithoutFlowInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutFlowHostToolsNestedInput;
};
export type FlowHostToolUncheckedUpdateWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolUncheckedUpdateManyWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type FlowHostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowHostTool"]>;
export type FlowHostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowHostTool"]>;
export type FlowHostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowHostTool"]>;
export type FlowHostToolSelectScalar = {
    id?: boolean;
    flowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
};
export type FlowHostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "flowId" | "hostToolId" | "isRequired", ExtArgs["result"]["flowHostTool"]>;
export type FlowHostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type FlowHostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type FlowHostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type $FlowHostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FlowHostTool";
    objects: {
        flow: Prisma.$FlowPayload<ExtArgs>;
        hostTool: Prisma.$HostToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        flowId: number;
        hostToolId: number;
        isRequired: boolean;
    }, ExtArgs["result"]["flowHostTool"]>;
    composites: {};
};
export type FlowHostToolGetPayload<S extends boolean | null | undefined | FlowHostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload, S>;
export type FlowHostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FlowHostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FlowHostToolCountAggregateInputType | true;
};
export interface FlowHostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FlowHostTool'];
        meta: {
            name: 'FlowHostTool';
        };
    };
    findUnique<T extends FlowHostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, FlowHostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FlowHostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FlowHostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FlowHostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, FlowHostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FlowHostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FlowHostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FlowHostToolFindManyArgs>(args?: Prisma.SelectSubset<T, FlowHostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FlowHostToolCreateArgs>(args: Prisma.SelectSubset<T, FlowHostToolCreateArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FlowHostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, FlowHostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FlowHostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FlowHostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FlowHostToolDeleteArgs>(args: Prisma.SelectSubset<T, FlowHostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FlowHostToolUpdateArgs>(args: Prisma.SelectSubset<T, FlowHostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FlowHostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, FlowHostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FlowHostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, FlowHostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FlowHostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FlowHostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FlowHostToolUpsertArgs>(args: Prisma.SelectSubset<T, FlowHostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__FlowHostToolClient<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FlowHostToolCountArgs>(args?: Prisma.Subset<T, FlowHostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FlowHostToolCountAggregateOutputType> : number>;
    aggregate<T extends FlowHostToolAggregateArgs>(args: Prisma.Subset<T, FlowHostToolAggregateArgs>): Prisma.PrismaPromise<GetFlowHostToolAggregateType<T>>;
    groupBy<T extends FlowHostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FlowHostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: FlowHostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FlowHostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFlowHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FlowHostToolFieldRefs;
}
export interface Prisma__FlowHostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    flow<T extends Prisma.FlowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.FlowDefaultArgs<ExtArgs>>): Prisma.Prisma__FlowClient<runtime.Types.Result.GetResult<Prisma.$FlowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTool<T extends Prisma.HostToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostToolDefaultArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FlowHostToolFieldRefs {
    readonly id: Prisma.FieldRef<"FlowHostTool", 'Int'>;
    readonly flowId: Prisma.FieldRef<"FlowHostTool", 'Int'>;
    readonly hostToolId: Prisma.FieldRef<"FlowHostTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"FlowHostTool", 'Boolean'>;
}
export type FlowHostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where: Prisma.FlowHostToolWhereUniqueInput;
};
export type FlowHostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where: Prisma.FlowHostToolWhereUniqueInput;
};
export type FlowHostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithRelationInput | Prisma.FlowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowHostToolScalarFieldEnum | Prisma.FlowHostToolScalarFieldEnum[];
};
export type FlowHostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithRelationInput | Prisma.FlowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowHostToolScalarFieldEnum | Prisma.FlowHostToolScalarFieldEnum[];
};
export type FlowHostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithRelationInput | Prisma.FlowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowHostToolScalarFieldEnum | Prisma.FlowHostToolScalarFieldEnum[];
};
export type FlowHostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowHostToolCreateInput, Prisma.FlowHostToolUncheckedCreateInput>;
};
export type FlowHostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FlowHostToolCreateManyInput | Prisma.FlowHostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FlowHostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    data: Prisma.FlowHostToolCreateManyInput | Prisma.FlowHostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FlowHostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FlowHostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateInput, Prisma.FlowHostToolUncheckedUpdateInput>;
    where: Prisma.FlowHostToolWhereUniqueInput;
};
export type FlowHostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FlowHostToolUpdateManyMutationInput, Prisma.FlowHostToolUncheckedUpdateManyInput>;
    where?: Prisma.FlowHostToolWhereInput;
    limit?: number;
};
export type FlowHostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowHostToolUpdateManyMutationInput, Prisma.FlowHostToolUncheckedUpdateManyInput>;
    where?: Prisma.FlowHostToolWhereInput;
    limit?: number;
    include?: Prisma.FlowHostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FlowHostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where: Prisma.FlowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowHostToolCreateInput, Prisma.FlowHostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FlowHostToolUpdateInput, Prisma.FlowHostToolUncheckedUpdateInput>;
};
export type FlowHostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where: Prisma.FlowHostToolWhereUniqueInput;
};
export type FlowHostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowHostToolWhereInput;
    limit?: number;
};
export type FlowHostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
};
