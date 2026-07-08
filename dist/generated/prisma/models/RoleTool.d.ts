import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type RoleToolModel = runtime.Types.Result.DefaultSelection<Prisma.$RoleToolPayload>;
export type AggregateRoleTool = {
    _count: RoleToolCountAggregateOutputType | null;
    _avg: RoleToolAvgAggregateOutputType | null;
    _sum: RoleToolSumAggregateOutputType | null;
    _min: RoleToolMinAggregateOutputType | null;
    _max: RoleToolMaxAggregateOutputType | null;
};
export type RoleToolAvgAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    toolId: number | null;
};
export type RoleToolSumAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    toolId: number | null;
};
export type RoleToolMinAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    toolId: number | null;
    createdAt: Date | null;
};
export type RoleToolMaxAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    toolId: number | null;
    createdAt: Date | null;
};
export type RoleToolCountAggregateOutputType = {
    id: number;
    roleId: number;
    toolId: number;
    createdAt: number;
    _all: number;
};
export type RoleToolAvgAggregateInputType = {
    id?: true;
    roleId?: true;
    toolId?: true;
};
export type RoleToolSumAggregateInputType = {
    id?: true;
    roleId?: true;
    toolId?: true;
};
export type RoleToolMinAggregateInputType = {
    id?: true;
    roleId?: true;
    toolId?: true;
    createdAt?: true;
};
export type RoleToolMaxAggregateInputType = {
    id?: true;
    roleId?: true;
    toolId?: true;
    createdAt?: true;
};
export type RoleToolCountAggregateInputType = {
    id?: true;
    roleId?: true;
    toolId?: true;
    createdAt?: true;
    _all?: true;
};
export type RoleToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleToolWhereInput;
    orderBy?: Prisma.RoleToolOrderByWithRelationInput | Prisma.RoleToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoleToolCountAggregateInputType;
    _avg?: RoleToolAvgAggregateInputType;
    _sum?: RoleToolSumAggregateInputType;
    _min?: RoleToolMinAggregateInputType;
    _max?: RoleToolMaxAggregateInputType;
};
export type GetRoleToolAggregateType<T extends RoleToolAggregateArgs> = {
    [P in keyof T & keyof AggregateRoleTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRoleTool[P]> : Prisma.GetScalarType<T[P], AggregateRoleTool[P]>;
};
export type RoleToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleToolWhereInput;
    orderBy?: Prisma.RoleToolOrderByWithAggregationInput | Prisma.RoleToolOrderByWithAggregationInput[];
    by: Prisma.RoleToolScalarFieldEnum[] | Prisma.RoleToolScalarFieldEnum;
    having?: Prisma.RoleToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoleToolCountAggregateInputType | true;
    _avg?: RoleToolAvgAggregateInputType;
    _sum?: RoleToolSumAggregateInputType;
    _min?: RoleToolMinAggregateInputType;
    _max?: RoleToolMaxAggregateInputType;
};
export type RoleToolGroupByOutputType = {
    id: number;
    roleId: number;
    toolId: number;
    createdAt: Date;
    _count: RoleToolCountAggregateOutputType | null;
    _avg: RoleToolAvgAggregateOutputType | null;
    _sum: RoleToolSumAggregateOutputType | null;
    _min: RoleToolMinAggregateOutputType | null;
    _max: RoleToolMaxAggregateOutputType | null;
};
export type GetRoleToolGroupByPayload<T extends RoleToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoleToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoleToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoleToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoleToolGroupByOutputType[P]>;
}>>;
export type RoleToolWhereInput = {
    AND?: Prisma.RoleToolWhereInput | Prisma.RoleToolWhereInput[];
    OR?: Prisma.RoleToolWhereInput[];
    NOT?: Prisma.RoleToolWhereInput | Prisma.RoleToolWhereInput[];
    id?: Prisma.IntFilter<"RoleTool"> | number;
    roleId?: Prisma.IntFilter<"RoleTool"> | number;
    toolId?: Prisma.IntFilter<"RoleTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleTool"> | Date | string;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
};
export type RoleToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    role?: Prisma.RoleOrderByWithRelationInput;
    tool?: Prisma.ToolOrderByWithRelationInput;
};
export type RoleToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    roleId_toolId?: Prisma.RoleToolRoleIdToolIdCompoundUniqueInput;
    AND?: Prisma.RoleToolWhereInput | Prisma.RoleToolWhereInput[];
    OR?: Prisma.RoleToolWhereInput[];
    NOT?: Prisma.RoleToolWhereInput | Prisma.RoleToolWhereInput[];
    roleId?: Prisma.IntFilter<"RoleTool"> | number;
    toolId?: Prisma.IntFilter<"RoleTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleTool"> | Date | string;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    tool?: Prisma.XOR<Prisma.ToolScalarRelationFilter, Prisma.ToolWhereInput>;
}, "id" | "roleId_toolId">;
export type RoleToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.RoleToolCountOrderByAggregateInput;
    _avg?: Prisma.RoleToolAvgOrderByAggregateInput;
    _max?: Prisma.RoleToolMaxOrderByAggregateInput;
    _min?: Prisma.RoleToolMinOrderByAggregateInput;
    _sum?: Prisma.RoleToolSumOrderByAggregateInput;
};
export type RoleToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoleToolScalarWhereWithAggregatesInput | Prisma.RoleToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoleToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoleToolScalarWhereWithAggregatesInput | Prisma.RoleToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"RoleTool"> | number;
    roleId?: Prisma.IntWithAggregatesFilter<"RoleTool"> | number;
    toolId?: Prisma.IntWithAggregatesFilter<"RoleTool"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"RoleTool"> | Date | string;
};
export type RoleToolCreateInput = {
    createdAt?: Date | string;
    role: Prisma.RoleCreateNestedOneWithoutRoleToolsInput;
    tool: Prisma.ToolCreateNestedOneWithoutRoleToolsInput;
};
export type RoleToolUncheckedCreateInput = {
    id?: number;
    roleId: number;
    toolId: number;
    createdAt?: Date | string;
};
export type RoleToolUpdateInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleToolsNestedInput;
    tool?: Prisma.ToolUpdateOneRequiredWithoutRoleToolsNestedInput;
};
export type RoleToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolCreateManyInput = {
    id?: number;
    roleId: number;
    toolId: number;
    createdAt?: Date | string;
};
export type RoleToolUpdateManyMutationInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolListRelationFilter = {
    every?: Prisma.RoleToolWhereInput;
    some?: Prisma.RoleToolWhereInput;
    none?: Prisma.RoleToolWhereInput;
};
export type RoleToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RoleToolRoleIdToolIdCompoundUniqueInput = {
    roleId: number;
    toolId: number;
};
export type RoleToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type RoleToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    toolId?: Prisma.SortOrder;
};
export type RoleToolCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput> | Prisma.RoleToolCreateWithoutRoleInput[] | Prisma.RoleToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutRoleInput | Prisma.RoleToolCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleToolCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
};
export type RoleToolUncheckedCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput> | Prisma.RoleToolCreateWithoutRoleInput[] | Prisma.RoleToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutRoleInput | Prisma.RoleToolCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleToolCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
};
export type RoleToolUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput> | Prisma.RoleToolCreateWithoutRoleInput[] | Prisma.RoleToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutRoleInput | Prisma.RoleToolCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleToolUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleToolUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleToolCreateManyRoleInputEnvelope;
    set?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    disconnect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    delete?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    update?: Prisma.RoleToolUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleToolUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleToolUpdateManyWithWhereWithoutRoleInput | Prisma.RoleToolUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
};
export type RoleToolUncheckedUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput> | Prisma.RoleToolCreateWithoutRoleInput[] | Prisma.RoleToolUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutRoleInput | Prisma.RoleToolCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleToolUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleToolUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleToolCreateManyRoleInputEnvelope;
    set?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    disconnect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    delete?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    update?: Prisma.RoleToolUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleToolUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleToolUpdateManyWithWhereWithoutRoleInput | Prisma.RoleToolUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
};
export type RoleToolCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput> | Prisma.RoleToolCreateWithoutToolInput[] | Prisma.RoleToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutToolInput | Prisma.RoleToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.RoleToolCreateManyToolInputEnvelope;
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
};
export type RoleToolUncheckedCreateNestedManyWithoutToolInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput> | Prisma.RoleToolCreateWithoutToolInput[] | Prisma.RoleToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutToolInput | Prisma.RoleToolCreateOrConnectWithoutToolInput[];
    createMany?: Prisma.RoleToolCreateManyToolInputEnvelope;
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
};
export type RoleToolUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput> | Prisma.RoleToolCreateWithoutToolInput[] | Prisma.RoleToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutToolInput | Prisma.RoleToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.RoleToolUpsertWithWhereUniqueWithoutToolInput | Prisma.RoleToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.RoleToolCreateManyToolInputEnvelope;
    set?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    disconnect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    delete?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    update?: Prisma.RoleToolUpdateWithWhereUniqueWithoutToolInput | Prisma.RoleToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.RoleToolUpdateManyWithWhereWithoutToolInput | Prisma.RoleToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
};
export type RoleToolUncheckedUpdateManyWithoutToolNestedInput = {
    create?: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput> | Prisma.RoleToolCreateWithoutToolInput[] | Prisma.RoleToolUncheckedCreateWithoutToolInput[];
    connectOrCreate?: Prisma.RoleToolCreateOrConnectWithoutToolInput | Prisma.RoleToolCreateOrConnectWithoutToolInput[];
    upsert?: Prisma.RoleToolUpsertWithWhereUniqueWithoutToolInput | Prisma.RoleToolUpsertWithWhereUniqueWithoutToolInput[];
    createMany?: Prisma.RoleToolCreateManyToolInputEnvelope;
    set?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    disconnect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    delete?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    connect?: Prisma.RoleToolWhereUniqueInput | Prisma.RoleToolWhereUniqueInput[];
    update?: Prisma.RoleToolUpdateWithWhereUniqueWithoutToolInput | Prisma.RoleToolUpdateWithWhereUniqueWithoutToolInput[];
    updateMany?: Prisma.RoleToolUpdateManyWithWhereWithoutToolInput | Prisma.RoleToolUpdateManyWithWhereWithoutToolInput[];
    deleteMany?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
};
export type RoleToolCreateWithoutRoleInput = {
    createdAt?: Date | string;
    tool: Prisma.ToolCreateNestedOneWithoutRoleToolsInput;
};
export type RoleToolUncheckedCreateWithoutRoleInput = {
    id?: number;
    toolId: number;
    createdAt?: Date | string;
};
export type RoleToolCreateOrConnectWithoutRoleInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput>;
};
export type RoleToolCreateManyRoleInputEnvelope = {
    data: Prisma.RoleToolCreateManyRoleInput | Prisma.RoleToolCreateManyRoleInput[];
    skipDuplicates?: boolean;
};
export type RoleToolUpsertWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleToolUpdateWithoutRoleInput, Prisma.RoleToolUncheckedUpdateWithoutRoleInput>;
    create: Prisma.XOR<Prisma.RoleToolCreateWithoutRoleInput, Prisma.RoleToolUncheckedCreateWithoutRoleInput>;
};
export type RoleToolUpdateWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleToolUpdateWithoutRoleInput, Prisma.RoleToolUncheckedUpdateWithoutRoleInput>;
};
export type RoleToolUpdateManyWithWhereWithoutRoleInput = {
    where: Prisma.RoleToolScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleToolUpdateManyMutationInput, Prisma.RoleToolUncheckedUpdateManyWithoutRoleInput>;
};
export type RoleToolScalarWhereInput = {
    AND?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
    OR?: Prisma.RoleToolScalarWhereInput[];
    NOT?: Prisma.RoleToolScalarWhereInput | Prisma.RoleToolScalarWhereInput[];
    id?: Prisma.IntFilter<"RoleTool"> | number;
    roleId?: Prisma.IntFilter<"RoleTool"> | number;
    toolId?: Prisma.IntFilter<"RoleTool"> | number;
    createdAt?: Prisma.DateTimeFilter<"RoleTool"> | Date | string;
};
export type RoleToolCreateWithoutToolInput = {
    createdAt?: Date | string;
    role: Prisma.RoleCreateNestedOneWithoutRoleToolsInput;
};
export type RoleToolUncheckedCreateWithoutToolInput = {
    id?: number;
    roleId: number;
    createdAt?: Date | string;
};
export type RoleToolCreateOrConnectWithoutToolInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput>;
};
export type RoleToolCreateManyToolInputEnvelope = {
    data: Prisma.RoleToolCreateManyToolInput | Prisma.RoleToolCreateManyToolInput[];
    skipDuplicates?: boolean;
};
export type RoleToolUpsertWithWhereUniqueWithoutToolInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleToolUpdateWithoutToolInput, Prisma.RoleToolUncheckedUpdateWithoutToolInput>;
    create: Prisma.XOR<Prisma.RoleToolCreateWithoutToolInput, Prisma.RoleToolUncheckedCreateWithoutToolInput>;
};
export type RoleToolUpdateWithWhereUniqueWithoutToolInput = {
    where: Prisma.RoleToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleToolUpdateWithoutToolInput, Prisma.RoleToolUncheckedUpdateWithoutToolInput>;
};
export type RoleToolUpdateManyWithWhereWithoutToolInput = {
    where: Prisma.RoleToolScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleToolUpdateManyMutationInput, Prisma.RoleToolUncheckedUpdateManyWithoutToolInput>;
};
export type RoleToolCreateManyRoleInput = {
    id?: number;
    toolId: number;
    createdAt?: Date | string;
};
export type RoleToolUpdateWithoutRoleInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tool?: Prisma.ToolUpdateOneRequiredWithoutRoleToolsNestedInput;
};
export type RoleToolUncheckedUpdateWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolUncheckedUpdateManyWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    toolId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolCreateManyToolInput = {
    id?: number;
    roleId: number;
    createdAt?: Date | string;
};
export type RoleToolUpdateWithoutToolInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleToolsNestedInput;
};
export type RoleToolUncheckedUpdateWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolUncheckedUpdateManyWithoutToolInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    toolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleTool"]>;
export type RoleToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    toolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleTool"]>;
export type RoleToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    toolId?: boolean;
    createdAt?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleTool"]>;
export type RoleToolSelectScalar = {
    id?: boolean;
    roleId?: boolean;
    toolId?: boolean;
    createdAt?: boolean;
};
export type RoleToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "roleId" | "toolId" | "createdAt", ExtArgs["result"]["roleTool"]>;
export type RoleToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type RoleToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type RoleToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    tool?: boolean | Prisma.ToolDefaultArgs<ExtArgs>;
};
export type $RoleToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RoleTool";
    objects: {
        role: Prisma.$RolePayload<ExtArgs>;
        tool: Prisma.$ToolPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        roleId: number;
        toolId: number;
        createdAt: Date;
    }, ExtArgs["result"]["roleTool"]>;
    composites: {};
};
export type RoleToolGetPayload<S extends boolean | null | undefined | RoleToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RoleToolPayload, S>;
export type RoleToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoleToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoleToolCountAggregateInputType | true;
};
export interface RoleToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RoleTool'];
        meta: {
            name: 'RoleTool';
        };
    };
    findUnique<T extends RoleToolFindUniqueArgs>(args: Prisma.SelectSubset<T, RoleToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoleToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoleToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoleToolFindFirstArgs>(args?: Prisma.SelectSubset<T, RoleToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoleToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoleToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoleToolFindManyArgs>(args?: Prisma.SelectSubset<T, RoleToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoleToolCreateArgs>(args: Prisma.SelectSubset<T, RoleToolCreateArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoleToolCreateManyArgs>(args?: Prisma.SelectSubset<T, RoleToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoleToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoleToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoleToolDeleteArgs>(args: Prisma.SelectSubset<T, RoleToolDeleteArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoleToolUpdateArgs>(args: Prisma.SelectSubset<T, RoleToolUpdateArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoleToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoleToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoleToolUpdateManyArgs>(args: Prisma.SelectSubset<T, RoleToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoleToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoleToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoleToolUpsertArgs>(args: Prisma.SelectSubset<T, RoleToolUpsertArgs<ExtArgs>>): Prisma.Prisma__RoleToolClient<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoleToolCountArgs>(args?: Prisma.Subset<T, RoleToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoleToolCountAggregateOutputType> : number>;
    aggregate<T extends RoleToolAggregateArgs>(args: Prisma.Subset<T, RoleToolAggregateArgs>): Prisma.PrismaPromise<GetRoleToolAggregateType<T>>;
    groupBy<T extends RoleToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoleToolGroupByArgs['orderBy'];
    } : {
        orderBy?: RoleToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoleToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoleToolFieldRefs;
}
export interface Prisma__RoleToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    role<T extends Prisma.RoleDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoleDefaultArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    tool<T extends Prisma.ToolDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolDefaultArgs<ExtArgs>>): Prisma.Prisma__ToolClient<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoleToolFieldRefs {
    readonly id: Prisma.FieldRef<"RoleTool", 'Int'>;
    readonly roleId: Prisma.FieldRef<"RoleTool", 'Int'>;
    readonly toolId: Prisma.FieldRef<"RoleTool", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"RoleTool", 'DateTime'>;
}
export type RoleToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where: Prisma.RoleToolWhereUniqueInput;
};
export type RoleToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where: Prisma.RoleToolWhereUniqueInput;
};
export type RoleToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where?: Prisma.RoleToolWhereInput;
    orderBy?: Prisma.RoleToolOrderByWithRelationInput | Prisma.RoleToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleToolScalarFieldEnum | Prisma.RoleToolScalarFieldEnum[];
};
export type RoleToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where?: Prisma.RoleToolWhereInput;
    orderBy?: Prisma.RoleToolOrderByWithRelationInput | Prisma.RoleToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleToolScalarFieldEnum | Prisma.RoleToolScalarFieldEnum[];
};
export type RoleToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where?: Prisma.RoleToolWhereInput;
    orderBy?: Prisma.RoleToolOrderByWithRelationInput | Prisma.RoleToolOrderByWithRelationInput[];
    cursor?: Prisma.RoleToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleToolScalarFieldEnum | Prisma.RoleToolScalarFieldEnum[];
};
export type RoleToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleToolCreateInput, Prisma.RoleToolUncheckedCreateInput>;
};
export type RoleToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoleToolCreateManyInput | Prisma.RoleToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoleToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    data: Prisma.RoleToolCreateManyInput | Prisma.RoleToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RoleToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RoleToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleToolUpdateInput, Prisma.RoleToolUncheckedUpdateInput>;
    where: Prisma.RoleToolWhereUniqueInput;
};
export type RoleToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoleToolUpdateManyMutationInput, Prisma.RoleToolUncheckedUpdateManyInput>;
    where?: Prisma.RoleToolWhereInput;
    limit?: number;
};
export type RoleToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleToolUpdateManyMutationInput, Prisma.RoleToolUncheckedUpdateManyInput>;
    where?: Prisma.RoleToolWhereInput;
    limit?: number;
    include?: Prisma.RoleToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RoleToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where: Prisma.RoleToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleToolCreateInput, Prisma.RoleToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoleToolUpdateInput, Prisma.RoleToolUncheckedUpdateInput>;
};
export type RoleToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
    where: Prisma.RoleToolWhereUniqueInput;
};
export type RoleToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleToolWhereInput;
    limit?: number;
};
export type RoleToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleToolSelect<ExtArgs> | null;
    omit?: Prisma.RoleToolOmit<ExtArgs> | null;
    include?: Prisma.RoleToolInclude<ExtArgs> | null;
};
