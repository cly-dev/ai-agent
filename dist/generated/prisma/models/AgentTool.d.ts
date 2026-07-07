import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type AgentToolModel = runtime.Types.Result.DefaultSelection<Prisma.$AgentToolPayload>;
export type AggregateAgentTool = {
    _count: AgentToolCountAggregateOutputType | null;
    _avg: AgentToolAvgAggregateOutputType | null;
    _sum: AgentToolSumAggregateOutputType | null;
    _min: AgentToolMinAggregateOutputType | null;
    _max: AgentToolMaxAggregateOutputType | null;
};
export type AgentToolAvgAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    toolId: number | null;
};
export type AgentToolSumAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    toolId: number | null;
};
export type AgentToolMinAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    toolId: number | null;
};
export type AgentToolMaxAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    toolId: number | null;
};
export type AgentToolCountAggregateOutputType = {
    id: number;
    agentId: number;
    toolId: number;
    _all: number;
};
export type AgentToolAvgAggregateInputType = {
    id?: true;
    agentId?: true;
    toolId?: true;
};
export type AgentToolSumAggregateInputType = {
    id?: true;
    agentId?: true;
    toolId?: true;
};
export type AgentToolMinAggregateInputType = {
    id?: true;
    agentId?: true;
    toolId?: true;
};
export type AgentToolMaxAggregateInputType = {
    id?: true;
    agentId?: true;
    toolId?: true;
};
export type AgentToolCountAggregateInputType = {
    id?: true;
    agentId?: true;
    toolId?: true;
    _all?: true;
};
export type AgentToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentToolWhereInput;
    orderBy?: Prisma.AgentToolOrderByWithRelationInput | Prisma.AgentToolOrderByWithRelationInput[];
    cursor?: Prisma.AgentToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AgentToolCountAggregateInputType;
    _avg?: AgentToolAvgAggregateInputType;
    _sum?: AgentToolSumAggregateInputType;
    _min?: AgentToolMinAggregateInputType;
    _max?: AgentToolMaxAggregateInputType;
};
export type GetAgentToolAggregateType<T extends AgentToolAggregateArgs> = {
    [P in keyof T & keyof AggregateAgentTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAgentTool[P]> : Prisma.GetScalarType<T[P], AggregateAgentTool[P]>;
};
export type AgentToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentToolWhereInput;
    orderBy?: Prisma.AgentToolOrderByWithAggregationInput | Prisma.AgentToolOrderByWithAggregationInput[];
    by: Prisma.AgentToolScalarFieldEnum[] | Prisma.AgentToolScalarFieldEnum;
    having?: Prisma.AgentToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AgentToolCountAggregateInputType | true;
    _avg?: AgentToolAvgAggregateInputType;
    _sum?: AgentToolSumAggregateInputType;
    _min?: AgentToolMinAggregateInputType;
    _max?: AgentToolMaxAggregateInputType;
};
export type AgentToolGroupByOutputType = {
    id: number;
    agentId: number;
    toolId: number;
    _count: AgentToolCountAggregateOutputType | null;
    _avg: AgentToolAvgAggregateOutputType | null;
    _sum: AgentToolSumAggregateOutputType | null;
    _min: AgentToolMinAggregateOutputType | null;
    _max: AgentToolMaxAggregateOutputType | null;
};
export type GetAgentToolGroupByPayload<T extends AgentToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AgentToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AgentToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AgentToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AgentToolGroupByOutputType[P]>;
}>>;
export type AgentToolWhereInput = {
    AND?: Prisma.AgentToolWhereInput | Prisma.AgentToolWhereInput[];
    OR?: Prisma.AgentToolWhereInput[];
    NOT?: Prisma.AgentToolWhereInput | Prisma.AgentToolWhereInput[];
    id?: Prisma.IntFilter<"AgentTool"> | number;
    agentId?: Prisma.IntFilter<"AgentTool"> | number;
    toolId?: Prisma.IntFilter<"AgentTool"> | number;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
};
export type AgentToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    agent?: Prisma.AgentOrderByWithRelationInput;
    tool?: Prisma.ToolOrderByWithRelationInput;
};
export type AgentToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    agentId_toolId?: Prisma.AgentToolAgentIdToolIdCompoundUniqueInput;
    AND?: Prisma.AgentToolWhereInput | Prisma.AgentToolWhereInput[];
    OR?: Prisma.AgentToolWhereInput[];
    NOT?: Prisma.AgentToolWhereInput | Prisma.AgentToolWhereInput[];
    agentId?: Prisma.IntFilter<"AgentTool"> | number;
    toolId?: Prisma.IntFilter<"AgentTool"> | number;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
}, "id" | "agentId_toolId">;
export type AgentToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    _count?: Prisma.AgentToolCountOrderByAggregateInput;
    _avg?: Prisma.AgentToolAvgOrderByAggregateInput;
    _max?: Prisma.AgentToolMaxOrderByAggregateInput;
    _min?: Prisma.AgentToolMinOrderByAggregateInput;
    _sum?: Prisma.AgentToolSumOrderByAggregateInput;
};
export type AgentToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.AgentToolScalarWhereWithAggregatesInput | Prisma.AgentToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.AgentToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AgentToolScalarWhereWithAggregatesInput | Prisma.AgentToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"AgentTool"> | number;
    agentId?: Prisma.IntWithAggregatesFilter<"AgentTool"> | number;
    toolId?: Prisma.IntWithAggregatesFilter<"AgentTool"> | number;
};
export type AgentToolCreateInput = {
    agent: Prisma.AgentCreateNestedOneWithoutAgentToolsInput;
    tool: Prisma.ToolCreateNestedOneWithoutAgentToolsInput;
};
export type AgentToolUncheckedCreateInput = {
    id?: number;
    agentId: number;
    toolId: number;
};
export type AgentToolUpdateInput = {
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentToolsNestedInput;
    tool?: Prisma.ToolUpdateOneRequiredWithoutAgentToolsNestedInput;
};
export type AgentToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolCreateManyInput = {
    id?: number;
    agentId: number;
    toolId: number;
};
export type AgentToolUpdateManyMutationInput = {};
export type AgentToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolListRelationFilter = {
    every?: Prisma.AgentToolWhereInput;
    some?: Prisma.AgentToolWhereInput;
    none?: Prisma.AgentToolWhereInput;
};
export type AgentToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AgentToolAgentIdToolIdCompoundUniqueInput = {
    agentId: number;
    toolId: number;
};
export type AgentToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type AgentToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type AgentToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type AgentToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type AgentToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type AgentToolCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput> | Prisma.AgentToolCreateWithoutToolInput[] | Prisma.AgentToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutToolInput | Prisma.AgentToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.AgentToolCreateManyToolInputEnvelope;
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
};
export type AgentToolUncheckedCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput> | Prisma.AgentToolCreateWithoutToolInput[] | Prisma.AgentToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutToolInput | Prisma.AgentToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.AgentToolCreateManyToolInputEnvelope;
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
};
export type AgentToolUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput> | Prisma.AgentToolCreateWithoutToolInput[] | Prisma.AgentToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutToolInput | Prisma.AgentToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.AgentToolUpsertWithWhereUniqueWithoutToolInput | Prisma.AgentToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.AgentToolCreateManyToolInputEnvelope;
    set?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    disconnect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    delete?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    update?: Prisma.AgentToolUpdateWithWhereUniqueWithoutToolInput | Prisma.AgentToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.AgentToolUpdateManyWithWhereWithoutToolInput | Prisma.AgentToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
};
export type AgentToolUncheckedUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput> | Prisma.AgentToolCreateWithoutToolInput[] | Prisma.AgentToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutToolInput | Prisma.AgentToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.AgentToolUpsertWithWhereUniqueWithoutToolInput | Prisma.AgentToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.AgentToolCreateManyToolInputEnvelope;
    set?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    disconnect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    delete?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    update?: Prisma.AgentToolUpdateWithWhereUniqueWithoutToolInput | Prisma.AgentToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.AgentToolUpdateManyWithWhereWithoutToolInput | Prisma.AgentToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
};
export type AgentToolCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput> | Prisma.AgentToolCreateWithoutAgentInput[] | Prisma.AgentToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutAgentInput | Prisma.AgentToolCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentToolCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
};
export type AgentToolUncheckedCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput> | Prisma.AgentToolCreateWithoutAgentInput[] | Prisma.AgentToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutAgentInput | Prisma.AgentToolCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentToolCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
};
export type AgentToolUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput> | Prisma.AgentToolCreateWithoutAgentInput[] | Prisma.AgentToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutAgentInput | Prisma.AgentToolCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentToolUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentToolUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentToolCreateManyAgentInputEnvelope;
    set?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    disconnect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    delete?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    update?: Prisma.AgentToolUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentToolUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentToolUpdateManyWithWhereWithoutAgentInput | Prisma.AgentToolUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
};
export type AgentToolUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput> | Prisma.AgentToolCreateWithoutAgentInput[] | Prisma.AgentToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentToolCreateOrConnectWithoutAgentInput | Prisma.AgentToolCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentToolUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentToolUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentToolCreateManyAgentInputEnvelope;
    set?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    disconnect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    delete?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    connect?: Prisma.AgentToolWhereUniqueInput | Prisma.AgentToolWhereUniqueInput[];
    update?: Prisma.AgentToolUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentToolUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentToolUpdateManyWithWhereWithoutAgentInput | Prisma.AgentToolUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
};
export type AgentToolCreateWithoutToolInput = {
    agent: Prisma.AgentCreateNestedOneWithoutAgentToolsInput;
};
export type AgentToolUncheckedCreateWithoutToolInput = {
    id?: number;
    agentId: number;
};
export type AgentToolCreateOrConnectWithoutToolInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput>;
};
export type AgentToolCreateManyToolInputEnvelope = {
    data: Prisma.AgentToolCreateManyToolInput | Prisma.AgentToolCreateManyToolInput[];
    skipDuplicates?: boolean;
};
export type AgentToolUpsertWithWhereUniqueWithoutToolInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentToolUpdateWithoutToolInput, Prisma.AgentToolUncheckedUpdateWithoutToolInput>;
    create: Prisma.XOR<Prisma.AgentToolCreateWithoutToolInput, Prisma.AgentToolUncheckedCreateWithoutToolInput>;
};
export type AgentToolUpdateWithWhereUniqueWithoutToolInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentToolUpdateWithoutToolInput, Prisma.AgentToolUncheckedUpdateWithoutToolInput>;
};
export type AgentToolUpdateManyWithWhereWithoutToolInput = {
    where: Prisma.AgentToolScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentToolUpdateManyMutationInput, Prisma.AgentToolUncheckedUpdateManyWithoutToolInput>;
};
export type AgentToolScalarWhereInput = {
    AND?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
    OR?: Prisma.AgentToolScalarWhereInput[];
    NOT?: Prisma.AgentToolScalarWhereInput | Prisma.AgentToolScalarWhereInput[];
    id?: Prisma.IntFilter<"AgentTool"> | number;
    agentId?: Prisma.IntFilter<"AgentTool"> | number;
    toolId?: Prisma.IntFilter<"AgentTool"> | number;
};
export type AgentToolCreateWithoutAgentInput = {
    tool: Prisma.ToolCreateNestedOneWithoutAgentToolsInput;
};
export type AgentToolUncheckedCreateWithoutAgentInput = {
    id?: number;
    toolId: number;
};
export type AgentToolCreateOrConnectWithoutAgentInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput>;
};
export type AgentToolCreateManyAgentInputEnvelope = {
    data: Prisma.AgentToolCreateManyAgentInput | Prisma.AgentToolCreateManyAgentInput[];
    skipDuplicates?: boolean;
};
export type AgentToolUpsertWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentToolUpdateWithoutAgentInput, Prisma.AgentToolUncheckedUpdateWithoutAgentInput>;
    create: Prisma.XOR<Prisma.AgentToolCreateWithoutAgentInput, Prisma.AgentToolUncheckedCreateWithoutAgentInput>;
};
export type AgentToolUpdateWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentToolUpdateWithoutAgentInput, Prisma.AgentToolUncheckedUpdateWithoutAgentInput>;
};
export type AgentToolUpdateManyWithWhereWithoutAgentInput = {
    where: Prisma.AgentToolScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentToolUpdateManyMutationInput, Prisma.AgentToolUncheckedUpdateManyWithoutAgentInput>;
};
export type AgentToolCreateManyToolInput = {
    id?: number;
    agentId: number;
};
export type AgentToolUpdateWithoutToolInput = {
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentToolsNestedInput;
};
export type AgentToolUncheckedUpdateWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolUncheckedUpdateManyWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolCreateManyAgentInput = {
    id?: number;
    toolId: number;
};
export type AgentToolUpdateWithoutAgentInput = {
    tool?: Prisma.ToolUpdateOneRequiredWithoutAgentToolsNestedInput;
};
export type AgentToolUncheckedUpdateWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolUncheckedUpdateManyWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    toolId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentTool"]>;
export type AgentToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    toolId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentTool"]>;
export type AgentToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    toolId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentTool"]>;
export type AgentToolSelectScalar = {
    id?: boolean;
    agentId?: boolean;
    toolId?: boolean;
};
export type AgentToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "agentId" | "toolId", ExtArgs["result"]["agentTool"]>;
export type AgentToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type AgentToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type AgentToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type $AgentToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AgentTool";
    objects: {
        agent: Prisma.$AgentPayload<ExtArgs>;
        tool: Prisma.$ToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        agentId: number;
        toolId: number;
    }, ExtArgs["result"]["agentTool"]>;
    composites: {};
};
export type AgentToolGetPayload<S extends boolean | null | undefined | AgentToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AgentToolPayload, S>;
export type AgentToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AgentToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AgentToolCountAggregateInputType | true;
};
export interface AgentToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AgentTool'];
        meta: {
            name: 'AgentTool';
        };
    };
    findUnique<T extends AgentToolFindUniqueArgs>(args: Prisma.SelectSubset<T, AgentToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AgentToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AgentToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AgentToolFindFirstArgs>(args?: Prisma.SelectSubset<T, AgentToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AgentToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AgentToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AgentToolFindManyArgs>(args?: Prisma.SelectSubset<T, AgentToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AgentToolCreateArgs>(args: Prisma.SelectSubset<T, AgentToolCreateArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AgentToolCreateManyArgs>(args?: Prisma.SelectSubset<T, AgentToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AgentToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AgentToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AgentToolDeleteArgs>(args: Prisma.SelectSubset<T, AgentToolDeleteArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AgentToolUpdateArgs>(args: Prisma.SelectSubset<T, AgentToolUpdateArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AgentToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, AgentToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AgentToolUpdateManyArgs>(args: Prisma.SelectSubset<T, AgentToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AgentToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AgentToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AgentToolUpsertArgs>(args: Prisma.SelectSubset<T, AgentToolUpsertArgs<ExtArgs>>): Prisma.Prisma__AgentToolClient<runtime.Types.Result.GetResult<Prisma.$AgentToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AgentToolCountArgs>(args?: Prisma.Subset<T, AgentToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AgentToolCountAggregateOutputType> : number>;
    aggregate<T extends AgentToolAggregateArgs>(args: Prisma.Subset<T, AgentToolAggregateArgs>): Prisma.PrismaPromise<GetAgentToolAggregateType<T>>;
    groupBy<T extends AgentToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AgentToolGroupByArgs['orderBy'];
    } : {
        orderBy?: AgentToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AgentToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AgentToolFieldRefs;
}
export interface Prisma__AgentToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    agent<T extends Prisma.AgentDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AgentDefaultArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tool<T extends Prisma.ToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolDefaultArgs<ExtArgs>>): Prisma.Prisma__ToolClient<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AgentToolFieldRefs {
    readonly id: Prisma.FieldRef<"AgentTool", 'Int'>;
    readonly agentId: Prisma.FieldRef<"AgentTool", 'Int'>;
    readonly toolId: Prisma.FieldRef<"AgentTool", 'Int'>;
}
export type AgentToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    where: Prisma.AgentToolWhereUniqueInput;
};
export type AgentToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    where: Prisma.AgentToolWhereUniqueInput;
};
export type AgentToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentToolCreateInput, Prisma.AgentToolUncheckedCreateInput>;
};
export type AgentToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AgentToolCreateManyInput | Prisma.AgentToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AgentToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    data: Prisma.AgentToolCreateManyInput | Prisma.AgentToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AgentToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AgentToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentToolUpdateInput, Prisma.AgentToolUncheckedUpdateInput>;
    where: Prisma.AgentToolWhereUniqueInput;
};
export type AgentToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AgentToolUpdateManyMutationInput, Prisma.AgentToolUncheckedUpdateManyInput>;
    where?: Prisma.AgentToolWhereInput;
    limit?: number;
};
export type AgentToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentToolUpdateManyMutationInput, Prisma.AgentToolUncheckedUpdateManyInput>;
    where?: Prisma.AgentToolWhereInput;
    limit?: number;
    include?: Prisma.AgentToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AgentToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    where: Prisma.AgentToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentToolCreateInput, Prisma.AgentToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AgentToolUpdateInput, Prisma.AgentToolUncheckedUpdateInput>;
};
export type AgentToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
    where: Prisma.AgentToolWhereUniqueInput;
};
export type AgentToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentToolWhereInput;
    limit?: number;
};
export type AgentToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentToolOmit<ExtArgs> | null;
    include?: Prisma.AgentToolInclude<ExtArgs> | null;
};
