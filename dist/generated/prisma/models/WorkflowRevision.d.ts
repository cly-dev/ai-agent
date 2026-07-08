import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type WorkflowRevisionModel = runtime.Types.Result.DefaultSelection<Prisma.$WorkflowRevisionPayload>;
export type AggregateWorkflowRevision = {
    _count: WorkflowRevisionCountAggregateOutputType | null;
    _avg: WorkflowRevisionAvgAggregateOutputType | null;
    _sum: WorkflowRevisionSumAggregateOutputType | null;
    _min: WorkflowRevisionMinAggregateOutputType | null;
    _max: WorkflowRevisionMaxAggregateOutputType | null;
};
export type WorkflowRevisionAvgAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    version: number | null;
};
export type WorkflowRevisionSumAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    version: number | null;
};
export type WorkflowRevisionMinAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    version: number | null;
    deliverable: $Enums.WorkflowDeliverable | null;
    changeNote: string | null;
    createdAt: Date | null;
};
export type WorkflowRevisionMaxAggregateOutputType = {
    id: number | null;
    workflowId: number | null;
    version: number | null;
    deliverable: $Enums.WorkflowDeliverable | null;
    changeNote: string | null;
    createdAt: Date | null;
};
export type WorkflowRevisionCountAggregateOutputType = {
    id: number;
    workflowId: number;
    version: number;
    nodes: number;
    deliverable: number;
    constraints: number;
    changeNote: number;
    createdAt: number;
    _all: number;
};
export type WorkflowRevisionAvgAggregateInputType = {
    id?: true;
    workflowId?: true;
    version?: true;
};
export type WorkflowRevisionSumAggregateInputType = {
    id?: true;
    workflowId?: true;
    version?: true;
};
export type WorkflowRevisionMinAggregateInputType = {
    id?: true;
    workflowId?: true;
    version?: true;
    deliverable?: true;
    changeNote?: true;
    createdAt?: true;
};
export type WorkflowRevisionMaxAggregateInputType = {
    id?: true;
    workflowId?: true;
    version?: true;
    deliverable?: true;
    changeNote?: true;
    createdAt?: true;
};
export type WorkflowRevisionCountAggregateInputType = {
    id?: true;
    workflowId?: true;
    version?: true;
    nodes?: true;
    deliverable?: true;
    constraints?: true;
    changeNote?: true;
    createdAt?: true;
    _all?: true;
};
export type WorkflowRevisionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowRevisionWhereInput;
    orderBy?: Prisma.WorkflowRevisionOrderByWithRelationInput | Prisma.WorkflowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | WorkflowRevisionCountAggregateInputType;
    _avg?: WorkflowRevisionAvgAggregateInputType;
    _sum?: WorkflowRevisionSumAggregateInputType;
    _min?: WorkflowRevisionMinAggregateInputType;
    _max?: WorkflowRevisionMaxAggregateInputType;
};
export type GetWorkflowRevisionAggregateType<T extends WorkflowRevisionAggregateArgs> = {
    [P in keyof T & keyof AggregateWorkflowRevision]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWorkflowRevision[P]> : Prisma.GetScalarType<T[P], AggregateWorkflowRevision[P]>;
};
export type WorkflowRevisionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowRevisionWhereInput;
    orderBy?: Prisma.WorkflowRevisionOrderByWithAggregationInput | Prisma.WorkflowRevisionOrderByWithAggregationInput[];
    by: Prisma.WorkflowRevisionScalarFieldEnum[] | Prisma.WorkflowRevisionScalarFieldEnum;
    having?: Prisma.WorkflowRevisionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WorkflowRevisionCountAggregateInputType | true;
    _avg?: WorkflowRevisionAvgAggregateInputType;
    _sum?: WorkflowRevisionSumAggregateInputType;
    _min?: WorkflowRevisionMinAggregateInputType;
    _max?: WorkflowRevisionMaxAggregateInputType;
};
export type WorkflowRevisionGroupByOutputType = {
    id: number;
    workflowId: number;
    version: number;
    nodes: runtime.JsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints: runtime.JsonValue;
    changeNote: string | null;
    createdAt: Date;
    _count: WorkflowRevisionCountAggregateOutputType | null;
    _avg: WorkflowRevisionAvgAggregateOutputType | null;
    _sum: WorkflowRevisionSumAggregateOutputType | null;
    _min: WorkflowRevisionMinAggregateOutputType | null;
    _max: WorkflowRevisionMaxAggregateOutputType | null;
};
export type GetWorkflowRevisionGroupByPayload<T extends WorkflowRevisionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WorkflowRevisionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WorkflowRevisionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WorkflowRevisionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WorkflowRevisionGroupByOutputType[P]>;
}>>;
export type WorkflowRevisionWhereInput = {
    AND?: Prisma.WorkflowRevisionWhereInput | Prisma.WorkflowRevisionWhereInput[];
    OR?: Prisma.WorkflowRevisionWhereInput[];
    NOT?: Prisma.WorkflowRevisionWhereInput | Prisma.WorkflowRevisionWhereInput[];
    id?: Prisma.IntFilter<"WorkflowRevision"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowRevision"> | number;
    version?: Prisma.IntFilter<"WorkflowRevision"> | number;
    nodes?: Prisma.JsonFilter<"WorkflowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"WorkflowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"WorkflowRevision">;
    changeNote?: Prisma.StringNullableFilter<"WorkflowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"WorkflowRevision"> | Date | string;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
};
export type WorkflowRevisionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    nodes?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    workflow?: Prisma.WorkflowOrderByWithRelationInput;
};
export type WorkflowRevisionWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    workflowId_version?: Prisma.WorkflowRevisionWorkflowIdVersionCompoundUniqueInput;
    AND?: Prisma.WorkflowRevisionWhereInput | Prisma.WorkflowRevisionWhereInput[];
    OR?: Prisma.WorkflowRevisionWhereInput[];
    NOT?: Prisma.WorkflowRevisionWhereInput | Prisma.WorkflowRevisionWhereInput[];
    workflowId?: Prisma.IntFilter<"WorkflowRevision"> | number;
    version?: Prisma.IntFilter<"WorkflowRevision"> | number;
    nodes?: Prisma.JsonFilter<"WorkflowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"WorkflowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"WorkflowRevision">;
    changeNote?: Prisma.StringNullableFilter<"WorkflowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"WorkflowRevision"> | Date | string;
    workflow?: Prisma.XOR<Prisma.WorkflowScalarRelationFilter, Prisma.WorkflowWhereInput>;
}, "id" | "workflowId_version">;
export type WorkflowRevisionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    nodes?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.WorkflowRevisionCountOrderByAggregateInput;
    _avg?: Prisma.WorkflowRevisionAvgOrderByAggregateInput;
    _max?: Prisma.WorkflowRevisionMaxOrderByAggregateInput;
    _min?: Prisma.WorkflowRevisionMinOrderByAggregateInput;
    _sum?: Prisma.WorkflowRevisionSumOrderByAggregateInput;
};
export type WorkflowRevisionScalarWhereWithAggregatesInput = {
    AND?: Prisma.WorkflowRevisionScalarWhereWithAggregatesInput | Prisma.WorkflowRevisionScalarWhereWithAggregatesInput[];
    OR?: Prisma.WorkflowRevisionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WorkflowRevisionScalarWhereWithAggregatesInput | Prisma.WorkflowRevisionScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"WorkflowRevision"> | number;
    workflowId?: Prisma.IntWithAggregatesFilter<"WorkflowRevision"> | number;
    version?: Prisma.IntWithAggregatesFilter<"WorkflowRevision"> | number;
    nodes?: Prisma.JsonWithAggregatesFilter<"WorkflowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableWithAggregatesFilter<"WorkflowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonWithAggregatesFilter<"WorkflowRevision">;
    changeNote?: Prisma.StringNullableWithAggregatesFilter<"WorkflowRevision"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"WorkflowRevision"> | Date | string;
};
export type WorkflowRevisionCreateInput = {
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
    workflow: Prisma.WorkflowCreateNestedOneWithoutRevisionsInput;
};
export type WorkflowRevisionUncheckedCreateInput = {
    id?: number;
    workflowId: number;
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type WorkflowRevisionUpdateInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    workflow?: Prisma.WorkflowUpdateOneRequiredWithoutRevisionsNestedInput;
};
export type WorkflowRevisionUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionCreateManyInput = {
    id?: number;
    workflowId: number;
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type WorkflowRevisionUpdateManyMutationInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    workflowId?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionListRelationFilter = {
    every?: Prisma.WorkflowRevisionWhereInput;
    some?: Prisma.WorkflowRevisionWhereInput;
    none?: Prisma.WorkflowRevisionWhereInput;
};
export type WorkflowRevisionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type WorkflowRevisionWorkflowIdVersionCompoundUniqueInput = {
    workflowId: number;
    version: number;
};
export type WorkflowRevisionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    nodes?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type WorkflowRevisionAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
};
export type WorkflowRevisionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type WorkflowRevisionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type WorkflowRevisionSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    workflowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
};
export type WorkflowRevisionCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowRevisionCreateWithoutWorkflowInput[] | Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowRevisionCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
};
export type WorkflowRevisionUncheckedCreateNestedManyWithoutWorkflowInput = {
    create?: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowRevisionCreateWithoutWorkflowInput[] | Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowRevisionCreateManyWorkflowInputEnvelope;
    connect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
};
export type WorkflowRevisionUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowRevisionCreateWithoutWorkflowInput[] | Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowRevisionUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowRevisionUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowRevisionCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    disconnect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    delete?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    connect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    update?: Prisma.WorkflowRevisionUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowRevisionUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowRevisionUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowRevisionUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowRevisionScalarWhereInput | Prisma.WorkflowRevisionScalarWhereInput[];
};
export type WorkflowRevisionUncheckedUpdateManyWithoutWorkflowNestedInput = {
    create?: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput> | Prisma.WorkflowRevisionCreateWithoutWorkflowInput[] | Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput[];
    connectOrCreate?: Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput | Prisma.WorkflowRevisionCreateOrConnectWithoutWorkflowInput[];
    upsert?: Prisma.WorkflowRevisionUpsertWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowRevisionUpsertWithWhereUniqueWithoutWorkflowInput[];
    createMany?: Prisma.WorkflowRevisionCreateManyWorkflowInputEnvelope;
    set?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    disconnect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    delete?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    connect?: Prisma.WorkflowRevisionWhereUniqueInput | Prisma.WorkflowRevisionWhereUniqueInput[];
    update?: Prisma.WorkflowRevisionUpdateWithWhereUniqueWithoutWorkflowInput | Prisma.WorkflowRevisionUpdateWithWhereUniqueWithoutWorkflowInput[];
    updateMany?: Prisma.WorkflowRevisionUpdateManyWithWhereWithoutWorkflowInput | Prisma.WorkflowRevisionUpdateManyWithWhereWithoutWorkflowInput[];
    deleteMany?: Prisma.WorkflowRevisionScalarWhereInput | Prisma.WorkflowRevisionScalarWhereInput[];
};
export type WorkflowRevisionCreateWithoutWorkflowInput = {
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type WorkflowRevisionUncheckedCreateWithoutWorkflowInput = {
    id?: number;
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type WorkflowRevisionCreateOrConnectWithoutWorkflowInput = {
    where: Prisma.WorkflowRevisionWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowRevisionCreateManyWorkflowInputEnvelope = {
    data: Prisma.WorkflowRevisionCreateManyWorkflowInput | Prisma.WorkflowRevisionCreateManyWorkflowInput[];
    skipDuplicates?: boolean;
};
export type WorkflowRevisionUpsertWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowRevisionWhereUniqueInput;
    update: Prisma.XOR<Prisma.WorkflowRevisionUpdateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedUpdateWithoutWorkflowInput>;
    create: Prisma.XOR<Prisma.WorkflowRevisionCreateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedCreateWithoutWorkflowInput>;
};
export type WorkflowRevisionUpdateWithWhereUniqueWithoutWorkflowInput = {
    where: Prisma.WorkflowRevisionWhereUniqueInput;
    data: Prisma.XOR<Prisma.WorkflowRevisionUpdateWithoutWorkflowInput, Prisma.WorkflowRevisionUncheckedUpdateWithoutWorkflowInput>;
};
export type WorkflowRevisionUpdateManyWithWhereWithoutWorkflowInput = {
    where: Prisma.WorkflowRevisionScalarWhereInput;
    data: Prisma.XOR<Prisma.WorkflowRevisionUpdateManyMutationInput, Prisma.WorkflowRevisionUncheckedUpdateManyWithoutWorkflowInput>;
};
export type WorkflowRevisionScalarWhereInput = {
    AND?: Prisma.WorkflowRevisionScalarWhereInput | Prisma.WorkflowRevisionScalarWhereInput[];
    OR?: Prisma.WorkflowRevisionScalarWhereInput[];
    NOT?: Prisma.WorkflowRevisionScalarWhereInput | Prisma.WorkflowRevisionScalarWhereInput[];
    id?: Prisma.IntFilter<"WorkflowRevision"> | number;
    workflowId?: Prisma.IntFilter<"WorkflowRevision"> | number;
    version?: Prisma.IntFilter<"WorkflowRevision"> | number;
    nodes?: Prisma.JsonFilter<"WorkflowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"WorkflowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"WorkflowRevision">;
    changeNote?: Prisma.StringNullableFilter<"WorkflowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"WorkflowRevision"> | Date | string;
};
export type WorkflowRevisionCreateManyWorkflowInput = {
    id?: number;
    version: number;
    nodes: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type WorkflowRevisionUpdateWithoutWorkflowInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionUncheckedUpdateWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionUncheckedUpdateManyWithoutWorkflowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    nodes?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkflowRevisionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    version?: boolean;
    nodes?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowRevision"]>;
export type WorkflowRevisionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    version?: boolean;
    nodes?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowRevision"]>;
export type WorkflowRevisionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    workflowId?: boolean;
    version?: boolean;
    nodes?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workflowRevision"]>;
export type WorkflowRevisionSelectScalar = {
    id?: boolean;
    workflowId?: boolean;
    version?: boolean;
    nodes?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
};
export type WorkflowRevisionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "workflowId" | "version" | "nodes" | "deliverable" | "constraints" | "changeNote" | "createdAt", ExtArgs["result"]["workflowRevision"]>;
export type WorkflowRevisionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
};
export type WorkflowRevisionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
};
export type WorkflowRevisionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    workflow?: boolean | Prisma.WorkflowDefaultArgs<ExtArgs>;
};
export type $WorkflowRevisionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WorkflowRevision";
    objects: {
        workflow: Prisma.$WorkflowPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        workflowId: number;
        version: number;
        nodes: runtime.JsonValue;
        deliverable: $Enums.WorkflowDeliverable;
        constraints: runtime.JsonValue;
        changeNote: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["workflowRevision"]>;
    composites: {};
};
export type WorkflowRevisionGetPayload<S extends boolean | null | undefined | WorkflowRevisionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload, S>;
export type WorkflowRevisionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WorkflowRevisionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WorkflowRevisionCountAggregateInputType | true;
};
export interface WorkflowRevisionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WorkflowRevision'];
        meta: {
            name: 'WorkflowRevision';
        };
    };
    findUnique<T extends WorkflowRevisionFindUniqueArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends WorkflowRevisionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends WorkflowRevisionFindFirstArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionFindFirstArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends WorkflowRevisionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends WorkflowRevisionFindManyArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends WorkflowRevisionCreateArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionCreateArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends WorkflowRevisionCreateManyArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends WorkflowRevisionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends WorkflowRevisionDeleteArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionDeleteArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends WorkflowRevisionUpdateArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionUpdateArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends WorkflowRevisionDeleteManyArgs>(args?: Prisma.SelectSubset<T, WorkflowRevisionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends WorkflowRevisionUpdateManyArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends WorkflowRevisionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends WorkflowRevisionUpsertArgs>(args: Prisma.SelectSubset<T, WorkflowRevisionUpsertArgs<ExtArgs>>): Prisma.Prisma__WorkflowRevisionClient<runtime.Types.Result.GetResult<Prisma.$WorkflowRevisionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends WorkflowRevisionCountArgs>(args?: Prisma.Subset<T, WorkflowRevisionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WorkflowRevisionCountAggregateOutputType> : number>;
    aggregate<T extends WorkflowRevisionAggregateArgs>(args: Prisma.Subset<T, WorkflowRevisionAggregateArgs>): Prisma.PrismaPromise<GetWorkflowRevisionAggregateType<T>>;
    groupBy<T extends WorkflowRevisionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WorkflowRevisionGroupByArgs['orderBy'];
    } : {
        orderBy?: WorkflowRevisionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WorkflowRevisionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkflowRevisionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: WorkflowRevisionFieldRefs;
}
export interface Prisma__WorkflowRevisionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    workflow<T extends Prisma.WorkflowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkflowDefaultArgs<ExtArgs>>): Prisma.Prisma__WorkflowClient<runtime.Types.Result.GetResult<Prisma.$WorkflowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface WorkflowRevisionFieldRefs {
    readonly id: Prisma.FieldRef<"WorkflowRevision", 'Int'>;
    readonly workflowId: Prisma.FieldRef<"WorkflowRevision", 'Int'>;
    readonly version: Prisma.FieldRef<"WorkflowRevision", 'Int'>;
    readonly nodes: Prisma.FieldRef<"WorkflowRevision", 'Json'>;
    readonly deliverable: Prisma.FieldRef<"WorkflowRevision", 'WorkflowDeliverable'>;
    readonly constraints: Prisma.FieldRef<"WorkflowRevision", 'Json'>;
    readonly changeNote: Prisma.FieldRef<"WorkflowRevision", 'String'>;
    readonly createdAt: Prisma.FieldRef<"WorkflowRevision", 'DateTime'>;
}
export type WorkflowRevisionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where: Prisma.WorkflowRevisionWhereUniqueInput;
};
export type WorkflowRevisionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where: Prisma.WorkflowRevisionWhereUniqueInput;
};
export type WorkflowRevisionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where?: Prisma.WorkflowRevisionWhereInput;
    orderBy?: Prisma.WorkflowRevisionOrderByWithRelationInput | Prisma.WorkflowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowRevisionScalarFieldEnum | Prisma.WorkflowRevisionScalarFieldEnum[];
};
export type WorkflowRevisionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where?: Prisma.WorkflowRevisionWhereInput;
    orderBy?: Prisma.WorkflowRevisionOrderByWithRelationInput | Prisma.WorkflowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowRevisionScalarFieldEnum | Prisma.WorkflowRevisionScalarFieldEnum[];
};
export type WorkflowRevisionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where?: Prisma.WorkflowRevisionWhereInput;
    orderBy?: Prisma.WorkflowRevisionOrderByWithRelationInput | Prisma.WorkflowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowRevisionScalarFieldEnum | Prisma.WorkflowRevisionScalarFieldEnum[];
};
export type WorkflowRevisionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowRevisionCreateInput, Prisma.WorkflowRevisionUncheckedCreateInput>;
};
export type WorkflowRevisionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.WorkflowRevisionCreateManyInput | Prisma.WorkflowRevisionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type WorkflowRevisionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    data: Prisma.WorkflowRevisionCreateManyInput | Prisma.WorkflowRevisionCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.WorkflowRevisionIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type WorkflowRevisionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowRevisionUpdateInput, Prisma.WorkflowRevisionUncheckedUpdateInput>;
    where: Prisma.WorkflowRevisionWhereUniqueInput;
};
export type WorkflowRevisionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.WorkflowRevisionUpdateManyMutationInput, Prisma.WorkflowRevisionUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowRevisionWhereInput;
    limit?: number;
};
export type WorkflowRevisionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.WorkflowRevisionUpdateManyMutationInput, Prisma.WorkflowRevisionUncheckedUpdateManyInput>;
    where?: Prisma.WorkflowRevisionWhereInput;
    limit?: number;
    include?: Prisma.WorkflowRevisionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type WorkflowRevisionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where: Prisma.WorkflowRevisionWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkflowRevisionCreateInput, Prisma.WorkflowRevisionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.WorkflowRevisionUpdateInput, Prisma.WorkflowRevisionUncheckedUpdateInput>;
};
export type WorkflowRevisionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
    where: Prisma.WorkflowRevisionWhereUniqueInput;
};
export type WorkflowRevisionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowRevisionWhereInput;
    limit?: number;
};
export type WorkflowRevisionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowRevisionOmit<ExtArgs> | null;
    include?: Prisma.WorkflowRevisionInclude<ExtArgs> | null;
};
