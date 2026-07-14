import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type WorkflowToolModel = runtime.Types.Result.DefaultSelection<Prisma.$WorkflowToolPayload>;
export type AggregateWorkflowTool = {
    _count: WorkflowToolCountAggregateOutputType | null;
    _avg: WorkflowToolAvgAggregateOutputType | null;
    _sum: WorkflowToolSumAggregateOutputType | null;
    _min: WorkflowToolMinAggregateOutputType | null;
    _max: WorkflowToolMaxAggregateOutputType | null;
};
export type WorkflowToolAvgAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    toolId: number | null;
};
export type WorkflowToolSumAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    toolId: number | null;
};
export type WorkflowToolMinAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type WorkflowToolMaxAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    toolId: number | null;
    isRequired: boolean | null;
};
export type WorkflowToolCountAggregateOutputType = {
    id: number;
    workflowId: number;
    toolId: number;
    isRequired: number;
    _all: number;
};
export type WorkflowToolAvgAggregateInputType = {
    id?: true;
    workflowId?: true;
    toolId?: true;
};
export type WorkflowToolSumAggregateInputType = {
    id?: true;
    workflowId?: true;
    toolId?: true;
};
export type WorkflowToolMinAggregateInputType = {
    id?: true;
    workflowId?: true;
    toolId?: true;
    isRequired?: true;
};
export type WorkflowToolMaxAggregateInputType = {
    id?: true;
    workflowId?: true;
    toolId?: true;
    isRequired?: true;
};
export type WorkflowToolCountAggregateInputType = {
    id?: true;
    workflowId?: true;
    toolId?: true;
    isRequired?: true;
    _all?: true;
};
export type WorkflowToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowToolWhereInput;
    orderBy?: Prisma.WorkflowToolOrderByWithRelationInput | Prisma.WorkflowToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | WorkflowToolCountAggregateInputType;
    _avg?: WorkflowToolAvgAggregateInputType;
    _sum?: WorkflowToolSumAggregateInputType;
    _min?: WorkflowToolMinAggregateInputType;
    _max?: WorkflowToolMaxAggregateInputType;
};
export type GetWorkflowToolAggregateType<T extends WorkflowToolAggregateArgs> = {
    [P in keyof T & keyof AggregateWorkflowTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWorkflowTool[P]> : Prisma.GetScalarType<T[P], AggregateWorkflowTool[P]>;
};
export type WorkflowToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowToolWhereInput;
    orderBy?: Prisma.WorkflowToolOrderByWithAggregationInput | Prisma.WorkflowToolOrderByWithAggregationInput[];
    by: Prisma.WorkflowToolScalarFieldEnum[] | Prisma.WorkflowToolScalarFieldEnum;
    having?: Prisma.WorkflowToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WorkflowToolCountAggregateInputType | true;
    _avg?: WorkflowToolAvgAggregateInputType;
    _sum?: WorkflowToolSumAggregateInputType;
    _min?: WorkflowToolMinAggregateInputType;
    _max?: WorkflowToolMaxAggregateInputType;
};
export type WorkflowToolGroupByOutputType = {
    id: number;
    workflowId: number;
    toolId: number;
    isRequired: boolean;
    _count: WorkflowToolCountAggregateOutputType | null;
    _avg: WorkflowToolAvgAggregateOutputType | null;
    _sum: WorkflowToolSumAggregateOutputType | null;
    _min: WorkflowToolMinAggregateOutputType | null;
    _max: WorkflowToolMaxAggregateOutputType | null;
};
export type GetWorkflowToolGroupByPayload<T extends WorkflowToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WorkflowToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WorkflowToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WorkflowToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WorkflowToolGroupByOutputType[P]>;
}>>;
export type WorkflowToolWhereInput = {
    AND?: Prisma.WorkflowToolWhereInput | Prisma.WorkflowToolWhereInput[];
    OR?: Prisma.WorkflowToolWhereInput[];
    NOT?: Prisma.WorkflowToolWhereInput | Prisma.WorkflowToolWhereInput[];
    id?: Prisma.IntFilter<"WorkflowTool"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowTool"> | number;
    toolId?: Prisma.IntFilter<"WorkflowTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowTool"> | boolean;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
};
export type WorkflowToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    workflow?: Prisma.WorkflowOrderByWithRelationInput;
    tool?: Prisma.ToolOrderByWithRelationInput;
};
export type WorkflowToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    workflowId_toolId?: Prisma.WorkflowToolWorkflowIdToolIdCompoundUniqueInput;
    AND?: Prisma.WorkflowToolWhereInput | Prisma.WorkflowToolWhereInput[];
    OR?: Prisma.WorkflowToolWhereInput[];
    NOT?: Prisma.WorkflowToolWhereInput | Prisma.WorkflowToolWhereInput[];
    workflowId?: Prisma.IntFilter<"WorkflowTool"> | number;
    toolId?: Prisma.IntFilter<"WorkflowTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowTool"> | boolean;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
}, "id" | "workflowId_toolId">;
export type WorkflowToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
    _count?: Prisma.WorkflowToolCountOrderByAggregateInput;
    _avg?: Prisma.WorkflowToolAvgOrderByAggregateInput;
    _max?: Prisma.WorkflowToolMaxOrderByAggregateInput;
    _min?: Prisma.WorkflowToolMinOrderByAggregateInput;
    _sum?: Prisma.WorkflowToolSumOrderByAggregateInput;
};
export type WorkflowToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.WorkflowToolScalarWhereWithAggregatesInput | Prisma.WorkflowToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.WorkflowToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WorkflowToolScalarWhereWithAggregatesInput | Prisma.WorkflowToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WorkflowTool"> | number;
    workflowId?: Prisma.IntWithAggregatesFilter<"WorkflowTool"> | number;
    toolId?: Prisma.IntWithAggregatesFilter<"WorkflowTool"> | number;
    isRequired?: Prisma.BoolWithAggregatesFilter<"WorkflowTool"> | boolean;
};
export type WorkflowToolCreateInput = {
    isRequired?: boolean;
    workflow: Prisma.WorkflowCreateNestedOneWithoutWorkflowToolsInput;
    tool: Prisma.ToolCreateNestedOneWithoutWorkflowToolsInput;
};
export type WorkflowToolUncheckedCreateInput = {
    id?: number;
    workflowId: number;
    toolId: number;
    isRequired?: boolean;
};
export type WorkflowToolUpdateInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    workflow?: Prisma.WorkflowUpdateOneRequiredWithoutWorkflowToolsNestedInput;
    tool?: Prisma.ToolUpdateOneRequiredWithoutWorkflowToolsNestedInput;
};
export type WorkflowToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolCreateManyInput = {
    id?: number;
    workflowId: number;
    toolId: number;
    isRequired?: boolean;
};
export type WorkflowToolUpdateManyMutationInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolListRelationFilter = {
    every?: Prisma.WorkflowToolWhereInput;
    some?: Prisma.WorkflowToolWhereInput;
    none?: Prisma.WorkflowToolWhereInput;
};
export type WorkflowToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type WorkflowToolWorkflowIdToolIdCompoundUniqueInput = {
    workflowId: number;
    toolId: number;
};
export type WorkflowToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type WorkflowToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    isRequired?: Prisma.SortOrder;
};
export type WorkflowToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type WorkflowToolCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput> | Prisma.WorkflowToolCreateWithoutToolInput[] | Prisma.WorkflowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutToolInput | Prisma.WorkflowToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.WorkflowToolCreateManyToolInputEnvelope;
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
};
export type WorkflowToolUncheckedCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput> | Prisma.WorkflowToolCreateWithoutToolInput[] | Prisma.WorkflowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutToolInput | Prisma.WorkflowToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.WorkflowToolCreateManyToolInputEnvelope;
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
};
export type WorkflowToolUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput> | Prisma.WorkflowToolCreateWithoutToolInput[] | Prisma.WorkflowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutToolInput | Prisma.WorkflowToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.WorkflowToolUpsertWithWhereUniqueWithoutToolInput | Prisma.WorkflowToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.WorkflowToolCreateManyToolInputEnvelope;
    set?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    delete?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    update?: Prisma.WorkflowToolUpdateWithWhereUniqueWithoutToolInput | Prisma.WorkflowToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.WorkflowToolUpdateManyWithWhereWithoutToolInput | Prisma.WorkflowToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
};
export type WorkflowToolUncheckedUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput> | Prisma.WorkflowToolCreateWithoutToolInput[] | Prisma.WorkflowToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutToolInput | Prisma.WorkflowToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.WorkflowToolUpsertWithWhereUniqueWithoutToolInput | Prisma.WorkflowToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.WorkflowToolCreateManyToolInputEnvelope;
    set?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    delete?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    update?: Prisma.WorkflowToolUpdateWithWhereUniqueWithoutToolInput | Prisma.WorkflowToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.WorkflowToolUpdateManyWithWhereWithoutToolInput | Prisma.WorkflowToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
};
export type WorkflowToolCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowToolCreateWithoutWorkflowInput[] | Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowToolCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
};
export type WorkflowToolUncheckedCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowToolCreateWithoutWorkflowInput[] | Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowToolCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
};
export type WorkflowToolUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowToolCreateWithoutWorkflowInput[] | Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowToolUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowToolUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowToolCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    delete?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    update?: Prisma.WorkflowToolUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowToolUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowToolUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowToolUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
};
export type WorkflowToolUncheckedUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowToolCreateWithoutWorkflowInput[] | Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowToolCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowToolUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowToolUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowToolCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    disconnect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    delete?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    connect?: Prisma.WorkflowToolWhereUniqueInput | Prisma.WorkflowToolWhereUniqueInput[];
    update?: Prisma.WorkflowToolUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowToolUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowToolUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowToolUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
};
export type WorkflowToolCreateWithoutToolInput = {
    isRequired?: boolean;
    workflow: Prisma.WorkflowCreateNestedOneWithoutWorkflowToolsInput;
};
export type WorkflowToolUncheckedCreateWithoutToolInput = {
    id?: number;
    workflowId: number;
    isRequired?: boolean;
};
export type WorkflowToolCreateOrConnectWithoutToolInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput>;
};
export type WorkflowToolCreateManyToolInputEnvelope = {
    data: Prisma.WorkflowToolCreateManyToolInput | Prisma.WorkflowToolCreateManyToolInput[];
    skipDuplicates?: boolean;
};
export type WorkflowToolUpsertWithWhereUniqueWithoutToolInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkflowToolUpdateWithoutToolInput, Prisma.WorkflowToolUncheckedUpdateWithoutToolInput>;
    create: Prisma.XOR<Prisma.WorkflowToolCreateWithoutToolInput, Prisma.WorkflowToolUncheckedCreateWithoutToolInput>;
};
export type WorkflowToolUpdateWithWhereUniqueWithoutToolInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateWithoutToolInput, Prisma.WorkflowToolUncheckedUpdateWithoutToolInput>;
};
export type WorkflowToolUpdateManyWithWhereWithoutToolInput = {
    where: Prisma.WorkflowToolScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateManyMutationInput, Prisma.WorkflowToolUncheckedUpdateManyWithoutToolInput>;
};
export type WorkflowToolScalarWhereInput = {
    AND?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
    OR?: Prisma.WorkflowToolScalarWhereInput[];
    NOT?: Prisma.WorkflowToolScalarWhereInput | Prisma.WorkflowToolScalarWhereInput[];
    id?: Prisma.IntFilter<"WorkflowTool"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowTool"> | number;
    toolId?: Prisma.IntFilter<"WorkflowTool"> | number;
    isRequired?: Prisma.BoolFilter<"WorkflowTool"> | boolean;
};
export type WorkflowToolCreateWithoutWorkflowInput = {
    isRequired?: boolean;
    tool: Prisma.ToolCreateNestedOneWithoutWorkflowToolsInput;
};
export type WorkflowToolUncheckedCreateWithoutWorkflowInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type WorkflowToolCreateOrConnectWithoutWorkflowInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowToolCreateManyWorkflowInputEnvelope = {
    data: Prisma.WorkflowToolCreateManyWorkflowInput | Prisma.WorkflowToolCreateManyWorkflowInput[];
    skipDuplicates?: boolean;
};
export type WorkflowToolUpsertWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkflowToolUpdateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedUpdateWithoutWorkflowInput>;
    create: Prisma.XOR<Prisma.WorkflowToolCreateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowToolUpdateWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateWithoutWorkflowInput, Prisma.WorkflowToolUncheckedUpdateWithoutWorkflowInput>;
};
export type WorkflowToolUpdateManyWithWhereWithoutWorkflowInput = {
    where: Prisma.WorkflowToolScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateManyMutationInput, Prisma.WorkflowToolUncheckedUpdateManyWithoutWorkflowInput>;
};
export type WorkflowToolCreateManyToolInput = {
    id?: number;
    workflowId: number;
    isRequired?: boolean;
};
export type WorkflowToolUpdateWithoutToolInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    workflow?: Prisma.WorkflowUpdateOneRequiredWithoutWorkflowToolsNestedInput;
};
export type WorkflowToolUncheckedUpdateWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolUncheckedUpdateManyWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolCreateManyWorkflowInput = {
    id?: number;
    toolId: number;
    isRequired?: boolean;
};
export type WorkflowToolUpdateWithoutWorkflowInput = {
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    tool?: Prisma.ToolUpdateOneRequiredWithoutWorkflowToolsNestedInput;
};
export type WorkflowToolUncheckedUpdateWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolUncheckedUpdateManyWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    isRequired?: Prisma.BoolFieldUpdateOperationsInput | boolean;
};
export type WorkflowToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowTool"]>;
export type WorkflowToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowTool"]>;
export type WorkflowToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowTool"]>;
export type WorkflowToolSelectScalar = {
    id?: boolean;
    workflowId?: boolean;
    toolId?: boolean;
    isRequired?: boolean;
};
export type WorkflowToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "workflowId" | "toolId" | "isRequired", ExtArgs["result"]["workflowTool"]>;
export type WorkflowToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type WorkflowToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type WorkflowToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type $WorkflowToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WorkflowTool";
    objects: {
        workflow: Prisma.$WorkflowPayload<ExtArgs>;
        tool: Prisma.$ToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        workflowId: number;
        toolId: number;
        isRequired: boolean;
    }, ExtArgs["result"]["workflowTool"]>;
    composites: {};
};
export type WorkflowToolGetPayload<S extends boolean | null | undefined | WorkflowToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload, S>;
export type WorkflowToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WorkflowToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WorkflowToolCountAggregateInputType | true;
};
export interface WorkflowToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WorkflowTool'];
        meta: {
            name: 'WorkflowTool';
        };
    };
    findUnique<T extends WorkflowToolFindUniqueArgs>(args: Prisma.SelectSubset<T, WorkflowToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends WorkflowToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WorkflowToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends WorkflowToolFindFirstArgs>(args?: Prisma.SelectSubset<T, WorkflowToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends WorkflowToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WorkflowToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends WorkflowToolFindManyArgs>(args?: Prisma.SelectSubset<T, WorkflowToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends WorkflowToolCreateArgs>(args: Prisma.SelectSubset<T, WorkflowToolCreateArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends WorkflowToolCreateManyArgs>(args?: Prisma.SelectSubset<T, WorkflowToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends WorkflowToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WorkflowToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends WorkflowToolDeleteArgs>(args: Prisma.SelectSubset<T, WorkflowToolDeleteArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends WorkflowToolUpdateArgs>(args: Prisma.SelectSubset<T, WorkflowToolUpdateArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends WorkflowToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, WorkflowToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends WorkflowToolUpdateManyArgs>(args: Prisma.SelectSubset<T, WorkflowToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends WorkflowToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WorkflowToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends WorkflowToolUpsertArgs>(args: Prisma.SelectSubset<T, WorkflowToolUpsertArgs<ExtArgs>>): Prisma.Prisma__WorkflowToolClient<runtime.Types.Result.GetResult<Prisma.$WorkflowToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends WorkflowToolCountArgs>(args?: Prisma.Subset<T, WorkflowToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WorkflowToolCountAggregateOutputType> : number>;
    aggregate<T extends WorkflowToolAggregateArgs>(args: Prisma.Subset<T, WorkflowToolAggregateArgs>): Prisma.PrismaPromise<GetWorkflowToolAggregateType<T>>;
    groupBy<T extends WorkflowToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WorkflowToolGroupByArgs['orderBy'];
    } : {
        orderBy?: WorkflowToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WorkflowToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkflowToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: WorkflowToolFieldRefs;
}
export interface Prisma__WorkflowToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    workflow<T extends Prisma.WorkflowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkflowDefaultArgs<ExtArgs>>): Prisma.Prisma__WorkflowClient<runtime.Types.Result.GetResult<Prisma.$WorkflowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tool<T extends Prisma.ToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolDefaultArgs<ExtArgs>>): Prisma.Prisma__ToolClient<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface WorkflowToolFieldRefs {
    readonly id: Prisma.FieldRef<"WorkflowTool", 'Int'>;
    readonly workflowId: Prisma.FieldRef<"WorkflowTool", 'Int'>;
    readonly toolId: Prisma.FieldRef<"WorkflowTool", 'Int'>;
    readonly isRequired: Prisma.FieldRef<"WorkflowTool", 'Boolean'>;
}
export type WorkflowToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowToolWhereUniqueInput;
};
export type WorkflowToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowToolWhereUniqueInput;
};
export type WorkflowToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowToolWhereInput;
    orderBy?: Prisma.WorkflowToolOrderByWithRelationInput | Prisma.WorkflowToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowToolScalarFieldEnum | Prisma.WorkflowToolScalarFieldEnum[];
};
export type WorkflowToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowToolWhereInput;
    orderBy?: Prisma.WorkflowToolOrderByWithRelationInput | Prisma.WorkflowToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowToolScalarFieldEnum | Prisma.WorkflowToolScalarFieldEnum[];
};
export type WorkflowToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowToolWhereInput;
    orderBy?: Prisma.WorkflowToolOrderByWithRelationInput | Prisma.WorkflowToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowToolScalarFieldEnum | Prisma.WorkflowToolScalarFieldEnum[];
};
export type WorkflowToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowToolCreateInput, Prisma.WorkflowToolUncheckedCreateInput>;
};
export type WorkflowToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.WorkflowToolCreateManyInput | Prisma.WorkflowToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WorkflowToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    data: Prisma.WorkflowToolCreateManyInput | Prisma.WorkflowToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.WorkflowToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type WorkflowToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateInput, Prisma.WorkflowToolUncheckedUpdateInput>;
    where: Prisma.WorkflowToolWhereUniqueInput;
};
export type WorkflowToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.WorkflowToolUpdateManyMutationInput, Prisma.WorkflowToolUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowToolWhereInput;
    limit?: number;
};
export type WorkflowToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowToolUpdateManyMutationInput, Prisma.WorkflowToolUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowToolWhereInput;
    limit?: number;
    include?: Prisma.WorkflowToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type WorkflowToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowToolCreateInput, Prisma.WorkflowToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.WorkflowToolUpdateInput, Prisma.WorkflowToolUncheckedUpdateInput>;
};
export type WorkflowToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
    where: Prisma.WorkflowToolWhereUniqueInput;
};
export type WorkflowToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowToolWhereInput;
    limit?: number;
};
export type WorkflowToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowToolInclude<ExtArgs> | null;
};
