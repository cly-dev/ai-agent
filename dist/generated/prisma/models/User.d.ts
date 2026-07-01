import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type UserModel = runtime.Types.Result.DefaultSelection<Prisma.$UserPayload>;
export type AggregateUser = {
    _count: UserCountAggregateOutputType | null;
    _avg: UserAvgAggregateOutputType | null;
    _sum: UserSumAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
export type UserAvgAggregateOutputType = {
    id: number | null;
};
export type UserSumAggregateOutputType = {
    id: number | null;
};
export type UserMinAggregateOutputType = {
    id: number | null;
    employeeId: string | null;
    email: string | null;
    password: string | null;
    username: string | null;
    status: $Enums.UserStatus | null;
    mustChangePassword: boolean | null;
    createdAt: Date | null;
};
export type UserMaxAggregateOutputType = {
    id: number | null;
    employeeId: string | null;
    email: string | null;
    password: string | null;
    username: string | null;
    status: $Enums.UserStatus | null;
    mustChangePassword: boolean | null;
    createdAt: Date | null;
};
export type UserCountAggregateOutputType = {
    id: number;
    employeeId: number;
    email: number;
    password: number;
    username: number;
    status: number;
    mustChangePassword: number;
    createdAt: number;
    _all: number;
};
export type UserAvgAggregateInputType = {
    id?: true;
};
export type UserSumAggregateInputType = {
    id?: true;
};
export type UserMinAggregateInputType = {
    id?: true;
    employeeId?: true;
    email?: true;
    password?: true;
    username?: true;
    status?: true;
    mustChangePassword?: true;
    createdAt?: true;
};
export type UserMaxAggregateInputType = {
    id?: true;
    employeeId?: true;
    email?: true;
    password?: true;
    username?: true;
    status?: true;
    mustChangePassword?: true;
    createdAt?: true;
};
export type UserCountAggregateInputType = {
    id?: true;
    employeeId?: true;
    email?: true;
    password?: true;
    username?: true;
    status?: true;
    mustChangePassword?: true;
    createdAt?: true;
    _all?: true;
};
export type UserAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    cursor?: Prisma.UserWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UserCountAggregateInputType;
    _avg?: UserAvgAggregateInputType;
    _sum?: UserSumAggregateInputType;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
};
export type GetUserAggregateType<T extends UserAggregateArgs> = {
    [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUser[P]> : Prisma.GetScalarType<T[P], AggregateUser[P]>;
};
export type UserGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithAggregationInput | Prisma.UserOrderByWithAggregationInput[];
    by: Prisma.UserScalarFieldEnum[] | Prisma.UserScalarFieldEnum;
    having?: Prisma.UserScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserCountAggregateInputType | true;
    _avg?: UserAvgAggregateInputType;
    _sum?: UserSumAggregateInputType;
    _min?: UserMinAggregateInputType;
    _max?: UserMaxAggregateInputType;
};
export type UserGroupByOutputType = {
    id: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status: $Enums.UserStatus;
    mustChangePassword: boolean;
    createdAt: Date;
    _count: UserCountAggregateOutputType | null;
    _avg: UserAvgAggregateOutputType | null;
    _sum: UserSumAggregateOutputType | null;
    _min: UserMinAggregateOutputType | null;
    _max: UserMaxAggregateOutputType | null;
};
export type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UserGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UserGroupByOutputType[P]>;
}>>;
export type UserWhereInput = {
    AND?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    OR?: Prisma.UserWhereInput[];
    NOT?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    id?: Prisma.IntFilter<"User"> | number;
    employeeId?: Prisma.StringFilter<"User"> | string;
    email?: Prisma.StringFilter<"User"> | string;
    password?: Prisma.StringFilter<"User"> | string;
    username?: Prisma.StringFilter<"User"> | string;
    status?: Prisma.EnumUserStatusFilter<"User"> | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFilter<"User"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    sessions?: Prisma.SessionListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    messageFeedbacks?: Prisma.MessageFeedbackListRelationFilter;
    llmModelConfigs?: Prisma.UserLlmModelConfigListRelationFilter;
    userApps?: Prisma.UserAppListRelationFilter;
    userIntegrations?: Prisma.UserIntegrationListRelationFilter;
    pageActionRuns?: Prisma.PageActionRunListRelationFilter;
    approvalsInitiated?: Prisma.ApprovalRequestListRelationFilter;
    approvalsToApprove?: Prisma.ApprovalRequestListRelationFilter;
};
export type UserOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    employeeId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    sessions?: Prisma.SessionOrderByRelationAggregateInput;
    messageTurns?: Prisma.MessageTurnOrderByRelationAggregateInput;
    messageFeedbacks?: Prisma.MessageFeedbackOrderByRelationAggregateInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigOrderByRelationAggregateInput;
    userApps?: Prisma.UserAppOrderByRelationAggregateInput;
    userIntegrations?: Prisma.UserIntegrationOrderByRelationAggregateInput;
    pageActionRuns?: Prisma.PageActionRunOrderByRelationAggregateInput;
    approvalsInitiated?: Prisma.ApprovalRequestOrderByRelationAggregateInput;
    approvalsToApprove?: Prisma.ApprovalRequestOrderByRelationAggregateInput;
};
export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    employeeId?: string;
    AND?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    OR?: Prisma.UserWhereInput[];
    NOT?: Prisma.UserWhereInput | Prisma.UserWhereInput[];
    email?: Prisma.StringFilter<"User"> | string;
    password?: Prisma.StringFilter<"User"> | string;
    username?: Prisma.StringFilter<"User"> | string;
    status?: Prisma.EnumUserStatusFilter<"User"> | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFilter<"User"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"User"> | Date | string;
    sessions?: Prisma.SessionListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    messageFeedbacks?: Prisma.MessageFeedbackListRelationFilter;
    llmModelConfigs?: Prisma.UserLlmModelConfigListRelationFilter;
    userApps?: Prisma.UserAppListRelationFilter;
    userIntegrations?: Prisma.UserIntegrationListRelationFilter;
    pageActionRuns?: Prisma.PageActionRunListRelationFilter;
    approvalsInitiated?: Prisma.ApprovalRequestListRelationFilter;
    approvalsToApprove?: Prisma.ApprovalRequestListRelationFilter;
}, "id" | "employeeId">;
export type UserOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    employeeId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.UserCountOrderByAggregateInput;
    _avg?: Prisma.UserAvgOrderByAggregateInput;
    _max?: Prisma.UserMaxOrderByAggregateInput;
    _min?: Prisma.UserMinOrderByAggregateInput;
    _sum?: Prisma.UserSumOrderByAggregateInput;
};
export type UserScalarWhereWithAggregatesInput = {
    AND?: Prisma.UserScalarWhereWithAggregatesInput | Prisma.UserScalarWhereWithAggregatesInput[];
    OR?: Prisma.UserScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UserScalarWhereWithAggregatesInput | Prisma.UserScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"User"> | number;
    employeeId?: Prisma.StringWithAggregatesFilter<"User"> | string;
    email?: Prisma.StringWithAggregatesFilter<"User"> | string;
    password?: Prisma.StringWithAggregatesFilter<"User"> | string;
    username?: Prisma.StringWithAggregatesFilter<"User"> | string;
    status?: Prisma.EnumUserStatusWithAggregatesFilter<"User"> | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolWithAggregatesFilter<"User"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"User"> | Date | string;
};
export type UserCreateInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserUpdateInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateManyInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
};
export type UserUpdateManyMutationInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UserCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    employeeId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type UserMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    employeeId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    employeeId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type UserSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type UserScalarRelationFilter = {
    is?: Prisma.UserWhereInput;
    isNot?: Prisma.UserWhereInput;
};
export type UserNullableScalarRelationFilter = {
    is?: Prisma.UserWhereInput | null;
    isNot?: Prisma.UserWhereInput | null;
};
export type StringFieldUpdateOperationsInput = {
    set?: string;
};
export type EnumUserStatusFieldUpdateOperationsInput = {
    set?: $Enums.UserStatus;
};
export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
};
export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type UserCreateNestedOneWithoutLlmModelConfigsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutLlmModelConfigsInput, Prisma.UserUncheckedCreateWithoutLlmModelConfigsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutLlmModelConfigsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutLlmModelConfigsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutLlmModelConfigsInput, Prisma.UserUncheckedCreateWithoutLlmModelConfigsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutLlmModelConfigsInput;
    upsert?: Prisma.UserUpsertWithoutLlmModelConfigsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutLlmModelConfigsInput, Prisma.UserUpdateWithoutLlmModelConfigsInput>, Prisma.UserUncheckedUpdateWithoutLlmModelConfigsInput>;
};
export type UserCreateNestedOneWithoutSessionsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSessionsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutSessionsInput;
    upsert?: Prisma.UserUpsertWithoutSessionsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput, Prisma.UserUpdateWithoutSessionsInput>, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
};
export type UserCreateNestedOneWithoutMessageFeedbacksInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutMessageFeedbacksInput, Prisma.UserUncheckedCreateWithoutMessageFeedbacksInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutMessageFeedbacksInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutMessageFeedbacksNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutMessageFeedbacksInput, Prisma.UserUncheckedCreateWithoutMessageFeedbacksInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutMessageFeedbacksInput;
    upsert?: Prisma.UserUpsertWithoutMessageFeedbacksInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutMessageFeedbacksInput, Prisma.UserUpdateWithoutMessageFeedbacksInput>, Prisma.UserUncheckedUpdateWithoutMessageFeedbacksInput>;
};
export type UserCreateNestedOneWithoutUserIntegrationsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUserIntegrationsInput, Prisma.UserUncheckedCreateWithoutUserIntegrationsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUserIntegrationsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutUserIntegrationsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUserIntegrationsInput, Prisma.UserUncheckedCreateWithoutUserIntegrationsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUserIntegrationsInput;
    upsert?: Prisma.UserUpsertWithoutUserIntegrationsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutUserIntegrationsInput, Prisma.UserUpdateWithoutUserIntegrationsInput>, Prisma.UserUncheckedUpdateWithoutUserIntegrationsInput>;
};
export type UserCreateNestedOneWithoutUserAppsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUserAppsInput, Prisma.UserUncheckedCreateWithoutUserAppsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUserAppsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutUserAppsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutUserAppsInput, Prisma.UserUncheckedCreateWithoutUserAppsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutUserAppsInput;
    upsert?: Prisma.UserUpsertWithoutUserAppsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutUserAppsInput, Prisma.UserUpdateWithoutUserAppsInput>, Prisma.UserUncheckedUpdateWithoutUserAppsInput>;
};
export type UserCreateNestedOneWithoutMessageTurnsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutMessageTurnsInput, Prisma.UserUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutMessageTurnsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutMessageTurnsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutMessageTurnsInput, Prisma.UserUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutMessageTurnsInput;
    upsert?: Prisma.UserUpsertWithoutMessageTurnsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutMessageTurnsInput, Prisma.UserUpdateWithoutMessageTurnsInput>, Prisma.UserUncheckedUpdateWithoutMessageTurnsInput>;
};
export type UserCreateNestedOneWithoutPageActionRunsInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPageActionRunsInput, Prisma.UserUncheckedCreateWithoutPageActionRunsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPageActionRunsInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneRequiredWithoutPageActionRunsNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutPageActionRunsInput, Prisma.UserUncheckedCreateWithoutPageActionRunsInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutPageActionRunsInput;
    upsert?: Prisma.UserUpsertWithoutPageActionRunsInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutPageActionRunsInput, Prisma.UserUpdateWithoutPageActionRunsInput>, Prisma.UserUncheckedUpdateWithoutPageActionRunsInput>;
};
export type UserCreateNestedOneWithoutApprovalsInitiatedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedCreateWithoutApprovalsInitiatedInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutApprovalsInitiatedInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserCreateNestedOneWithoutApprovalsToApproveInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutApprovalsToApproveInput, Prisma.UserUncheckedCreateWithoutApprovalsToApproveInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutApprovalsToApproveInput;
    connect?: Prisma.UserWhereUniqueInput;
};
export type UserUpdateOneWithoutApprovalsInitiatedNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedCreateWithoutApprovalsInitiatedInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutApprovalsInitiatedInput;
    upsert?: Prisma.UserUpsertWithoutApprovalsInitiatedInput;
    disconnect?: Prisma.UserWhereInput | boolean;
    delete?: Prisma.UserWhereInput | boolean;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutApprovalsInitiatedInput, Prisma.UserUpdateWithoutApprovalsInitiatedInput>, Prisma.UserUncheckedUpdateWithoutApprovalsInitiatedInput>;
};
export type UserUpdateOneRequiredWithoutApprovalsToApproveNestedInput = {
    create?: Prisma.XOR<Prisma.UserCreateWithoutApprovalsToApproveInput, Prisma.UserUncheckedCreateWithoutApprovalsToApproveInput>;
    connectOrCreate?: Prisma.UserCreateOrConnectWithoutApprovalsToApproveInput;
    upsert?: Prisma.UserUpsertWithoutApprovalsToApproveInput;
    connect?: Prisma.UserWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UserUpdateToOneWithWhereWithoutApprovalsToApproveInput, Prisma.UserUpdateWithoutApprovalsToApproveInput>, Prisma.UserUncheckedUpdateWithoutApprovalsToApproveInput>;
};
export type UserCreateWithoutLlmModelConfigsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutLlmModelConfigsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutLlmModelConfigsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutLlmModelConfigsInput, Prisma.UserUncheckedCreateWithoutLlmModelConfigsInput>;
};
export type UserUpsertWithoutLlmModelConfigsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutLlmModelConfigsInput, Prisma.UserUncheckedUpdateWithoutLlmModelConfigsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutLlmModelConfigsInput, Prisma.UserUncheckedCreateWithoutLlmModelConfigsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutLlmModelConfigsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutLlmModelConfigsInput, Prisma.UserUncheckedUpdateWithoutLlmModelConfigsInput>;
};
export type UserUpdateWithoutLlmModelConfigsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutLlmModelConfigsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutSessionsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutSessionsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutSessionsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
};
export type UserUpsertWithoutSessionsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutSessionsInput, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutSessionsInput, Prisma.UserUncheckedCreateWithoutSessionsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutSessionsInput, Prisma.UserUncheckedUpdateWithoutSessionsInput>;
};
export type UserUpdateWithoutSessionsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutMessageFeedbacksInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutMessageFeedbacksInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutMessageFeedbacksInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutMessageFeedbacksInput, Prisma.UserUncheckedCreateWithoutMessageFeedbacksInput>;
};
export type UserUpsertWithoutMessageFeedbacksInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutMessageFeedbacksInput, Prisma.UserUncheckedUpdateWithoutMessageFeedbacksInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutMessageFeedbacksInput, Prisma.UserUncheckedCreateWithoutMessageFeedbacksInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutMessageFeedbacksInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutMessageFeedbacksInput, Prisma.UserUncheckedUpdateWithoutMessageFeedbacksInput>;
};
export type UserUpdateWithoutMessageFeedbacksInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutMessageFeedbacksInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutUserIntegrationsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutUserIntegrationsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutUserIntegrationsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutUserIntegrationsInput, Prisma.UserUncheckedCreateWithoutUserIntegrationsInput>;
};
export type UserUpsertWithoutUserIntegrationsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutUserIntegrationsInput, Prisma.UserUncheckedUpdateWithoutUserIntegrationsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutUserIntegrationsInput, Prisma.UserUncheckedCreateWithoutUserIntegrationsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutUserIntegrationsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutUserIntegrationsInput, Prisma.UserUncheckedUpdateWithoutUserIntegrationsInput>;
};
export type UserUpdateWithoutUserIntegrationsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutUserIntegrationsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutUserAppsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutUserAppsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutUserAppsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutUserAppsInput, Prisma.UserUncheckedCreateWithoutUserAppsInput>;
};
export type UserUpsertWithoutUserAppsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutUserAppsInput, Prisma.UserUncheckedUpdateWithoutUserAppsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutUserAppsInput, Prisma.UserUncheckedCreateWithoutUserAppsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutUserAppsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutUserAppsInput, Prisma.UserUncheckedUpdateWithoutUserAppsInput>;
};
export type UserUpdateWithoutUserAppsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutUserAppsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutMessageTurnsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutMessageTurnsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutMessageTurnsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutMessageTurnsInput, Prisma.UserUncheckedCreateWithoutMessageTurnsInput>;
};
export type UserUpsertWithoutMessageTurnsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutMessageTurnsInput, Prisma.UserUncheckedUpdateWithoutMessageTurnsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutMessageTurnsInput, Prisma.UserUncheckedCreateWithoutMessageTurnsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutMessageTurnsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutMessageTurnsInput, Prisma.UserUncheckedUpdateWithoutMessageTurnsInput>;
};
export type UserUpdateWithoutMessageTurnsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutMessageTurnsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutPageActionRunsInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutPageActionRunsInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutPageActionRunsInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutPageActionRunsInput, Prisma.UserUncheckedCreateWithoutPageActionRunsInput>;
};
export type UserUpsertWithoutPageActionRunsInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutPageActionRunsInput, Prisma.UserUncheckedUpdateWithoutPageActionRunsInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutPageActionRunsInput, Prisma.UserUncheckedCreateWithoutPageActionRunsInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutPageActionRunsInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutPageActionRunsInput, Prisma.UserUncheckedUpdateWithoutPageActionRunsInput>;
};
export type UserUpdateWithoutPageActionRunsInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutPageActionRunsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserCreateWithoutApprovalsInitiatedInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsToApprove?: Prisma.ApprovalRequestCreateNestedManyWithoutApproverInput;
};
export type UserUncheckedCreateWithoutApprovalsInitiatedInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutApproverInput;
};
export type UserCreateOrConnectWithoutApprovalsInitiatedInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedCreateWithoutApprovalsInitiatedInput>;
};
export type UserCreateWithoutApprovalsToApproveInput = {
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestCreateNestedManyWithoutInitiatorInput;
};
export type UserUncheckedCreateWithoutApprovalsToApproveInput = {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    status?: $Enums.UserStatus;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    sessions?: Prisma.SessionUncheckedCreateNestedManyWithoutUserInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutUserInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutUserInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedCreateNestedManyWithoutUserInput;
    userApps?: Prisma.UserAppUncheckedCreateNestedManyWithoutUserInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedCreateNestedManyWithoutUserInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedCreateNestedManyWithoutUserInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedCreateNestedManyWithoutInitiatorInput;
};
export type UserCreateOrConnectWithoutApprovalsToApproveInput = {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateWithoutApprovalsToApproveInput, Prisma.UserUncheckedCreateWithoutApprovalsToApproveInput>;
};
export type UserUpsertWithoutApprovalsInitiatedInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedUpdateWithoutApprovalsInitiatedInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedCreateWithoutApprovalsInitiatedInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutApprovalsInitiatedInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutApprovalsInitiatedInput, Prisma.UserUncheckedUpdateWithoutApprovalsInitiatedInput>;
};
export type UserUpdateWithoutApprovalsInitiatedInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUpdateManyWithoutApproverNestedInput;
};
export type UserUncheckedUpdateWithoutApprovalsInitiatedInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsToApprove?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutApproverNestedInput;
};
export type UserUpsertWithoutApprovalsToApproveInput = {
    update: Prisma.XOR<Prisma.UserUpdateWithoutApprovalsToApproveInput, Prisma.UserUncheckedUpdateWithoutApprovalsToApproveInput>;
    create: Prisma.XOR<Prisma.UserCreateWithoutApprovalsToApproveInput, Prisma.UserUncheckedCreateWithoutApprovalsToApproveInput>;
    where?: Prisma.UserWhereInput;
};
export type UserUpdateToOneWithWhereWithoutApprovalsToApproveInput = {
    where?: Prisma.UserWhereInput;
    data: Prisma.XOR<Prisma.UserUpdateWithoutApprovalsToApproveInput, Prisma.UserUncheckedUpdateWithoutApprovalsToApproveInput>;
};
export type UserUpdateWithoutApprovalsToApproveInput = {
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUpdateManyWithoutInitiatorNestedInput;
};
export type UserUncheckedUpdateWithoutApprovalsToApproveInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    employeeId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sessions?: Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutUserNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput;
    llmModelConfigs?: Prisma.UserLlmModelConfigUncheckedUpdateManyWithoutUserNestedInput;
    userApps?: Prisma.UserAppUncheckedUpdateManyWithoutUserNestedInput;
    userIntegrations?: Prisma.UserIntegrationUncheckedUpdateManyWithoutUserNestedInput;
    pageActionRuns?: Prisma.PageActionRunUncheckedUpdateManyWithoutUserNestedInput;
    approvalsInitiated?: Prisma.ApprovalRequestUncheckedUpdateManyWithoutInitiatorNestedInput;
};
export type UserCountOutputType = {
    sessions: number;
    messageTurns: number;
    messageFeedbacks: number;
    llmModelConfigs: number;
    userApps: number;
    userIntegrations: number;
    pageActionRuns: number;
    approvalsInitiated: number;
    approvalsToApprove: number;
};
export type UserCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs;
    messageTurns?: boolean | UserCountOutputTypeCountMessageTurnsArgs;
    messageFeedbacks?: boolean | UserCountOutputTypeCountMessageFeedbacksArgs;
    llmModelConfigs?: boolean | UserCountOutputTypeCountLlmModelConfigsArgs;
    userApps?: boolean | UserCountOutputTypeCountUserAppsArgs;
    userIntegrations?: boolean | UserCountOutputTypeCountUserIntegrationsArgs;
    pageActionRuns?: boolean | UserCountOutputTypeCountPageActionRunsArgs;
    approvalsInitiated?: boolean | UserCountOutputTypeCountApprovalsInitiatedArgs;
    approvalsToApprove?: boolean | UserCountOutputTypeCountApprovalsToApproveArgs;
};
export type UserCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserCountOutputTypeSelect<ExtArgs> | null;
};
export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionWhereInput;
};
export type UserCountOutputTypeCountMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageTurnWhereInput;
};
export type UserCountOutputTypeCountMessageFeedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
};
export type UserCountOutputTypeCountLlmModelConfigsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserLlmModelConfigWhereInput;
};
export type UserCountOutputTypeCountUserAppsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserAppWhereInput;
};
export type UserCountOutputTypeCountUserIntegrationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserIntegrationWhereInput;
};
export type UserCountOutputTypeCountPageActionRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PageActionRunWhereInput;
};
export type UserCountOutputTypeCountApprovalsInitiatedArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ApprovalRequestWhereInput;
};
export type UserCountOutputTypeCountApprovalsToApproveArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ApprovalRequestWhereInput;
};
export type UserSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    employeeId?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    status?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
    sessions?: boolean | Prisma.User$sessionsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.User$messageTurnsArgs<ExtArgs>;
    messageFeedbacks?: boolean | Prisma.User$messageFeedbacksArgs<ExtArgs>;
    llmModelConfigs?: boolean | Prisma.User$llmModelConfigsArgs<ExtArgs>;
    userApps?: boolean | Prisma.User$userAppsArgs<ExtArgs>;
    userIntegrations?: boolean | Prisma.User$userIntegrationsArgs<ExtArgs>;
    pageActionRuns?: boolean | Prisma.User$pageActionRunsArgs<ExtArgs>;
    approvalsInitiated?: boolean | Prisma.User$approvalsInitiatedArgs<ExtArgs>;
    approvalsToApprove?: boolean | Prisma.User$approvalsToApproveArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["user"]>;
export type UserSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    employeeId?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    status?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["user"]>;
export type UserSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    employeeId?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    status?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["user"]>;
export type UserSelectScalar = {
    id?: boolean;
    employeeId?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    status?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
};
export type UserOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "employeeId" | "email" | "password" | "username" | "status" | "mustChangePassword" | "createdAt", ExtArgs["result"]["user"]>;
export type UserInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sessions?: boolean | Prisma.User$sessionsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.User$messageTurnsArgs<ExtArgs>;
    messageFeedbacks?: boolean | Prisma.User$messageFeedbacksArgs<ExtArgs>;
    llmModelConfigs?: boolean | Prisma.User$llmModelConfigsArgs<ExtArgs>;
    userApps?: boolean | Prisma.User$userAppsArgs<ExtArgs>;
    userIntegrations?: boolean | Prisma.User$userIntegrationsArgs<ExtArgs>;
    pageActionRuns?: boolean | Prisma.User$pageActionRunsArgs<ExtArgs>;
    approvalsInitiated?: boolean | Prisma.User$approvalsInitiatedArgs<ExtArgs>;
    approvalsToApprove?: boolean | Prisma.User$approvalsToApproveArgs<ExtArgs>;
    _count?: boolean | Prisma.UserCountOutputTypeDefaultArgs<ExtArgs>;
};
export type UserIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type UserIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $UserPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "User";
    objects: {
        sessions: Prisma.$SessionPayload<ExtArgs>[];
        messageTurns: Prisma.$MessageTurnPayload<ExtArgs>[];
        messageFeedbacks: Prisma.$MessageFeedbackPayload<ExtArgs>[];
        llmModelConfigs: Prisma.$UserLlmModelConfigPayload<ExtArgs>[];
        userApps: Prisma.$UserAppPayload<ExtArgs>[];
        userIntegrations: Prisma.$UserIntegrationPayload<ExtArgs>[];
        pageActionRuns: Prisma.$PageActionRunPayload<ExtArgs>[];
        approvalsInitiated: Prisma.$ApprovalRequestPayload<ExtArgs>[];
        approvalsToApprove: Prisma.$ApprovalRequestPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: $Enums.UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }, ExtArgs["result"]["user"]>;
    composites: {};
};
export type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UserPayload, S>;
export type UserCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserCountAggregateInputType | true;
};
export interface UserDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['User'];
        meta: {
            name: 'User';
        };
    };
    findUnique<T extends UserFindUniqueArgs>(args: Prisma.SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends UserFindFirstArgs>(args?: Prisma.SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends UserFindManyArgs>(args?: Prisma.SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends UserCreateArgs>(args: Prisma.SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends UserCreateManyArgs>(args?: Prisma.SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends UserDeleteArgs>(args: Prisma.SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends UserUpdateArgs>(args: Prisma.SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends UserDeleteManyArgs>(args?: Prisma.SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends UserUpdateManyArgs>(args: Prisma.SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends UserUpsertArgs>(args: Prisma.SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends UserCountArgs>(args?: Prisma.Subset<T, UserCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UserCountAggregateOutputType> : number>;
    aggregate<T extends UserAggregateArgs>(args: Prisma.Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>;
    groupBy<T extends UserGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UserGroupByArgs['orderBy'];
    } : {
        orderBy?: UserGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: UserFieldRefs;
}
export interface Prisma__UserClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    sessions<T extends Prisma.User$sessionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messageTurns<T extends Prisma.User$messageTurnsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$messageTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messageFeedbacks<T extends Prisma.User$messageFeedbacksArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$messageFeedbacksArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    llmModelConfigs<T extends Prisma.User$llmModelConfigsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$llmModelConfigsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserLlmModelConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    userApps<T extends Prisma.User$userAppsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$userAppsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserAppPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    userIntegrations<T extends Prisma.User$userIntegrationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$userIntegrationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UserIntegrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    pageActionRuns<T extends Prisma.User$pageActionRunsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$pageActionRunsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PageActionRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    approvalsInitiated<T extends Prisma.User$approvalsInitiatedArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$approvalsInitiatedArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ApprovalRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    approvalsToApprove<T extends Prisma.User$approvalsToApproveArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.User$approvalsToApproveArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ApprovalRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface UserFieldRefs {
    readonly id: Prisma.FieldRef<"User", 'Int'>;
    readonly employeeId: Prisma.FieldRef<"User", 'String'>;
    readonly email: Prisma.FieldRef<"User", 'String'>;
    readonly password: Prisma.FieldRef<"User", 'String'>;
    readonly username: Prisma.FieldRef<"User", 'String'>;
    readonly status: Prisma.FieldRef<"User", 'UserStatus'>;
    readonly mustChangePassword: Prisma.FieldRef<"User", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"User", 'DateTime'>;
}
export type UserFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where: Prisma.UserWhereUniqueInput;
};
export type UserFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where: Prisma.UserWhereUniqueInput;
};
export type UserFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    cursor?: Prisma.UserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type UserFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    cursor?: Prisma.UserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type UserFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[];
    cursor?: Prisma.UserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserScalarFieldEnum | Prisma.UserScalarFieldEnum[];
};
export type UserCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>;
};
export type UserCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.UserCreateManyInput | Prisma.UserCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UserCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    data: Prisma.UserCreateManyInput | Prisma.UserCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UserUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>;
    where: Prisma.UserWhereUniqueInput;
};
export type UserUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyInput>;
    where?: Prisma.UserWhereInput;
    limit?: number;
};
export type UserUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UserUpdateManyMutationInput, Prisma.UserUncheckedUpdateManyInput>;
    where?: Prisma.UserWhereInput;
    limit?: number;
};
export type UserUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>;
};
export type UserDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where: Prisma.UserWhereUniqueInput;
};
export type UserDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UserWhereInput;
    limit?: number;
};
export type User$sessionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where?: Prisma.SessionWhereInput;
    orderBy?: Prisma.SessionOrderByWithRelationInput | Prisma.SessionOrderByWithRelationInput[];
    cursor?: Prisma.SessionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SessionScalarFieldEnum | Prisma.SessionScalarFieldEnum[];
};
export type User$messageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageTurnSelect<ExtArgs> | null;
    omit?: Prisma.MessageTurnOmit<ExtArgs> | null;
    include?: Prisma.MessageTurnInclude<ExtArgs> | null;
    where?: Prisma.MessageTurnWhereInput;
    orderBy?: Prisma.MessageTurnOrderByWithRelationInput | Prisma.MessageTurnOrderByWithRelationInput[];
    cursor?: Prisma.MessageTurnWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageTurnScalarFieldEnum | Prisma.MessageTurnScalarFieldEnum[];
};
export type User$messageFeedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    where?: Prisma.MessageFeedbackWhereInput;
    orderBy?: Prisma.MessageFeedbackOrderByWithRelationInput | Prisma.MessageFeedbackOrderByWithRelationInput[];
    cursor?: Prisma.MessageFeedbackWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageFeedbackScalarFieldEnum | Prisma.MessageFeedbackScalarFieldEnum[];
};
export type User$llmModelConfigsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserLlmModelConfigSelect<ExtArgs> | null;
    omit?: Prisma.UserLlmModelConfigOmit<ExtArgs> | null;
    include?: Prisma.UserLlmModelConfigInclude<ExtArgs> | null;
    where?: Prisma.UserLlmModelConfigWhereInput;
    orderBy?: Prisma.UserLlmModelConfigOrderByWithRelationInput | Prisma.UserLlmModelConfigOrderByWithRelationInput[];
    cursor?: Prisma.UserLlmModelConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UserLlmModelConfigScalarFieldEnum | Prisma.UserLlmModelConfigScalarFieldEnum[];
};
export type User$userAppsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type User$userIntegrationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type User$pageActionRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PageActionRunSelect<ExtArgs> | null;
    omit?: Prisma.PageActionRunOmit<ExtArgs> | null;
    include?: Prisma.PageActionRunInclude<ExtArgs> | null;
    where?: Prisma.PageActionRunWhereInput;
    orderBy?: Prisma.PageActionRunOrderByWithRelationInput | Prisma.PageActionRunOrderByWithRelationInput[];
    cursor?: Prisma.PageActionRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PageActionRunScalarFieldEnum | Prisma.PageActionRunScalarFieldEnum[];
};
export type User$approvalsInitiatedArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ApprovalRequestSelect<ExtArgs> | null;
    omit?: Prisma.ApprovalRequestOmit<ExtArgs> | null;
    include?: Prisma.ApprovalRequestInclude<ExtArgs> | null;
    where?: Prisma.ApprovalRequestWhereInput;
    orderBy?: Prisma.ApprovalRequestOrderByWithRelationInput | Prisma.ApprovalRequestOrderByWithRelationInput[];
    cursor?: Prisma.ApprovalRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ApprovalRequestScalarFieldEnum | Prisma.ApprovalRequestScalarFieldEnum[];
};
export type User$approvalsToApproveArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ApprovalRequestSelect<ExtArgs> | null;
    omit?: Prisma.ApprovalRequestOmit<ExtArgs> | null;
    include?: Prisma.ApprovalRequestInclude<ExtArgs> | null;
    where?: Prisma.ApprovalRequestWhereInput;
    orderBy?: Prisma.ApprovalRequestOrderByWithRelationInput | Prisma.ApprovalRequestOrderByWithRelationInput[];
    cursor?: Prisma.ApprovalRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ApprovalRequestScalarFieldEnum | Prisma.ApprovalRequestScalarFieldEnum[];
};
export type UserDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
};
