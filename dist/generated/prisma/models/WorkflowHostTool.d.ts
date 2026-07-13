import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type WorkflowHostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$WorkflowHostToolPayload>;
export type AggregateWorkflowHostTool = {
    _count: WorkflowHostToolCountAggregateOutputType | null;
    _avg: WorkflowHostToolAvgAggregateOutputType | null;
    _sum: WorkflowHostToolSumAggregateOutputType | null;
    _min: WorkflowHostToolMinAggregateOutputType | null;
    _max: WorkflowHostToolMaxAggregateOutputType | null;
};
export type WorkflowHostToolAvgAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    hostToolId: number | null;
};
export type WorkflowHostToolSumAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    hostToolId: number | null;
};
export type WorkflowHostToolMinAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    hostToolId: number | null;
    isRequired: boolean | null;
};
export type WorkflowHostToolMaxAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    hostToolId: number | null;
    isRequired: boolean | null;
};
export type WorkflowHostToolCountAggregateOutputType = {
    id: number;
    workflowId: number;
    hostToolId: number;
    isRequired: number;
    _all: number;
};
export type WorkflowHostToolAvgAggregateInputType = {
    id?: true;
    workflowId?: true;
    hostToolId?: true;
};
export type WorkflowHostToolSumAggregateInputType = {
    id?: true;
    workflowId?: true;
    hostToolId?: true;
};
export type WorkflowHostToolMinAggregateInputType = {
    id?: true;
    workflowId?: true;
    hostToolId?: true;
    isRequired?: true;
};
export type WorkflowHostToolMaxAggregateInputType = {
    id?: true;
    workflowId?: true;
    hostToolId?: true;
    isRequired?: true;
};
export type WorkflowHostToolCountAggregateInputType = {
    id?: true;
    workflowId?: true;
    hostToolId?: true;
    isRequired?: true;
    _all?: true;
};
export type WorkflowHostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithRelationInput | Prisma.WorkflowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | WorkflowHostToolCountAggregateInputType;
    _avg?: WorkflowHostToolAvgAggregateInputType;
    _sum?: WorkflowHostToolSumAggregateInputType;
    _min?: WorkflowHostToolMinAggregateInputType;
    _max?: WorkflowHostToolMaxAggregateInputType;
};
export type GetWorkflowHostToolAggregateType<T extends WorkflowHostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateWorkflowHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWorkflowHostTool[P]> : Prisma.GetScalarType<T[P], AggregateWorkflowHostTool[P]>;
};
export type WorkflowHostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithAggregationInput | Prisma.WorkflowHostToolOrderByWithAggregationInput[];
    by: Prisma.WorkflowHostToolScalarFieldEnum[] | Prisma.WorkflowHostToolScalarFieldEnum;
    having?: Prisma.WorkflowHostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WorkflowHostToolCountAggregateInputType | true;
    _avg?: WorkflowHostToolAvgAggregateInputType;
    _sum?: WorkflowHostToolSumAggregateInputType;
    _min?: WorkflowHostToolMinAggregateInputType;
    _max?: WorkflowHostToolMaxAggregateInputType;
};
export type WorkflowHostToolGroupByOutputType = {
    id: number;
    workflowId: number;
    hostToolId: number;
    isRequired: boolean;
    _count: WorkflowHostToolCountAggregateOutputType | null;
    _avg: WorkflowHostToolAvgAggregateOutputType | null;
    _sum: WorkflowHostToolSumAggregateOutputType | null;
    _min: WorkflowHostToolMinAggregateOutputType | null;
    _max: WorkflowHostToolMaxAggregateOutputType | null;
};
export type GetWorkflowHostToolGroupByPayload<T extends WorkflowHostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WorkflowHostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WorkflowHostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WorkflowHostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WorkflowHostToolGroupByOutputType[P]>;
}>>;
export type WorkflowHostToolWhereInput = {
    AND?: Prisma.WorkflowHostToolWhereInput | Prisma.WorkflowHostToolWhereInput[];
    OR?: Prisma.WorkflowHostToolWhereInput[];
    NOT?: Prisma.WorkflowHostToolWhereInput | Prisma.WorkflowHostToolWhereInput[];
    id?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowHostTool"> | boolean;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
};
export type WorkflowHostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    workflow?: Prisma.WorkflowOrderByWithRelationInput;
    hostTool?: Prisma.HostToolOrderByWithRelationInput;
};
export type WorkflowHostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    workflowId_hostToolId?: Prisma.WorkflowHostToolWorkflowIdHostToolIdCompoundUniqueInput;
    AND?: Prisma.WorkflowHostToolWhereInput | Prisma.WorkflowHostToolWhereInput[];
    OR?: Prisma.WorkflowHostToolWhereInput[];
    NOT?: Prisma.WorkflowHostToolWhereInput | Prisma.WorkflowHostToolWhereInput[];
    workflowId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowHostTool"> | boolean;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
}, "id" | "workflowId_hostToolId">;
export type WorkflowHostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    _count?: Prisma.WorkflowHostToolCountOrderByAggregateInput;
    _avg?: Prisma.WorkflowHostToolAvgOrderByAggregateInput;
    _max?: Prisma.WorkflowHostToolMaxOrderByAggregateInput;
    _min?: Prisma.WorkflowHostToolMinOrderByAggregateInput;
    _sum?: Prisma.WorkflowHostToolSumOrderByAggregateInput;
};
export type WorkflowHostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.WorkflowHostToolScalarWhereWithAggregatesInput | Prisma.WorkflowHostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.WorkflowHostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WorkflowHostToolScalarWhereWithAggregatesInput | Prisma.WorkflowHostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WorkflowHostTool"> | number;
    workflowId?: Prisma.IntWithAggregatesFilter<"WorkflowHostTool"> | number;
    hostToolId?: Prisma.IntWithAggregatesFilter<"WorkflowHostTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"WorkflowHostTool"> | boolean;
};
export type WorkflowHostToolCreateInput = {
    isRequired?: boolean;
    workflow: Prisma.WorkflowCreateNestedOneWithoutWorkflowHostToolsInput;
    hostTool: Prisma.HostToolCreateNestedOneWithoutWorkflowHostToolsInput;
};
export type WorkflowHostToolUncheckedCreateInput = {
    id?: number;
    workflowId: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolUpdateInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    workflow?: Prisma.WorkflowUpdateOneRequiredWithoutWorkflowHostToolsNestedInput;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutWorkflowHostToolsNestedInput;
};
export type WorkflowHostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolCreateManyInput = {
    id?: number;
    workflowId: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolUpdateManyMutationInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolListRelationFilter = {
    every?: Prisma.WorkflowHostToolWhereInput;
    some?: Prisma.WorkflowHostToolWhereInput;
    none?: Prisma.WorkflowHostToolWhereInput;
};
export type WorkflowHostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type WorkflowHostToolWorkflowIdHostToolIdCompoundUniqueInput = {
    workflowId: number;
    hostToolId: number;
};
export type WorkflowHostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowHostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type WorkflowHostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowHostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowHostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type WorkflowHostToolCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.WorkflowHostToolCreateWithoutHostToolInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput | Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
};
export type WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.WorkflowHostToolCreateWithoutHostToolInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput | Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
};
export type WorkflowHostToolUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.WorkflowHostToolCreateWithoutHostToolInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput | Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    delete?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    update?: Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.WorkflowHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.WorkflowHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
};
export type WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput> | Prisma.WorkflowHostToolCreateWithoutHostToolInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput | Prisma.WorkflowHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    delete?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    update?: Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.WorkflowHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.WorkflowHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
};
export type WorkflowHostToolCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowHostToolCreateWithoutWorkflowInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
};
export type WorkflowHostToolUncheckedCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowHostToolCreateWithoutWorkflowInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
};
export type WorkflowHostToolUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowHostToolCreateWithoutWorkflowInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    delete?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    update?: Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowHostToolUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowHostToolUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
};
export type WorkflowHostToolUncheckedUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowHostToolCreateWithoutWorkflowInput[] | Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowHostToolCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowHostToolUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowHostToolCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    delete?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    connect?: Prisma.WorkflowHostToolWhereUniqueInput | Prisma.WorkflowHostToolWhereUniqueInput[];
    update?: Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowHostToolUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowHostToolUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowHostToolUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
};
export type WorkflowHostToolCreateWithoutHostToolInput = {
    isRequired?: boolean;
    workflow: Prisma.WorkflowCreateNestedOneWithoutWorkflowHostToolsInput;
};
export type WorkflowHostToolUncheckedCreateWithoutHostToolInput = {
    id?: number;
    workflowId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolCreateOrConnectWithoutHostToolInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput>;
};
export type WorkflowHostToolCreateManyHostToolInputEnvelope = {
    data: Prisma.WorkflowHostToolCreateManyHostToolInput | Prisma.WorkflowHostToolCreateManyHostToolInput[];
    skipDuplicates?: boolean;
};
export type WorkflowHostToolUpsertWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkflowHostToolUpdateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedUpdateWithoutHostToolInput>;
    create: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedCreateWithoutHostToolInput>;
};
export type WorkflowHostToolUpdateWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateWithoutHostToolInput, Prisma.WorkflowHostToolUncheckedUpdateWithoutHostToolInput>;
};
export type WorkflowHostToolUpdateManyWithWhereWithoutHostToolInput = {
    where: Prisma.WorkflowHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateManyMutationInput, Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolInput>;
};
export type WorkflowHostToolScalarWhereInput = {
    AND?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
    OR?: Prisma.WorkflowHostToolScalarWhereInput[];
    NOT?: Prisma.WorkflowHostToolScalarWhereInput | Prisma.WorkflowHostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"WorkflowHostTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowHostTool"> | boolean;
};
export type WorkflowHostToolCreateWithoutWorkflowInput = {
    isRequired?: boolean;
    hostTool: Prisma.HostToolCreateNestedOneWithoutWorkflowHostToolsInput;
};
export type WorkflowHostToolUncheckedCreateWithoutWorkflowInput = {
    id?: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolCreateOrConnectWithoutWorkflowInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowHostToolCreateManyWorkflowInputEnvelope = {
    data: Prisma.WorkflowHostToolCreateManyWorkflowInput | Prisma.WorkflowHostToolCreateManyWorkflowInput[];
    skipDuplicates?: boolean;
};
export type WorkflowHostToolUpsertWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkflowHostToolUpdateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedUpdateWithoutWorkflowInput>;
    create: Prisma.XOR<Prisma.WorkflowHostToolCreateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowHostToolUpdateWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateWithoutWorkflowInput, Prisma.WorkflowHostToolUncheckedUpdateWithoutWorkflowInput>;
};
export type WorkflowHostToolUpdateManyWithWhereWithoutWorkflowInput = {
    where: Prisma.WorkflowHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateManyMutationInput, Prisma.WorkflowHostToolUncheckedUpdateManyWithoutWorkflowInput>;
};
export type WorkflowHostToolCreateManyHostToolInput = {
    id?: number;
    workflowId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolUpdateWithoutHostToolInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    workflow?: Prisma.WorkflowUpdateOneRequiredWithoutWorkflowHostToolsNestedInput;
};
export type WorkflowHostToolUncheckedUpdateWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolUncheckedUpdateManyWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolCreateManyWorkflowInput = {
    id?: number;
    hostToolId: number;
    isRequired?: boolean;
};
export type WorkflowHostToolUpdateWithoutWorkflowInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutWorkflowHostToolsNestedInput;
};
export type WorkflowHostToolUncheckedUpdateWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolUncheckedUpdateManyWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowHostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowHostTool"]>;
export type WorkflowHostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowHostTool"]>;
export type WorkflowHostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowHostTool"]>;
export type WorkflowHostToolSelectScalar = {
    id?: boolean;
    workflowId?: boolean;
    hostToolId?: boolean;
    isRequired?: boolean;
};
export type WorkflowHostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "workflowId" | "hostToolId" | "isRequired", ExtArgs["result"]["workflowHostTool"]>;
export type WorkflowHostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type WorkflowHostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type WorkflowHostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type $WorkflowHostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WorkflowHostTool";
    objects: {
        workflow: Prisma.$WorkflowPayload<ExtArgs>;
        hostTool: Prisma.$HostToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        workflowId: number;
        hostToolId: number;
        isRequired: boolean;
    }, ExtArgs["result"]["workflowHostTool"]>;
    composites: {};
};
export type WorkflowHostToolGetPayload<S extends boolean | null | undefined | WorkflowHostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload, S>;
export type WorkflowHostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WorkflowHostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WorkflowHostToolCountAggregateInputType | true;
};
export interface WorkflowHostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WorkflowHostTool'];
        meta: {
            name: 'WorkflowHostTool';
        };
    };
    findUnique<T extends WorkflowHostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends WorkflowHostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends WorkflowHostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends WorkflowHostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends WorkflowHostToolFindManyArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends WorkflowHostToolCreateArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolCreateArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends WorkflowHostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends WorkflowHostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends WorkflowHostToolDeleteArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends WorkflowHostToolUpdateArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends WorkflowHostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, WorkflowHostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends WorkflowHostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends WorkflowHostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends WorkflowHostToolUpsertArgs>(args: Prisma.SelectSubset<T, WorkflowHostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__WorkflowHostToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends WorkflowHostToolCountArgs>(args?: Prisma.Subset<T, WorkflowHostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WorkflowHostToolCountAggregateOutputType> : number>;
    aggregate<T extends WorkflowHostToolAggregateArgs>(args: Prisma.Subset<T, WorkflowHostToolAggregateArgs>): Prisma.PrismaPromise<GetWorkflowHostToolAggregateType<T>>;
    groupBy<T extends WorkflowHostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WorkflowHostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: WorkflowHostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WorkflowHostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkflowHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: WorkflowHostToolFieldRefs;
}
export interface Prisma__WorkflowHostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    workflow<T extends Prisma.WorkflowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkflowDefaultArgs<ExtArgs>>): Prisma.Prisma__WorkflowClient<runtime.Types.Result.GetResult<Prisma.$WorkflowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTool<T extends Prisma.HostToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostToolDefaultArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface WorkflowHostToolFieldRefs {
    readonly id: Prisma.FieldRef<"WorkflowHostTool", 'Int'>;
    readonly workflowId: Prisma.FieldRef<"WorkflowHostTool", 'Int'>;
    readonly hostToolId: Prisma.FieldRef<"WorkflowHostTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"WorkflowHostTool", 'Boolean'>;
}
export type WorkflowHostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowHostToolWhereUniqueInput;
};
export type WorkflowHostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowHostToolWhereUniqueInput;
};
export type WorkflowHostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithRelationInput | Prisma.WorkflowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowHostToolScalarFieldEnum | Prisma.WorkflowHostToolScalarFieldEnum[];
};
export type WorkflowHostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithRelationInput | Prisma.WorkflowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowHostToolScalarFieldEnum | Prisma.WorkflowHostToolScalarFieldEnum[];
};
export type WorkflowHostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithRelationInput | Prisma.WorkflowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowHostToolScalarFieldEnum | Prisma.WorkflowHostToolScalarFieldEnum[];
};
export type WorkflowHostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowHostToolCreateInput, Prisma.WorkflowHostToolUncheckedCreateInput>;
};
export type WorkflowHostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.WorkflowHostToolCreateManyInput | Prisma.WorkflowHostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WorkflowHostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    data: Prisma.WorkflowHostToolCreateManyInput | Prisma.WorkflowHostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.WorkflowHostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type WorkflowHostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateInput, Prisma.WorkflowHostToolUncheckedUpdateInput>;
    where: Prisma.WorkflowHostToolWhereUniqueInput;
};
export type WorkflowHostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateManyMutationInput, Prisma.WorkflowHostToolUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowHostToolWhereInput;
    limit?: number;
};
export type WorkflowHostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowHostToolUpdateManyMutationInput, Prisma.WorkflowHostToolUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowHostToolWhereInput;
    limit?: number;
    include?: Prisma.WorkflowHostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type WorkflowHostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowHostToolCreateInput, Prisma.WorkflowHostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.WorkflowHostToolUpdateInput, Prisma.WorkflowHostToolUncheckedUpdateInput>;
};
export type WorkflowHostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowHostToolWhereUniqueInput;
};
export type WorkflowHostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowHostToolWhereInput;
    limit?: number;
};
export type WorkflowHostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
};
