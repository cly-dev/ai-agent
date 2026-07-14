import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type SessionModel = runtime.Types.Result.DefaultSelection<Prisma.$SessionPayload>;
export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null;
    _avg: SessionAvgAggregateOutputType | null;
    _sum: SessionSumAggregateOutputType | null;
    _min: SessionMinAggregateOutputType | null;
    _max: SessionMaxAggregateOutputType | null;
};
export type SessionAvgAggregateOutputType = {
    userId: number | null;
    appClientId: number | null;
    agentId: number | null;
};
export type SessionSumAggregateOutputType = {
    userId: number | null;
    appClientId: number | null;
    agentId: number | null;
};
export type SessionMinAggregateOutputType = {
    id: string | null;
    userId: number | null;
    appClientId: number | null;
    agentId: number | null;
    title: string | null;
    createdAt: Date | null;
};
export type SessionMaxAggregateOutputType = {
    id: string | null;
    userId: number | null;
    appClientId: number | null;
    agentId: number | null;
    title: string | null;
    createdAt: Date | null;
};
export type SessionCountAggregateOutputType = {
    id: number;
    userId: number;
    appClientId: number;
    agentId: number;
    title: number;
    createdAt: number;
    _all: number;
};
export type SessionAvgAggregateInputType = {
    userId?: true;
    appClientId?: true;
    agentId?: true;
};
export type SessionSumAggregateInputType = {
    userId?: true;
    appClientId?: true;
    agentId?: true;
};
export type SessionMinAggregateInputType = {
    id?: true;
    userId?: true;
    appClientId?: true;
    agentId?: true;
    title?: true;
    createdAt?: true;
};
export type SessionMaxAggregateInputType = {
    id?: true;
    userId?: true;
    appClientId?: true;
    agentId?: true;
    title?: true;
    createdAt?: true;
};
export type SessionCountAggregateInputType = {
    id?: true;
    userId?: true;
    appClientId?: true;
    agentId?: true;
    title?: true;
    createdAt?: true;
    _all?: true;
};
export type SessionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionWhereInput;
    orderBy?: Prisma.SessionOrderByWithRelationInput | Prisma.SessionOrderByWithRelationInput[];
    cursor?: Prisma.SessionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SessionCountAggregateInputType;
    _avg?: SessionAvgAggregateInputType;
    _sum?: SessionSumAggregateInputType;
    _min?: SessionMinAggregateInputType;
    _max?: SessionMaxAggregateInputType;
};
export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
    [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSession[P]> : Prisma.GetScalarType<T[P], AggregateSession[P]>;
};
export type SessionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionWhereInput;
    orderBy?: Prisma.SessionOrderByWithAggregationInput | Prisma.SessionOrderByWithAggregationInput[];
    by: Prisma.SessionScalarFieldEnum[] | Prisma.SessionScalarFieldEnum;
    having?: Prisma.SessionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SessionCountAggregateInputType | true;
    _avg?: SessionAvgAggregateInputType;
    _sum?: SessionSumAggregateInputType;
    _min?: SessionMinAggregateInputType;
    _max?: SessionMaxAggregateInputType;
};
export type SessionGroupByOutputType = {
    id: string;
    userId: number;
    appClientId: number;
    agentId: number | null;
    title: string | null;
    createdAt: Date;
    _count: SessionCountAggregateOutputType | null;
    _avg: SessionAvgAggregateOutputType | null;
    _sum: SessionSumAggregateOutputType | null;
    _min: SessionMinAggregateOutputType | null;
    _max: SessionMaxAggregateOutputType | null;
};
export type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SessionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SessionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SessionGroupByOutputType[P]>;
}>>;
export type SessionWhereInput = {
    AND?: Prisma.SessionWhereInput | Prisma.SessionWhereInput[];
    OR?: Prisma.SessionWhereInput[];
    NOT?: Prisma.SessionWhereInput | Prisma.SessionWhereInput[];
    id?: Prisma.StringFilter<"Session"> | string;
    userId?: Prisma.IntFilter<"Session"> | number;
    appClientId?: Prisma.IntFilter<"Session"> | number;
    agentId?: Prisma.IntNullableFilter<"Session"> | number | null;
    title?: Prisma.StringNullableFilter<"Session"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Session"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    messages?: Prisma.MessageListRelationFilter;
    agentRuns?: Prisma.AgentRunListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    messageFeedbacks?: Prisma.MessageFeedbackListRelationFilter;
    sessionGoaMemory?: Prisma.XOR<Prisma.SessionGoaMemoryNullableScalarRelationFilter, Prisma.SessionGoaMemoryWhereInput> | null;
};
export type SessionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    messages?: Prisma.MessageOrderByRelationAggregateInput;
    agentRuns?: Prisma.AgentRunOrderByRelationAggregateInput;
    messageTurns?: Prisma.MessageTurnOrderByRelationAggregateInput;
    messageFeedbacks?: Prisma.MessageFeedbackOrderByRelationAggregateInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryOrderByWithRelationInput;
};
export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.SessionWhereInput | Prisma.SessionWhereInput[];
    OR?: Prisma.SessionWhereInput[];
    NOT?: Prisma.SessionWhereInput | Prisma.SessionWhereInput[];
    userId?: Prisma.IntFilter<"Session"> | number;
    appClientId?: Prisma.IntFilter<"Session"> | number;
    agentId?: Prisma.IntNullableFilter<"Session"> | number | null;
    title?: Prisma.StringNullableFilter<"Session"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Session"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    messages?: Prisma.MessageListRelationFilter;
    agentRuns?: Prisma.AgentRunListRelationFilter;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    messageFeedbacks?: Prisma.MessageFeedbackListRelationFilter;
    sessionGoaMemory?: Prisma.XOR<Prisma.SessionGoaMemoryNullableScalarRelationFilter, Prisma.SessionGoaMemoryWhereInput> | null;
}, "id">;
export type SessionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.SessionCountOrderByAggregateInput;
    _avg?: Prisma.SessionAvgOrderByAggregateInput;
    _max?: Prisma.SessionMaxOrderByAggregateInput;
    _min?: Prisma.SessionMinOrderByAggregateInput;
    _sum?: Prisma.SessionSumOrderByAggregateInput;
};
export type SessionScalarWhereWithAggregatesInput = {
    AND?: Prisma.SessionScalarWhereWithAggregatesInput | Prisma.SessionScalarWhereWithAggregatesInput[];
    OR?: Prisma.SessionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SessionScalarWhereWithAggregatesInput | Prisma.SessionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Session"> | string;
    userId?: Prisma.IntWithAggregatesFilter<"Session"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"Session"> | number;
    agentId?: Prisma.IntNullableWithAggregatesFilter<"Session"> | number | null;
    title?: Prisma.StringNullableWithAggregatesFilter<"Session"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Session"> | Date | string;
};
export type SessionCreateInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionCreateManyInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
};
export type SessionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionListRelationFilter = {
    every?: Prisma.SessionWhereInput;
    some?: Prisma.SessionWhereInput;
    none?: Prisma.SessionWhereInput;
};
export type SessionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type SessionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SessionAvgOrderByAggregateInput = {
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type SessionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SessionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SessionSumOrderByAggregateInput = {
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type SessionScalarRelationFilter = {
    is?: Prisma.SessionWhereInput;
    isNot?: Prisma.SessionWhereInput;
};
export type SessionCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput> | Prisma.SessionCreateWithoutUserInput[] | Prisma.SessionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutUserInput | Prisma.SessionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.SessionCreateManyUserInputEnvelope;
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
};
export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput> | Prisma.SessionCreateWithoutUserInput[] | Prisma.SessionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutUserInput | Prisma.SessionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.SessionCreateManyUserInputEnvelope;
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
};
export type SessionUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput> | Prisma.SessionCreateWithoutUserInput[] | Prisma.SessionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutUserInput | Prisma.SessionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.SessionUpsertWithWhereUniqueWithoutUserInput | Prisma.SessionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.SessionCreateManyUserInputEnvelope;
    set?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    disconnect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    delete?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    update?: Prisma.SessionUpdateWithWhereUniqueWithoutUserInput | Prisma.SessionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.SessionUpdateManyWithWhereWithoutUserInput | Prisma.SessionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
};
export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput> | Prisma.SessionCreateWithoutUserInput[] | Prisma.SessionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutUserInput | Prisma.SessionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.SessionUpsertWithWhereUniqueWithoutUserInput | Prisma.SessionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.SessionCreateManyUserInputEnvelope;
    set?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    disconnect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    delete?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    update?: Prisma.SessionUpdateWithWhereUniqueWithoutUserInput | Prisma.SessionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.SessionUpdateManyWithWhereWithoutUserInput | Prisma.SessionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
};
export type SessionCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput> | Prisma.SessionCreateWithoutAppClientInput[] | Prisma.SessionUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAppClientInput | Prisma.SessionCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.SessionCreateManyAppClientInputEnvelope;
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
};
export type SessionUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput> | Prisma.SessionCreateWithoutAppClientInput[] | Prisma.SessionUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAppClientInput | Prisma.SessionCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.SessionCreateManyAppClientInputEnvelope;
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
};
export type SessionUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput> | Prisma.SessionCreateWithoutAppClientInput[] | Prisma.SessionUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAppClientInput | Prisma.SessionCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.SessionUpsertWithWhereUniqueWithoutAppClientInput | Prisma.SessionUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.SessionCreateManyAppClientInputEnvelope;
    set?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    disconnect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    delete?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    update?: Prisma.SessionUpdateWithWhereUniqueWithoutAppClientInput | Prisma.SessionUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.SessionUpdateManyWithWhereWithoutAppClientInput | Prisma.SessionUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
};
export type SessionUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput> | Prisma.SessionCreateWithoutAppClientInput[] | Prisma.SessionUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAppClientInput | Prisma.SessionCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.SessionUpsertWithWhereUniqueWithoutAppClientInput | Prisma.SessionUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.SessionCreateManyAppClientInputEnvelope;
    set?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    disconnect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    delete?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    connect?: Prisma.SessionWhereUniqueInput | Prisma.SessionWhereUniqueInput[];
    update?: Prisma.SessionUpdateWithWhereUniqueWithoutAppClientInput | Prisma.SessionUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.SessionUpdateManyWithWhereWithoutAppClientInput | Prisma.SessionUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
};
export type SessionCreateNestedOneWithoutSessionGoaMemoryInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedCreateWithoutSessionGoaMemoryInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutSessionGoaMemoryInput;
    connect?: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateOneRequiredWithoutSessionGoaMemoryNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedCreateWithoutSessionGoaMemoryInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutSessionGoaMemoryInput;
    upsert?: Prisma.SessionUpsertWithoutSessionGoaMemoryInput;
    connect?: Prisma.SessionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionUpdateToOneWithWhereWithoutSessionGoaMemoryInput, Prisma.SessionUpdateWithoutSessionGoaMemoryInput>, Prisma.SessionUncheckedUpdateWithoutSessionGoaMemoryInput>;
};
export type SessionCreateNestedOneWithoutMessagesInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessagesInput, Prisma.SessionUncheckedCreateWithoutMessagesInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessagesInput;
    connect?: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessagesInput, Prisma.SessionUncheckedCreateWithoutMessagesInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessagesInput;
    upsert?: Prisma.SessionUpsertWithoutMessagesInput;
    connect?: Prisma.SessionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionUpdateToOneWithWhereWithoutMessagesInput, Prisma.SessionUpdateWithoutMessagesInput>, Prisma.SessionUncheckedUpdateWithoutMessagesInput>;
};
export type SessionCreateNestedOneWithoutMessageFeedbacksInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedCreateWithoutMessageFeedbacksInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessageFeedbacksInput;
    connect?: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateOneRequiredWithoutMessageFeedbacksNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedCreateWithoutMessageFeedbacksInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessageFeedbacksInput;
    upsert?: Prisma.SessionUpsertWithoutMessageFeedbacksInput;
    connect?: Prisma.SessionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionUpdateToOneWithWhereWithoutMessageFeedbacksInput, Prisma.SessionUpdateWithoutMessageFeedbacksInput>, Prisma.SessionUncheckedUpdateWithoutMessageFeedbacksInput>;
};
export type SessionCreateNestedOneWithoutMessageTurnsInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessageTurnsInput, Prisma.SessionUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessageTurnsInput;
    connect?: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateOneRequiredWithoutMessageTurnsNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutMessageTurnsInput, Prisma.SessionUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutMessageTurnsInput;
    upsert?: Prisma.SessionUpsertWithoutMessageTurnsInput;
    connect?: Prisma.SessionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionUpdateToOneWithWhereWithoutMessageTurnsInput, Prisma.SessionUpdateWithoutMessageTurnsInput>, Prisma.SessionUncheckedUpdateWithoutMessageTurnsInput>;
};
export type SessionCreateNestedOneWithoutAgentRunsInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAgentRunsInput, Prisma.SessionUncheckedCreateWithoutAgentRunsInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAgentRunsInput;
    connect?: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateOneRequiredWithoutAgentRunsNestedInput = {
    create?: Prisma.XOR<Prisma.SessionCreateWithoutAgentRunsInput, Prisma.SessionUncheckedCreateWithoutAgentRunsInput>;
    connectOrCreate?: Prisma.SessionCreateOrConnectWithoutAgentRunsInput;
    upsert?: Prisma.SessionUpsertWithoutAgentRunsInput;
    connect?: Prisma.SessionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionUpdateToOneWithWhereWithoutAgentRunsInput, Prisma.SessionUpdateWithoutAgentRunsInput>, Prisma.SessionUncheckedUpdateWithoutAgentRunsInput>;
};
export type SessionCreateWithoutUserInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutUserInput = {
    id: string;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutUserInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput>;
};
export type SessionCreateManyUserInputEnvelope = {
    data: Prisma.SessionCreateManyUserInput | Prisma.SessionCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.SessionWhereUniqueInput;
    update: Prisma.XOR<Prisma.SessionUpdateWithoutUserInput, Prisma.SessionUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutUserInput, Prisma.SessionUncheckedCreateWithoutUserInput>;
};
export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.SessionWhereUniqueInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutUserInput, Prisma.SessionUncheckedUpdateWithoutUserInput>;
};
export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.SessionScalarWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateManyMutationInput, Prisma.SessionUncheckedUpdateManyWithoutUserInput>;
};
export type SessionScalarWhereInput = {
    AND?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
    OR?: Prisma.SessionScalarWhereInput[];
    NOT?: Prisma.SessionScalarWhereInput | Prisma.SessionScalarWhereInput[];
    id?: Prisma.StringFilter<"Session"> | string;
    userId?: Prisma.IntFilter<"Session"> | number;
    appClientId?: Prisma.IntFilter<"Session"> | number;
    agentId?: Prisma.IntNullableFilter<"Session"> | number | null;
    title?: Prisma.StringNullableFilter<"Session"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Session"> | Date | string;
};
export type SessionCreateWithoutAppClientInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutAppClientInput = {
    id: string;
    userId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutAppClientInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput>;
};
export type SessionCreateManyAppClientInputEnvelope = {
    data: Prisma.SessionCreateManyAppClientInput | Prisma.SessionCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type SessionUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.SessionWhereUniqueInput;
    update: Prisma.XOR<Prisma.SessionUpdateWithoutAppClientInput, Prisma.SessionUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutAppClientInput, Prisma.SessionUncheckedCreateWithoutAppClientInput>;
};
export type SessionUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.SessionWhereUniqueInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutAppClientInput, Prisma.SessionUncheckedUpdateWithoutAppClientInput>;
};
export type SessionUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.SessionScalarWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateManyMutationInput, Prisma.SessionUncheckedUpdateManyWithoutAppClientInput>;
};
export type SessionCreateWithoutSessionGoaMemoryInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutSessionGoaMemoryInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutSessionGoaMemoryInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedCreateWithoutSessionGoaMemoryInput>;
};
export type SessionUpsertWithoutSessionGoaMemoryInput = {
    update: Prisma.XOR<Prisma.SessionUpdateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedUpdateWithoutSessionGoaMemoryInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedCreateWithoutSessionGoaMemoryInput>;
    where?: Prisma.SessionWhereInput;
};
export type SessionUpdateToOneWithWhereWithoutSessionGoaMemoryInput = {
    where?: Prisma.SessionWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutSessionGoaMemoryInput, Prisma.SessionUncheckedUpdateWithoutSessionGoaMemoryInput>;
};
export type SessionUpdateWithoutSessionGoaMemoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutSessionGoaMemoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
};
export type SessionCreateWithoutMessagesInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutMessagesInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutMessagesInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessagesInput, Prisma.SessionUncheckedCreateWithoutMessagesInput>;
};
export type SessionUpsertWithoutMessagesInput = {
    update: Prisma.XOR<Prisma.SessionUpdateWithoutMessagesInput, Prisma.SessionUncheckedUpdateWithoutMessagesInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessagesInput, Prisma.SessionUncheckedCreateWithoutMessagesInput>;
    where?: Prisma.SessionWhereInput;
};
export type SessionUpdateToOneWithWhereWithoutMessagesInput = {
    where?: Prisma.SessionWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutMessagesInput, Prisma.SessionUncheckedUpdateWithoutMessagesInput>;
};
export type SessionUpdateWithoutMessagesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutMessagesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionCreateWithoutMessageFeedbacksInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutMessageFeedbacksInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutMessageFeedbacksInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedCreateWithoutMessageFeedbacksInput>;
};
export type SessionUpsertWithoutMessageFeedbacksInput = {
    update: Prisma.XOR<Prisma.SessionUpdateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedUpdateWithoutMessageFeedbacksInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedCreateWithoutMessageFeedbacksInput>;
    where?: Prisma.SessionWhereInput;
};
export type SessionUpdateToOneWithWhereWithoutMessageFeedbacksInput = {
    where?: Prisma.SessionWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutMessageFeedbacksInput, Prisma.SessionUncheckedUpdateWithoutMessageFeedbacksInput>;
};
export type SessionUpdateWithoutMessageFeedbacksInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutMessageFeedbacksInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionCreateWithoutMessageTurnsInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutMessageTurnsInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    agentRuns?: Prisma.AgentRunUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutMessageTurnsInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessageTurnsInput, Prisma.SessionUncheckedCreateWithoutMessageTurnsInput>;
};
export type SessionUpsertWithoutMessageTurnsInput = {
    update: Prisma.XOR<Prisma.SessionUpdateWithoutMessageTurnsInput, Prisma.SessionUncheckedUpdateWithoutMessageTurnsInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutMessageTurnsInput, Prisma.SessionUncheckedCreateWithoutMessageTurnsInput>;
    where?: Prisma.SessionWhereInput;
};
export type SessionUpdateToOneWithWhereWithoutMessageTurnsInput = {
    where?: Prisma.SessionWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutMessageTurnsInput, Prisma.SessionUncheckedUpdateWithoutMessageTurnsInput>;
};
export type SessionUpdateWithoutMessageTurnsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutMessageTurnsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionCreateWithoutAgentRunsInput = {
    id: string;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutSessionsInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutSessionsInput;
    messages?: Prisma.MessageCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryCreateNestedOneWithoutSessionInput;
};
export type SessionUncheckedCreateWithoutAgentRunsInput = {
    id: string;
    userId: number;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
    messages?: Prisma.MessageUncheckedCreateNestedManyWithoutSessionInput;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutSessionInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput;
};
export type SessionCreateOrConnectWithoutAgentRunsInput = {
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateWithoutAgentRunsInput, Prisma.SessionUncheckedCreateWithoutAgentRunsInput>;
};
export type SessionUpsertWithoutAgentRunsInput = {
    update: Prisma.XOR<Prisma.SessionUpdateWithoutAgentRunsInput, Prisma.SessionUncheckedUpdateWithoutAgentRunsInput>;
    create: Prisma.XOR<Prisma.SessionCreateWithoutAgentRunsInput, Prisma.SessionUncheckedCreateWithoutAgentRunsInput>;
    where?: Prisma.SessionWhereInput;
};
export type SessionUpdateToOneWithWhereWithoutAgentRunsInput = {
    where?: Prisma.SessionWhereInput;
    data: Prisma.XOR<Prisma.SessionUpdateWithoutAgentRunsInput, Prisma.SessionUncheckedUpdateWithoutAgentRunsInput>;
};
export type SessionUpdateWithoutAgentRunsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutAgentRunsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionCreateManyUserInput = {
    id: string;
    appClientId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
};
export type SessionUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionCreateManyAppClientInput = {
    id: string;
    userId: number;
    agentId?: number | null;
    title?: string | null;
    createdAt?: Date | string;
};
export type SessionUpdateWithoutAppClientInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput;
    messages?: Prisma.MessageUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messages?: Prisma.MessageUncheckedUpdateManyWithoutSessionNestedInput;
    agentRuns?: Prisma.AgentRunUncheckedUpdateManyWithoutSessionNestedInput;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutSessionNestedInput;
    messageFeedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput;
    sessionGoaMemory?: Prisma.SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput;
};
export type SessionUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    title?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionCountOutputType = {
    messages: number;
    agentRuns: number;
    messageTurns: number;
    messageFeedbacks: number;
};
export type SessionCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    messages?: boolean | SessionCountOutputTypeCountMessagesArgs;
    agentRuns?: boolean | SessionCountOutputTypeCountAgentRunsArgs;
    messageTurns?: boolean | SessionCountOutputTypeCountMessageTurnsArgs;
    messageFeedbacks?: boolean | SessionCountOutputTypeCountMessageFeedbacksArgs;
};
export type SessionCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionCountOutputTypeSelect<ExtArgs> | null;
};
export type SessionCountOutputTypeCountMessagesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
};
export type SessionCountOutputTypeCountAgentRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentRunWhereInput;
};
export type SessionCountOutputTypeCountMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageTurnWhereInput;
};
export type SessionCountOutputTypeCountMessageFeedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
};
export type SessionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    title?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    messages?: boolean | Prisma.Session$messagesArgs<ExtArgs>;
    agentRuns?: boolean | Prisma.Session$agentRunsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Session$messageTurnsArgs<ExtArgs>;
    messageFeedbacks?: boolean | Prisma.Session$messageFeedbacksArgs<ExtArgs>;
    sessionGoaMemory?: boolean | Prisma.Session$sessionGoaMemoryArgs<ExtArgs>;
    _count?: boolean | Prisma.SessionCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["session"]>;
export type SessionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    title?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["session"]>;
export type SessionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    title?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["session"]>;
export type SessionSelectScalar = {
    id?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    agentId?: boolean;
    title?: boolean;
    createdAt?: boolean;
};
export type SessionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "appClientId" | "agentId" | "title" | "createdAt", ExtArgs["result"]["session"]>;
export type SessionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    messages?: boolean | Prisma.Session$messagesArgs<ExtArgs>;
    agentRuns?: boolean | Prisma.Session$agentRunsArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Session$messageTurnsArgs<ExtArgs>;
    messageFeedbacks?: boolean | Prisma.Session$messageFeedbacksArgs<ExtArgs>;
    sessionGoaMemory?: boolean | Prisma.Session$sessionGoaMemoryArgs<ExtArgs>;
    _count?: boolean | Prisma.SessionCountOutputTypeDefaultArgs<ExtArgs>;
};
export type SessionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type SessionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type $SessionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Session";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        messages: Prisma.$MessagePayload<ExtArgs>[];
        agentRuns: Prisma.$AgentRunPayload<ExtArgs>[];
        messageTurns: Prisma.$MessageTurnPayload<ExtArgs>[];
        messageFeedbacks: Prisma.$MessageFeedbackPayload<ExtArgs>[];
        sessionGoaMemory: Prisma.$SessionGoaMemoryPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: number;
        appClientId: number;
        agentId: number | null;
        title: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["session"]>;
    composites: {};
};
export type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SessionPayload, S>;
export type SessionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SessionCountAggregateInputType | true;
};
export interface SessionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Session'];
        meta: {
            name: 'Session';
        };
    };
    findUnique<T extends SessionFindUniqueArgs>(args: Prisma.SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SessionFindFirstArgs>(args?: Prisma.SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SessionFindManyArgs>(args?: Prisma.SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SessionCreateArgs>(args: Prisma.SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SessionCreateManyArgs>(args?: Prisma.SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SessionDeleteArgs>(args: Prisma.SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SessionUpdateArgs>(args: Prisma.SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SessionDeleteManyArgs>(args?: Prisma.SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SessionUpdateManyArgs>(args: Prisma.SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SessionUpsertArgs>(args: Prisma.SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SessionCountArgs>(args?: Prisma.Subset<T, SessionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SessionCountAggregateOutputType> : number>;
    aggregate<T extends SessionAggregateArgs>(args: Prisma.Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>;
    groupBy<T extends SessionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SessionGroupByArgs['orderBy'];
    } : {
        orderBy?: SessionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SessionFieldRefs;
}
export interface Prisma__SessionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    messages<T extends Prisma.Session$messagesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Session$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    agentRuns<T extends Prisma.Session$agentRunsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Session$agentRunsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messageTurns<T extends Prisma.Session$messageTurnsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Session$messageTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    messageFeedbacks<T extends Prisma.Session$messageFeedbacksArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Session$messageFeedbacksArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    sessionGoaMemory<T extends Prisma.Session$sessionGoaMemoryArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Session$sessionGoaMemoryArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SessionFieldRefs {
    readonly id: Prisma.FieldRef<"Session", 'String'>;
    readonly userId: Prisma.FieldRef<"Session", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"Session", 'Int'>;
    readonly agentId: Prisma.FieldRef<"Session", 'Int'>;
    readonly title: Prisma.FieldRef<"Session", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Session", 'DateTime'>;
}
export type SessionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where: Prisma.SessionWhereUniqueInput;
};
export type SessionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where: Prisma.SessionWhereUniqueInput;
};
export type SessionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type SessionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type SessionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type SessionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionCreateInput, Prisma.SessionUncheckedCreateInput>;
};
export type SessionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SessionCreateManyInput | Prisma.SessionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SessionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    data: Prisma.SessionCreateManyInput | Prisma.SessionCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.SessionIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type SessionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionUpdateInput, Prisma.SessionUncheckedUpdateInput>;
    where: Prisma.SessionWhereUniqueInput;
};
export type SessionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SessionUpdateManyMutationInput, Prisma.SessionUncheckedUpdateManyInput>;
    where?: Prisma.SessionWhereInput;
    limit?: number;
};
export type SessionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionUpdateManyMutationInput, Prisma.SessionUncheckedUpdateManyInput>;
    where?: Prisma.SessionWhereInput;
    limit?: number;
    include?: Prisma.SessionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type SessionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where: Prisma.SessionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionCreateInput, Prisma.SessionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SessionUpdateInput, Prisma.SessionUncheckedUpdateInput>;
};
export type SessionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
    where: Prisma.SessionWhereUniqueInput;
};
export type SessionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionWhereInput;
    limit?: number;
};
export type Session$messagesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type Session$agentRunsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentRunSelect<ExtArgs> | null;
    omit?: Prisma.AgentRunOmit<ExtArgs> | null;
    include?: Prisma.AgentRunInclude<ExtArgs> | null;
    where?: Prisma.AgentRunWhereInput;
    orderBy?: Prisma.AgentRunOrderByWithRelationInput | Prisma.AgentRunOrderByWithRelationInput[];
    cursor?: Prisma.AgentRunWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentRunScalarFieldEnum | Prisma.AgentRunScalarFieldEnum[];
};
export type Session$messageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Session$messageFeedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Session$sessionGoaMemoryArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where?: Prisma.SessionGoaMemoryWhereInput;
};
export type SessionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionSelect<ExtArgs> | null;
    omit?: Prisma.SessionOmit<ExtArgs> | null;
    include?: Prisma.SessionInclude<ExtArgs> | null;
};
