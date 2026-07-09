import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type AgentHostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$AgentHostToolPayload>;
export type AggregateAgentHostTool = {
    _count: AgentHostToolCountAggregateOutputType | null;
    _avg: AgentHostToolAvgAggregateOutputType | null;
    _sum: AgentHostToolSumAggregateOutputType | null;
    _min: AgentHostToolMinAggregateOutputType | null;
    _max: AgentHostToolMaxAggregateOutputType | null;
};
export type AgentHostToolAvgAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    hostToolId: number | null;
};
export type AgentHostToolSumAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    hostToolId: number | null;
};
export type AgentHostToolMinAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    hostToolId: number | null;
    createdAt: Date | null;
};
export type AgentHostToolMaxAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    hostToolId: number | null;
    createdAt: Date | null;
};
export type AgentHostToolCountAggregateOutputType = {
    id: number;
    agentId: number;
    hostToolId: number;
    createdAt: number;
    _all: number;
};
export type AgentHostToolAvgAggregateInputType = {
    id?: true;
    agentId?: true;
    hostToolId?: true;
};
export type AgentHostToolSumAggregateInputType = {
    id?: true;
    agentId?: true;
    hostToolId?: true;
};
export type AgentHostToolMinAggregateInputType = {
    id?: true;
    agentId?: true;
    hostToolId?: true;
    createdAt?: true;
};
export type AgentHostToolMaxAggregateInputType = {
    id?: true;
    agentId?: true;
    hostToolId?: true;
    createdAt?: true;
};
export type AgentHostToolCountAggregateInputType = {
    id?: true;
    agentId?: true;
    hostToolId?: true;
    createdAt?: true;
    _all?: true;
};
export type AgentHostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentHostToolWhereInput;
    orderBy?: Prisma.AgentHostToolOrderByWithRelationInput | Prisma.AgentHostToolOrderByWithRelationInput[];
    cursor?: Prisma.AgentHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AgentHostToolCountAggregateInputType;
    _avg?: AgentHostToolAvgAggregateInputType;
    _sum?: AgentHostToolSumAggregateInputType;
    _min?: AgentHostToolMinAggregateInputType;
    _max?: AgentHostToolMaxAggregateInputType;
};
export type GetAgentHostToolAggregateType<T extends AgentHostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateAgentHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAgentHostTool[P]> : Prisma.GetScalarType<T[P], AggregateAgentHostTool[P]>;
};
export type AgentHostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentHostToolWhereInput;
    orderBy?: Prisma.AgentHostToolOrderByWithAggregationInput | Prisma.AgentHostToolOrderByWithAggregationInput[];
    by: Prisma.AgentHostToolScalarFieldEnum[] | Prisma.AgentHostToolScalarFieldEnum;
    having?: Prisma.AgentHostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AgentHostToolCountAggregateInputType | true;
    _avg?: AgentHostToolAvgAggregateInputType;
    _sum?: AgentHostToolSumAggregateInputType;
    _min?: AgentHostToolMinAggregateInputType;
    _max?: AgentHostToolMaxAggregateInputType;
};
export type AgentHostToolGroupByOutputType = {
    id: number;
    agentId: number;
    hostToolId: number;
    createdAt: Date;
    _count: AgentHostToolCountAggregateOutputType | null;
    _avg: AgentHostToolAvgAggregateOutputType | null;
    _sum: AgentHostToolSumAggregateOutputType | null;
    _min: AgentHostToolMinAggregateOutputType | null;
    _max: AgentHostToolMaxAggregateOutputType | null;
};
export type GetAgentHostToolGroupByPayload<T extends AgentHostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AgentHostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AgentHostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AgentHostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AgentHostToolGroupByOutputType[P]>;
}>>;
export type AgentHostToolWhereInput = {
    AND?: Prisma.AgentHostToolWhereInput | Prisma.AgentHostToolWhereInput[];
    OR?: Prisma.AgentHostToolWhereInput[];
    NOT?: Prisma.AgentHostToolWhereInput | Prisma.AgentHostToolWhereInput[];
    id?: Prisma.IntFilter<"AgentHostTool"> | number;
    agentId?: Prisma.IntFilter<"AgentHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"AgentHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"AgentHostTool"> | Date | string;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
};
export type AgentHostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    agent?: Prisma.AgentOrderByWithRelationInput;
    hostTool?: Prisma.HostToolOrderByWithRelationInput;
};
export type AgentHostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    agentId_hostToolId?: Prisma.AgentHostToolAgentIdHostToolIdCompoundUniqueInput;
    AND?: Prisma.AgentHostToolWhereInput | Prisma.AgentHostToolWhereInput[];
    OR?: Prisma.AgentHostToolWhereInput[];
    NOT?: Prisma.AgentHostToolWhereInput | Prisma.AgentHostToolWhereInput[];
    agentId?: Prisma.IntFilter<"AgentHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"AgentHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"AgentHostTool"> | Date | string;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
}, "id" | "agentId_hostToolId">;
export type AgentHostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.AgentHostToolCountOrderByAggregateInput;
    _avg?: Prisma.AgentHostToolAvgOrderByAggregateInput;
    _max?: Prisma.AgentHostToolMaxOrderByAggregateInput;
    _min?: Prisma.AgentHostToolMinOrderByAggregateInput;
    _sum?: Prisma.AgentHostToolSumOrderByAggregateInput;
};
export type AgentHostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.AgentHostToolScalarWhereWithAggregatesInput | Prisma.AgentHostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.AgentHostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AgentHostToolScalarWhereWithAggregatesInput | Prisma.AgentHostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"AgentHostTool"> | number;
    agentId?: Prisma.IntWithAggregatesFilter<"AgentHostTool"> | number;
    hostToolId?: Prisma.IntWithAggregatesFilter<"AgentHostTool"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"AgentHostTool"> | Date | string;
};
export type AgentHostToolCreateInput = {
    createdAt?: Date | string;
    agent: Prisma.AgentCreateNestedOneWithoutAgentHostToolsInput;
    hostTool: Prisma.HostToolCreateNestedOneWithoutAgentHostToolsInput;
};
export type AgentHostToolUncheckedCreateInput = {
    id?: number;
    agentId: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type AgentHostToolUpdateInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentHostToolsNestedInput;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutAgentHostToolsNestedInput;
};
export type AgentHostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolCreateManyInput = {
    id?: number;
    agentId: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type AgentHostToolUpdateManyMutationInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolListRelationFilter = {
    every?: Prisma.AgentHostToolWhereInput;
    some?: Prisma.AgentHostToolWhereInput;
    none?: Prisma.AgentHostToolWhereInput;
};
export type AgentHostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AgentHostToolAgentIdHostToolIdCompoundUniqueInput = {
    agentId: number;
    hostToolId: number;
};
export type AgentHostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentHostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type AgentHostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentHostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AgentHostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type AgentHostToolCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput> | Prisma.AgentHostToolCreateWithoutAgentInput[] | Prisma.AgentHostToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutAgentInput | Prisma.AgentHostToolCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentHostToolCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
};
export type AgentHostToolUncheckedCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput> | Prisma.AgentHostToolCreateWithoutAgentInput[] | Prisma.AgentHostToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutAgentInput | Prisma.AgentHostToolCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentHostToolCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
};
export type AgentHostToolUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput> | Prisma.AgentHostToolCreateWithoutAgentInput[] | Prisma.AgentHostToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutAgentInput | Prisma.AgentHostToolCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentHostToolUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentHostToolUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentHostToolCreateManyAgentInputEnvelope;
    set?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    disconnect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    delete?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    update?: Prisma.AgentHostToolUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentHostToolUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentHostToolUpdateManyWithWhereWithoutAgentInput | Prisma.AgentHostToolUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
};
export type AgentHostToolUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput> | Prisma.AgentHostToolCreateWithoutAgentInput[] | Prisma.AgentHostToolUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutAgentInput | Prisma.AgentHostToolCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentHostToolUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentHostToolUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentHostToolCreateManyAgentInputEnvelope;
    set?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    disconnect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    delete?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    update?: Prisma.AgentHostToolUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentHostToolUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentHostToolUpdateManyWithWhereWithoutAgentInput | Prisma.AgentHostToolUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
};
export type AgentHostToolCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput> | Prisma.AgentHostToolCreateWithoutHostToolInput[] | Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput | Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.AgentHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
};
export type AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput> | Prisma.AgentHostToolCreateWithoutHostToolInput[] | Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput | Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.AgentHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
};
export type AgentHostToolUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput> | Prisma.AgentHostToolCreateWithoutHostToolInput[] | Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput | Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.AgentHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.AgentHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.AgentHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    disconnect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    delete?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    update?: Prisma.AgentHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.AgentHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.AgentHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.AgentHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
};
export type AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput> | Prisma.AgentHostToolCreateWithoutHostToolInput[] | Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput | Prisma.AgentHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.AgentHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.AgentHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.AgentHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    disconnect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    delete?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    connect?: Prisma.AgentHostToolWhereUniqueInput | Prisma.AgentHostToolWhereUniqueInput[];
    update?: Prisma.AgentHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.AgentHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.AgentHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.AgentHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
};
export type AgentHostToolCreateWithoutAgentInput = {
    createdAt?: Date | string;
    hostTool: Prisma.HostToolCreateNestedOneWithoutAgentHostToolsInput;
};
export type AgentHostToolUncheckedCreateWithoutAgentInput = {
    id?: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type AgentHostToolCreateOrConnectWithoutAgentInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput>;
};
export type AgentHostToolCreateManyAgentInputEnvelope = {
    data: Prisma.AgentHostToolCreateManyAgentInput | Prisma.AgentHostToolCreateManyAgentInput[];
    skipDuplicates?: boolean;
};
export type AgentHostToolUpsertWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentHostToolUpdateWithoutAgentInput, Prisma.AgentHostToolUncheckedUpdateWithoutAgentInput>;
    create: Prisma.XOR<Prisma.AgentHostToolCreateWithoutAgentInput, Prisma.AgentHostToolUncheckedCreateWithoutAgentInput>;
};
export type AgentHostToolUpdateWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateWithoutAgentInput, Prisma.AgentHostToolUncheckedUpdateWithoutAgentInput>;
};
export type AgentHostToolUpdateManyWithWhereWithoutAgentInput = {
    where: Prisma.AgentHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateManyMutationInput, Prisma.AgentHostToolUncheckedUpdateManyWithoutAgentInput>;
};
export type AgentHostToolScalarWhereInput = {
    AND?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
    OR?: Prisma.AgentHostToolScalarWhereInput[];
    NOT?: Prisma.AgentHostToolScalarWhereInput | Prisma.AgentHostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"AgentHostTool"> | number;
    agentId?: Prisma.IntFilter<"AgentHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"AgentHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"AgentHostTool"> | Date | string;
};
export type AgentHostToolCreateWithoutHostToolInput = {
    createdAt?: Date | string;
    agent: Prisma.AgentCreateNestedOneWithoutAgentHostToolsInput;
};
export type AgentHostToolUncheckedCreateWithoutHostToolInput = {
    id?: number;
    agentId: number;
    createdAt?: Date | string;
};
export type AgentHostToolCreateOrConnectWithoutHostToolInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput>;
};
export type AgentHostToolCreateManyHostToolInputEnvelope = {
    data: Prisma.AgentHostToolCreateManyHostToolInput | Prisma.AgentHostToolCreateManyHostToolInput[];
    skipDuplicates?: boolean;
};
export type AgentHostToolUpsertWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentHostToolUpdateWithoutHostToolInput, Prisma.AgentHostToolUncheckedUpdateWithoutHostToolInput>;
    create: Prisma.XOR<Prisma.AgentHostToolCreateWithoutHostToolInput, Prisma.AgentHostToolUncheckedCreateWithoutHostToolInput>;
};
export type AgentHostToolUpdateWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.AgentHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateWithoutHostToolInput, Prisma.AgentHostToolUncheckedUpdateWithoutHostToolInput>;
};
export type AgentHostToolUpdateManyWithWhereWithoutHostToolInput = {
    where: Prisma.AgentHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateManyMutationInput, Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolInput>;
};
export type AgentHostToolCreateManyAgentInput = {
    id?: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type AgentHostToolUpdateWithoutAgentInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutAgentHostToolsNestedInput;
};
export type AgentHostToolUncheckedUpdateWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolUncheckedUpdateManyWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolCreateManyHostToolInput = {
    id?: number;
    agentId: number;
    createdAt?: Date | string;
};
export type AgentHostToolUpdateWithoutHostToolInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentHostToolsNestedInput;
};
export type AgentHostToolUncheckedUpdateWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolUncheckedUpdateManyWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AgentHostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentHostTool"]>;
export type AgentHostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentHostTool"]>;
export type AgentHostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentHostTool"]>;
export type AgentHostToolSelectScalar = {
    id?: boolean;
    agentId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
};
export type AgentHostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "agentId" | "hostToolId" | "createdAt", ExtArgs["result"]["agentHostTool"]>;
export type AgentHostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type AgentHostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type AgentHostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type $AgentHostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AgentHostTool";
    objects: {
        agent: Prisma.$AgentPayload<ExtArgs>;
        hostTool: Prisma.$HostToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        agentId: number;
        hostToolId: number;
        createdAt: Date;
    }, ExtArgs["result"]["agentHostTool"]>;
    composites: {};
};
export type AgentHostToolGetPayload<S extends boolean | null | undefined | AgentHostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload, S>;
export type AgentHostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AgentHostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AgentHostToolCountAggregateInputType | true;
};
export interface AgentHostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AgentHostTool'];
        meta: {
            name: 'AgentHostTool';
        };
    };
    findUnique<T extends AgentHostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, AgentHostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AgentHostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AgentHostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AgentHostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, AgentHostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AgentHostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AgentHostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AgentHostToolFindManyArgs>(args?: Prisma.SelectSubset<T, AgentHostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AgentHostToolCreateArgs>(args: Prisma.SelectSubset<T, AgentHostToolCreateArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AgentHostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, AgentHostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AgentHostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AgentHostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AgentHostToolDeleteArgs>(args: Prisma.SelectSubset<T, AgentHostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AgentHostToolUpdateArgs>(args: Prisma.SelectSubset<T, AgentHostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AgentHostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, AgentHostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AgentHostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, AgentHostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AgentHostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AgentHostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AgentHostToolUpsertArgs>(args: Prisma.SelectSubset<T, AgentHostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__AgentHostToolClient<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AgentHostToolCountArgs>(args?: Prisma.Subset<T, AgentHostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AgentHostToolCountAggregateOutputType> : number>;
    aggregate<T extends AgentHostToolAggregateArgs>(args: Prisma.Subset<T, AgentHostToolAggregateArgs>): Prisma.PrismaPromise<GetAgentHostToolAggregateType<T>>;
    groupBy<T extends AgentHostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AgentHostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: AgentHostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AgentHostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AgentHostToolFieldRefs;
}
export interface Prisma__AgentHostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    agent<T extends Prisma.AgentDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AgentDefaultArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTool<T extends Prisma.HostToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostToolDefaultArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AgentHostToolFieldRefs {
    readonly id: Prisma.FieldRef<"AgentHostTool", 'Int'>;
    readonly agentId: Prisma.FieldRef<"AgentHostTool", 'Int'>;
    readonly hostToolId: Prisma.FieldRef<"AgentHostTool", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"AgentHostTool", 'DateTime'>;
}
export type AgentHostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where: Prisma.AgentHostToolWhereUniqueInput;
};
export type AgentHostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where: Prisma.AgentHostToolWhereUniqueInput;
};
export type AgentHostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentHostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentHostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type AgentHostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentHostToolCreateInput, Prisma.AgentHostToolUncheckedCreateInput>;
};
export type AgentHostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AgentHostToolCreateManyInput | Prisma.AgentHostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AgentHostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    data: Prisma.AgentHostToolCreateManyInput | Prisma.AgentHostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AgentHostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AgentHostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateInput, Prisma.AgentHostToolUncheckedUpdateInput>;
    where: Prisma.AgentHostToolWhereUniqueInput;
};
export type AgentHostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AgentHostToolUpdateManyMutationInput, Prisma.AgentHostToolUncheckedUpdateManyInput>;
    where?: Prisma.AgentHostToolWhereInput;
    limit?: number;
};
export type AgentHostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentHostToolUpdateManyMutationInput, Prisma.AgentHostToolUncheckedUpdateManyInput>;
    where?: Prisma.AgentHostToolWhereInput;
    limit?: number;
    include?: Prisma.AgentHostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AgentHostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where: Prisma.AgentHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentHostToolCreateInput, Prisma.AgentHostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AgentHostToolUpdateInput, Prisma.AgentHostToolUncheckedUpdateInput>;
};
export type AgentHostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where: Prisma.AgentHostToolWhereUniqueInput;
};
export type AgentHostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentHostToolWhereInput;
    limit?: number;
};
export type AgentHostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
};
