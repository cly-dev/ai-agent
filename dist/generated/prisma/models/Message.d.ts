import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type MessageModel = runtime.Types.Result.DefaultSelection<Prisma.$MessagePayload>;
export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null;
    _avg: MessageAvgAggregateOutputType | null;
    _sum: MessageSumAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
export type MessageAvgAggregateOutputType = {
    id: number | null;
};
export type MessageSumAggregateOutputType = {
    id: number | null;
};
export type MessageMinAggregateOutputType = {
    id: number | null;
    sessionId: string | null;
    role: string | null;
    content: string | null;
    toolName: string | null;
    createdAt: Date | null;
};
export type MessageMaxAggregateOutputType = {
    id: number | null;
    sessionId: string | null;
    role: string | null;
    content: string | null;
    toolName: string | null;
    createdAt: Date | null;
};
export type MessageCountAggregateOutputType = {
    id: number;
    sessionId: number;
    role: number;
    content: number;
    toolName: number;
    toolInput: number;
    toolOutput: number;
    pageContextJson: number;
    createdAt: number;
    _all: number;
};
export type MessageAvgAggregateInputType = {
    id?: true;
};
export type MessageSumAggregateInputType = {
    id?: true;
};
export type MessageMinAggregateInputType = {
    id?: true;
    sessionId?: true;
    role?: true;
    content?: true;
    toolName?: true;
    createdAt?: true;
};
export type MessageMaxAggregateInputType = {
    id?: true;
    sessionId?: true;
    role?: true;
    content?: true;
    toolName?: true;
    createdAt?: true;
};
export type MessageCountAggregateInputType = {
    id?: true;
    sessionId?: true;
    role?: true;
    content?: true;
    toolName?: true;
    toolInput?: true;
    toolOutput?: true;
    pageContextJson?: true;
    createdAt?: true;
    _all?: true;
};
export type MessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MessageCountAggregateInputType;
    _avg?: MessageAvgAggregateInputType;
    _sum?: MessageSumAggregateInputType;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
    [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMessage[P]> : Prisma.GetScalarType<T[P], AggregateMessage[P]>;
};
export type MessageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithAggregationInput | Prisma.MessageOrderByWithAggregationInput[];
    by: Prisma.MessageScalarFieldEnum[] | Prisma.MessageScalarFieldEnum;
    having?: Prisma.MessageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MessageCountAggregateInputType | true;
    _avg?: MessageAvgAggregateInputType;
    _sum?: MessageSumAggregateInputType;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type MessageGroupByOutputType = {
    id: number;
    sessionId: string;
    role: string;
    content: string | null;
    toolName: string | null;
    toolInput: runtime.JsonValue | null;
    toolOutput: runtime.JsonValue | null;
    pageContextJson: runtime.JsonValue | null;
    createdAt: Date;
    _count: MessageCountAggregateOutputType | null;
    _avg: MessageAvgAggregateOutputType | null;
    _sum: MessageSumAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
export type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MessageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]>;
}>>;
export type MessageWhereInput = {
    AND?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    OR?: Prisma.MessageWhereInput[];
    NOT?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    id?: Prisma.IntFilter<"Message"> | number;
    sessionId?: Prisma.StringFilter<"Message"> | string;
    role?: Prisma.StringFilter<"Message"> | string;
    content?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolName?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolInput?: Prisma.JsonNullableFilter<"Message">;
    toolOutput?: Prisma.JsonNullableFilter<"Message">;
    pageContextJson?: Prisma.JsonNullableFilter<"Message">;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    outputMessageTurns?: Prisma.MessageTurnListRelationFilter;
    agentRunOutputs?: Prisma.AgentRunListRelationFilter;
    feedbacks?: Prisma.MessageFeedbackListRelationFilter;
};
export type MessageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    content?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolName?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolInput?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolOutput?: Prisma.SortOrderInput | Prisma.SortOrder;
    pageContextJson?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    session?: Prisma.SessionOrderByWithRelationInput;
    messageTurns?: Prisma.MessageTurnOrderByRelationAggregateInput;
    outputMessageTurns?: Prisma.MessageTurnOrderByRelationAggregateInput;
    agentRunOutputs?: Prisma.AgentRunOrderByRelationAggregateInput;
    feedbacks?: Prisma.MessageFeedbackOrderByRelationAggregateInput;
};
export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    OR?: Prisma.MessageWhereInput[];
    NOT?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    sessionId?: Prisma.StringFilter<"Message"> | string;
    role?: Prisma.StringFilter<"Message"> | string;
    content?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolName?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolInput?: Prisma.JsonNullableFilter<"Message">;
    toolOutput?: Prisma.JsonNullableFilter<"Message">;
    pageContextJson?: Prisma.JsonNullableFilter<"Message">;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
    messageTurns?: Prisma.MessageTurnListRelationFilter;
    outputMessageTurns?: Prisma.MessageTurnListRelationFilter;
    agentRunOutputs?: Prisma.AgentRunListRelationFilter;
    feedbacks?: Prisma.MessageFeedbackListRelationFilter;
}, "id">;
export type MessageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    content?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolName?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolInput?: Prisma.SortOrderInput | Prisma.SortOrder;
    toolOutput?: Prisma.SortOrderInput | Prisma.SortOrder;
    pageContextJson?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.MessageCountOrderByAggregateInput;
    _avg?: Prisma.MessageAvgOrderByAggregateInput;
    _max?: Prisma.MessageMaxOrderByAggregateInput;
    _min?: Prisma.MessageMinOrderByAggregateInput;
    _sum?: Prisma.MessageSumOrderByAggregateInput;
};
export type MessageScalarWhereWithAggregatesInput = {
    AND?: Prisma.MessageScalarWhereWithAggregatesInput | Prisma.MessageScalarWhereWithAggregatesInput[];
    OR?: Prisma.MessageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MessageScalarWhereWithAggregatesInput | Prisma.MessageScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Message"> | number;
    sessionId?: Prisma.StringWithAggregatesFilter<"Message"> | string;
    role?: Prisma.StringWithAggregatesFilter<"Message"> | string;
    content?: Prisma.StringNullableWithAggregatesFilter<"Message"> | string | null;
    toolName?: Prisma.StringNullableWithAggregatesFilter<"Message"> | string | null;
    toolInput?: Prisma.JsonNullableWithAggregatesFilter<"Message">;
    toolOutput?: Prisma.JsonNullableWithAggregatesFilter<"Message">;
    pageContextJson?: Prisma.JsonNullableWithAggregatesFilter<"Message">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Message"> | Date | string;
};
export type MessageCreateInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessagesInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutMessageInput;
};
export type MessageUncheckedCreateInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput;
};
export type MessageUpdateInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessagesNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput;
};
export type MessageCreateManyInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type MessageUpdateManyMutationInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageListRelationFilter = {
    every?: Prisma.MessageWhereInput;
    some?: Prisma.MessageWhereInput;
    none?: Prisma.MessageWhereInput;
};
export type MessageOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MessageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    toolName?: Prisma.SortOrder;
    toolInput?: Prisma.SortOrder;
    toolOutput?: Prisma.SortOrder;
    pageContextJson?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type MessageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    toolName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    toolName?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type MessageScalarRelationFilter = {
    is?: Prisma.MessageWhereInput;
    isNot?: Prisma.MessageWhereInput;
};
export type MessageNullableScalarRelationFilter = {
    is?: Prisma.MessageWhereInput | null;
    isNot?: Prisma.MessageWhereInput | null;
};
export type MessageCreateNestedManyWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput> | Prisma.MessageCreateWithoutSessionInput[] | Prisma.MessageUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSessionInput | Prisma.MessageCreateOrConnectWithoutSessionInput[];
    createMany?: Prisma.MessageCreateManySessionInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUncheckedCreateNestedManyWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput> | Prisma.MessageCreateWithoutSessionInput[] | Prisma.MessageUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSessionInput | Prisma.MessageCreateOrConnectWithoutSessionInput[];
    createMany?: Prisma.MessageCreateManySessionInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUpdateManyWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput> | Prisma.MessageCreateWithoutSessionInput[] | Prisma.MessageUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSessionInput | Prisma.MessageCreateOrConnectWithoutSessionInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSessionInput | Prisma.MessageUpsertWithWhereUniqueWithoutSessionInput[];
    createMany?: Prisma.MessageCreateManySessionInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSessionInput | Prisma.MessageUpdateWithWhereUniqueWithoutSessionInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSessionInput | Prisma.MessageUpdateManyWithWhereWithoutSessionInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput> | Prisma.MessageCreateWithoutSessionInput[] | Prisma.MessageUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSessionInput | Prisma.MessageCreateOrConnectWithoutSessionInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSessionInput | Prisma.MessageUpsertWithWhereUniqueWithoutSessionInput[];
    createMany?: Prisma.MessageCreateManySessionInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSessionInput | Prisma.MessageUpdateWithWhereUniqueWithoutSessionInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSessionInput | Prisma.MessageUpdateManyWithWhereWithoutSessionInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageCreateNestedOneWithoutFeedbacksInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutFeedbacksInput, Prisma.MessageUncheckedCreateWithoutFeedbacksInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutFeedbacksInput;
    connect?: Prisma.MessageWhereUniqueInput;
};
export type MessageUpdateOneRequiredWithoutFeedbacksNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutFeedbacksInput, Prisma.MessageUncheckedCreateWithoutFeedbacksInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutFeedbacksInput;
    upsert?: Prisma.MessageUpsertWithoutFeedbacksInput;
    connect?: Prisma.MessageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.MessageUpdateToOneWithWhereWithoutFeedbacksInput, Prisma.MessageUpdateWithoutFeedbacksInput>, Prisma.MessageUncheckedUpdateWithoutFeedbacksInput>;
};
export type MessageCreateNestedOneWithoutMessageTurnsInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutMessageTurnsInput;
    connect?: Prisma.MessageWhereUniqueInput;
};
export type MessageCreateNestedOneWithoutOutputMessageTurnsInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutOutputMessageTurnsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutOutputMessageTurnsInput;
    connect?: Prisma.MessageWhereUniqueInput;
};
export type MessageUpdateOneWithoutMessageTurnsNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutMessageTurnsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutMessageTurnsInput;
    upsert?: Prisma.MessageUpsertWithoutMessageTurnsInput;
    disconnect?: Prisma.MessageWhereInput | boolean;
    delete?: Prisma.MessageWhereInput | boolean;
    connect?: Prisma.MessageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.MessageUpdateToOneWithWhereWithoutMessageTurnsInput, Prisma.MessageUpdateWithoutMessageTurnsInput>, Prisma.MessageUncheckedUpdateWithoutMessageTurnsInput>;
};
export type MessageUpdateOneWithoutOutputMessageTurnsNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutOutputMessageTurnsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutOutputMessageTurnsInput;
    upsert?: Prisma.MessageUpsertWithoutOutputMessageTurnsInput;
    disconnect?: Prisma.MessageWhereInput | boolean;
    delete?: Prisma.MessageWhereInput | boolean;
    connect?: Prisma.MessageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.MessageUpdateToOneWithWhereWithoutOutputMessageTurnsInput, Prisma.MessageUpdateWithoutOutputMessageTurnsInput>, Prisma.MessageUncheckedUpdateWithoutOutputMessageTurnsInput>;
};
export type MessageCreateNestedOneWithoutAgentRunOutputsInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedCreateWithoutAgentRunOutputsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutAgentRunOutputsInput;
    connect?: Prisma.MessageWhereUniqueInput;
};
export type MessageUpdateOneWithoutAgentRunOutputsNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedCreateWithoutAgentRunOutputsInput>;
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutAgentRunOutputsInput;
    upsert?: Prisma.MessageUpsertWithoutAgentRunOutputsInput;
    disconnect?: Prisma.MessageWhereInput | boolean;
    delete?: Prisma.MessageWhereInput | boolean;
    connect?: Prisma.MessageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.MessageUpdateToOneWithWhereWithoutAgentRunOutputsInput, Prisma.MessageUpdateWithoutAgentRunOutputsInput>, Prisma.MessageUncheckedUpdateWithoutAgentRunOutputsInput>;
};
export type MessageCreateWithoutSessionInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutMessageInput;
};
export type MessageUncheckedCreateWithoutSessionInput = {
    id?: number;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput;
};
export type MessageCreateOrConnectWithoutSessionInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput>;
};
export type MessageCreateManySessionInputEnvelope = {
    data: Prisma.MessageCreateManySessionInput | Prisma.MessageCreateManySessionInput[];
    skipDuplicates?: boolean;
};
export type MessageUpsertWithWhereUniqueWithoutSessionInput = {
    where: Prisma.MessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageUpdateWithoutSessionInput, Prisma.MessageUncheckedUpdateWithoutSessionInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSessionInput, Prisma.MessageUncheckedCreateWithoutSessionInput>;
};
export type MessageUpdateWithWhereUniqueWithoutSessionInput = {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutSessionInput, Prisma.MessageUncheckedUpdateWithoutSessionInput>;
};
export type MessageUpdateManyWithWhereWithoutSessionInput = {
    where: Prisma.MessageScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyWithoutSessionInput>;
};
export type MessageScalarWhereInput = {
    AND?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
    OR?: Prisma.MessageScalarWhereInput[];
    NOT?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
    id?: Prisma.IntFilter<"Message"> | number;
    sessionId?: Prisma.StringFilter<"Message"> | string;
    role?: Prisma.StringFilter<"Message"> | string;
    content?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolName?: Prisma.StringNullableFilter<"Message"> | string | null;
    toolInput?: Prisma.JsonNullableFilter<"Message">;
    toolOutput?: Prisma.JsonNullableFilter<"Message">;
    pageContextJson?: Prisma.JsonNullableFilter<"Message">;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
};
export type MessageCreateWithoutFeedbacksInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessagesInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunCreateNestedManyWithoutOutputMessageInput;
};
export type MessageUncheckedCreateWithoutFeedbacksInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedCreateNestedManyWithoutOutputMessageInput;
};
export type MessageCreateOrConnectWithoutFeedbacksInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutFeedbacksInput, Prisma.MessageUncheckedCreateWithoutFeedbacksInput>;
};
export type MessageUpsertWithoutFeedbacksInput = {
    update: Prisma.XOR<Prisma.MessageUpdateWithoutFeedbacksInput, Prisma.MessageUncheckedUpdateWithoutFeedbacksInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutFeedbacksInput, Prisma.MessageUncheckedCreateWithoutFeedbacksInput>;
    where?: Prisma.MessageWhereInput;
};
export type MessageUpdateToOneWithWhereWithoutFeedbacksInput = {
    where?: Prisma.MessageWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutFeedbacksInput, Prisma.MessageUncheckedUpdateWithoutFeedbacksInput>;
};
export type MessageUpdateWithoutFeedbacksInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessagesNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUpdateManyWithoutOutputMessageNestedInput;
};
export type MessageUncheckedUpdateWithoutFeedbacksInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedUpdateManyWithoutOutputMessageNestedInput;
};
export type MessageCreateWithoutMessageTurnsInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessagesInput;
    outputMessageTurns?: Prisma.MessageTurnCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutMessageInput;
};
export type MessageUncheckedCreateWithoutMessageTurnsInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    outputMessageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutOutputMessageInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput;
};
export type MessageCreateOrConnectWithoutMessageTurnsInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutMessageTurnsInput>;
};
export type MessageCreateWithoutOutputMessageTurnsInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessagesInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutMessageInput;
    agentRunOutputs?: Prisma.AgentRunCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutMessageInput;
};
export type MessageUncheckedCreateWithoutOutputMessageTurnsInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutMessageInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput;
};
export type MessageCreateOrConnectWithoutOutputMessageTurnsInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutOutputMessageTurnsInput>;
};
export type MessageUpsertWithoutMessageTurnsInput = {
    update: Prisma.XOR<Prisma.MessageUpdateWithoutMessageTurnsInput, Prisma.MessageUncheckedUpdateWithoutMessageTurnsInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutMessageTurnsInput>;
    where?: Prisma.MessageWhereInput;
};
export type MessageUpdateToOneWithWhereWithoutMessageTurnsInput = {
    where?: Prisma.MessageWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutMessageTurnsInput, Prisma.MessageUncheckedUpdateWithoutMessageTurnsInput>;
};
export type MessageUpdateWithoutMessageTurnsInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessagesNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateWithoutMessageTurnsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    outputMessageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput;
};
export type MessageUpsertWithoutOutputMessageTurnsInput = {
    update: Prisma.XOR<Prisma.MessageUpdateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedUpdateWithoutOutputMessageTurnsInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedCreateWithoutOutputMessageTurnsInput>;
    where?: Prisma.MessageWhereInput;
};
export type MessageUpdateToOneWithWhereWithoutOutputMessageTurnsInput = {
    where?: Prisma.MessageWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutOutputMessageTurnsInput, Prisma.MessageUncheckedUpdateWithoutOutputMessageTurnsInput>;
};
export type MessageUpdateWithoutOutputMessageTurnsInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessagesNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateWithoutOutputMessageTurnsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput;
};
export type MessageCreateWithoutAgentRunOutputsInput = {
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessagesInput;
    messageTurns?: Prisma.MessageTurnCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackCreateNestedManyWithoutMessageInput;
};
export type MessageUncheckedCreateWithoutAgentRunOutputsInput = {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutMessageInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedCreateNestedManyWithoutOutputMessageInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput;
};
export type MessageCreateOrConnectWithoutAgentRunOutputsInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedCreateWithoutAgentRunOutputsInput>;
};
export type MessageUpsertWithoutAgentRunOutputsInput = {
    update: Prisma.XOR<Prisma.MessageUpdateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedUpdateWithoutAgentRunOutputsInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedCreateWithoutAgentRunOutputsInput>;
    where?: Prisma.MessageWhereInput;
};
export type MessageUpdateToOneWithWhereWithoutAgentRunOutputsInput = {
    where?: Prisma.MessageWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutAgentRunOutputsInput, Prisma.MessageUncheckedUpdateWithoutAgentRunOutputsInput>;
};
export type MessageUpdateWithoutAgentRunOutputsInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessagesNestedInput;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateWithoutAgentRunOutputsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput;
};
export type MessageCreateManySessionInput = {
    id?: number;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
};
export type MessageUpdateWithoutSessionInput = {
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateWithoutSessionInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    messageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutMessageNestedInput;
    outputMessageTurns?: Prisma.MessageTurnUncheckedUpdateManyWithoutOutputMessageNestedInput;
    agentRunOutputs?: Prisma.AgentRunUncheckedUpdateManyWithoutOutputMessageNestedInput;
    feedbacks?: Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput;
};
export type MessageUncheckedUpdateManyWithoutSessionInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toolInput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    toolOutput?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    pageContextJson?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageCountOutputType = {
    messageTurns: number;
    outputMessageTurns: number;
    agentRunOutputs: number;
    feedbacks: number;
};
export type MessageCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    messageTurns?: boolean | MessageCountOutputTypeCountMessageTurnsArgs;
    outputMessageTurns?: boolean | MessageCountOutputTypeCountOutputMessageTurnsArgs;
    agentRunOutputs?: boolean | MessageCountOutputTypeCountAgentRunOutputsArgs;
    feedbacks?: boolean | MessageCountOutputTypeCountFeedbacksArgs;
};
export type MessageCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageCountOutputTypeSelect<ExtArgs> | null;
};
export type MessageCountOutputTypeCountMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageTurnWhereInput;
};
export type MessageCountOutputTypeCountOutputMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageTurnWhereInput;
};
export type MessageCountOutputTypeCountAgentRunOutputsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentRunWhereInput;
};
export type MessageCountOutputTypeCountFeedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
};
export type MessageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sessionId?: boolean;
    role?: boolean;
    content?: boolean;
    toolName?: boolean;
    toolInput?: boolean;
    toolOutput?: boolean;
    pageContextJson?: boolean;
    createdAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Message$messageTurnsArgs<ExtArgs>;
    outputMessageTurns?: boolean | Prisma.Message$outputMessageTurnsArgs<ExtArgs>;
    agentRunOutputs?: boolean | Prisma.Message$agentRunOutputsArgs<ExtArgs>;
    feedbacks?: boolean | Prisma.Message$feedbacksArgs<ExtArgs>;
    _count?: boolean | Prisma.MessageCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sessionId?: boolean;
    role?: boolean;
    content?: boolean;
    toolName?: boolean;
    toolInput?: boolean;
    toolOutput?: boolean;
    pageContextJson?: boolean;
    createdAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sessionId?: boolean;
    role?: boolean;
    content?: boolean;
    toolName?: boolean;
    toolInput?: boolean;
    toolOutput?: boolean;
    pageContextJson?: boolean;
    createdAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectScalar = {
    id?: boolean;
    sessionId?: boolean;
    role?: boolean;
    content?: boolean;
    toolName?: boolean;
    toolInput?: boolean;
    toolOutput?: boolean;
    pageContextJson?: boolean;
    createdAt?: boolean;
};
export type MessageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "sessionId" | "role" | "content" | "toolName" | "toolInput" | "toolOutput" | "pageContextJson" | "createdAt", ExtArgs["result"]["message"]>;
export type MessageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    messageTurns?: boolean | Prisma.Message$messageTurnsArgs<ExtArgs>;
    outputMessageTurns?: boolean | Prisma.Message$outputMessageTurnsArgs<ExtArgs>;
    agentRunOutputs?: boolean | Prisma.Message$agentRunOutputsArgs<ExtArgs>;
    feedbacks?: boolean | Prisma.Message$feedbacksArgs<ExtArgs>;
    _count?: boolean | Prisma.MessageCountOutputTypeDefaultArgs<ExtArgs>;
};
export type MessageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
};
export type MessageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
};
export type $MessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Message";
    objects: {
        session: Prisma.$SessionPayload<ExtArgs>;
        messageTurns: Prisma.$MessageTurnPayload<ExtArgs>[];
        outputMessageTurns: Prisma.$MessageTurnPayload<ExtArgs>[];
        agentRunOutputs: Prisma.$AgentRunPayload<ExtArgs>[];
        feedbacks: Prisma.$MessageFeedbackPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        sessionId: string;
        role: string;
        content: string | null;
        toolName: string | null;
        toolInput: runtime.JsonValue | null;
        toolOutput: runtime.JsonValue | null;
        pageContextJson: runtime.JsonValue | null;
        createdAt: Date;
    }, ExtArgs["result"]["message"]>;
    composites: {};
};
export type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MessagePayload, S>;
export type MessageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MessageCountAggregateInputType | true;
};
export interface MessageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Message'];
        meta: {
            name: 'Message';
        };
    };
    findUnique<T extends MessageFindUniqueArgs>(args: Prisma.SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MessageFindFirstArgs>(args?: Prisma.SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MessageFindManyArgs>(args?: Prisma.SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MessageCreateArgs>(args: Prisma.SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MessageCreateManyArgs>(args?: Prisma.SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MessageDeleteArgs>(args: Prisma.SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MessageUpdateArgs>(args: Prisma.SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MessageDeleteManyArgs>(args?: Prisma.SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MessageUpdateManyArgs>(args: Prisma.SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MessageUpsertArgs>(args: Prisma.SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MessageCountArgs>(args?: Prisma.Subset<T, MessageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MessageCountAggregateOutputType> : number>;
    aggregate<T extends MessageAggregateArgs>(args: Prisma.Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>;
    groupBy<T extends MessageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MessageGroupByArgs['orderBy'];
    } : {
        orderBy?: MessageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MessageFieldRefs;
}
export interface Prisma__MessageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    session<T extends Prisma.SessionDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SessionDefaultArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    messageTurns<T extends Prisma.Message$messageTurnsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$messageTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    outputMessageTurns<T extends Prisma.Message$outputMessageTurnsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$outputMessageTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    agentRunOutputs<T extends Prisma.Message$agentRunOutputsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$agentRunOutputsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    feedbacks<T extends Prisma.Message$feedbacksArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$feedbacksArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MessageFieldRefs {
    readonly id: Prisma.FieldRef<"Message", 'Int'>;
    readonly sessionId: Prisma.FieldRef<"Message", 'String'>;
    readonly role: Prisma.FieldRef<"Message", 'String'>;
    readonly content: Prisma.FieldRef<"Message", 'String'>;
    readonly toolName: Prisma.FieldRef<"Message", 'String'>;
    readonly toolInput: Prisma.FieldRef<"Message", 'Json'>;
    readonly toolOutput: Prisma.FieldRef<"Message", 'Json'>;
    readonly pageContextJson: Prisma.FieldRef<"Message", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"Message", 'DateTime'>;
}
export type MessageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageCreateInput, Prisma.MessageUncheckedCreateInput>;
};
export type MessageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MessageCreateManyInput | Prisma.MessageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MessageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    data: Prisma.MessageCreateManyInput | Prisma.MessageCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.MessageIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type MessageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageUpdateInput, Prisma.MessageUncheckedUpdateInput>;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyInput>;
    where?: Prisma.MessageWhereInput;
    limit?: number;
};
export type MessageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyInput>;
    where?: Prisma.MessageWhereInput;
    limit?: number;
    include?: Prisma.MessageIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type MessageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateInput, Prisma.MessageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MessageUpdateInput, Prisma.MessageUncheckedUpdateInput>;
};
export type MessageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    limit?: number;
};
export type Message$messageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Message$outputMessageTurnsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Message$agentRunOutputsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Message$feedbacksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
};
