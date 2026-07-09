import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type HostPageModel = runtime.Types.Result.DefaultSelection<Prisma.$HostPagePayload>;
export type AggregateHostPage = {
    _count: HostPageCountAggregateOutputType | null;
    _avg: HostPageAvgAggregateOutputType | null;
    _sum: HostPageSumAggregateOutputType | null;
    _min: HostPageMinAggregateOutputType | null;
    _max: HostPageMaxAggregateOutputType | null;
};
export type HostPageAvgAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    sortOrder: number | null;
};
export type HostPageSumAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    sortOrder: number | null;
};
export type HostPageMinAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    scope: string | null;
    label: string | null;
    description: string | null;
    routePattern: string | null;
    sortOrder: number | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type HostPageMaxAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    scope: string | null;
    label: string | null;
    description: string | null;
    routePattern: string | null;
    sortOrder: number | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type HostPageCountAggregateOutputType = {
    id: number;
    appClientId: number;
    scope: number;
    label: number;
    description: number;
    routePattern: number;
    sortOrder: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type HostPageAvgAggregateInputType = {
    id?: true;
    appClientId?: true;
    sortOrder?: true;
};
export type HostPageSumAggregateInputType = {
    id?: true;
    appClientId?: true;
    sortOrder?: true;
};
export type HostPageMinAggregateInputType = {
    id?: true;
    appClientId?: true;
    scope?: true;
    label?: true;
    description?: true;
    routePattern?: true;
    sortOrder?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type HostPageMaxAggregateInputType = {
    id?: true;
    appClientId?: true;
    scope?: true;
    label?: true;
    description?: true;
    routePattern?: true;
    sortOrder?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type HostPageCountAggregateInputType = {
    id?: true;
    appClientId?: true;
    scope?: true;
    label?: true;
    description?: true;
    routePattern?: true;
    sortOrder?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type HostPageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostPageWhereInput;
    orderBy?: Prisma.HostPageOrderByWithRelationInput | Prisma.HostPageOrderByWithRelationInput[];
    cursor?: Prisma.HostPageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | HostPageCountAggregateInputType;
    _avg?: HostPageAvgAggregateInputType;
    _sum?: HostPageSumAggregateInputType;
    _min?: HostPageMinAggregateInputType;
    _max?: HostPageMaxAggregateInputType;
};
export type GetHostPageAggregateType<T extends HostPageAggregateArgs> = {
    [P in keyof T & keyof AggregateHostPage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateHostPage[P]> : Prisma.GetScalarType<T[P], AggregateHostPage[P]>;
};
export type HostPageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostPageWhereInput;
    orderBy?: Prisma.HostPageOrderByWithAggregationInput | Prisma.HostPageOrderByWithAggregationInput[];
    by: Prisma.HostPageScalarFieldEnum[] | Prisma.HostPageScalarFieldEnum;
    having?: Prisma.HostPageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: HostPageCountAggregateInputType | true;
    _avg?: HostPageAvgAggregateInputType;
    _sum?: HostPageSumAggregateInputType;
    _min?: HostPageMinAggregateInputType;
    _max?: HostPageMaxAggregateInputType;
};
export type HostPageGroupByOutputType = {
    id: number;
    appClientId: number;
    scope: string;
    label: string;
    description: string | null;
    routePattern: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: HostPageCountAggregateOutputType | null;
    _avg: HostPageAvgAggregateOutputType | null;
    _sum: HostPageSumAggregateOutputType | null;
    _min: HostPageMinAggregateOutputType | null;
    _max: HostPageMaxAggregateOutputType | null;
};
export type GetHostPageGroupByPayload<T extends HostPageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<HostPageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof HostPageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], HostPageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], HostPageGroupByOutputType[P]>;
}>>;
export type HostPageWhereInput = {
    AND?: Prisma.HostPageWhereInput | Prisma.HostPageWhereInput[];
    OR?: Prisma.HostPageWhereInput[];
    NOT?: Prisma.HostPageWhereInput | Prisma.HostPageWhereInput[];
    id?: Prisma.IntFilter<"HostPage"> | number;
    appClientId?: Prisma.IntFilter<"HostPage"> | number;
    scope?: Prisma.StringFilter<"HostPage"> | string;
    label?: Prisma.StringFilter<"HostPage"> | string;
    description?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    routePattern?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    sortOrder?: Prisma.IntFilter<"HostPage"> | number;
    isActive?: Prisma.BoolFilter<"HostPage"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    hostTools?: Prisma.HostToolListRelationFilter;
};
export type HostPageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    scope?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    routePattern?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    hostTools?: Prisma.HostToolOrderByRelationAggregateInput;
};
export type HostPageWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    appClientId_scope?: Prisma.HostPageAppClientIdScopeCompoundUniqueInput;
    AND?: Prisma.HostPageWhereInput | Prisma.HostPageWhereInput[];
    OR?: Prisma.HostPageWhereInput[];
    NOT?: Prisma.HostPageWhereInput | Prisma.HostPageWhereInput[];
    appClientId?: Prisma.IntFilter<"HostPage"> | number;
    scope?: Prisma.StringFilter<"HostPage"> | string;
    label?: Prisma.StringFilter<"HostPage"> | string;
    description?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    routePattern?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    sortOrder?: Prisma.IntFilter<"HostPage"> | number;
    isActive?: Prisma.BoolFilter<"HostPage"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    hostTools?: Prisma.HostToolListRelationFilter;
}, "id" | "appClientId_scope">;
export type HostPageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    scope?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    routePattern?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.HostPageCountOrderByAggregateInput;
    _avg?: Prisma.HostPageAvgOrderByAggregateInput;
    _max?: Prisma.HostPageMaxOrderByAggregateInput;
    _min?: Prisma.HostPageMinOrderByAggregateInput;
    _sum?: Prisma.HostPageSumOrderByAggregateInput;
};
export type HostPageScalarWhereWithAggregatesInput = {
    AND?: Prisma.HostPageScalarWhereWithAggregatesInput | Prisma.HostPageScalarWhereWithAggregatesInput[];
    OR?: Prisma.HostPageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.HostPageScalarWhereWithAggregatesInput | Prisma.HostPageScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"HostPage"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"HostPage"> | number;
    scope?: Prisma.StringWithAggregatesFilter<"HostPage"> | string;
    label?: Prisma.StringWithAggregatesFilter<"HostPage"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"HostPage"> | string | null;
    routePattern?: Prisma.StringNullableWithAggregatesFilter<"HostPage"> | string | null;
    sortOrder?: Prisma.IntWithAggregatesFilter<"HostPage"> | number;
    isActive?: Prisma.BoolWithAggregatesFilter<"HostPage"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"HostPage"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"HostPage"> | Date | string;
};
export type HostPageCreateInput = {
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostPagesInput;
    hostTools?: Prisma.HostToolCreateNestedManyWithoutHostPageInput;
};
export type HostPageUncheckedCreateInput = {
    id?: number;
    appClientId: number;
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    hostTools?: Prisma.HostToolUncheckedCreateNestedManyWithoutHostPageInput;
};
export type HostPageUpdateInput = {
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostPagesNestedInput;
    hostTools?: Prisma.HostToolUpdateManyWithoutHostPageNestedInput;
};
export type HostPageUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTools?: Prisma.HostToolUncheckedUpdateManyWithoutHostPageNestedInput;
};
export type HostPageCreateManyInput = {
    id?: number;
    appClientId: number;
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostPageUpdateManyMutationInput = {
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostPageUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostPageListRelationFilter = {
    every?: Prisma.HostPageWhereInput;
    some?: Prisma.HostPageWhereInput;
    none?: Prisma.HostPageWhereInput;
};
export type HostPageOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type HostPageAppClientIdScopeCompoundUniqueInput = {
    appClientId: number;
    scope: string;
};
export type HostPageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    scope?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    routePattern?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostPageAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type HostPageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    scope?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    routePattern?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostPageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    scope?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    routePattern?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostPageSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type HostPageNullableScalarRelationFilter = {
    is?: Prisma.HostPageWhereInput | null;
    isNot?: Prisma.HostPageWhereInput | null;
};
export type HostPageCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput> | Prisma.HostPageCreateWithoutAppClientInput[] | Prisma.HostPageUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutAppClientInput | Prisma.HostPageCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.HostPageCreateManyAppClientInputEnvelope;
    connect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
};
export type HostPageUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput> | Prisma.HostPageCreateWithoutAppClientInput[] | Prisma.HostPageUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutAppClientInput | Prisma.HostPageCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.HostPageCreateManyAppClientInputEnvelope;
    connect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
};
export type HostPageUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput> | Prisma.HostPageCreateWithoutAppClientInput[] | Prisma.HostPageUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutAppClientInput | Prisma.HostPageCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.HostPageUpsertWithWhereUniqueWithoutAppClientInput | Prisma.HostPageUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.HostPageCreateManyAppClientInputEnvelope;
    set?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    disconnect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    delete?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    connect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    update?: Prisma.HostPageUpdateWithWhereUniqueWithoutAppClientInput | Prisma.HostPageUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.HostPageUpdateManyWithWhereWithoutAppClientInput | Prisma.HostPageUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.HostPageScalarWhereInput | Prisma.HostPageScalarWhereInput[];
};
export type HostPageUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput> | Prisma.HostPageCreateWithoutAppClientInput[] | Prisma.HostPageUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutAppClientInput | Prisma.HostPageCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.HostPageUpsertWithWhereUniqueWithoutAppClientInput | Prisma.HostPageUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.HostPageCreateManyAppClientInputEnvelope;
    set?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    disconnect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    delete?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    connect?: Prisma.HostPageWhereUniqueInput | Prisma.HostPageWhereUniqueInput[];
    update?: Prisma.HostPageUpdateWithWhereUniqueWithoutAppClientInput | Prisma.HostPageUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.HostPageUpdateManyWithWhereWithoutAppClientInput | Prisma.HostPageUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.HostPageScalarWhereInput | Prisma.HostPageScalarWhereInput[];
};
export type HostPageCreateNestedOneWithoutHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutHostToolsInput, Prisma.HostPageUncheckedCreateWithoutHostToolsInput>;
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutHostToolsInput;
    connect?: Prisma.HostPageWhereUniqueInput;
};
export type HostPageUpdateOneWithoutHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostPageCreateWithoutHostToolsInput, Prisma.HostPageUncheckedCreateWithoutHostToolsInput>;
    connectOrCreate?: Prisma.HostPageCreateOrConnectWithoutHostToolsInput;
    upsert?: Prisma.HostPageUpsertWithoutHostToolsInput;
    disconnect?: Prisma.HostPageWhereInput | boolean;
    delete?: Prisma.HostPageWhereInput | boolean;
    connect?: Prisma.HostPageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostPageUpdateToOneWithWhereWithoutHostToolsInput, Prisma.HostPageUpdateWithoutHostToolsInput>, Prisma.HostPageUncheckedUpdateWithoutHostToolsInput>;
};
export type HostPageCreateWithoutAppClientInput = {
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    hostTools?: Prisma.HostToolCreateNestedManyWithoutHostPageInput;
};
export type HostPageUncheckedCreateWithoutAppClientInput = {
    id?: number;
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    hostTools?: Prisma.HostToolUncheckedCreateNestedManyWithoutHostPageInput;
};
export type HostPageCreateOrConnectWithoutAppClientInput = {
    where: Prisma.HostPageWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput>;
};
export type HostPageCreateManyAppClientInputEnvelope = {
    data: Prisma.HostPageCreateManyAppClientInput | Prisma.HostPageCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type HostPageUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.HostPageWhereUniqueInput;
    update: Prisma.XOR<Prisma.HostPageUpdateWithoutAppClientInput, Prisma.HostPageUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.HostPageCreateWithoutAppClientInput, Prisma.HostPageUncheckedCreateWithoutAppClientInput>;
};
export type HostPageUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.HostPageWhereUniqueInput;
    data: Prisma.XOR<Prisma.HostPageUpdateWithoutAppClientInput, Prisma.HostPageUncheckedUpdateWithoutAppClientInput>;
};
export type HostPageUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.HostPageScalarWhereInput;
    data: Prisma.XOR<Prisma.HostPageUpdateManyMutationInput, Prisma.HostPageUncheckedUpdateManyWithoutAppClientInput>;
};
export type HostPageScalarWhereInput = {
    AND?: Prisma.HostPageScalarWhereInput | Prisma.HostPageScalarWhereInput[];
    OR?: Prisma.HostPageScalarWhereInput[];
    NOT?: Prisma.HostPageScalarWhereInput | Prisma.HostPageScalarWhereInput[];
    id?: Prisma.IntFilter<"HostPage"> | number;
    appClientId?: Prisma.IntFilter<"HostPage"> | number;
    scope?: Prisma.StringFilter<"HostPage"> | string;
    label?: Prisma.StringFilter<"HostPage"> | string;
    description?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    routePattern?: Prisma.StringNullableFilter<"HostPage"> | string | null;
    sortOrder?: Prisma.IntFilter<"HostPage"> | number;
    isActive?: Prisma.BoolFilter<"HostPage"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostPage"> | Date | string;
};
export type HostPageCreateWithoutHostToolsInput = {
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostPagesInput;
};
export type HostPageUncheckedCreateWithoutHostToolsInput = {
    id?: number;
    appClientId: number;
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostPageCreateOrConnectWithoutHostToolsInput = {
    where: Prisma.HostPageWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostPageCreateWithoutHostToolsInput, Prisma.HostPageUncheckedCreateWithoutHostToolsInput>;
};
export type HostPageUpsertWithoutHostToolsInput = {
    update: Prisma.XOR<Prisma.HostPageUpdateWithoutHostToolsInput, Prisma.HostPageUncheckedUpdateWithoutHostToolsInput>;
    create: Prisma.XOR<Prisma.HostPageCreateWithoutHostToolsInput, Prisma.HostPageUncheckedCreateWithoutHostToolsInput>;
    where?: Prisma.HostPageWhereInput;
};
export type HostPageUpdateToOneWithWhereWithoutHostToolsInput = {
    where?: Prisma.HostPageWhereInput;
    data: Prisma.XOR<Prisma.HostPageUpdateWithoutHostToolsInput, Prisma.HostPageUncheckedUpdateWithoutHostToolsInput>;
};
export type HostPageUpdateWithoutHostToolsInput = {
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostPagesNestedInput;
};
export type HostPageUncheckedUpdateWithoutHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostPageCreateManyAppClientInput = {
    id?: number;
    scope: string;
    label: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostPageUpdateWithoutAppClientInput = {
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTools?: Prisma.HostToolUpdateManyWithoutHostPageNestedInput;
};
export type HostPageUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTools?: Prisma.HostToolUncheckedUpdateManyWithoutHostPageNestedInput;
};
export type HostPageUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    scope?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    routePattern?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostPageCountOutputType = {
    hostTools: number;
};
export type HostPageCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    hostTools?: boolean | HostPageCountOutputTypeCountHostToolsArgs;
};
export type HostPageCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageCountOutputTypeSelect<ExtArgs> | null;
};
export type HostPageCountOutputTypeCountHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostToolWhereInput;
};
export type HostPageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    scope?: boolean;
    label?: boolean;
    description?: boolean;
    routePattern?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostTools?: boolean | Prisma.HostPage$hostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.HostPageCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["hostPage"]>;
export type HostPageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    scope?: boolean;
    label?: boolean;
    description?: boolean;
    routePattern?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["hostPage"]>;
export type HostPageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    scope?: boolean;
    label?: boolean;
    description?: boolean;
    routePattern?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["hostPage"]>;
export type HostPageSelectScalar = {
    id?: boolean;
    appClientId?: boolean;
    scope?: boolean;
    label?: boolean;
    description?: boolean;
    routePattern?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type HostPageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "appClientId" | "scope" | "label" | "description" | "routePattern" | "sortOrder" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["hostPage"]>;
export type HostPageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostTools?: boolean | Prisma.HostPage$hostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.HostPageCountOutputTypeDefaultArgs<ExtArgs>;
};
export type HostPageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type HostPageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type $HostPagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "HostPage";
    objects: {
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        hostTools: Prisma.$HostToolPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        appClientId: number;
        scope: string;
        label: string;
        description: string | null;
        routePattern: string | null;
        sortOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["hostPage"]>;
    composites: {};
};
export type HostPageGetPayload<S extends boolean | null | undefined | HostPageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$HostPagePayload, S>;
export type HostPageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<HostPageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: HostPageCountAggregateInputType | true;
};
export interface HostPageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['HostPage'];
        meta: {
            name: 'HostPage';
        };
    };
    findUnique<T extends HostPageFindUniqueArgs>(args: Prisma.SelectSubset<T, HostPageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends HostPageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, HostPageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends HostPageFindFirstArgs>(args?: Prisma.SelectSubset<T, HostPageFindFirstArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends HostPageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, HostPageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends HostPageFindManyArgs>(args?: Prisma.SelectSubset<T, HostPageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends HostPageCreateArgs>(args: Prisma.SelectSubset<T, HostPageCreateArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends HostPageCreateManyArgs>(args?: Prisma.SelectSubset<T, HostPageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends HostPageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, HostPageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends HostPageDeleteArgs>(args: Prisma.SelectSubset<T, HostPageDeleteArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends HostPageUpdateArgs>(args: Prisma.SelectSubset<T, HostPageUpdateArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends HostPageDeleteManyArgs>(args?: Prisma.SelectSubset<T, HostPageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends HostPageUpdateManyArgs>(args: Prisma.SelectSubset<T, HostPageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends HostPageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, HostPageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends HostPageUpsertArgs>(args: Prisma.SelectSubset<T, HostPageUpsertArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends HostPageCountArgs>(args?: Prisma.Subset<T, HostPageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], HostPageCountAggregateOutputType> : number>;
    aggregate<T extends HostPageAggregateArgs>(args: Prisma.Subset<T, HostPageAggregateArgs>): Prisma.PrismaPromise<GetHostPageAggregateType<T>>;
    groupBy<T extends HostPageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: HostPageGroupByArgs['orderBy'];
    } : {
        orderBy?: HostPageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, HostPageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHostPageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: HostPageFieldRefs;
}
export interface Prisma__HostPageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTools<T extends Prisma.HostPage$hostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostPage$hostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface HostPageFieldRefs {
    readonly id: Prisma.FieldRef<"HostPage", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"HostPage", 'Int'>;
    readonly scope: Prisma.FieldRef<"HostPage", 'String'>;
    readonly label: Prisma.FieldRef<"HostPage", 'String'>;
    readonly description: Prisma.FieldRef<"HostPage", 'String'>;
    readonly routePattern: Prisma.FieldRef<"HostPage", 'String'>;
    readonly sortOrder: Prisma.FieldRef<"HostPage", 'Int'>;
    readonly isActive: Prisma.FieldRef<"HostPage", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"HostPage", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"HostPage", 'DateTime'>;
}
export type HostPageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where: Prisma.HostPageWhereUniqueInput;
};
export type HostPageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where: Prisma.HostPageWhereUniqueInput;
};
export type HostPageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where?: Prisma.HostPageWhereInput;
    orderBy?: Prisma.HostPageOrderByWithRelationInput | Prisma.HostPageOrderByWithRelationInput[];
    cursor?: Prisma.HostPageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostPageScalarFieldEnum | Prisma.HostPageScalarFieldEnum[];
};
export type HostPageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where?: Prisma.HostPageWhereInput;
    orderBy?: Prisma.HostPageOrderByWithRelationInput | Prisma.HostPageOrderByWithRelationInput[];
    cursor?: Prisma.HostPageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostPageScalarFieldEnum | Prisma.HostPageScalarFieldEnum[];
};
export type HostPageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where?: Prisma.HostPageWhereInput;
    orderBy?: Prisma.HostPageOrderByWithRelationInput | Prisma.HostPageOrderByWithRelationInput[];
    cursor?: Prisma.HostPageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostPageScalarFieldEnum | Prisma.HostPageScalarFieldEnum[];
};
export type HostPageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostPageCreateInput, Prisma.HostPageUncheckedCreateInput>;
};
export type HostPageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.HostPageCreateManyInput | Prisma.HostPageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type HostPageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    data: Prisma.HostPageCreateManyInput | Prisma.HostPageCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.HostPageIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type HostPageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostPageUpdateInput, Prisma.HostPageUncheckedUpdateInput>;
    where: Prisma.HostPageWhereUniqueInput;
};
export type HostPageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.HostPageUpdateManyMutationInput, Prisma.HostPageUncheckedUpdateManyInput>;
    where?: Prisma.HostPageWhereInput;
    limit?: number;
};
export type HostPageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostPageUpdateManyMutationInput, Prisma.HostPageUncheckedUpdateManyInput>;
    where?: Prisma.HostPageWhereInput;
    limit?: number;
    include?: Prisma.HostPageIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type HostPageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where: Prisma.HostPageWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostPageCreateInput, Prisma.HostPageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.HostPageUpdateInput, Prisma.HostPageUncheckedUpdateInput>;
};
export type HostPageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where: Prisma.HostPageWhereUniqueInput;
};
export type HostPageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostPageWhereInput;
    limit?: number;
};
export type HostPage$hostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithRelationInput | Prisma.HostToolOrderByWithRelationInput[];
    cursor?: Prisma.HostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostToolScalarFieldEnum | Prisma.HostToolScalarFieldEnum[];
};
export type HostPageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
};
