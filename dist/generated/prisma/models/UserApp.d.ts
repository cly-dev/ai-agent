import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type UserAppModel = runtime.Types.Result.DefaultSelection<Prisma.$UserAppPayload>;
export type AggregateUserApp = {
    _count: UserAppCountAggregateOutputType | null;
    _avg: UserAppAvgAggregateOutputType | null;
    _sum: UserAppSumAggregateOutputType | null;
    _min: UserAppMinAggregateOutputType | null;
    _max: UserAppMaxAggregateOutputType | null;
};
export type UserAppAvgAggregateOutputType = {
    id: number | null;
    userId: number | null;
    appId: number | null;
    roleId: number | null;
};
export type UserAppSumAggregateOutputType = {
    id: number | null;
    userId: number | null;
    appId: number | null;
    roleId: number | null;
};
export type UserAppMinAggregateOutputType = {
    id: number | null;
    userId: number | null;
    appId: number | null;
    roleId: number | null;
    createdAt: Date | null;
};
export type UserAppMaxAggregateOutputType = {
    id: number | null;
    userId: number | null;
    appId: number | null;
    roleId: number | null;
    createdAt: Date | null;
};
export type UserAppCountAggregateOutputType = {
    id: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt: number;
    _all: number;
};
export type UserAppAvgAggregateInputType = {
    id?: true;
    userId?: true;
    appId?: true;
    roleId?: true;
};
export type UserAppSumAggregateInputType = {
    id?: true;
    userId?: true;
    appId?: true;
    roleId?: true;
};
export type UserAppMinAggregateInputType = {
    id?: true;
    userId?: true;
    appId?: true;
    roleId?: true;
    createdAt?: true;
};
export type UserAppMaxAggregateInputType = {
    id?: true;
    userId?: true;
    appId?: true;
    roleId?: true;
    createdAt?: true;
};
export type UserAppCountAggregateInputType = {
    id?: true;
    userId?: true;
    appId?: true;
    roleId?: true;
    createdAt?: true;
    _all?: true;
};
export type UserAppAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserAppWhereInput;
    orderBy?: Prisma.UserAppOrderByWithRelationInput | Prisma.UserAppOrderByWithRelationInput[];
    cursor?: Prisma.UserAppWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UserAppCountAggregateInputType;
    _avg?: UserAppAvgAggregateInputType;
    _sum?: UserAppSumAggregateInputType;
    _min?: UserAppMinAggregateInputType;
    _max?: UserAppMaxAggregateInputType;
};
export type GetUserAppAggregateType<T extends UserAppAggregateArgs> = {
    [P in keyof T & keyof AggregateUserApp]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUserApp[P]> : Prisma.GetScalarType<T[P], AggregateUserApp[P]>;
};
export type UserAppGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserAppWhereInput;
    orderBy?: Prisma.UserAppOrderByWithAggregationInput | Prisma.UserAppOrderByWithAggregationInput[];
    by: Prisma.UserAppScalarFieldEnum[] | Prisma.UserAppScalarFieldEnum;
    having?: Prisma.UserAppScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserAppCountAggregateInputType | true;
    _avg?: UserAppAvgAggregateInputType;
    _sum?: UserAppSumAggregateInputType;
    _min?: UserAppMinAggregateInputType;
    _max?: UserAppMaxAggregateInputType;
};
export type UserAppGroupByOutputType = {
    id: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt: Date;
    _count: UserAppCountAggregateOutputType | null;
    _avg: UserAppAvgAggregateOutputType | null;
    _sum: UserAppSumAggregateOutputType | null;
    _min: UserAppMinAggregateOutputType | null;
    _max: UserAppMaxAggregateOutputType | null;
};
export type GetUserAppGroupByPayload<T extends UserAppGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserAppGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserAppGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserAppGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserAppGroupByOutputType[P]>;
}>>;
export type UserAppWhereInput = {
    AND?: Prisma.UserAppWhereInput | Prisma.UserAppWhereInput[];
    OR?: Prisma.UserAppWhereInput[];
    NOT?: Prisma.UserAppWhereInput | Prisma.UserAppWhereInput[];
    id?: Prisma.IntFilter<"UserApp"> | number;
    userId?: Prisma.IntFilter<"UserApp"> | number;
    appId?: Prisma.IntFilter<"UserApp"> | number;
    roleId?: Prisma.IntFilter<"UserApp"> | number;
    createdAt?: Prisma.DateTimeFilter<"UserApp"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
};
export type UserAppOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    role?: Prisma.RoleOrderByWithRelationInput;
};
export type UserAppWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    userId_appId?: Prisma.UserAppUserIdAppIdCompoundUniqueInput;
    AND?: Prisma.UserAppWhereInput | Prisma.UserAppWhereInput[];
    OR?: Prisma.UserAppWhereInput[];
    NOT?: Prisma.UserAppWhereInput | Prisma.UserAppWhereInput[];
    userId?: Prisma.IntFilter<"UserApp"> | number;
    appId?: Prisma.IntFilter<"UserApp"> | number;
    roleId?: Prisma.IntFilter<"UserApp"> | number;
    createdAt?: Prisma.DateTimeFilter<"UserApp"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    role?: Prisma.XOR<Prisma.RoleScalarRelationFilter, Prisma.RoleWhereInput>;
}, "id" | "userId_appId">;
export type UserAppOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.UserAppCountOrderByAggregateInput;
    _avg?: Prisma.UserAppAvgOrderByAggregateInput;
    _max?: Prisma.UserAppMaxOrderByAggregateInput;
    _min?: Prisma.UserAppMinOrderByAggregateInput;
    _sum?: Prisma.UserAppSumOrderByAggregateInput;
};
export type UserAppScalarWhereWithAggregatesInput = {
    AND?: Prisma.UserAppScalarWhereWithAggregatesInput | Prisma.UserAppScalarWhereWithAggregatesInput[];
    OR?: Prisma.UserAppScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UserAppScalarWhereWithAggregatesInput | Prisma.UserAppScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"UserApp"> | number;
    userId?: Prisma.IntWithAggregatesFilter<"UserApp"> | number;
    appId?: Prisma.IntWithAggregatesFilter<"UserApp"> | number;
    roleId?: Prisma.IntWithAggregatesFilter<"UserApp"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"UserApp"> | Date | string;
};
export type UserAppCreateInput = {
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutUserAppsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutUserAppsInput;
    role: Prisma.RoleCreateNestedOneWithoutUserAppsInput;
};
export type UserAppUncheckedCreateInput = {
    id?: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppUpdateInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutUserAppsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutUserAppsNestedInput;
    role?: Prisma.RoleUpdateOneRequiredWithoutUserAppsNestedInput;
};
export type UserAppUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppCreateManyInput = {
    id?: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppUpdateManyMutationInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppListRelationFilter = {
    every?: Prisma.UserAppWhereInput;
    some?: Prisma.UserAppWhereInput;
    none?: Prisma.UserAppWhereInput;
};
export type UserAppOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type UserAppUserIdAppIdCompoundUniqueInput = {
    userId: number;
    appId: number;
};
export type UserAppCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserAppAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
};
export type UserAppMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserAppMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserAppSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appId?: Prisma.SortOrder;
    roleId?: Prisma.SortOrder;
};
export type UserAppCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput> | Prisma.UserAppCreateWithoutUserInput[] | Prisma.UserAppUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutUserInput | Prisma.UserAppCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserAppCreateManyUserInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput> | Prisma.UserAppCreateWithoutUserInput[] | Prisma.UserAppUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutUserInput | Prisma.UserAppCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserAppCreateManyUserInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput> | Prisma.UserAppCreateWithoutUserInput[] | Prisma.UserAppUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutUserInput | Prisma.UserAppCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutUserInput | Prisma.UserAppUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserAppCreateManyUserInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutUserInput | Prisma.UserAppUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutUserInput | Prisma.UserAppUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput> | Prisma.UserAppCreateWithoutUserInput[] | Prisma.UserAppUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutUserInput | Prisma.UserAppCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutUserInput | Prisma.UserAppUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserAppCreateManyUserInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutUserInput | Prisma.UserAppUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutUserInput | Prisma.UserAppUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput> | Prisma.UserAppCreateWithoutRoleInput[] | Prisma.UserAppUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutRoleInput | Prisma.UserAppCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.UserAppCreateManyRoleInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUncheckedCreateNestedManyWithoutRoleInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput> | Prisma.UserAppCreateWithoutRoleInput[] | Prisma.UserAppUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutRoleInput | Prisma.UserAppCreateOrConnectWithoutRoleInput[];
    createMany?: Prisma.UserAppCreateManyRoleInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput> | Prisma.UserAppCreateWithoutRoleInput[] | Prisma.UserAppUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutRoleInput | Prisma.UserAppCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutRoleInput | Prisma.UserAppUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.UserAppCreateManyRoleInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutRoleInput | Prisma.UserAppUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutRoleInput | Prisma.UserAppUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppUncheckedUpdateManyWithoutRoleNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput> | Prisma.UserAppCreateWithoutRoleInput[] | Prisma.UserAppUncheckedCreateWithoutRoleInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutRoleInput | Prisma.UserAppCreateOrConnectWithoutRoleInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutRoleInput | Prisma.UserAppUpsertWithWhereUniqueWithoutRoleInput[];
    createMany?: Prisma.UserAppCreateManyRoleInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutRoleInput | Prisma.UserAppUpdateWithWhereUniqueWithoutRoleInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutRoleInput | Prisma.UserAppUpdateManyWithWhereWithoutRoleInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput> | Prisma.UserAppCreateWithoutAppClientInput[] | Prisma.UserAppUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutAppClientInput | Prisma.UserAppCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.UserAppCreateManyAppClientInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput> | Prisma.UserAppCreateWithoutAppClientInput[] | Prisma.UserAppUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutAppClientInput | Prisma.UserAppCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.UserAppCreateManyAppClientInputEnvelope;
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
};
export type UserAppUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput> | Prisma.UserAppCreateWithoutAppClientInput[] | Prisma.UserAppUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutAppClientInput | Prisma.UserAppCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutAppClientInput | Prisma.UserAppUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.UserAppCreateManyAppClientInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutAppClientInput | Prisma.UserAppUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutAppClientInput | Prisma.UserAppUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput> | Prisma.UserAppCreateWithoutAppClientInput[] | Prisma.UserAppUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.UserAppCreateOrConnectWithoutAppClientInput | Prisma.UserAppCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.UserAppUpsertWithWhereUniqueWithoutAppClientInput | Prisma.UserAppUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.UserAppCreateManyAppClientInputEnvelope;
    set?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    disconnect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    delete?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    connect?: Prisma.UserAppWhereUniqueInput | Prisma.UserAppWhereUniqueInput[];
    update?: Prisma.UserAppUpdateWithWhereUniqueWithoutAppClientInput | Prisma.UserAppUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.UserAppUpdateManyWithWhereWithoutAppClientInput | Prisma.UserAppUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
};
export type UserAppCreateWithoutUserInput = {
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutUserAppsInput;
    role: Prisma.RoleCreateNestedOneWithoutUserAppsInput;
};
export type UserAppUncheckedCreateWithoutUserInput = {
    id?: number;
    appId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppCreateOrConnectWithoutUserInput = {
    where: Prisma.UserAppWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput>;
};
export type UserAppCreateManyUserInputEnvelope = {
    data: Prisma.UserAppCreateManyUserInput | Prisma.UserAppCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type UserAppUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserAppWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserAppUpdateWithoutUserInput, Prisma.UserAppUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutUserInput, Prisma.UserAppUncheckedCreateWithoutUserInput>;
};
export type UserAppUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserAppWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserAppUpdateWithoutUserInput, Prisma.UserAppUncheckedUpdateWithoutUserInput>;
};
export type UserAppUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.UserAppScalarWhereInput;
    data: Prisma.XOR<Prisma.UserAppUpdateManyMutationInput, Prisma.UserAppUncheckedUpdateManyWithoutUserInput>;
};
export type UserAppScalarWhereInput = {
    AND?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
    OR?: Prisma.UserAppScalarWhereInput[];
    NOT?: Prisma.UserAppScalarWhereInput | Prisma.UserAppScalarWhereInput[];
    id?: Prisma.IntFilter<"UserApp"> | number;
    userId?: Prisma.IntFilter<"UserApp"> | number;
    appId?: Prisma.IntFilter<"UserApp"> | number;
    roleId?: Prisma.IntFilter<"UserApp"> | number;
    createdAt?: Prisma.DateTimeFilter<"UserApp"> | Date | string;
};
export type UserAppCreateWithoutRoleInput = {
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutUserAppsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutUserAppsInput;
};
export type UserAppUncheckedCreateWithoutRoleInput = {
    id?: number;
    userId: number;
    appId: number;
    createdAt?: Date | string;
};
export type UserAppCreateOrConnectWithoutRoleInput = {
    where: Prisma.UserAppWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput>;
};
export type UserAppCreateManyRoleInputEnvelope = {
    data: Prisma.UserAppCreateManyRoleInput | Prisma.UserAppCreateManyRoleInput[];
    skipDuplicates?: boolean;
};
export type UserAppUpsertWithWhereUniqueWithoutRoleInput = {
    where: Prisma.UserAppWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserAppUpdateWithoutRoleInput, Prisma.UserAppUncheckedUpdateWithoutRoleInput>;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutRoleInput, Prisma.UserAppUncheckedCreateWithoutRoleInput>;
};
export type UserAppUpdateWithWhereUniqueWithoutRoleInput = {
    where: Prisma.UserAppWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserAppUpdateWithoutRoleInput, Prisma.UserAppUncheckedUpdateWithoutRoleInput>;
};
export type UserAppUpdateManyWithWhereWithoutRoleInput = {
    where: Prisma.UserAppScalarWhereInput;
    data: Prisma.XOR<Prisma.UserAppUpdateManyMutationInput, Prisma.UserAppUncheckedUpdateManyWithoutRoleInput>;
};
export type UserAppCreateWithoutAppClientInput = {
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutUserAppsInput;
    role: Prisma.RoleCreateNestedOneWithoutUserAppsInput;
};
export type UserAppUncheckedCreateWithoutAppClientInput = {
    id?: number;
    userId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppCreateOrConnectWithoutAppClientInput = {
    where: Prisma.UserAppWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput>;
};
export type UserAppCreateManyAppClientInputEnvelope = {
    data: Prisma.UserAppCreateManyAppClientInput | Prisma.UserAppCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type UserAppUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.UserAppWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserAppUpdateWithoutAppClientInput, Prisma.UserAppUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.UserAppCreateWithoutAppClientInput, Prisma.UserAppUncheckedCreateWithoutAppClientInput>;
};
export type UserAppUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.UserAppWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserAppUpdateWithoutAppClientInput, Prisma.UserAppUncheckedUpdateWithoutAppClientInput>;
};
export type UserAppUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.UserAppScalarWhereInput;
    data: Prisma.XOR<Prisma.UserAppUpdateManyMutationInput, Prisma.UserAppUncheckedUpdateManyWithoutAppClientInput>;
};
export type UserAppCreateManyUserInput = {
    id?: number;
    appId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppUpdateWithoutUserInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutUserAppsNestedInput;
    role?: Prisma.RoleUpdateOneRequiredWithoutUserAppsNestedInput;
};
export type UserAppUncheckedUpdateWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppCreateManyRoleInput = {
    id?: number;
    userId: number;
    appId: number;
    createdAt?: Date | string;
};
export type UserAppUpdateWithoutRoleInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutUserAppsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutUserAppsNestedInput;
};
export type UserAppUncheckedUpdateWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppUncheckedUpdateManyWithoutRoleInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppCreateManyAppClientInput = {
    id?: number;
    userId: number;
    roleId: number;
    createdAt?: Date | string;
};
export type UserAppUpdateWithoutAppClientInput = {
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutUserAppsNestedInput;
    role?: Prisma.RoleUpdateOneRequiredWithoutUserAppsNestedInput;
};
export type UserAppUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    roleId?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserAppSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appId?: boolean;
    roleId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userApp"]>;
export type UserAppSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appId?: boolean;
    roleId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userApp"]>;
export type UserAppSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appId?: boolean;
    roleId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userApp"]>;
export type UserAppSelectScalar = {
    id?: boolean;
    userId?: boolean;
    appId?: boolean;
    roleId?: boolean;
    createdAt?: boolean;
};
export type UserAppOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "appId" | "roleId" | "createdAt", ExtArgs["result"]["userApp"]>;
export type UserAppInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
};
export type UserAppIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
};
export type UserAppIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    role?: boolean | Prisma.RoleDefaultArgs<ExtArgs>;
};
export type $UserAppPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserApp";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        role: Prisma.$RolePayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        userId: number;
        appId: number;
        roleId: number;
        createdAt: Date;
    }, ExtArgs["result"]["userApp"]>;
    composites: {};
};
export type UserAppGetPayload<S extends boolean | null | undefined | UserAppDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UserAppPayload, S>;
export type UserAppCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UserAppFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserAppCountAggregateInputType | true;
};
export interface UserAppDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['UserApp'];
        meta: {
            name: 'UserApp';
        };
    };
    findUnique<T extends UserAppFindUniqueArgs>(args: Prisma.SelectSubset<T, UserAppFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends UserAppFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UserAppFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends UserAppFindFirstArgs>(args?: Prisma.SelectSubset<T, UserAppFindFirstArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends UserAppFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UserAppFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends UserAppFindManyArgs>(args?: Prisma.SelectSubset<T, UserAppFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends UserAppCreateArgs>(args: Prisma.SelectSubset<T, UserAppCreateArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends UserAppCreateManyArgs>(args?: Prisma.SelectSubset<T, UserAppCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends UserAppCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UserAppCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends UserAppDeleteArgs>(args: Prisma.SelectSubset<T, UserAppDeleteArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends UserAppUpdateArgs>(args: Prisma.SelectSubset<T, UserAppUpdateArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends UserAppDeleteManyArgs>(args?: Prisma.SelectSubset<T, UserAppDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends UserAppUpdateManyArgs>(args: Prisma.SelectSubset<T, UserAppUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends UserAppUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UserAppUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends UserAppUpsertArgs>(args: Prisma.SelectSubset<T, UserAppUpsertArgs<ExtArgs>>): Prisma.Prisma__UserAppClient<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends UserAppCountArgs>(args?: Prisma.Subset<T, UserAppCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserAppCountAggregateOutputType> : number>;
    aggregate<T extends UserAppAggregateArgs>(args: Prisma.Subset<T, UserAppAggregateArgs>): Prisma.PrismaPromise<GetUserAppAggregateType<T>>;
    groupBy<T extends UserAppGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UserAppGroupByArgs['orderBy'];
    } : {
        orderBy?: UserAppGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UserAppGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserAppGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: UserAppFieldRefs;
}
export interface Prisma__UserAppClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    role<T extends Prisma.RoleDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RoleDefaultArgs<ExtArgs>>): Prisma.Prisma__RoleClient<runtime.Types.Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface UserAppFieldRefs {
    readonly id: Prisma.FieldRef<"UserApp", 'Int'>;
    readonly userId: Prisma.FieldRef<"UserApp", 'Int'>;
    readonly appId: Prisma.FieldRef<"UserApp", 'Int'>;
    readonly roleId: Prisma.FieldRef<"UserApp", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"UserApp", 'DateTime'>;
}
export type UserAppFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    where: Prisma.UserAppWhereUniqueInput;
};
export type UserAppFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    where: Prisma.UserAppWhereUniqueInput;
};
export type UserAppFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type UserAppFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type UserAppFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type UserAppCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserAppCreateInput, Prisma.UserAppUncheckedCreateInput>;
};
export type UserAppCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.UserAppCreateManyInput | Prisma.UserAppCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UserAppCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    data: Prisma.UserAppCreateManyInput | Prisma.UserAppCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.UserAppIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type UserAppUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserAppUpdateInput, Prisma.UserAppUncheckedUpdateInput>;
    where: Prisma.UserAppWhereUniqueInput;
};
export type UserAppUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.UserAppUpdateManyMutationInput, Prisma.UserAppUncheckedUpdateManyInput>;
    where?: Prisma.UserAppWhereInput;
    limit?: number;
};
export type UserAppUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserAppUpdateManyMutationInput, Prisma.UserAppUncheckedUpdateManyInput>;
    where?: Prisma.UserAppWhereInput;
    limit?: number;
    include?: Prisma.UserAppIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type UserAppUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    where: Prisma.UserAppWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserAppCreateInput, Prisma.UserAppUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.UserAppUpdateInput, Prisma.UserAppUncheckedUpdateInput>;
};
export type UserAppDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
    where: Prisma.UserAppWhereUniqueInput;
};
export type UserAppDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserAppWhereInput;
    limit?: number;
};
export type UserAppDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserAppSelect<ExtArgs> | null;
    omit?: Prisma.UserAppOmit<ExtArgs> | null;
    include?: Prisma.UserAppInclude<ExtArgs> | null;
};
