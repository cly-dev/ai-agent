import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type FlowRevisionModel = runtime.Types.Result.DefaultSelection<Prisma.$FlowRevisionPayload>;
export type AggregateFlowRevision = {
    _count: FlowRevisionCountAggregateOutputType | null;
    _avg: FlowRevisionAvgAggregateOutputType | null;
    _sum: FlowRevisionSumAggregateOutputType | null;
    _min: FlowRevisionMinAggregateOutputType | null;
    _max: FlowRevisionMaxAggregateOutputType | null;
};
export type FlowRevisionAvgAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    version: number | null;
};
export type FlowRevisionSumAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    version: number | null;
};
export type FlowRevisionMinAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    version: number | null;
    deliverable: $Enums.WorkflowDeliverable | null;
    changeNote: string | null;
    createdAt: Date | null;
};
export type FlowRevisionMaxAggregateOutputType = {
    id: number | null;
    flowId: number | null;
    version: number | null;
    deliverable: $Enums.WorkflowDeliverable | null;
    changeNote: string | null;
    createdAt: Date | null;
};
export type FlowRevisionCountAggregateOutputType = {
    id: number;
    flowId: number;
    version: number;
    intent: number;
    ir: number;
    deliverable: number;
    constraints: number;
    changeNote: number;
    createdAt: number;
    _all: number;
};
export type FlowRevisionAvgAggregateInputType = {
    id?: true;
    flowId?: true;
    version?: true;
};
export type FlowRevisionSumAggregateInputType = {
    id?: true;
    flowId?: true;
    version?: true;
};
export type FlowRevisionMinAggregateInputType = {
    id?: true;
    flowId?: true;
    version?: true;
    deliverable?: true;
    changeNote?: true;
    createdAt?: true;
};
export type FlowRevisionMaxAggregateInputType = {
    id?: true;
    flowId?: true;
    version?: true;
    deliverable?: true;
    changeNote?: true;
    createdAt?: true;
};
export type FlowRevisionCountAggregateInputType = {
    id?: true;
    flowId?: true;
    version?: true;
    intent?: true;
    ir?: true;
    deliverable?: true;
    constraints?: true;
    changeNote?: true;
    createdAt?: true;
    _all?: true;
};
export type FlowRevisionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowRevisionWhereInput;
    orderBy?: Prisma.FlowRevisionOrderByWithRelationInput | Prisma.FlowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.FlowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FlowRevisionCountAggregateInputType;
    _avg?: FlowRevisionAvgAggregateInputType;
    _sum?: FlowRevisionSumAggregateInputType;
    _min?: FlowRevisionMinAggregateInputType;
    _max?: FlowRevisionMaxAggregateInputType;
};
export type GetFlowRevisionAggregateType<T extends FlowRevisionAggregateArgs> = {
    [P in keyof T & keyof AggregateFlowRevision]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFlowRevision[P]> : Prisma.GetScalarType<T[P], AggregateFlowRevision[P]>;
};
export type FlowRevisionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowRevisionWhereInput;
    orderBy?: Prisma.FlowRevisionOrderByWithAggregationInput | Prisma.FlowRevisionOrderByWithAggregationInput[];
    by: Prisma.FlowRevisionScalarFieldEnum[] | Prisma.FlowRevisionScalarFieldEnum;
    having?: Prisma.FlowRevisionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FlowRevisionCountAggregateInputType | true;
    _avg?: FlowRevisionAvgAggregateInputType;
    _sum?: FlowRevisionSumAggregateInputType;
    _min?: FlowRevisionMinAggregateInputType;
    _max?: FlowRevisionMaxAggregateInputType;
};
export type FlowRevisionGroupByOutputType = {
    id: number;
    flowId: number;
    version: number;
    intent: runtime.JsonValue;
    ir: runtime.JsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints: runtime.JsonValue;
    changeNote: string | null;
    createdAt: Date;
    _count: FlowRevisionCountAggregateOutputType | null;
    _avg: FlowRevisionAvgAggregateOutputType | null;
    _sum: FlowRevisionSumAggregateOutputType | null;
    _min: FlowRevisionMinAggregateOutputType | null;
    _max: FlowRevisionMaxAggregateOutputType | null;
};
export type GetFlowRevisionGroupByPayload<T extends FlowRevisionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FlowRevisionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FlowRevisionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FlowRevisionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FlowRevisionGroupByOutputType[P]>;
}>>;
export type FlowRevisionWhereInput = {
    AND?: Prisma.FlowRevisionWhereInput | Prisma.FlowRevisionWhereInput[];
    OR?: Prisma.FlowRevisionWhereInput[];
    NOT?: Prisma.FlowRevisionWhereInput | Prisma.FlowRevisionWhereInput[];
    id?: Prisma.IntFilter<"FlowRevision"> | number;
    flowId?: Prisma.IntFilter<"FlowRevision"> | number;
    version?: Prisma.IntFilter<"FlowRevision"> | number;
    intent?: Prisma.JsonFilter<"FlowRevision">;
    ir?: Prisma.JsonFilter<"FlowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"FlowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"FlowRevision">;
    changeNote?: Prisma.StringNullableFilter<"FlowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FlowRevision"> | Date | string;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
};
export type FlowRevisionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    intent?: Prisma.SortOrder;
    ir?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    flow?: Prisma.FlowOrderByWithRelationInput;
};
export type FlowRevisionWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    flowId_version?: Prisma.FlowRevisionFlowIdVersionCompoundUniqueInput;
    AND?: Prisma.FlowRevisionWhereInput | Prisma.FlowRevisionWhereInput[];
    OR?: Prisma.FlowRevisionWhereInput[];
    NOT?: Prisma.FlowRevisionWhereInput | Prisma.FlowRevisionWhereInput[];
    flowId?: Prisma.IntFilter<"FlowRevision"> | number;
    version?: Prisma.IntFilter<"FlowRevision"> | number;
    intent?: Prisma.JsonFilter<"FlowRevision">;
    ir?: Prisma.JsonFilter<"FlowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"FlowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"FlowRevision">;
    changeNote?: Prisma.StringNullableFilter<"FlowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FlowRevision"> | Date | string;
    flow?: Prisma.XOR<Prisma.FlowScalarRelationFilter, Prisma.FlowWhereInput>;
}, "id" | "flowId_version">;
export type FlowRevisionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    intent?: Prisma.SortOrder;
    ir?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.FlowRevisionCountOrderByAggregateInput;
    _avg?: Prisma.FlowRevisionAvgOrderByAggregateInput;
    _max?: Prisma.FlowRevisionMaxOrderByAggregateInput;
    _min?: Prisma.FlowRevisionMinOrderByAggregateInput;
    _sum?: Prisma.FlowRevisionSumOrderByAggregateInput;
};
export type FlowRevisionScalarWhereWithAggregatesInput = {
    AND?: Prisma.FlowRevisionScalarWhereWithAggregatesInput | Prisma.FlowRevisionScalarWhereWithAggregatesInput[];
    OR?: Prisma.FlowRevisionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FlowRevisionScalarWhereWithAggregatesInput | Prisma.FlowRevisionScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"FlowRevision"> | number;
    flowId?: Prisma.IntWithAggregatesFilter<"FlowRevision"> | number;
    version?: Prisma.IntWithAggregatesFilter<"FlowRevision"> | number;
    intent?: Prisma.JsonWithAggregatesFilter<"FlowRevision">;
    ir?: Prisma.JsonWithAggregatesFilter<"FlowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableWithAggregatesFilter<"FlowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonWithAggregatesFilter<"FlowRevision">;
    changeNote?: Prisma.StringNullableWithAggregatesFilter<"FlowRevision"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"FlowRevision"> | Date | string;
};
export type FlowRevisionCreateInput = {
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
    flow: Prisma.FlowCreateNestedOneWithoutRevisionsInput;
};
export type FlowRevisionUncheckedCreateInput = {
    id?: number;
    flowId: number;
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type FlowRevisionUpdateInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    flow?: Prisma.FlowUpdateOneRequiredWithoutRevisionsNestedInput;
};
export type FlowRevisionUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionCreateManyInput = {
    id?: number;
    flowId: number;
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type FlowRevisionUpdateManyMutationInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    flowId?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionListRelationFilter = {
    every?: Prisma.FlowRevisionWhereInput;
    some?: Prisma.FlowRevisionWhereInput;
    none?: Prisma.FlowRevisionWhereInput;
};
export type FlowRevisionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FlowRevisionFlowIdVersionCompoundUniqueInput = {
    flowId: number;
    version: number;
};
export type FlowRevisionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    intent?: Prisma.SortOrder;
    ir?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    constraints?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FlowRevisionAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
};
export type FlowRevisionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FlowRevisionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
    deliverable?: Prisma.SortOrder;
    changeNote?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FlowRevisionSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    flowId?: Prisma.SortOrder;
    version?: Prisma.SortOrder;
};
export type FlowRevisionCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput> | Prisma.FlowRevisionCreateWithoutFlowInput[] | Prisma.FlowRevisionUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowRevisionCreateOrConnectWithoutFlowInput | Prisma.FlowRevisionCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowRevisionCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
};
export type FlowRevisionUncheckedCreateNestedManyWithoutFlowInput = {
    create?: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput> | Prisma.FlowRevisionCreateWithoutFlowInput[] | Prisma.FlowRevisionUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowRevisionCreateOrConnectWithoutFlowInput | Prisma.FlowRevisionCreateOrConnectWithoutFlowInput[];
    createMany?: Prisma.FlowRevisionCreateManyFlowInputEnvelope;
    connect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
};
export type FlowRevisionUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput> | Prisma.FlowRevisionCreateWithoutFlowInput[] | Prisma.FlowRevisionUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowRevisionCreateOrConnectWithoutFlowInput | Prisma.FlowRevisionCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowRevisionUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowRevisionUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowRevisionCreateManyFlowInputEnvelope;
    set?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    disconnect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    delete?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    connect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    update?: Prisma.FlowRevisionUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowRevisionUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowRevisionUpdateManyWithWhereWithoutFlowInput | Prisma.FlowRevisionUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowRevisionScalarWhereInput | Prisma.FlowRevisionScalarWhereInput[];
};
export type FlowRevisionUncheckedUpdateManyWithoutFlowNestedInput = {
    create?: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput> | Prisma.FlowRevisionCreateWithoutFlowInput[] | Prisma.FlowRevisionUncheckedCreateWithoutFlowInput[];
    connectOrCreate?: Prisma.FlowRevisionCreateOrConnectWithoutFlowInput | Prisma.FlowRevisionCreateOrConnectWithoutFlowInput[];
    upsert?: Prisma.FlowRevisionUpsertWithWhereUniqueWithoutFlowInput | Prisma.FlowRevisionUpsertWithWhereUniqueWithoutFlowInput[];
    createMany?: Prisma.FlowRevisionCreateManyFlowInputEnvelope;
    set?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    disconnect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    delete?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    connect?: Prisma.FlowRevisionWhereUniqueInput | Prisma.FlowRevisionWhereUniqueInput[];
    update?: Prisma.FlowRevisionUpdateWithWhereUniqueWithoutFlowInput | Prisma.FlowRevisionUpdateWithWhereUniqueWithoutFlowInput[];
    updateMany?: Prisma.FlowRevisionUpdateManyWithWhereWithoutFlowInput | Prisma.FlowRevisionUpdateManyWithWhereWithoutFlowInput[];
    deleteMany?: Prisma.FlowRevisionScalarWhereInput | Prisma.FlowRevisionScalarWhereInput[];
};
export type FlowRevisionCreateWithoutFlowInput = {
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type FlowRevisionUncheckedCreateWithoutFlowInput = {
    id?: number;
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type FlowRevisionCreateOrConnectWithoutFlowInput = {
    where: Prisma.FlowRevisionWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput>;
};
export type FlowRevisionCreateManyFlowInputEnvelope = {
    data: Prisma.FlowRevisionCreateManyFlowInput | Prisma.FlowRevisionCreateManyFlowInput[];
    skipDuplicates?: boolean;
};
export type FlowRevisionUpsertWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowRevisionWhereUniqueInput;
    update: Prisma.XOR<Prisma.FlowRevisionUpdateWithoutFlowInput, Prisma.FlowRevisionUncheckedUpdateWithoutFlowInput>;
    create: Prisma.XOR<Prisma.FlowRevisionCreateWithoutFlowInput, Prisma.FlowRevisionUncheckedCreateWithoutFlowInput>;
};
export type FlowRevisionUpdateWithWhereUniqueWithoutFlowInput = {
    where: Prisma.FlowRevisionWhereUniqueInput;
    data: Prisma.XOR<Prisma.FlowRevisionUpdateWithoutFlowInput, Prisma.FlowRevisionUncheckedUpdateWithoutFlowInput>;
};
export type FlowRevisionUpdateManyWithWhereWithoutFlowInput = {
    where: Prisma.FlowRevisionScalarWhereInput;
    data: Prisma.XOR<Prisma.FlowRevisionUpdateManyMutationInput, Prisma.FlowRevisionUncheckedUpdateManyWithoutFlowInput>;
};
export type FlowRevisionScalarWhereInput = {
    AND?: Prisma.FlowRevisionScalarWhereInput | Prisma.FlowRevisionScalarWhereInput[];
    OR?: Prisma.FlowRevisionScalarWhereInput[];
    NOT?: Prisma.FlowRevisionScalarWhereInput | Prisma.FlowRevisionScalarWhereInput[];
    id?: Prisma.IntFilter<"FlowRevision"> | number;
    flowId?: Prisma.IntFilter<"FlowRevision"> | number;
    version?: Prisma.IntFilter<"FlowRevision"> | number;
    intent?: Prisma.JsonFilter<"FlowRevision">;
    ir?: Prisma.JsonFilter<"FlowRevision">;
    deliverable?: Prisma.EnumWorkflowDeliverableFilter<"FlowRevision"> | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonFilter<"FlowRevision">;
    changeNote?: Prisma.StringNullableFilter<"FlowRevision"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FlowRevision"> | Date | string;
};
export type FlowRevisionCreateManyFlowInput = {
    id?: number;
    version: number;
    intent: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable: $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: string | null;
    createdAt?: Date | string;
};
export type FlowRevisionUpdateWithoutFlowInput = {
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionUncheckedUpdateWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionUncheckedUpdateManyWithoutFlowInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    version?: Prisma.IntFieldUpdateOperationsInput | number;
    intent?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    ir?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    deliverable?: Prisma.EnumWorkflowDeliverableFieldUpdateOperationsInput | $Enums.WorkflowDeliverable;
    constraints?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    changeNote?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FlowRevisionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    version?: boolean;
    intent?: boolean;
    ir?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowRevision"]>;
export type FlowRevisionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    version?: boolean;
    intent?: boolean;
    ir?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowRevision"]>;
export type FlowRevisionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    flowId?: boolean;
    version?: boolean;
    intent?: boolean;
    ir?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["flowRevision"]>;
export type FlowRevisionSelectScalar = {
    id?: boolean;
    flowId?: boolean;
    version?: boolean;
    intent?: boolean;
    ir?: boolean;
    deliverable?: boolean;
    constraints?: boolean;
    changeNote?: boolean;
    createdAt?: boolean;
};
export type FlowRevisionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "flowId" | "version" | "intent" | "ir" | "deliverable" | "constraints" | "changeNote" | "createdAt", ExtArgs["result"]["flowRevision"]>;
export type FlowRevisionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
};
export type FlowRevisionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
};
export type FlowRevisionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    flow?: boolean | Prisma.FlowDefaultArgs<ExtArgs>;
};
export type $FlowRevisionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FlowRevision";
    objects: {
        flow: Prisma.$FlowPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        flowId: number;
        version: number;
        intent: runtime.JsonValue;
        ir: runtime.JsonValue;
        deliverable: $Enums.WorkflowDeliverable;
        constraints: runtime.JsonValue;
        changeNote: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["flowRevision"]>;
    composites: {};
};
export type FlowRevisionGetPayload<S extends boolean | null | undefined | FlowRevisionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload, S>;
export type FlowRevisionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FlowRevisionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FlowRevisionCountAggregateInputType | true;
};
export interface FlowRevisionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FlowRevision'];
        meta: {
            name: 'FlowRevision';
        };
    };
    findUnique<T extends FlowRevisionFindUniqueArgs>(args: Prisma.SelectSubset<T, FlowRevisionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FlowRevisionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FlowRevisionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FlowRevisionFindFirstArgs>(args?: Prisma.SelectSubset<T, FlowRevisionFindFirstArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FlowRevisionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FlowRevisionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FlowRevisionFindManyArgs>(args?: Prisma.SelectSubset<T, FlowRevisionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FlowRevisionCreateArgs>(args: Prisma.SelectSubset<T, FlowRevisionCreateArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FlowRevisionCreateManyArgs>(args?: Prisma.SelectSubset<T, FlowRevisionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FlowRevisionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FlowRevisionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FlowRevisionDeleteArgs>(args: Prisma.SelectSubset<T, FlowRevisionDeleteArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FlowRevisionUpdateArgs>(args: Prisma.SelectSubset<T, FlowRevisionUpdateArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FlowRevisionDeleteManyArgs>(args?: Prisma.SelectSubset<T, FlowRevisionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FlowRevisionUpdateManyArgs>(args: Prisma.SelectSubset<T, FlowRevisionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FlowRevisionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FlowRevisionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FlowRevisionUpsertArgs>(args: Prisma.SelectSubset<T, FlowRevisionUpsertArgs<ExtArgs>>): Prisma.Prisma__FlowRevisionClient<runtime.Types.Result.GetResult<Prisma.$FlowRevisionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FlowRevisionCountArgs>(args?: Prisma.Subset<T, FlowRevisionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FlowRevisionCountAggregateOutputType> : number>;
    aggregate<T extends FlowRevisionAggregateArgs>(args: Prisma.Subset<T, FlowRevisionAggregateArgs>): Prisma.PrismaPromise<GetFlowRevisionAggregateType<T>>;
    groupBy<T extends FlowRevisionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FlowRevisionGroupByArgs['orderBy'];
    } : {
        orderBy?: FlowRevisionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FlowRevisionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFlowRevisionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FlowRevisionFieldRefs;
}
export interface Prisma__FlowRevisionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    flow<T extends Prisma.FlowDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.FlowDefaultArgs<ExtArgs>>): Prisma.Prisma__FlowClient<runtime.Types.Result.GetResult<Prisma.$FlowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FlowRevisionFieldRefs {
    readonly id: Prisma.FieldRef<"FlowRevision", 'Int'>;
    readonly flowId: Prisma.FieldRef<"FlowRevision", 'Int'>;
    readonly version: Prisma.FieldRef<"FlowRevision", 'Int'>;
    readonly intent: Prisma.FieldRef<"FlowRevision", 'Json'>;
    readonly ir: Prisma.FieldRef<"FlowRevision", 'Json'>;
    readonly deliverable: Prisma.FieldRef<"FlowRevision", 'WorkflowDeliverable'>;
    readonly constraints: Prisma.FieldRef<"FlowRevision", 'Json'>;
    readonly changeNote: Prisma.FieldRef<"FlowRevision", 'String'>;
    readonly createdAt: Prisma.FieldRef<"FlowRevision", 'DateTime'>;
}
export type FlowRevisionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where: Prisma.FlowRevisionWhereUniqueInput;
};
export type FlowRevisionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where: Prisma.FlowRevisionWhereUniqueInput;
};
export type FlowRevisionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where?: Prisma.FlowRevisionWhereInput;
    orderBy?: Prisma.FlowRevisionOrderByWithRelationInput | Prisma.FlowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.FlowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowRevisionScalarFieldEnum | Prisma.FlowRevisionScalarFieldEnum[];
};
export type FlowRevisionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where?: Prisma.FlowRevisionWhereInput;
    orderBy?: Prisma.FlowRevisionOrderByWithRelationInput | Prisma.FlowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.FlowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowRevisionScalarFieldEnum | Prisma.FlowRevisionScalarFieldEnum[];
};
export type FlowRevisionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where?: Prisma.FlowRevisionWhereInput;
    orderBy?: Prisma.FlowRevisionOrderByWithRelationInput | Prisma.FlowRevisionOrderByWithRelationInput[];
    cursor?: Prisma.FlowRevisionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowRevisionScalarFieldEnum | Prisma.FlowRevisionScalarFieldEnum[];
};
export type FlowRevisionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowRevisionCreateInput, Prisma.FlowRevisionUncheckedCreateInput>;
};
export type FlowRevisionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FlowRevisionCreateManyInput | Prisma.FlowRevisionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FlowRevisionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    data: Prisma.FlowRevisionCreateManyInput | Prisma.FlowRevisionCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FlowRevisionIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FlowRevisionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowRevisionUpdateInput, Prisma.FlowRevisionUncheckedUpdateInput>;
    where: Prisma.FlowRevisionWhereUniqueInput;
};
export type FlowRevisionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FlowRevisionUpdateManyMutationInput, Prisma.FlowRevisionUncheckedUpdateManyInput>;
    where?: Prisma.FlowRevisionWhereInput;
    limit?: number;
};
export type FlowRevisionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FlowRevisionUpdateManyMutationInput, Prisma.FlowRevisionUncheckedUpdateManyInput>;
    where?: Prisma.FlowRevisionWhereInput;
    limit?: number;
    include?: Prisma.FlowRevisionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FlowRevisionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where: Prisma.FlowRevisionWhereUniqueInput;
    create: Prisma.XOR<Prisma.FlowRevisionCreateInput, Prisma.FlowRevisionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FlowRevisionUpdateInput, Prisma.FlowRevisionUncheckedUpdateInput>;
};
export type FlowRevisionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
    where: Prisma.FlowRevisionWhereUniqueInput;
};
export type FlowRevisionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowRevisionWhereInput;
    limit?: number;
};
export type FlowRevisionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowRevisionSelect<ExtArgs> | null;
    omit?: Prisma.FlowRevisionOmit<ExtArgs> | null;
    include?: Prisma.FlowRevisionInclude<ExtArgs> | null;
};
