import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type RoleHostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$RoleHostToolPayload>;
export type AggregateRoleHostTool = {
    _count: RoleHostToolCountAggregateOutputType | null;
    _avg: RoleHostToolAvgAggregateOutputType | null;
    _sum: RoleHostToolSumAggregateOutputType | null;
    _min: RoleHostToolMinAggregateOutputType | null;
    _max: RoleHostToolMaxAggregateOutputType | null;
};
export type RoleHostToolAvgAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    hostToolId: number | null;
};
export type RoleHostToolSumAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    hostToolId: number | null;
};
export type RoleHostToolMinAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    hostToolId: number | null;
    createdAt: Date | null;
};
export type RoleHostToolMaxAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    hostToolId: number | null;
    createdAt: Date | null;
};
export type RoleHostToolCountAggregateOutputType = {
    id: number;
    roleId: number;
    hostToolId: number;
    createdAt: number;
    _all: number;
};
export type RoleHostToolAvgAggregateInputType = {
    id?: true;
    roleId?: true;
    hostToolId?: true;
};
export type RoleHostToolSumAggregateInputType = {
    id?: true;
    roleId?: true;
    hostToolId?: true;
};
export type RoleHostToolMinAggregateInputType = {
    id?: true;
    roleId?: true;
    hostToolId?: true;
    createdAt?: true;
};
export type RoleHostToolMaxAggregateInputType = {
    id?: true;
    roleId?: true;
    hostToolId?: true;
    createdAt?: true;
};
export type RoleHostToolCountAggregateInputType = {
    id?: true;
    roleId?: true;
    hostToolId?: true;
    createdAt?: true;
    _all?: true;
};
export type RoleHostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleHostToolWhereInput;
    orderBy?: Prisma.RoleHostToolOrderByWithRelationInput | Prisma.RoleHostToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoleHostToolCountAggregateInputType;
    _avg?: RoleHostToolAvgAggregateInputType;
    _sum?: RoleHostToolSumAggregateInputType;
    _min?: RoleHostToolMinAggregateInputType;
    _max?: RoleHostToolMaxAggregateInputType;
};
export type GetRoleHostToolAggregateType<T extends RoleHostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateRoleHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRoleHostTool[P]> : Prisma.GetScalarType<T[P], AggregateRoleHostTool[P]>;
};
export type RoleHostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleHostToolWhereInput;
    orderBy?: Prisma.RoleHostToolOrderByWithAggregationInput | Prisma.RoleHostToolOrderByWithAggregationInput[];
    by: Prisma.RoleHostToolScalarFieldEnum[] | Prisma.RoleHostToolScalarFieldEnum;
    having?: Prisma.RoleHostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoleHostToolCountAggregateInputType | true;
    _avg?: RoleHostToolAvgAggregateInputType;
    _sum?: RoleHostToolSumAggregateInputType;
    _min?: RoleHostToolMinAggregateInputType;
    _max?: RoleHostToolMaxAggregateInputType;
};
export type RoleHostToolGroupByOutputType = {
    id: number;
    roleId: number;
    hostToolId: number;
    createdAt: Date;
    _count: RoleHostToolCountAggregateOutputType | null;
    _avg: RoleHostToolAvgAggregateOutputType | null;
    _sum: RoleHostToolSumAggregateOutputType | null;
    _min: RoleHostToolMinAggregateOutputType | null;
    _max: RoleHostToolMaxAggregateOutputType | null;
};
export type GetRoleHostToolGroupByPayload<T extends RoleHostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoleHostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoleHostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoleHostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoleHostToolGroupByOutputType[P]>;
}>>;
export type RoleHostToolWhereInput = {
    AND?: Prisma.RoleHostToolWhereInput | Prisma.RoleHostToolWhereInput[];
    OR?: Prisma.RoleHostToolWhereInput[];
    NOT?: Prisma.RoleHostToolWhereInput | Prisma.RoleHostToolWhereInput[];
    id?: Prisma.IntFilter<"RoleHostTool"> | number;
    roleId?: Prisma.IntFilter<"RoleHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"RoleHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleHostTool"> | Date | string;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
};
export type RoleHostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    role?: Prisma.RoleOrderByWithRelationInput;
    hostTool?: Prisma.HostToolOrderByWithRelationInput;
};
export type RoleHostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    roleId_hostToolId?: Prisma.RoleHostToolRoleIdHostToolIdCompoundUniqueInput;
    AND?: Prisma.RoleHostToolWhereInput | Prisma.RoleHostToolWhereInput[];
    OR?: Prisma.RoleHostToolWhereInput[];
    NOT?: Prisma.RoleHostToolWhereInput | Prisma.RoleHostToolWhereInput[];
    roleId?: Prisma.IntFilter<"RoleHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"RoleHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleHostTool"> | Date | string;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    hostTool?: Prisma.XOR<Prisma.HostToolScalarRelationFilter, Prisma.HostToolWhereInput>;
}, "id" | "roleId_hostToolId">;
export type RoleHostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.RoleHostToolCountOrderByAggregateInput;
    _avg?: Prisma.RoleHostToolAvgOrderByAggregateInput;
    _max?: Prisma.RoleHostToolMaxOrderByAggregateInput;
    _min?: Prisma.RoleHostToolMinOrderByAggregateInput;
    _sum?: Prisma.RoleHostToolSumOrderByAggregateInput;
};
export type RoleHostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoleHostToolScalarWhereWithAggregatesInput | Prisma.RoleHostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoleHostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoleHostToolScalarWhereWithAggregatesInput | Prisma.RoleHostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"RoleHostTool"> | number;
    roleId?: Prisma.IntWithAggregatesFilter<"RoleHostTool"> | number;
    hostToolId?: Prisma.IntWithAggregatesFilter<"RoleHostTool"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"RoleHostTool"> | Date | string;
};
export type RoleHostToolCreateInput = {
    createdAt?: Date | string;
    role: Prisma.RoleCreateNestedOneWithoutRoleHostToolsInput;
    hostTool: Prisma.HostToolCreateNestedOneWithoutRoleHostToolsInput;
};
export type RoleHostToolUncheckedCreateInput = {
    id?: number;
    roleId: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type RoleHostToolUpdateInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleHostToolsNestedInput;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutRoleHostToolsNestedInput;
};
export type RoleHostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolCreateManyInput = {
    id?: number;
    roleId: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type RoleHostToolUpdateManyMutationInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolListRelationFilter = {
    every?: Prisma.RoleHostToolWhereInput;
    some?: Prisma.RoleHostToolWhereInput;
    none?: Prisma.RoleHostToolWhereInput;
};
export type RoleHostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RoleHostToolRoleIdHostToolIdCompoundUniqueInput = {
    roleId: number;
    hostToolId: number;
};
export type RoleHostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleHostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type RoleHostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleHostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleHostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    hostToolId?: Prisma.SortOrder;
};
export type RoleHostToolCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput> | Prisma.RoleHostToolCreateWithoutRoleInput[] | Prisma.RoleHostToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutRoleInput | Prisma.RoleHostToolCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleHostToolCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
};
export type RoleHostToolUncheckedCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput> | Prisma.RoleHostToolCreateWithoutRoleInput[] | Prisma.RoleHostToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutRoleInput | Prisma.RoleHostToolCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleHostToolCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
};
export type RoleHostToolUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput> | Prisma.RoleHostToolCreateWithoutRoleInput[] | Prisma.RoleHostToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutRoleInput | Prisma.RoleHostToolCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleHostToolUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleHostToolUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleHostToolCreateManyRoleInputEnvelope;
    set?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    disconnect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    delete?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    update?: Prisma.RoleHostToolUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleHostToolUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleHostToolUpdateManyWithWhereWithoutRoleInput | Prisma.RoleHostToolUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
};
export type RoleHostToolUncheckedUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput> | Prisma.RoleHostToolCreateWithoutRoleInput[] | Prisma.RoleHostToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutRoleInput | Prisma.RoleHostToolCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleHostToolUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleHostToolUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleHostToolCreateManyRoleInputEnvelope;
    set?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    disconnect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    delete?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    update?: Prisma.RoleHostToolUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleHostToolUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleHostToolUpdateManyWithWhereWithoutRoleInput | Prisma.RoleHostToolUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
};
export type RoleHostToolCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput> | Prisma.RoleHostToolCreateWithoutHostToolInput[] | Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput | Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.RoleHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
};
export type RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput> | Prisma.RoleHostToolCreateWithoutHostToolInput[] | Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput | Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput[];
    createMany?: Prisma.RoleHostToolCreateManyHostToolInputEnvelope;
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
};
export type RoleHostToolUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput> | Prisma.RoleHostToolCreateWithoutHostToolInput[] | Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput | Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.RoleHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.RoleHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.RoleHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    disconnect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    delete?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    update?: Prisma.RoleHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.RoleHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.RoleHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.RoleHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
};
export type RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput = {
    create?: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput> | Prisma.RoleHostToolCreateWithoutHostToolInput[] | Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput[];
    connectOrCreate?: Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput | Prisma.RoleHostToolCreateOrConnectWithoutHostToolInput[];
    upsert?: Prisma.RoleHostToolUpsertWithWhereUniqueWithoutHostToolInput | Prisma.RoleHostToolUpsertWithWhereUniqueWithoutHostToolInput[];
    createMany?: Prisma.RoleHostToolCreateManyHostToolInputEnvelope;
    set?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    disconnect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    delete?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    connect?: Prisma.RoleHostToolWhereUniqueInput | Prisma.RoleHostToolWhereUniqueInput[];
    update?: Prisma.RoleHostToolUpdateWithWhereUniqueWithoutHostToolInput | Prisma.RoleHostToolUpdateWithWhereUniqueWithoutHostToolInput[];
    updateMany?: Prisma.RoleHostToolUpdateManyWithWhereWithoutHostToolInput | Prisma.RoleHostToolUpdateManyWithWhereWithoutHostToolInput[];
    deleteMany?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
};
export type RoleHostToolCreateWithoutRoleInput = {
    createdAt?: Date | string;
    hostTool: Prisma.HostToolCreateNestedOneWithoutRoleHostToolsInput;
};
export type RoleHostToolUncheckedCreateWithoutRoleInput = {
    id?: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type RoleHostToolCreateOrConnectWithoutRoleInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput>;
};
export type RoleHostToolCreateManyRoleInputEnvelope = {
    data: Prisma.RoleHostToolCreateManyRoleInput | Prisma.RoleHostToolCreateManyRoleInput[];
    skipDuplicates?: boolean;
};
export type RoleHostToolUpsertWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleHostToolUpdateWithoutRoleInput, Prisma.RoleHostToolUncheckedUpdateWithoutRoleInput>;
    create: Prisma.XOR<Prisma.RoleHostToolCreateWithoutRoleInput, Prisma.RoleHostToolUncheckedCreateWithoutRoleInput>;
};
export type RoleHostToolUpdateWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateWithoutRoleInput, Prisma.RoleHostToolUncheckedUpdateWithoutRoleInput>;
};
export type RoleHostToolUpdateManyWithWhereWithoutRoleInput = {
    where: Prisma.RoleHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateManyMutationInput, Prisma.RoleHostToolUncheckedUpdateManyWithoutRoleInput>;
};
export type RoleHostToolScalarWhereInput = {
    AND?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
    OR?: Prisma.RoleHostToolScalarWhereInput[];
    NOT?: Prisma.RoleHostToolScalarWhereInput | Prisma.RoleHostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"RoleHostTool"> | number;
    roleId?: Prisma.IntFilter<"RoleHostTool"> | number;
    hostToolId?: Prisma.IntFilter<"RoleHostTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleHostTool"> | Date | string;
};
export type RoleHostToolCreateWithoutHostToolInput = {
    createdAt?: Date | string;
    role: Prisma.RoleCreateNestedOneWithoutRoleHostToolsInput;
};
export type RoleHostToolUncheckedCreateWithoutHostToolInput = {
    id?: number;
    roleId: number;
    createdAt?: Date | string;
};
export type RoleHostToolCreateOrConnectWithoutHostToolInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput>;
};
export type RoleHostToolCreateManyHostToolInputEnvelope = {
    data: Prisma.RoleHostToolCreateManyHostToolInput | Prisma.RoleHostToolCreateManyHostToolInput[];
    skipDuplicates?: boolean;
};
export type RoleHostToolUpsertWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleHostToolUpdateWithoutHostToolInput, Prisma.RoleHostToolUncheckedUpdateWithoutHostToolInput>;
    create: Prisma.XOR<Prisma.RoleHostToolCreateWithoutHostToolInput, Prisma.RoleHostToolUncheckedCreateWithoutHostToolInput>;
};
export type RoleHostToolUpdateWithWhereUniqueWithoutHostToolInput = {
    where: Prisma.RoleHostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateWithoutHostToolInput, Prisma.RoleHostToolUncheckedUpdateWithoutHostToolInput>;
};
export type RoleHostToolUpdateManyWithWhereWithoutHostToolInput = {
    where: Prisma.RoleHostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateManyMutationInput, Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolInput>;
};
export type RoleHostToolCreateManyRoleInput = {
    id?: number;
    hostToolId: number;
    createdAt?: Date | string;
};
export type RoleHostToolUpdateWithoutRoleInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostTool?: Prisma.HostToolUpdateOneRequiredWithoutRoleHostToolsNestedInput;
};
export type RoleHostToolUncheckedUpdateWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolUncheckedUpdateManyWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostToolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolCreateManyHostToolInput = {
    id?: number;
    roleId: number;
    createdAt?: Date | string;
};
export type RoleHostToolUpdateWithoutHostToolInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleHostToolsNestedInput;
};
export type RoleHostToolUncheckedUpdateWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolUncheckedUpdateManyWithoutHostToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleHostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleHostTool"]>;
export type RoleHostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleHostTool"]>;
export type RoleHostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleHostTool"]>;
export type RoleHostToolSelectScalar = {
    id?: boolean;
    roleId?: boolean;
    hostToolId?: boolean;
    createdAt?: boolean;
};
export type RoleHostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "roleId" | "hostToolId" | "createdAt", ExtArgs["result"]["roleHostTool"]>;
export type RoleHostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type RoleHostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type RoleHostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    hostTool?: boolean | Prisma.HostToolDefaultArgs<ExtArgs>;
};
export type $RoleHostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RoleHostTool";
    objects: {
        role: Prisma.$RolePayload<ExtArgs>;
        hostTool: Prisma.$HostToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        roleId: number;
        hostToolId: number;
        createdAt: Date;
    }, ExtArgs["result"]["roleHostTool"]>;
    composites: {};
};
export type RoleHostToolGetPayload<S extends boolean | null | undefined | RoleHostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload, S>;
export type RoleHostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoleHostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoleHostToolCountAggregateInputType | true;
};
export interface RoleHostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RoleHostTool'];
        meta: {
            name: 'RoleHostTool';
        };
    };
    findUnique<T extends RoleHostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, RoleHostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoleHostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoleHostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoleHostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, RoleHostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoleHostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoleHostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoleHostToolFindManyArgs>(args?: Prisma.SelectSubset<T, RoleHostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoleHostToolCreateArgs>(args: Prisma.SelectSubset<T, RoleHostToolCreateArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoleHostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, RoleHostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoleHostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoleHostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoleHostToolDeleteArgs>(args: Prisma.SelectSubset<T, RoleHostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoleHostToolUpdateArgs>(args: Prisma.SelectSubset<T, RoleHostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoleHostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoleHostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoleHostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, RoleHostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoleHostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoleHostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoleHostToolUpsertArgs>(args: Prisma.SelectSubset<T, RoleHostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__RoleHostToolClient<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoleHostToolCountArgs>(args?: Prisma.Subset<T, RoleHostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoleHostToolCountAggregateOutputType> : number>;
    aggregate<T extends RoleHostToolAggregateArgs>(args: Prisma.Subset<T, RoleHostToolAggregateArgs>): Prisma.PrismaPromise<GetRoleHostToolAggregateType<T>>;
    groupBy<T extends RoleHostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoleHostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: RoleHostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoleHostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoleHostToolFieldRefs;
}
export interface Prisma__RoleHostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    role<T extends Prisma.RoleDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoleDefaultArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostTool<T extends Prisma.HostToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostToolDefaultArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoleHostToolFieldRefs {
    readonly id: Prisma.FieldRef<"RoleHostTool", 'Int'>;
    readonly roleId: Prisma.FieldRef<"RoleHostTool", 'Int'>;
    readonly hostToolId: Prisma.FieldRef<"RoleHostTool", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"RoleHostTool", 'DateTime'>;
}
export type RoleHostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where: Prisma.RoleHostToolWhereUniqueInput;
};
export type RoleHostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where: Prisma.RoleHostToolWhereUniqueInput;
};
export type RoleHostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where?: Prisma.RoleHostToolWhereInput;
    orderBy?: Prisma.RoleHostToolOrderByWithRelationInput | Prisma.RoleHostToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleHostToolScalarFieldEnum | Prisma.RoleHostToolScalarFieldEnum[];
};
export type RoleHostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where?: Prisma.RoleHostToolWhereInput;
    orderBy?: Prisma.RoleHostToolOrderByWithRelationInput | Prisma.RoleHostToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleHostToolScalarFieldEnum | Prisma.RoleHostToolScalarFieldEnum[];
};
export type RoleHostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where?: Prisma.RoleHostToolWhereInput;
    orderBy?: Prisma.RoleHostToolOrderByWithRelationInput | Prisma.RoleHostToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleHostToolScalarFieldEnum | Prisma.RoleHostToolScalarFieldEnum[];
};
export type RoleHostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleHostToolCreateInput, Prisma.RoleHostToolUncheckedCreateInput>;
};
export type RoleHostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoleHostToolCreateManyInput | Prisma.RoleHostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoleHostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    data: Prisma.RoleHostToolCreateManyInput | Prisma.RoleHostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RoleHostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RoleHostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateInput, Prisma.RoleHostToolUncheckedUpdateInput>;
    where: Prisma.RoleHostToolWhereUniqueInput;
};
export type RoleHostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoleHostToolUpdateManyMutationInput, Prisma.RoleHostToolUncheckedUpdateManyInput>;
    where?: Prisma.RoleHostToolWhereInput;
    limit?: number;
};
export type RoleHostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleHostToolUpdateManyMutationInput, Prisma.RoleHostToolUncheckedUpdateManyInput>;
    where?: Prisma.RoleHostToolWhereInput;
    limit?: number;
    include?: Prisma.RoleHostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RoleHostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where: Prisma.RoleHostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleHostToolCreateInput, Prisma.RoleHostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoleHostToolUpdateInput, Prisma.RoleHostToolUncheckedUpdateInput>;
};
export type RoleHostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
    where: Prisma.RoleHostToolWhereUniqueInput;
};
export type RoleHostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleHostToolWhereInput;
    limit?: number;
};
export type RoleHostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleHostToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleHostToolOmit<ExtArgs> | null;
    include?: Prisma.RoleHostToolInclude<ExtArgs> | null;
};
