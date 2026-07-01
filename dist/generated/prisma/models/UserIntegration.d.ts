import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type UserIntegrationModel = runtime.Types.Result.DefaultSelection<Prisma.$UserIntegrationPayload>;
export type AggregateUserIntegration = {
    _count: UserIntegrationCountAggregateOutputType | null;
    _avg: UserIntegrationAvgAggregateOutputType | null;
    _sum: UserIntegrationSumAggregateOutputType | null;
    _min: UserIntegrationMinAggregateOutputType | null;
    _max: UserIntegrationMaxAggregateOutputType | null;
};
export type UserIntegrationAvgAggregateOutputType = {
    id: number | null;
    userId: number | null;
    integrationId: number | null;
};
export type UserIntegrationSumAggregateOutputType = {
    id: number | null;
    userId: number | null;
    integrationId: number | null;
};
export type UserIntegrationMinAggregateOutputType = {
    id: number | null;
    userId: number | null;
    integrationId: number | null;
    userApiKey: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserIntegrationMaxAggregateOutputType = {
    id: number | null;
    userId: number | null;
    integrationId: number | null;
    userApiKey: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UserIntegrationCountAggregateOutputType = {
    id: number;
    userId: number;
    integrationId: number;
    userApiKey: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type UserIntegrationAvgAggregateInputType = {
    id?: true;
    userId?: true;
    integrationId?: true;
};
export type UserIntegrationSumAggregateInputType = {
    id?: true;
    userId?: true;
    integrationId?: true;
};
export type UserIntegrationMinAggregateInputType = {
    id?: true;
    userId?: true;
    integrationId?: true;
    userApiKey?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserIntegrationMaxAggregateInputType = {
    id?: true;
    userId?: true;
    integrationId?: true;
    userApiKey?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UserIntegrationCountAggregateInputType = {
    id?: true;
    userId?: true;
    integrationId?: true;
    userApiKey?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type UserIntegrationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithRelationInput | Prisma.UserIntegrationOrderByWithRelationInput[];
    cursor?: Prisma.UserIntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UserIntegrationCountAggregateInputType;
    _avg?: UserIntegrationAvgAggregateInputType;
    _sum?: UserIntegrationSumAggregateInputType;
    _min?: UserIntegrationMinAggregateInputType;
    _max?: UserIntegrationMaxAggregateInputType;
};
export type GetUserIntegrationAggregateType<T extends UserIntegrationAggregateArgs> = {
    [P in keyof T & keyof AggregateUserIntegration]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUserIntegration[P]> : Prisma.GetScalarType<T[P], AggregateUserIntegration[P]>;
};
export type UserIntegrationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithAggregationInput | Prisma.UserIntegrationOrderByWithAggregationInput[];
    by: Prisma.UserIntegrationScalarFieldEnum[] | Prisma.UserIntegrationScalarFieldEnum;
    having?: Prisma.UserIntegrationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserIntegrationCountAggregateInputType | true;
    _avg?: UserIntegrationAvgAggregateInputType;
    _sum?: UserIntegrationSumAggregateInputType;
    _min?: UserIntegrationMinAggregateInputType;
    _max?: UserIntegrationMaxAggregateInputType;
};
export type UserIntegrationGroupByOutputType = {
    id: number;
    userId: number;
    integrationId: number;
    userApiKey: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: UserIntegrationCountAggregateOutputType | null;
    _avg: UserIntegrationAvgAggregateOutputType | null;
    _sum: UserIntegrationSumAggregateOutputType | null;
    _min: UserIntegrationMinAggregateOutputType | null;
    _max: UserIntegrationMaxAggregateOutputType | null;
};
export type GetUserIntegrationGroupByPayload<T extends UserIntegrationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserIntegrationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserIntegrationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserIntegrationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserIntegrationGroupByOutputType[P]>;
}>>;
export type UserIntegrationWhereInput = {
    AND?: Prisma.UserIntegrationWhereInput | Prisma.UserIntegrationWhereInput[];
    OR?: Prisma.UserIntegrationWhereInput[];
    NOT?: Prisma.UserIntegrationWhereInput | Prisma.UserIntegrationWhereInput[];
    id?: Prisma.IntFilter<"UserIntegration"> | number;
    userId?: Prisma.IntFilter<"UserIntegration"> | number;
    integrationId?: Prisma.IntFilter<"UserIntegration"> | number;
    userApiKey?: Prisma.StringFilter<"UserIntegration"> | string;
    isActive?: Prisma.BoolFilter<"UserIntegration"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    integration?: Prisma.XOR<Prisma.IntegrationScalarRelationFilter, Prisma.IntegrationWhereInput>;
};
export type UserIntegrationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
    userApiKey?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    integration?: Prisma.IntegrationOrderByWithRelationInput;
};
export type UserIntegrationWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    userId_integrationId?: Prisma.UserIntegrationUserIdIntegrationIdCompoundUniqueInput;
    AND?: Prisma.UserIntegrationWhereInput | Prisma.UserIntegrationWhereInput[];
    OR?: Prisma.UserIntegrationWhereInput[];
    NOT?: Prisma.UserIntegrationWhereInput | Prisma.UserIntegrationWhereInput[];
    userId?: Prisma.IntFilter<"UserIntegration"> | number;
    integrationId?: Prisma.IntFilter<"UserIntegration"> | number;
    userApiKey?: Prisma.StringFilter<"UserIntegration"> | string;
    isActive?: Prisma.BoolFilter<"UserIntegration"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    integration?: Prisma.XOR<Prisma.IntegrationScalarRelationFilter, Prisma.IntegrationWhereInput>;
}, "id" | "userId_integrationId">;
export type UserIntegrationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
    userApiKey?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.UserIntegrationCountOrderByAggregateInput;
    _avg?: Prisma.UserIntegrationAvgOrderByAggregateInput;
    _max?: Prisma.UserIntegrationMaxOrderByAggregateInput;
    _min?: Prisma.UserIntegrationMinOrderByAggregateInput;
    _sum?: Prisma.UserIntegrationSumOrderByAggregateInput;
};
export type UserIntegrationScalarWhereWithAggregatesInput = {
    AND?: Prisma.UserIntegrationScalarWhereWithAggregatesInput | Prisma.UserIntegrationScalarWhereWithAggregatesInput[];
    OR?: Prisma.UserIntegrationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UserIntegrationScalarWhereWithAggregatesInput | Prisma.UserIntegrationScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"UserIntegration"> | number;
    userId?: Prisma.IntWithAggregatesFilter<"UserIntegration"> | number;
    integrationId?: Prisma.IntWithAggregatesFilter<"UserIntegration"> | number;
    userApiKey?: Prisma.StringWithAggregatesFilter<"UserIntegration"> | string;
    isActive?: Prisma.BoolWithAggregatesFilter<"UserIntegration"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"UserIntegration"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"UserIntegration"> | Date | string;
};
export type UserIntegrationCreateInput = {
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutUserIntegrationsInput;
    integration: Prisma.IntegrationCreateNestedOneWithoutUserIntegrationsInput;
};
export type UserIntegrationUncheckedCreateInput = {
    id?: number;
    userId: number;
    integrationId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationUpdateInput = {
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutUserIntegrationsNestedInput;
    integration?: Prisma.IntegrationUpdateOneRequiredWithoutUserIntegrationsNestedInput;
};
export type UserIntegrationUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    integrationId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationCreateManyInput = {
    id?: number;
    userId: number;
    integrationId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationUpdateManyMutationInput = {
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    integrationId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationListRelationFilter = {
    every?: Prisma.UserIntegrationWhereInput;
    some?: Prisma.UserIntegrationWhereInput;
    none?: Prisma.UserIntegrationWhereInput;
};
export type UserIntegrationOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type UserIntegrationUserIdIntegrationIdCompoundUniqueInput = {
    userId: number;
    integrationId: number;
};
export type UserIntegrationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
    userApiKey?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserIntegrationAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
};
export type UserIntegrationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
    userApiKey?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserIntegrationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
    userApiKey?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UserIntegrationSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    integrationId?: Prisma.SortOrder;
};
export type UserIntegrationCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput> | Prisma.UserIntegrationCreateWithoutUserInput[] | Prisma.UserIntegrationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutUserInput | Prisma.UserIntegrationCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserIntegrationCreateManyUserInputEnvelope;
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
};
export type UserIntegrationUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput> | Prisma.UserIntegrationCreateWithoutUserInput[] | Prisma.UserIntegrationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutUserInput | Prisma.UserIntegrationCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.UserIntegrationCreateManyUserInputEnvelope;
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
};
export type UserIntegrationUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput> | Prisma.UserIntegrationCreateWithoutUserInput[] | Prisma.UserIntegrationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutUserInput | Prisma.UserIntegrationCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserIntegrationUpsertWithWhereUniqueWithoutUserInput | Prisma.UserIntegrationUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserIntegrationCreateManyUserInputEnvelope;
    set?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    disconnect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    delete?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    update?: Prisma.UserIntegrationUpdateWithWhereUniqueWithoutUserInput | Prisma.UserIntegrationUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserIntegrationUpdateManyWithWhereWithoutUserInput | Prisma.UserIntegrationUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
};
export type UserIntegrationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput> | Prisma.UserIntegrationCreateWithoutUserInput[] | Prisma.UserIntegrationUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutUserInput | Prisma.UserIntegrationCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.UserIntegrationUpsertWithWhereUniqueWithoutUserInput | Prisma.UserIntegrationUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.UserIntegrationCreateManyUserInputEnvelope;
    set?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    disconnect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    delete?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    update?: Prisma.UserIntegrationUpdateWithWhereUniqueWithoutUserInput | Prisma.UserIntegrationUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.UserIntegrationUpdateManyWithWhereWithoutUserInput | Prisma.UserIntegrationUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
};
export type UserIntegrationCreateNestedManyWithoutIntegrationInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput> | Prisma.UserIntegrationCreateWithoutIntegrationInput[] | Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput | Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput[];
    createMany?: Prisma.UserIntegrationCreateManyIntegrationInputEnvelope;
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
};
export type UserIntegrationUncheckedCreateNestedManyWithoutIntegrationInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput> | Prisma.UserIntegrationCreateWithoutIntegrationInput[] | Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput | Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput[];
    createMany?: Prisma.UserIntegrationCreateManyIntegrationInputEnvelope;
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
};
export type UserIntegrationUpdateManyWithoutIntegrationNestedInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput> | Prisma.UserIntegrationCreateWithoutIntegrationInput[] | Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput | Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput[];
    upsert?: Prisma.UserIntegrationUpsertWithWhereUniqueWithoutIntegrationInput | Prisma.UserIntegrationUpsertWithWhereUniqueWithoutIntegrationInput[];
    createMany?: Prisma.UserIntegrationCreateManyIntegrationInputEnvelope;
    set?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    disconnect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    delete?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    update?: Prisma.UserIntegrationUpdateWithWhereUniqueWithoutIntegrationInput | Prisma.UserIntegrationUpdateWithWhereUniqueWithoutIntegrationInput[];
    updateMany?: Prisma.UserIntegrationUpdateManyWithWhereWithoutIntegrationInput | Prisma.UserIntegrationUpdateManyWithWhereWithoutIntegrationInput[];
    deleteMany?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
};
export type UserIntegrationUncheckedUpdateManyWithoutIntegrationNestedInput = {
    create?: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput> | Prisma.UserIntegrationCreateWithoutIntegrationInput[] | Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput[];
    connectOrCreate?: Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput | Prisma.UserIntegrationCreateOrConnectWithoutIntegrationInput[];
    upsert?: Prisma.UserIntegrationUpsertWithWhereUniqueWithoutIntegrationInput | Prisma.UserIntegrationUpsertWithWhereUniqueWithoutIntegrationInput[];
    createMany?: Prisma.UserIntegrationCreateManyIntegrationInputEnvelope;
    set?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    disconnect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    delete?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    connect?: Prisma.UserIntegrationWhereUniqueInput | Prisma.UserIntegrationWhereUniqueInput[];
    update?: Prisma.UserIntegrationUpdateWithWhereUniqueWithoutIntegrationInput | Prisma.UserIntegrationUpdateWithWhereUniqueWithoutIntegrationInput[];
    updateMany?: Prisma.UserIntegrationUpdateManyWithWhereWithoutIntegrationInput | Prisma.UserIntegrationUpdateManyWithWhereWithoutIntegrationInput[];
    deleteMany?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
};
export type UserIntegrationCreateWithoutUserInput = {
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    integration: Prisma.IntegrationCreateNestedOneWithoutUserIntegrationsInput;
};
export type UserIntegrationUncheckedCreateWithoutUserInput = {
    id?: number;
    integrationId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationCreateOrConnectWithoutUserInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput>;
};
export type UserIntegrationCreateManyUserInputEnvelope = {
    data: Prisma.UserIntegrationCreateManyUserInput | Prisma.UserIntegrationCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type UserIntegrationUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserIntegrationUpdateWithoutUserInput, Prisma.UserIntegrationUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.UserIntegrationCreateWithoutUserInput, Prisma.UserIntegrationUncheckedCreateWithoutUserInput>;
};
export type UserIntegrationUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateWithoutUserInput, Prisma.UserIntegrationUncheckedUpdateWithoutUserInput>;
};
export type UserIntegrationUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.UserIntegrationScalarWhereInput;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateManyMutationInput, Prisma.UserIntegrationUncheckedUpdateManyWithoutUserInput>;
};
export type UserIntegrationScalarWhereInput = {
    AND?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
    OR?: Prisma.UserIntegrationScalarWhereInput[];
    NOT?: Prisma.UserIntegrationScalarWhereInput | Prisma.UserIntegrationScalarWhereInput[];
    id?: Prisma.IntFilter<"UserIntegration"> | number;
    userId?: Prisma.IntFilter<"UserIntegration"> | number;
    integrationId?: Prisma.IntFilter<"UserIntegration"> | number;
    userApiKey?: Prisma.StringFilter<"UserIntegration"> | string;
    isActive?: Prisma.BoolFilter<"UserIntegration"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UserIntegration"> | Date | string;
};
export type UserIntegrationCreateWithoutIntegrationInput = {
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutUserIntegrationsInput;
};
export type UserIntegrationUncheckedCreateWithoutIntegrationInput = {
    id?: number;
    userId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationCreateOrConnectWithoutIntegrationInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput>;
};
export type UserIntegrationCreateManyIntegrationInputEnvelope = {
    data: Prisma.UserIntegrationCreateManyIntegrationInput | Prisma.UserIntegrationCreateManyIntegrationInput[];
    skipDuplicates?: boolean;
};
export type UserIntegrationUpsertWithWhereUniqueWithoutIntegrationInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    update: Prisma.XOR<Prisma.UserIntegrationUpdateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedUpdateWithoutIntegrationInput>;
    create: Prisma.XOR<Prisma.UserIntegrationCreateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedCreateWithoutIntegrationInput>;
};
export type UserIntegrationUpdateWithWhereUniqueWithoutIntegrationInput = {
    where: Prisma.UserIntegrationWhereUniqueInput;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateWithoutIntegrationInput, Prisma.UserIntegrationUncheckedUpdateWithoutIntegrationInput>;
};
export type UserIntegrationUpdateManyWithWhereWithoutIntegrationInput = {
    where: Prisma.UserIntegrationScalarWhereInput;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateManyMutationInput, Prisma.UserIntegrationUncheckedUpdateManyWithoutIntegrationInput>;
};
export type UserIntegrationCreateManyUserInput = {
    id?: number;
    integrationId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationUpdateWithoutUserInput = {
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    integration?: Prisma.IntegrationUpdateOneRequiredWithoutUserIntegrationsNestedInput;
};
export type UserIntegrationUncheckedUpdateWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    integrationId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    integrationId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationCreateManyIntegrationInput = {
    id?: number;
    userId: number;
    userApiKey: string;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UserIntegrationUpdateWithoutIntegrationInput = {
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutUserIntegrationsNestedInput;
};
export type UserIntegrationUncheckedUpdateWithoutIntegrationInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationUncheckedUpdateManyWithoutIntegrationInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    userApiKey?: Prisma.StringFieldUpdateOperationsInput | string;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserIntegrationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    integrationId?: boolean;
    userApiKey?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userIntegration"]>;
export type UserIntegrationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    integrationId?: boolean;
    userApiKey?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userIntegration"]>;
export type UserIntegrationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    integrationId?: boolean;
    userApiKey?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["userIntegration"]>;
export type UserIntegrationSelectScalar = {
    id?: boolean;
    userId?: boolean;
    integrationId?: boolean;
    userApiKey?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type UserIntegrationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "integrationId" | "userApiKey" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["userIntegration"]>;
export type UserIntegrationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
};
export type UserIntegrationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
};
export type UserIntegrationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    integration?: boolean | Prisma.IntegrationDefaultArgs<ExtArgs>;
};
export type $UserIntegrationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserIntegration";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        integration: Prisma.$IntegrationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        userId: number;
        integrationId: number;
        userApiKey: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["userIntegration"]>;
    composites: {};
};
export type UserIntegrationGetPayload<S extends boolean | null | undefined | UserIntegrationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload, S>;
export type UserIntegrationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UserIntegrationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserIntegrationCountAggregateInputType | true;
};
export interface UserIntegrationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['UserIntegration'];
        meta: {
            name: 'UserIntegration';
        };
    };
    findUnique<T extends UserIntegrationFindUniqueArgs>(args: Prisma.SelectSubset<T, UserIntegrationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends UserIntegrationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UserIntegrationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends UserIntegrationFindFirstArgs>(args?: Prisma.SelectSubset<T, UserIntegrationFindFirstArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends UserIntegrationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UserIntegrationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends UserIntegrationFindManyArgs>(args?: Prisma.SelectSubset<T, UserIntegrationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends UserIntegrationCreateArgs>(args: Prisma.SelectSubset<T, UserIntegrationCreateArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends UserIntegrationCreateManyArgs>(args?: Prisma.SelectSubset<T, UserIntegrationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends UserIntegrationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UserIntegrationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends UserIntegrationDeleteArgs>(args: Prisma.SelectSubset<T, UserIntegrationDeleteArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends UserIntegrationUpdateArgs>(args: Prisma.SelectSubset<T, UserIntegrationUpdateArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends UserIntegrationDeleteManyArgs>(args?: Prisma.SelectSubset<T, UserIntegrationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends UserIntegrationUpdateManyArgs>(args: Prisma.SelectSubset<T, UserIntegrationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends UserIntegrationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UserIntegrationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends UserIntegrationUpsertArgs>(args: Prisma.SelectSubset<T, UserIntegrationUpsertArgs<ExtArgs>>): Prisma.Prisma__UserIntegrationClient<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends UserIntegrationCountArgs>(args?: Prisma.Subset<T, UserIntegrationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserIntegrationCountAggregateOutputType> : number>;
    aggregate<T extends UserIntegrationAggregateArgs>(args: Prisma.Subset<T, UserIntegrationAggregateArgs>): Prisma.PrismaPromise<GetUserIntegrationAggregateType<T>>;
    groupBy<T extends UserIntegrationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UserIntegrationGroupByArgs['orderBy'];
    } : {
        orderBy?: UserIntegrationGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UserIntegrationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserIntegrationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: UserIntegrationFieldRefs;
}
export interface Prisma__UserIntegrationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    integration<T extends Prisma.IntegrationDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.IntegrationDefaultArgs<ExtArgs>>): Prisma.Prisma__IntegrationClient<runtime.Types.Result.GetResult<Prisma.$IntegrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface UserIntegrationFieldRefs {
    readonly id: Prisma.FieldRef<"UserIntegration", 'Int'>;
    readonly userId: Prisma.FieldRef<"UserIntegration", 'Int'>;
    readonly integrationId: Prisma.FieldRef<"UserIntegration", 'Int'>;
    readonly userApiKey: Prisma.FieldRef<"UserIntegration", 'String'>;
    readonly isActive: Prisma.FieldRef<"UserIntegration", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"UserIntegration", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"UserIntegration", 'DateTime'>;
}
export type UserIntegrationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where: Prisma.UserIntegrationWhereUniqueInput;
};
export type UserIntegrationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where: Prisma.UserIntegrationWhereUniqueInput;
};
export type UserIntegrationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithRelationInput | Prisma.UserIntegrationOrderByWithRelationInput[];
    cursor?: Prisma.UserIntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserIntegrationScalarFieldEnum | Prisma.UserIntegrationScalarFieldEnum[];
};
export type UserIntegrationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithRelationInput | Prisma.UserIntegrationOrderByWithRelationInput[];
    cursor?: Prisma.UserIntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserIntegrationScalarFieldEnum | Prisma.UserIntegrationScalarFieldEnum[];
};
export type UserIntegrationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where?: Prisma.UserIntegrationWhereInput;
    orderBy?: Prisma.UserIntegrationOrderByWithRelationInput | Prisma.UserIntegrationOrderByWithRelationInput[];
    cursor?: Prisma.UserIntegrationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserIntegrationScalarFieldEnum | Prisma.UserIntegrationScalarFieldEnum[];
};
export type UserIntegrationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserIntegrationCreateInput, Prisma.UserIntegrationUncheckedCreateInput>;
};
export type UserIntegrationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.UserIntegrationCreateManyInput | Prisma.UserIntegrationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UserIntegrationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    data: Prisma.UserIntegrationCreateManyInput | Prisma.UserIntegrationCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.UserIntegrationIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type UserIntegrationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateInput, Prisma.UserIntegrationUncheckedUpdateInput>;
    where: Prisma.UserIntegrationWhereUniqueInput;
};
export type UserIntegrationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.UserIntegrationUpdateManyMutationInput, Prisma.UserIntegrationUncheckedUpdateManyInput>;
    where?: Prisma.UserIntegrationWhereInput;
    limit?: number;
};
export type UserIntegrationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserIntegrationUpdateManyMutationInput, Prisma.UserIntegrationUncheckedUpdateManyInput>;
    where?: Prisma.UserIntegrationWhereInput;
    limit?: number;
    include?: Prisma.UserIntegrationIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type UserIntegrationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where: Prisma.UserIntegrationWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserIntegrationCreateInput, Prisma.UserIntegrationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.UserIntegrationUpdateInput, Prisma.UserIntegrationUncheckedUpdateInput>;
};
export type UserIntegrationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
    where: Prisma.UserIntegrationWhereUniqueInput;
};
export type UserIntegrationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserIntegrationWhereInput;
    limit?: number;
};
export type UserIntegrationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserIntegrationSelect<ExtArgs> | null;
    omit?: Prisma.UserIntegrationOmit<ExtArgs> | null;
    include?: Prisma.UserIntegrationInclude<ExtArgs> | null;
};
