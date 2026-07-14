import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type RoleModel = runtime.Types.Result.DefaultSelection<Prisma.$RolePayload>;
export type AggregateRole = {
    _count: RoleCountAggregateOutputType | null;
    _avg: RoleAvgAggregateOutputType | null;
    _sum: RoleSumAggregateOutputType | null;
    _min: RoleMinAggregateOutputType | null;
    _max: RoleMaxAggregateOutputType | null;
};
export type RoleAvgAggregateOutputType = {
    id: number | null;
};
export type RoleSumAggregateOutputType = {
    id: number | null;
};
export type RoleMinAggregateOutputType = {
    id: number | null;
    name: string | null;
    description: string | null;
    allowToolLevel: $Enums.ToolLevel | null;
    createdAt: Date | null;
};
export type RoleMaxAggregateOutputType = {
    id: number | null;
    name: string | null;
    description: string | null;
    allowToolLevel: $Enums.ToolLevel | null;
    createdAt: Date | null;
};
export type RoleCountAggregateOutputType = {
    id: number;
    name: number;
    description: number;
    allowToolLevel: number;
    createdAt: number;
    _all: number;
};
export type RoleAvgAggregateInputType = {
    id?: true;
};
export type RoleSumAggregateInputType = {
    id?: true;
};
export type RoleMinAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    allowToolLevel?: true;
    createdAt?: true;
};
export type RoleMaxAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    allowToolLevel?: true;
    createdAt?: true;
};
export type RoleCountAggregateInputType = {
    id?: true;
    name?: true;
    description?: true;
    allowToolLevel?: true;
    createdAt?: true;
    _all?: true;
};
export type RoleAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
    cursor?: Prisma.RoleWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RoleCountAggregateInputType;
    _avg?: RoleAvgAggregateInputType;
    _sum?: RoleSumAggregateInputType;
    _min?: RoleMinAggregateInputType;
    _max?: RoleMaxAggregateInputType;
};
export type GetRoleAggregateType<T extends RoleAggregateArgs> = {
    [P in keyof T & keyof AggregateRole]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRole[P]> : Prisma.GetScalarType<T[P], AggregateRole[P]>;
};
export type RoleGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithAggregationInput | Prisma.RoleOrderByWithAggregationInput[];
    by: Prisma.RoleScalarFieldEnum[] | Prisma.RoleScalarFieldEnum;
    having?: Prisma.RoleScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RoleCountAggregateInputType | true;
    _avg?: RoleAvgAggregateInputType;
    _sum?: RoleSumAggregateInputType;
    _min?: RoleMinAggregateInputType;
    _max?: RoleMaxAggregateInputType;
};
export type RoleGroupByOutputType = {
    id: number;
    name: string;
    description: string | null;
    allowToolLevel: $Enums.ToolLevel;
    createdAt: Date;
    _count: RoleCountAggregateOutputType | null;
    _avg: RoleAvgAggregateOutputType | null;
    _sum: RoleSumAggregateOutputType | null;
    _min: RoleMinAggregateOutputType | null;
    _max: RoleMaxAggregateOutputType | null;
};
export type GetRoleGroupByPayload<T extends RoleGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RoleGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RoleGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RoleGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RoleGroupByOutputType[P]>;
}>>;
export type RoleWhereInput = {
    AND?: Prisma.RoleWhereInput | Prisma.RoleWhereInput[];
    OR?: Prisma.RoleWhereInput[];
    NOT?: Prisma.RoleWhereInput | Prisma.RoleWhereInput[];
    id?: Prisma.IntFilter<"Role"> | number;
    name?: Prisma.StringFilter<"Role"> | string;
    description?: Prisma.StringNullableFilter<"Role"> | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFilter<"Role"> | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFilter<"Role"> | Date | string;
    roleSkills?: Prisma.RoleSkillListRelationFilter;
    userApps?: Prisma.UserAppListRelationFilter;
    roleTools?: Prisma.RoleToolListRelationFilter;
    roleHostTools?: Prisma.RoleHostToolListRelationFilter;
};
export type RoleOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    allowToolLevel?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    roleSkills?: Prisma.RoleSkillOrderByRelationAggregateInput;
    userApps?: Prisma.UserAppOrderByRelationAggregateInput;
    roleTools?: Prisma.RoleToolOrderByRelationAggregateInput;
    roleHostTools?: Prisma.RoleHostToolOrderByRelationAggregateInput;
};
export type RoleWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    name?: string;
    AND?: Prisma.RoleWhereInput | Prisma.RoleWhereInput[];
    OR?: Prisma.RoleWhereInput[];
    NOT?: Prisma.RoleWhereInput | Prisma.RoleWhereInput[];
    description?: Prisma.StringNullableFilter<"Role"> | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFilter<"Role"> | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFilter<"Role"> | Date | string;
    roleSkills?: Prisma.RoleSkillListRelationFilter;
    userApps?: Prisma.UserAppListRelationFilter;
    roleTools?: Prisma.RoleToolListRelationFilter;
    roleHostTools?: Prisma.RoleHostToolListRelationFilter;
}, "id" | "name">;
export type RoleOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    allowToolLevel?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.RoleCountOrderByAggregateInput;
    _avg?: Prisma.RoleAvgOrderByAggregateInput;
    _max?: Prisma.RoleMaxOrderByAggregateInput;
    _min?: Prisma.RoleMinOrderByAggregateInput;
    _sum?: Prisma.RoleSumOrderByAggregateInput;
};
export type RoleScalarWhereWithAggregatesInput = {
    AND?: Prisma.RoleScalarWhereWithAggregatesInput | Prisma.RoleScalarWhereWithAggregatesInput[];
    OR?: Prisma.RoleScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RoleScalarWhereWithAggregatesInput | Prisma.RoleScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Role"> | number;
    name?: Prisma.StringWithAggregatesFilter<"Role"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Role"> | string | null;
    allowToolLevel?: Prisma.EnumToolLevelWithAggregatesFilter<"Role"> | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Role"> | Date | string;
};
export type RoleCreateInput = {
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutRoleInput;
};
export type RoleUncheckedCreateInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolUncheckedCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutRoleInput;
};
export type RoleUpdateInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutRoleNestedInput;
};
export type RoleUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUncheckedUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutRoleNestedInput;
};
export type RoleCreateManyInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
};
export type RoleUpdateManyMutationInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RoleCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    allowToolLevel?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type RoleMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    allowToolLevel?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    allowToolLevel?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RoleSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type RoleScalarRelationFilter = {
    is?: Prisma.RoleWhereInput;
    isNot?: Prisma.RoleWhereInput;
};
export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
};
export type EnumToolLevelFieldUpdateOperationsInput = {
    set?: $Enums.ToolLevel;
};
export type RoleCreateNestedOneWithoutRoleSkillsInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleSkillsInput, Prisma.RoleUncheckedCreateWithoutRoleSkillsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleSkillsInput;
    connect?: Prisma.RoleWhereUniqueInput;
};
export type RoleUpdateOneRequiredWithoutRoleSkillsNestedInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleSkillsInput, Prisma.RoleUncheckedCreateWithoutRoleSkillsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleSkillsInput;
    upsert?: Prisma.RoleUpsertWithoutRoleSkillsInput;
    connect?: Prisma.RoleWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoleUpdateToOneWithWhereWithoutRoleSkillsInput, Prisma.RoleUpdateWithoutRoleSkillsInput>, Prisma.RoleUncheckedUpdateWithoutRoleSkillsInput>;
};
export type RoleCreateNestedOneWithoutUserAppsInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutUserAppsInput, Prisma.RoleUncheckedCreateWithoutUserAppsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutUserAppsInput;
    connect?: Prisma.RoleWhereUniqueInput;
};
export type RoleUpdateOneRequiredWithoutUserAppsNestedInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutUserAppsInput, Prisma.RoleUncheckedCreateWithoutUserAppsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutUserAppsInput;
    upsert?: Prisma.RoleUpsertWithoutUserAppsInput;
    connect?: Prisma.RoleWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoleUpdateToOneWithWhereWithoutUserAppsInput, Prisma.RoleUpdateWithoutUserAppsInput>, Prisma.RoleUncheckedUpdateWithoutUserAppsInput>;
};
export type RoleCreateNestedOneWithoutRoleToolsInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleToolsInput, Prisma.RoleUncheckedCreateWithoutRoleToolsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleToolsInput;
    connect?: Prisma.RoleWhereUniqueInput;
};
export type RoleUpdateOneRequiredWithoutRoleToolsNestedInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleToolsInput, Prisma.RoleUncheckedCreateWithoutRoleToolsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleToolsInput;
    upsert?: Prisma.RoleUpsertWithoutRoleToolsInput;
    connect?: Prisma.RoleWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoleUpdateToOneWithWhereWithoutRoleToolsInput, Prisma.RoleUpdateWithoutRoleToolsInput>, Prisma.RoleUncheckedUpdateWithoutRoleToolsInput>;
};
export type RoleCreateNestedOneWithoutRoleHostToolsInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleHostToolsInput, Prisma.RoleUncheckedCreateWithoutRoleHostToolsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleHostToolsInput;
    connect?: Prisma.RoleWhereUniqueInput;
};
export type RoleUpdateOneRequiredWithoutRoleHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.RoleCreateWithoutRoleHostToolsInput, Prisma.RoleUncheckedCreateWithoutRoleHostToolsInput>;
    connectOrCreate?: Prisma.RoleCreateOrConnectWithoutRoleHostToolsInput;
    upsert?: Prisma.RoleUpsertWithoutRoleHostToolsInput;
    connect?: Prisma.RoleWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.RoleUpdateToOneWithWhereWithoutRoleHostToolsInput, Prisma.RoleUpdateWithoutRoleHostToolsInput>, Prisma.RoleUncheckedUpdateWithoutRoleHostToolsInput>;
};
export type RoleCreateWithoutRoleSkillsInput = {
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    userApps?: Prisma.UserAppCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutRoleInput;
};
export type RoleUncheckedCreateWithoutRoleSkillsInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolUncheckedCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutRoleInput;
};
export type RoleCreateOrConnectWithoutRoleSkillsInput = {
    where: Prisma.RoleWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleSkillsInput, Prisma.RoleUncheckedCreateWithoutRoleSkillsInput>;
};
export type RoleUpsertWithoutRoleSkillsInput = {
    update: Prisma.XOR<Prisma.RoleUpdateWithoutRoleSkillsInput, Prisma.RoleUncheckedUpdateWithoutRoleSkillsInput>;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleSkillsInput, Prisma.RoleUncheckedCreateWithoutRoleSkillsInput>;
    where?: Prisma.RoleWhereInput;
};
export type RoleUpdateToOneWithWhereWithoutRoleSkillsInput = {
    where?: Prisma.RoleWhereInput;
    data: Prisma.XOR<Prisma.RoleUpdateWithoutRoleSkillsInput, Prisma.RoleUncheckedUpdateWithoutRoleSkillsInput>;
};
export type RoleUpdateWithoutRoleSkillsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    userApps?: Prisma.UserAppUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutRoleNestedInput;
};
export type RoleUncheckedUpdateWithoutRoleSkillsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUncheckedUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutRoleNestedInput;
};
export type RoleCreateWithoutUserAppsInput = {
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutRoleInput;
};
export type RoleUncheckedCreateWithoutUserAppsInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolUncheckedCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutRoleInput;
};
export type RoleCreateOrConnectWithoutUserAppsInput = {
    where: Prisma.RoleWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleCreateWithoutUserAppsInput, Prisma.RoleUncheckedCreateWithoutUserAppsInput>;
};
export type RoleUpsertWithoutUserAppsInput = {
    update: Prisma.XOR<Prisma.RoleUpdateWithoutUserAppsInput, Prisma.RoleUncheckedUpdateWithoutUserAppsInput>;
    create: Prisma.XOR<Prisma.RoleCreateWithoutUserAppsInput, Prisma.RoleUncheckedCreateWithoutUserAppsInput>;
    where?: Prisma.RoleWhereInput;
};
export type RoleUpdateToOneWithWhereWithoutUserAppsInput = {
    where?: Prisma.RoleWhereInput;
    data: Prisma.XOR<Prisma.RoleUpdateWithoutUserAppsInput, Prisma.RoleUncheckedUpdateWithoutUserAppsInput>;
};
export type RoleUpdateWithoutUserAppsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutRoleNestedInput;
};
export type RoleUncheckedUpdateWithoutUserAppsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUncheckedUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutRoleNestedInput;
};
export type RoleCreateWithoutRoleToolsInput = {
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutRoleInput;
};
export type RoleUncheckedCreateWithoutRoleToolsInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutRoleInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutRoleInput;
};
export type RoleCreateOrConnectWithoutRoleToolsInput = {
    where: Prisma.RoleWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleToolsInput, Prisma.RoleUncheckedCreateWithoutRoleToolsInput>;
};
export type RoleUpsertWithoutRoleToolsInput = {
    update: Prisma.XOR<Prisma.RoleUpdateWithoutRoleToolsInput, Prisma.RoleUncheckedUpdateWithoutRoleToolsInput>;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleToolsInput, Prisma.RoleUncheckedCreateWithoutRoleToolsInput>;
    where?: Prisma.RoleWhereInput;
};
export type RoleUpdateToOneWithWhereWithoutRoleToolsInput = {
    where?: Prisma.RoleWhereInput;
    data: Prisma.XOR<Prisma.RoleUpdateWithoutRoleToolsInput, Prisma.RoleUncheckedUpdateWithoutRoleToolsInput>;
};
export type RoleUpdateWithoutRoleToolsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutRoleNestedInput;
};
export type RoleUncheckedUpdateWithoutRoleToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutRoleNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutRoleNestedInput;
};
export type RoleCreateWithoutRoleHostToolsInput = {
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolCreateNestedManyWithoutRoleInput;
};
export type RoleUncheckedCreateWithoutRoleHostToolsInput = {
    id?: number;
    name: string;
    description?: string | null;
    allowToolLevel?: $Enums.ToolLevel;
    createdAt?: Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedCreateNestedManyWithoutRoleInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutRoleInput;
    roleTools?: Prisma.RoleToolUncheckedCreateNestedManyWithoutRoleInput;
};
export type RoleCreateOrConnectWithoutRoleHostToolsInput = {
    where: Prisma.RoleWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleHostToolsInput, Prisma.RoleUncheckedCreateWithoutRoleHostToolsInput>;
};
export type RoleUpsertWithoutRoleHostToolsInput = {
    update: Prisma.XOR<Prisma.RoleUpdateWithoutRoleHostToolsInput, Prisma.RoleUncheckedUpdateWithoutRoleHostToolsInput>;
    create: Prisma.XOR<Prisma.RoleCreateWithoutRoleHostToolsInput, Prisma.RoleUncheckedCreateWithoutRoleHostToolsInput>;
    where?: Prisma.RoleWhereInput;
};
export type RoleUpdateToOneWithWhereWithoutRoleHostToolsInput = {
    where?: Prisma.RoleWhereInput;
    data: Prisma.XOR<Prisma.RoleUpdateWithoutRoleHostToolsInput, Prisma.RoleUncheckedUpdateWithoutRoleHostToolsInput>;
};
export type RoleUpdateWithoutRoleHostToolsInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUpdateManyWithoutRoleNestedInput;
};
export type RoleUncheckedUpdateWithoutRoleHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    allowToolLevel?: Prisma.EnumToolLevelFieldUpdateOperationsInput | $Enums.ToolLevel;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    roleSkills?: Prisma.RoleSkillUncheckedUpdateManyWithoutRoleNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutRoleNestedInput;
    roleTools?: Prisma.RoleToolUncheckedUpdateManyWithoutRoleNestedInput;
};
export type RoleCountOutputType = {
    roleSkills: number;
    userApps: number;
    roleTools: number;
    roleHostTools: number;
};
export type RoleCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    roleSkills?: boolean | RoleCountOutputTypeCountRoleSkillsArgs;
    userApps?: boolean | RoleCountOutputTypeCountUserAppsArgs;
    roleTools?: boolean | RoleCountOutputTypeCountRoleToolsArgs;
    roleHostTools?: boolean | RoleCountOutputTypeCountRoleHostToolsArgs;
};
export type RoleCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleCountOutputTypeSelect<ExtArgs> | null;
};
export type RoleCountOutputTypeCountRoleSkillsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleSkillWhereInput;
};
export type RoleCountOutputTypeCountUserAppsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserAppWhereInput;
};
export type RoleCountOutputTypeCountRoleToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleToolWhereInput;
};
export type RoleCountOutputTypeCountRoleHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleHostToolWhereInput;
};
export type RoleSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    description?: boolean;
    allowToolLevel?: boolean;
    createdAt?: boolean;
    roleSkills?: boolean | Prisma.Role$roleSkillsArgs<ExtArgs>;
    userApps?: boolean | Prisma.Role$userAppsArgs<ExtArgs>;
    roleTools?: boolean | Prisma.Role$roleToolsArgs<ExtArgs>;
    roleHostTools?: boolean | Prisma.Role$roleHostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.RoleCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["role"]>;
export type RoleSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    description?: boolean;
    allowToolLevel?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["role"]>;
export type RoleSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    description?: boolean;
    allowToolLevel?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["role"]>;
export type RoleSelectScalar = {
    id?: boolean;
    name?: boolean;
    description?: boolean;
    allowToolLevel?: boolean;
    createdAt?: boolean;
};
export type RoleOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "description" | "allowToolLevel" | "createdAt", ExtArgs["result"]["role"]>;
export type RoleInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    roleSkills?: boolean | Prisma.Role$roleSkillsArgs<ExtArgs>;
    userApps?: boolean | Prisma.Role$userAppsArgs<ExtArgs>;
    roleTools?: boolean | Prisma.Role$roleToolsArgs<ExtArgs>;
    roleHostTools?: boolean | Prisma.Role$roleHostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.RoleCountOutputTypeDefaultArgs<ExtArgs>;
};
export type RoleIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type RoleIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $RolePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Role";
    objects: {
        roleSkills: Prisma.$RoleSkillPayload<ExtArgs>[];
        userApps: Prisma.$UserAppPayload<ExtArgs>[];
        roleTools: Prisma.$RoleToolPayload<ExtArgs>[];
        roleHostTools: Prisma.$RoleHostToolPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        name: string;
        description: string | null;
        allowToolLevel: $Enums.ToolLevel;
        createdAt: Date;
    }, ExtArgs["result"]["role"]>;
    composites: {};
};
export type RoleGetPayload<S extends boolean | null | undefined | RoleDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RolePayload, S>;
export type RoleCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RoleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RoleCountAggregateInputType | true;
};
export interface RoleDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Role'];
        meta: {
            name: 'Role';
        };
    };
    findUnique<T extends RoleFindUniqueArgs>(args: Prisma.SelectSubset<T, RoleFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RoleFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RoleFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RoleFindFirstArgs>(args?: Prisma.SelectSubset<T, RoleFindFirstArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RoleFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RoleFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RoleFindManyArgs>(args?: Prisma.SelectSubset<T, RoleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RoleCreateArgs>(args: Prisma.SelectSubset<T, RoleCreateArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RoleCreateManyArgs>(args?: Prisma.SelectSubset<T, RoleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RoleCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RoleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RoleDeleteArgs>(args: Prisma.SelectSubset<T, RoleDeleteArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RoleUpdateArgs>(args: Prisma.SelectSubset<T, RoleUpdateArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RoleDeleteManyArgs>(args?: Prisma.SelectSubset<T, RoleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RoleUpdateManyArgs>(args: Prisma.SelectSubset<T, RoleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RoleUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RoleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RoleUpsertArgs>(args: Prisma.SelectSubset<T, RoleUpsertArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RoleCountArgs>(args?: Prisma.Subset<T, RoleCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RoleCountAggregateOutputType> : number>;
    aggregate<T extends RoleAggregateArgs>(args: Prisma.Subset<T, RoleAggregateArgs>): Prisma.PrismaPromise<GetRoleAggregateType<T>>;
    groupBy<T extends RoleGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RoleGroupByArgs['orderBy'];
    } : {
        orderBy?: RoleGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RoleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RoleFieldRefs;
}
export interface Prisma__RoleClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    roleSkills<T extends Prisma.Role$roleSkillsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Role$roleSkillsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleSkillPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    userApps<T extends Prisma.Role$userAppsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Role$userAppsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    roleTools<T extends Prisma.Role$roleToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Role$roleToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    roleHostTools<T extends Prisma.Role$roleHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Role$roleHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RoleFieldRefs {
    readonly id: Prisma.FieldRef<"Role", 'Int'>;
    readonly name: Prisma.FieldRef<"Role", 'String'>;
    readonly description: Prisma.FieldRef<"Role", 'String'>;
    readonly allowToolLevel: Prisma.FieldRef<"Role", 'ToolLevel'>;
    readonly createdAt: Prisma.FieldRef<"Role", 'DateTime'>;
}
export type RoleFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where: Prisma.RoleWhereUniqueInput;
};
export type RoleFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where: Prisma.RoleWhereUniqueInput;
};
export type RoleFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
    cursor?: Prisma.RoleWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleScalarFieldEnum | Prisma.RoleScalarFieldEnum[];
};
export type RoleFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
    cursor?: Prisma.RoleWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleScalarFieldEnum | Prisma.RoleScalarFieldEnum[];
};
export type RoleFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
    cursor?: Prisma.RoleWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RoleScalarFieldEnum | Prisma.RoleScalarFieldEnum[];
};
export type RoleCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleCreateInput, Prisma.RoleUncheckedCreateInput>;
};
export type RoleCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RoleCreateManyInput | Prisma.RoleCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoleCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    data: Prisma.RoleCreateManyInput | Prisma.RoleCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RoleUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleUpdateInput, Prisma.RoleUncheckedUpdateInput>;
    where: Prisma.RoleWhereUniqueInput;
};
export type RoleUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RoleUpdateManyMutationInput, Prisma.RoleUncheckedUpdateManyInput>;
    where?: Prisma.RoleWhereInput;
    limit?: number;
};
export type RoleUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RoleUpdateManyMutationInput, Prisma.RoleUncheckedUpdateManyInput>;
    where?: Prisma.RoleWhereInput;
    limit?: number;
};
export type RoleUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where: Prisma.RoleWhereUniqueInput;
    create: Prisma.XOR<Prisma.RoleCreateInput, Prisma.RoleUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RoleUpdateInput, Prisma.RoleUncheckedUpdateInput>;
};
export type RoleDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
    where: Prisma.RoleWhereUniqueInput;
};
export type RoleDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleWhereInput;
    limit?: number;
};
export type Role$roleSkillsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Role$userAppsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    where?: Prisma.UserAppWhereInput;
    orderBy?: Prisma.UserAppOrderByWithRelationInput | Prisma.UserAppOrderByWithRelationInput[];
    cursor?: Prisma.UserAppWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserAppScalarFieldEnum | Prisma.UserAppScalarFieldEnum[];
};
export type Role$roleToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Role$roleHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type RoleDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RoleSelect<ExtArgs> | null;
    omit?: Prisma.RoleOmit<ExtArgs> | null;
    include?: Prisma.RoleInclude<ExtArgs> | null;
};
