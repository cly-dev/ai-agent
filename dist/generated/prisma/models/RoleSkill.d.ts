import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type RoleSkillModel = runtime.Types.Result.DefaultSelection<Prisma.$RoleSkillPayload>;
export type AggregateRoleSkill = {
    _count: RoleSkillCountAggregateOutputType | null;
    _avg: RoleSkillAvgAggregateOutputType | null;
    _sum: RoleSkillSumAggregateOutputType | null;
    _min: RoleSkillMinAggregateOutputType | null;
    _max: RoleSkillMaxAggregateOutputType | null;
};
export type RoleSkillAvgAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    skillId: number | null;
};
export type RoleSkillSumAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    skillId: number | null;
};
export type RoleSkillMinAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    skillId: number | null;
};
export type RoleSkillMaxAggregateOutputType = {
    id: number | null;
    roleId: number | null;
    skillId: number | null;
};
export type RoleSkillCountAggregateOutputType = {
    id: number;
    roleId: number;
    skillId: number;
    _all: number;
};
export type RoleSkillAvgAggregateInputType = {
    id?: true;
    roleId?: true;
    skillId?: true;
};
export type RoleSkillSumAggregateInputType = {
    id?: true;
    roleId?: true;
    skillId?: true;
};
export type RoleSkillMinAggregateInputType = {
    id?: true;
    roleId?: true;
    skillId?: true;
};
export type RoleSkillMaxAggregateInputType = {
    id?: true;
    roleId?: true;
    skillId?: true;
};
export type RoleSkillCountAggregateInputType = {
    id?: true;
    roleId?: true;
    skillId?: true;
    _all?: true;
};
export type RoleSkillAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleSkillWhereInput;
    orderBy?: Prisma.RoleSkillOrderByWithRelationInput | Prisma.RoleSkillOrderByWithRelationInput[];
    cursor?: Prisma.RoleSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoleSkillCountAggregateInputType;
    _avg?: RoleSkillAvgAggregateInputType;
    _sum?: RoleSkillSumAggregateInputType;
    _min?: RoleSkillMinAggregateInputType;
    _max?: RoleSkillMaxAggregateInputType;
};
export type GetRoleSkillAggregateType<T extends RoleSkillAggregateArgs> = {
    [P in keyof T & keyof AggregateRoleSkill]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRoleSkill[P]> : Prisma.GetScalarType<T[P], AggregateRoleSkill[P]>;
};
export type RoleSkillGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleSkillWhereInput;
    orderBy?: Prisma.RoleSkillOrderByWithAggregationInput | Prisma.RoleSkillOrderByWithAggregationInput[];
    by: Prisma.RoleSkillScalarFieldEnum[] | Prisma.RoleSkillScalarFieldEnum;
    having?: Prisma.RoleSkillScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoleSkillCountAggregateInputType | true;
    _avg?: RoleSkillAvgAggregateInputType;
    _sum?: RoleSkillSumAggregateInputType;
    _min?: RoleSkillMinAggregateInputType;
    _max?: RoleSkillMaxAggregateInputType;
};
export type RoleSkillGroupByOutputType = {
    id: number;
    roleId: number;
    skillId: number;
    _count: RoleSkillCountAggregateOutputType | null;
    _avg: RoleSkillAvgAggregateOutputType | null;
    _sum: RoleSkillSumAggregateOutputType | null;
    _min: RoleSkillMinAggregateOutputType | null;
    _max: RoleSkillMaxAggregateOutputType | null;
};
export type GetRoleSkillGroupByPayload<T extends RoleSkillGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoleSkillGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoleSkillGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoleSkillGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoleSkillGroupByOutputType[P]>;
}>>;
export type RoleSkillWhereInput = {
    AND?: Prisma.RoleSkillWhereInput | Prisma.RoleSkillWhereInput[];
    OR?: Prisma.RoleSkillWhereInput[];
    NOT?: Prisma.RoleSkillWhereInput | Prisma.RoleSkillWhereInput[];
    id?: Prisma.IntFilter<"RoleSkill"> | number;
    roleId?: Prisma.IntFilter<"RoleSkill"> | number;
    skillId?: Prisma.IntFilter<"RoleSkill"> | number;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
};
export type RoleSkillOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    role?: Prisma.RoleOrderByWithRelationInput;
    skill?: Prisma.SkillOrderByWithRelationInput;
};
export type RoleSkillWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    roleId_skillId?: Prisma.RoleSkillRoleIdSkillIdCompoundUniqueInput;
    AND?: Prisma.RoleSkillWhereInput | Prisma.RoleSkillWhereInput[];
    OR?: Prisma.RoleSkillWhereInput[];
    NOT?: Prisma.RoleSkillWhereInput | Prisma.RoleSkillWhereInput[];
    roleId?: Prisma.IntFilter<"RoleSkill"> | number;
    skillId?: Prisma.IntFilter<"RoleSkill"> | number;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
}, "id" | "roleId_skillId">;
export type RoleSkillOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    _count?: Prisma.RoleSkillCountOrderByAggregateInput;
    _avg?: Prisma.RoleSkillAvgOrderByAggregateInput;
    _max?: Prisma.RoleSkillMaxOrderByAggregateInput;
    _min?: Prisma.RoleSkillMinOrderByAggregateInput;
    _sum?: Prisma.RoleSkillSumOrderByAggregateInput;
};
export type RoleSkillScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoleSkillScalarWhereWithAggregatesInput | Prisma.RoleSkillScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoleSkillScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoleSkillScalarWhereWithAggregatesInput | Prisma.RoleSkillScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"RoleSkill"> | number;
    roleId?: Prisma.IntWithAggregatesFilter<"RoleSkill"> | number;
    skillId?: Prisma.IntWithAggregatesFilter<"RoleSkill"> | number;
};
export type RoleSkillCreateInput = {
    role: Prisma.RoleCreateNestedOneWithoutRoleSkillsInput;
    skill: Prisma.SkillCreateNestedOneWithoutRoleSkillsInput;
};
export type RoleSkillUncheckedCreateInput = {
    id?: number;
    roleId: number;
    skillId: number;
};
export type RoleSkillUpdateInput = {
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleSkillsNestedInput;
    skill?: Prisma.SkillUpdateOneRequiredWithoutRoleSkillsNestedInput;
};
export type RoleSkillUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillCreateManyInput = {
    id?: number;
    roleId: number;
    skillId: number;
};
export type RoleSkillUpdateManyMutationInput = {};
export type RoleSkillUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillListRelationFilter = {
    every?: Prisma.RoleSkillWhereInput;
    some?: Prisma.RoleSkillWhereInput;
    none?: Prisma.RoleSkillWhereInput;
};
export type RoleSkillOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RoleSkillRoleIdSkillIdCompoundUniqueInput = {
    roleId: number;
    skillId: number;
};
export type RoleSkillCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type RoleSkillAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type RoleSkillMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type RoleSkillMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type RoleSkillSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type RoleSkillCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput> | Prisma.RoleSkillCreateWithoutRoleInput[] | Prisma.RoleSkillUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutRoleInput | Prisma.RoleSkillCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleSkillCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
};
export type RoleSkillUncheckedCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput> | Prisma.RoleSkillCreateWithoutRoleInput[] | Prisma.RoleSkillUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutRoleInput | Prisma.RoleSkillCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.RoleSkillCreateManyRoleInputEnvelope;
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
};
export type RoleSkillUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput> | Prisma.RoleSkillCreateWithoutRoleInput[] | Prisma.RoleSkillUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutRoleInput | Prisma.RoleSkillCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleSkillUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleSkillUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleSkillCreateManyRoleInputEnvelope;
    set?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    disconnect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    delete?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    update?: Prisma.RoleSkillUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleSkillUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleSkillUpdateManyWithWhereWithoutRoleInput | Prisma.RoleSkillUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
};
export type RoleSkillUncheckedUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput> | Prisma.RoleSkillCreateWithoutRoleInput[] | Prisma.RoleSkillUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutRoleInput | Prisma.RoleSkillCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.RoleSkillUpsertWithWhereUniqueWithoutRoleInput | Prisma.RoleSkillUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.RoleSkillCreateManyRoleInputEnvelope;
    set?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    disconnect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    delete?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    update?: Prisma.RoleSkillUpdateWithWhereUniqueWithoutRoleInput | Prisma.RoleSkillUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.RoleSkillUpdateManyWithWhereWithoutRoleInput | Prisma.RoleSkillUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
};
export type RoleSkillCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput> | Prisma.RoleSkillCreateWithoutSkillInput[] | Prisma.RoleSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutSkillInput | Prisma.RoleSkillCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.RoleSkillCreateManySkillInputEnvelope;
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
};
export type RoleSkillUncheckedCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput> | Prisma.RoleSkillCreateWithoutSkillInput[] | Prisma.RoleSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutSkillInput | Prisma.RoleSkillCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.RoleSkillCreateManySkillInputEnvelope;
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
};
export type RoleSkillUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput> | Prisma.RoleSkillCreateWithoutSkillInput[] | Prisma.RoleSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutSkillInput | Prisma.RoleSkillCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.RoleSkillUpsertWithWhereUniqueWithoutSkillInput | Prisma.RoleSkillUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.RoleSkillCreateManySkillInputEnvelope;
    set?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    disconnect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    delete?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    update?: Prisma.RoleSkillUpdateWithWhereUniqueWithoutSkillInput | Prisma.RoleSkillUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.RoleSkillUpdateManyWithWhereWithoutSkillInput | Prisma.RoleSkillUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
};
export type RoleSkillUncheckedUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput> | Prisma.RoleSkillCreateWithoutSkillInput[] | Prisma.RoleSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.RoleSkillCreateOrConnectWithoutSkillInput | Prisma.RoleSkillCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.RoleSkillUpsertWithWhereUniqueWithoutSkillInput | Prisma.RoleSkillUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.RoleSkillCreateManySkillInputEnvelope;
    set?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    disconnect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    delete?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    connect?: Prisma.RoleSkillWhereUniqueInput | Prisma.RoleSkillWhereUniqueInput[];
    update?: Prisma.RoleSkillUpdateWithWhereUniqueWithoutSkillInput | Prisma.RoleSkillUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.RoleSkillUpdateManyWithWhereWithoutSkillInput | Prisma.RoleSkillUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
};
export type RoleSkillCreateWithoutRoleInput = {
    skill: Prisma.SkillCreateNestedOneWithoutRoleSkillsInput;
};
export type RoleSkillUncheckedCreateWithoutRoleInput = {
    id?: number;
    skillId: number;
};
export type RoleSkillCreateOrConnectWithoutRoleInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput>;
};
export type RoleSkillCreateManyRoleInputEnvelope = {
    data: Prisma.RoleSkillCreateManyRoleInput | Prisma.RoleSkillCreateManyRoleInput[];
    skipDuplicates?: boolean;
};
export type RoleSkillUpsertWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleSkillUpdateWithoutRoleInput, Prisma.RoleSkillUncheckedUpdateWithoutRoleInput>;
    create: Prisma.XOR<Prisma.RoleSkillCreateWithoutRoleInput, Prisma.RoleSkillUncheckedCreateWithoutRoleInput>;
};
export type RoleSkillUpdateWithWhereUniqueWithoutRoleInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleSkillUpdateWithoutRoleInput, Prisma.RoleSkillUncheckedUpdateWithoutRoleInput>;
};
export type RoleSkillUpdateManyWithWhereWithoutRoleInput = {
    where: Prisma.RoleSkillScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleSkillUpdateManyMutationInput, Prisma.RoleSkillUncheckedUpdateManyWithoutRoleInput>;
};
export type RoleSkillScalarWhereInput = {
    AND?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
    OR?: Prisma.RoleSkillScalarWhereInput[];
    NOT?: Prisma.RoleSkillScalarWhereInput | Prisma.RoleSkillScalarWhereInput[];
    id?: Prisma.IntFilter<"RoleSkill"> | number;
    roleId?: Prisma.IntFilter<"RoleSkill"> | number;
    skillId?: Prisma.IntFilter<"RoleSkill"> | number;
};
export type RoleSkillCreateWithoutSkillInput = {
    role: Prisma.RoleCreateNestedOneWithoutRoleSkillsInput;
};
export type RoleSkillUncheckedCreateWithoutSkillInput = {
    id?: number;
    roleId: number;
};
export type RoleSkillCreateOrConnectWithoutSkillInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput>;
};
export type RoleSkillCreateManySkillInputEnvelope = {
    data: Prisma.RoleSkillCreateManySkillInput | Prisma.RoleSkillCreateManySkillInput[];
    skipDuplicates?: boolean;
};
export type RoleSkillUpsertWithWhereUniqueWithoutSkillInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    update: Prisma.XOR<Prisma.RoleSkillUpdateWithoutSkillInput, Prisma.RoleSkillUncheckedUpdateWithoutSkillInput>;
    create: Prisma.XOR<Prisma.RoleSkillCreateWithoutSkillInput, Prisma.RoleSkillUncheckedCreateWithoutSkillInput>;
};
export type RoleSkillUpdateWithWhereUniqueWithoutSkillInput = {
    where: Prisma.RoleSkillWhereUniqueInput;
    data: Prisma.XOR<Prisma.RoleSkillUpdateWithoutSkillInput, Prisma.RoleSkillUncheckedUpdateWithoutSkillInput>;
};
export type RoleSkillUpdateManyWithWhereWithoutSkillInput = {
    where: Prisma.RoleSkillScalarWhereInput;
    data: Prisma.XOR<Prisma.RoleSkillUpdateManyMutationInput, Prisma.RoleSkillUncheckedUpdateManyWithoutSkillInput>;
};
export type RoleSkillCreateManyRoleInput = {
    id?: number;
    skillId: number;
};
export type RoleSkillUpdateWithoutRoleInput = {
    skill?: Prisma.SkillUpdateOneRequiredWithoutRoleSkillsNestedInput;
};
export type RoleSkillUncheckedUpdateWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillUncheckedUpdateManyWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillCreateManySkillInput = {
    id?: number;
    roleId: number;
};
export type RoleSkillUpdateWithoutSkillInput = {
    role?: Prisma.RoleUpdateOneRequiredWithoutRoleSkillsNestedInput;
};
export type RoleSkillUncheckedUpdateWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillUncheckedUpdateManyWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type RoleSkillSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    skillId?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleSkill"]>;
export type RoleSkillSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    skillId?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleSkill"]>;
export type RoleSkillSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    roleId?: boolean;
    skillId?: boolean;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["roleSkill"]>;
export type RoleSkillSelectScalar = {
    id?: boolean;
    roleId?: boolean;
    skillId?: boolean;
};
export type RoleSkillOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "roleId" | "skillId", ExtArgs["result"]["roleSkill"]>;
export type RoleSkillInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type RoleSkillIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type RoleSkillIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type $RoleSkillPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RoleSkill";
    objects: {
        role: Prisma.$RolePayload<ExtArgs>;
        skill: Prisma.$SkillPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        roleId: number;
        skillId: number;
    }, ExtArgs["result"]["roleSkill"]>;
    composites: {};
};
export type RoleSkillGetPayload<S extends boolean | null | undefined | RoleSkillDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload, S>;
export type RoleSkillCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoleSkillFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoleSkillCountAggregateInputType | true;
};
export interface RoleSkillDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RoleSkill'];
        meta: {
            name: 'RoleSkill';
        };
    };
    findUnique<T extends RoleSkillFindUniqueArgs>(args: Prisma.SelectSubset<T, RoleSkillFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoleSkillFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoleSkillFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoleSkillFindFirstArgs>(args?: Prisma.SelectSubset<T, RoleSkillFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoleSkillFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoleSkillFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoleSkillFindManyArgs>(args?: Prisma.SelectSubset<T, RoleSkillFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoleSkillCreateArgs>(args: Prisma.SelectSubset<T, RoleSkillCreateArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoleSkillCreateManyArgs>(args?: Prisma.SelectSubset<T, RoleSkillCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoleSkillCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoleSkillCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoleSkillDeleteArgs>(args: Prisma.SelectSubset<T, RoleSkillDeleteArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoleSkillUpdateArgs>(args: Prisma.SelectSubset<T, RoleSkillUpdateArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoleSkillDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoleSkillDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoleSkillUpdateManyArgs>(args: Prisma.SelectSubset<T, RoleSkillUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoleSkillUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoleSkillUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoleSkillUpsertArgs>(args: Prisma.SelectSubset<T, RoleSkillUpsertArgs<ExtArgs>>): Prisma.Prisma__RoleSkillClient<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoleSkillCountArgs>(args?: Prisma.Subset<T, RoleSkillCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoleSkillCountAggregateOutputType> : number>;
    aggregate<T extends RoleSkillAggregateArgs>(args: Prisma.Subset<T, RoleSkillAggregateArgs>): Prisma.PrismaPromise<GetRoleSkillAggregateType<T>>;
    groupBy<T extends RoleSkillGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoleSkillGroupByArgs['orderBy'];
    } : {
        orderBy?: RoleSkillGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoleSkillGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleSkillGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoleSkillFieldRefs;
}
export interface Prisma__RoleSkillClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    role<T extends Prisma.RoleDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoleDefaultArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    skill<T extends Prisma.SkillDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SkillDefaultArgs<ExtArgs>>): Prisma.Prisma__SkillClient<runtime.Types.Result.GetResult<Prisma.$SkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoleSkillFieldRefs {
    readonly id: Prisma.FieldRef<"RoleSkill", 'Int'>;
    readonly roleId: Prisma.FieldRef<"RoleSkill", 'Int'>;
    readonly skillId: Prisma.FieldRef<"RoleSkill", 'Int'>;
}
export type RoleSkillFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where: Prisma.RoleSkillWhereUniqueInput;
};
export type RoleSkillFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where: Prisma.RoleSkillWhereUniqueInput;
};
export type RoleSkillFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where?: Prisma.RoleSkillWhereInput;
    orderBy?: Prisma.RoleSkillOrderByWithRelationInput | Prisma.RoleSkillOrderByWithRelationInput[];
    cursor?: Prisma.RoleSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleSkillScalarFieldEnum | Prisma.RoleSkillScalarFieldEnum[];
};
export type RoleSkillFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where?: Prisma.RoleSkillWhereInput;
    orderBy?: Prisma.RoleSkillOrderByWithRelationInput | Prisma.RoleSkillOrderByWithRelationInput[];
    cursor?: Prisma.RoleSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleSkillScalarFieldEnum | Prisma.RoleSkillScalarFieldEnum[];
};
export type RoleSkillFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where?: Prisma.RoleSkillWhereInput;
    orderBy?: Prisma.RoleSkillOrderByWithRelationInput | Prisma.RoleSkillOrderByWithRelationInput[];
    cursor?: Prisma.RoleSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleSkillScalarFieldEnum | Prisma.RoleSkillScalarFieldEnum[];
};
export type RoleSkillCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleSkillCreateInput, Prisma.RoleSkillUncheckedCreateInput>;
};
export type RoleSkillCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoleSkillCreateManyInput | Prisma.RoleSkillCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoleSkillCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    data: Prisma.RoleSkillCreateManyInput | Prisma.RoleSkillCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RoleSkillIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RoleSkillUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleSkillUpdateInput, Prisma.RoleSkillUncheckedUpdateInput>;
    where: Prisma.RoleSkillWhereUniqueInput;
};
export type RoleSkillUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoleSkillUpdateManyMutationInput, Prisma.RoleSkillUncheckedUpdateManyInput>;
    where?: Prisma.RoleSkillWhereInput;
    limit?: number;
};
export type RoleSkillUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleSkillUpdateManyMutationInput, Prisma.RoleSkillUncheckedUpdateManyInput>;
    where?: Prisma.RoleSkillWhereInput;
    limit?: number;
    include?: Prisma.RoleSkillIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RoleSkillUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where: Prisma.RoleSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleSkillCreateInput, Prisma.RoleSkillUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoleSkillUpdateInput, Prisma.RoleSkillUncheckedUpdateInput>;
};
export type RoleSkillDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
    where: Prisma.RoleSkillWhereUniqueInput;
};
export type RoleSkillDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleSkillWhereInput;
    limit?: number;
};
export type RoleSkillDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSkillSelect<ExtArgs> | null;
    omit?: Prisma.RoleSkillOmit<ExtArgs> | null;
    include?: Prisma.RoleSkillInclude<ExtArgs> | null;
};
