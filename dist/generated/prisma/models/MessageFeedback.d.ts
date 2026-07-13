import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type MessageFeedbackModel = runtime.Types.Result.DefaultSelection<Prisma.$MessageFeedbackPayload>;
export type AggregateMessageFeedback = {
    _count: MessageFeedbackCountAggregateOutputType | null;
    _avg: MessageFeedbackAvgAggregateOutputType | null;
    _sum: MessageFeedbackSumAggregateOutputType | null;
    _min: MessageFeedbackMinAggregateOutputType | null;
    _max: MessageFeedbackMaxAggregateOutputType | null;
};
export type MessageFeedbackAvgAggregateOutputType = {
    id: number | null;
    messageId: number | null;
    userId: number | null;
    appClientId: number | null;
    turnId: number | null;
    agentId: number | null;
};
export type MessageFeedbackSumAggregateOutputType = {
    id: number | null;
    messageId: number | null;
    userId: number | null;
    appClientId: number | null;
    turnId: number | null;
    agentId: number | null;
};
export type MessageFeedbackMinAggregateOutputType = {
    id: number | null;
    messageId: number | null;
    sessionId: string | null;
    userId: number | null;
    appClientId: number | null;
    turnId: number | null;
    agentId: number | null;
    rating: $Enums.MessageFeedbackRating | null;
    comment: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MessageFeedbackMaxAggregateOutputType = {
    id: number | null;
    messageId: number | null;
    sessionId: string | null;
    userId: number | null;
    appClientId: number | null;
    turnId: number | null;
    agentId: number | null;
    rating: $Enums.MessageFeedbackRating | null;
    comment: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MessageFeedbackCountAggregateOutputType = {
    id: number;
    messageId: number;
    sessionId: number;
    userId: number;
    appClientId: number;
    turnId: number;
    agentId: number;
    rating: number;
    reasonTags: number;
    comment: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type MessageFeedbackAvgAggregateInputType = {
    id?: true;
    messageId?: true;
    userId?: true;
    appClientId?: true;
    turnId?: true;
    agentId?: true;
};
export type MessageFeedbackSumAggregateInputType = {
    id?: true;
    messageId?: true;
    userId?: true;
    appClientId?: true;
    turnId?: true;
    agentId?: true;
};
export type MessageFeedbackMinAggregateInputType = {
    id?: true;
    messageId?: true;
    sessionId?: true;
    userId?: true;
    appClientId?: true;
    turnId?: true;
    agentId?: true;
    rating?: true;
    comment?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MessageFeedbackMaxAggregateInputType = {
    id?: true;
    messageId?: true;
    sessionId?: true;
    userId?: true;
    appClientId?: true;
    turnId?: true;
    agentId?: true;
    rating?: true;
    comment?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MessageFeedbackCountAggregateInputType = {
    id?: true;
    messageId?: true;
    sessionId?: true;
    userId?: true;
    appClientId?: true;
    turnId?: true;
    agentId?: true;
    rating?: true;
    reasonTags?: true;
    comment?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type MessageFeedbackAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
    orderBy?: Prisma.MessageFeedbackOrderByWithRelationInput | Prisma.MessageFeedbackOrderByWithRelationInput[];
    cursor?: Prisma.MessageFeedbackWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MessageFeedbackCountAggregateInputType;
    _avg?: MessageFeedbackAvgAggregateInputType;
    _sum?: MessageFeedbackSumAggregateInputType;
    _min?: MessageFeedbackMinAggregateInputType;
    _max?: MessageFeedbackMaxAggregateInputType;
};
export type GetMessageFeedbackAggregateType<T extends MessageFeedbackAggregateArgs> = {
    [P in keyof T & keyof AggregateMessageFeedback]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMessageFeedback[P]> : Prisma.GetScalarType<T[P], AggregateMessageFeedback[P]>;
};
export type MessageFeedbackGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
    orderBy?: Prisma.MessageFeedbackOrderByWithAggregationInput | Prisma.MessageFeedbackOrderByWithAggregationInput[];
    by: Prisma.MessageFeedbackScalarFieldEnum[] | Prisma.MessageFeedbackScalarFieldEnum;
    having?: Prisma.MessageFeedbackScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MessageFeedbackCountAggregateInputType | true;
    _avg?: MessageFeedbackAvgAggregateInputType;
    _sum?: MessageFeedbackSumAggregateInputType;
    _min?: MessageFeedbackMinAggregateInputType;
    _max?: MessageFeedbackMaxAggregateInputType;
};
export type MessageFeedbackGroupByOutputType = {
    id: number;
    messageId: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    turnId: number | null;
    agentId: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags: runtime.JsonValue | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: MessageFeedbackCountAggregateOutputType | null;
    _avg: MessageFeedbackAvgAggregateOutputType | null;
    _sum: MessageFeedbackSumAggregateOutputType | null;
    _min: MessageFeedbackMinAggregateOutputType | null;
    _max: MessageFeedbackMaxAggregateOutputType | null;
};
export type GetMessageFeedbackGroupByPayload<T extends MessageFeedbackGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MessageFeedbackGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MessageFeedbackGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MessageFeedbackGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MessageFeedbackGroupByOutputType[P]>;
}>>;
export type MessageFeedbackWhereInput = {
    AND?: Prisma.MessageFeedbackWhereInput | Prisma.MessageFeedbackWhereInput[];
    OR?: Prisma.MessageFeedbackWhereInput[];
    NOT?: Prisma.MessageFeedbackWhereInput | Prisma.MessageFeedbackWhereInput[];
    id?: Prisma.IntFilter<"MessageFeedback"> | number;
    messageId?: Prisma.IntFilter<"MessageFeedback"> | number;
    sessionId?: Prisma.StringFilter<"MessageFeedback"> | string;
    userId?: Prisma.IntFilter<"MessageFeedback"> | number;
    appClientId?: Prisma.IntFilter<"MessageFeedback"> | number;
    turnId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    agentId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFilter<"MessageFeedback"> | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.JsonNullableFilter<"MessageFeedback">;
    comment?: Prisma.StringNullableFilter<"MessageFeedback"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
    message?: Prisma.XOR<Prisma.MessageScalarRelationFilter, Prisma.MessageWhereInput>;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
};
export type MessageFeedbackOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrderInput | Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    rating?: Prisma.SortOrder;
    reasonTags?: Prisma.SortOrderInput | Prisma.SortOrder;
    comment?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    message?: Prisma.MessageOrderByWithRelationInput;
    session?: Prisma.SessionOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
};
export type MessageFeedbackWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    messageId_userId?: Prisma.MessageFeedbackMessageIdUserIdCompoundUniqueInput;
    AND?: Prisma.MessageFeedbackWhereInput | Prisma.MessageFeedbackWhereInput[];
    OR?: Prisma.MessageFeedbackWhereInput[];
    NOT?: Prisma.MessageFeedbackWhereInput | Prisma.MessageFeedbackWhereInput[];
    messageId?: Prisma.IntFilter<"MessageFeedback"> | number;
    sessionId?: Prisma.StringFilter<"MessageFeedback"> | string;
    userId?: Prisma.IntFilter<"MessageFeedback"> | number;
    appClientId?: Prisma.IntFilter<"MessageFeedback"> | number;
    turnId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    agentId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFilter<"MessageFeedback"> | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.JsonNullableFilter<"MessageFeedback">;
    comment?: Prisma.StringNullableFilter<"MessageFeedback"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
    message?: Prisma.XOR<Prisma.MessageScalarRelationFilter, Prisma.MessageWhereInput>;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
}, "id" | "messageId_userId">;
export type MessageFeedbackOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrderInput | Prisma.SortOrder;
    agentId?: Prisma.SortOrderInput | Prisma.SortOrder;
    rating?: Prisma.SortOrder;
    reasonTags?: Prisma.SortOrderInput | Prisma.SortOrder;
    comment?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.MessageFeedbackCountOrderByAggregateInput;
    _avg?: Prisma.MessageFeedbackAvgOrderByAggregateInput;
    _max?: Prisma.MessageFeedbackMaxOrderByAggregateInput;
    _min?: Prisma.MessageFeedbackMinOrderByAggregateInput;
    _sum?: Prisma.MessageFeedbackSumOrderByAggregateInput;
};
export type MessageFeedbackScalarWhereWithAggregatesInput = {
    AND?: Prisma.MessageFeedbackScalarWhereWithAggregatesInput | Prisma.MessageFeedbackScalarWhereWithAggregatesInput[];
    OR?: Prisma.MessageFeedbackScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MessageFeedbackScalarWhereWithAggregatesInput | Prisma.MessageFeedbackScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"MessageFeedback"> | number;
    messageId?: Prisma.IntWithAggregatesFilter<"MessageFeedback"> | number;
    sessionId?: Prisma.StringWithAggregatesFilter<"MessageFeedback"> | string;
    userId?: Prisma.IntWithAggregatesFilter<"MessageFeedback"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"MessageFeedback"> | number;
    turnId?: Prisma.IntNullableWithAggregatesFilter<"MessageFeedback"> | number | null;
    agentId?: Prisma.IntNullableWithAggregatesFilter<"MessageFeedback"> | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingWithAggregatesFilter<"MessageFeedback"> | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.JsonNullableWithAggregatesFilter<"MessageFeedback">;
    comment?: Prisma.StringNullableWithAggregatesFilter<"MessageFeedback"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"MessageFeedback"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"MessageFeedback"> | Date | string;
};
export type MessageFeedbackCreateInput = {
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    message: Prisma.MessageCreateNestedOneWithoutFeedbacksInput;
    session: Prisma.SessionCreateNestedOneWithoutMessageFeedbacksInput;
    user: Prisma.UserCreateNestedOneWithoutMessageFeedbacksInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutMessageFeedbacksInput;
};
export type MessageFeedbackUncheckedCreateInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.MessageUpdateOneRequiredWithoutFeedbacksNestedInput;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
};
export type MessageFeedbackUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackCreateManyInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateManyMutationInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackListRelationFilter = {
    every?: Prisma.MessageFeedbackWhereInput;
    some?: Prisma.MessageFeedbackWhereInput;
    none?: Prisma.MessageFeedbackWhereInput;
};
export type MessageFeedbackOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MessageFeedbackMessageIdUserIdCompoundUniqueInput = {
    messageId: number;
    userId: number;
};
export type MessageFeedbackCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    rating?: Prisma.SortOrder;
    reasonTags?: Prisma.SortOrder;
    comment?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MessageFeedbackAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type MessageFeedbackMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    rating?: Prisma.SortOrder;
    comment?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MessageFeedbackMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    sessionId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    rating?: Prisma.SortOrder;
    comment?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MessageFeedbackSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    messageId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    turnId?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
};
export type MessageFeedbackCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput> | Prisma.MessageFeedbackCreateWithoutUserInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutUserInput | Prisma.MessageFeedbackCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MessageFeedbackCreateManyUserInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput> | Prisma.MessageFeedbackCreateWithoutUserInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutUserInput | Prisma.MessageFeedbackCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MessageFeedbackCreateManyUserInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput> | Prisma.MessageFeedbackCreateWithoutUserInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutUserInput | Prisma.MessageFeedbackCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutUserInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MessageFeedbackCreateManyUserInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutUserInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutUserInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput> | Prisma.MessageFeedbackCreateWithoutUserInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutUserInput | Prisma.MessageFeedbackCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutUserInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MessageFeedbackCreateManyUserInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutUserInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutUserInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput> | Prisma.MessageFeedbackCreateWithoutAppClientInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput | Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.MessageFeedbackCreateManyAppClientInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput> | Prisma.MessageFeedbackCreateWithoutAppClientInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput | Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.MessageFeedbackCreateManyAppClientInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput> | Prisma.MessageFeedbackCreateWithoutAppClientInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput | Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutAppClientInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.MessageFeedbackCreateManyAppClientInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutAppClientInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutAppClientInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput> | Prisma.MessageFeedbackCreateWithoutAppClientInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput | Prisma.MessageFeedbackCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutAppClientInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.MessageFeedbackCreateManyAppClientInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutAppClientInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutAppClientInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackCreateNestedManyWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput> | Prisma.MessageFeedbackCreateWithoutSessionInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput | Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput[];
    createMany?: Prisma.MessageFeedbackCreateManySessionInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUncheckedCreateNestedManyWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput> | Prisma.MessageFeedbackCreateWithoutSessionInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput | Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput[];
    createMany?: Prisma.MessageFeedbackCreateManySessionInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUpdateManyWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput> | Prisma.MessageFeedbackCreateWithoutSessionInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput | Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutSessionInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutSessionInput[];
    createMany?: Prisma.MessageFeedbackCreateManySessionInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutSessionInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutSessionInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutSessionInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutSessionInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput> | Prisma.MessageFeedbackCreateWithoutSessionInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput | Prisma.MessageFeedbackCreateOrConnectWithoutSessionInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutSessionInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutSessionInput[];
    createMany?: Prisma.MessageFeedbackCreateManySessionInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutSessionInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutSessionInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutSessionInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutSessionInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackCreateNestedManyWithoutMessageInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput> | Prisma.MessageFeedbackCreateWithoutMessageInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput | Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput[];
    createMany?: Prisma.MessageFeedbackCreateManyMessageInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUncheckedCreateNestedManyWithoutMessageInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput> | Prisma.MessageFeedbackCreateWithoutMessageInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput | Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput[];
    createMany?: Prisma.MessageFeedbackCreateManyMessageInputEnvelope;
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
};
export type MessageFeedbackUpdateManyWithoutMessageNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput> | Prisma.MessageFeedbackCreateWithoutMessageInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput | Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutMessageInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutMessageInput[];
    createMany?: Prisma.MessageFeedbackCreateManyMessageInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutMessageInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutMessageInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutMessageInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutMessageInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type MessageFeedbackUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput> | Prisma.MessageFeedbackCreateWithoutMessageInput[] | Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput[];
    connectOrCreate?: Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput | Prisma.MessageFeedbackCreateOrConnectWithoutMessageInput[];
    upsert?: Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutMessageInput | Prisma.MessageFeedbackUpsertWithWhereUniqueWithoutMessageInput[];
    createMany?: Prisma.MessageFeedbackCreateManyMessageInputEnvelope;
    set?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    disconnect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    delete?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    connect?: Prisma.MessageFeedbackWhereUniqueInput | Prisma.MessageFeedbackWhereUniqueInput[];
    update?: Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutMessageInput | Prisma.MessageFeedbackUpdateWithWhereUniqueWithoutMessageInput[];
    updateMany?: Prisma.MessageFeedbackUpdateManyWithWhereWithoutMessageInput | Prisma.MessageFeedbackUpdateManyWithWhereWithoutMessageInput[];
    deleteMany?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
};
export type EnumMessageFeedbackRatingFieldUpdateOperationsInput = {
    set?: $Enums.MessageFeedbackRating;
};
export type MessageFeedbackCreateWithoutUserInput = {
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    message: Prisma.MessageCreateNestedOneWithoutFeedbacksInput;
    session: Prisma.SessionCreateNestedOneWithoutMessageFeedbacksInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutMessageFeedbacksInput;
};
export type MessageFeedbackUncheckedCreateWithoutUserInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackCreateOrConnectWithoutUserInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput>;
};
export type MessageFeedbackCreateManyUserInputEnvelope = {
    data: Prisma.MessageFeedbackCreateManyUserInput | Prisma.MessageFeedbackCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type MessageFeedbackUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutUserInput, Prisma.MessageFeedbackUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutUserInput, Prisma.MessageFeedbackUncheckedCreateWithoutUserInput>;
};
export type MessageFeedbackUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutUserInput, Prisma.MessageFeedbackUncheckedUpdateWithoutUserInput>;
};
export type MessageFeedbackUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.MessageFeedbackScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyWithoutUserInput>;
};
export type MessageFeedbackScalarWhereInput = {
    AND?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
    OR?: Prisma.MessageFeedbackScalarWhereInput[];
    NOT?: Prisma.MessageFeedbackScalarWhereInput | Prisma.MessageFeedbackScalarWhereInput[];
    id?: Prisma.IntFilter<"MessageFeedback"> | number;
    messageId?: Prisma.IntFilter<"MessageFeedback"> | number;
    sessionId?: Prisma.StringFilter<"MessageFeedback"> | string;
    userId?: Prisma.IntFilter<"MessageFeedback"> | number;
    appClientId?: Prisma.IntFilter<"MessageFeedback"> | number;
    turnId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    agentId?: Prisma.IntNullableFilter<"MessageFeedback"> | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFilter<"MessageFeedback"> | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.JsonNullableFilter<"MessageFeedback">;
    comment?: Prisma.StringNullableFilter<"MessageFeedback"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MessageFeedback"> | Date | string;
};
export type MessageFeedbackCreateWithoutAppClientInput = {
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    message: Prisma.MessageCreateNestedOneWithoutFeedbacksInput;
    session: Prisma.SessionCreateNestedOneWithoutMessageFeedbacksInput;
    user: Prisma.UserCreateNestedOneWithoutMessageFeedbacksInput;
};
export type MessageFeedbackUncheckedCreateWithoutAppClientInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    userId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackCreateOrConnectWithoutAppClientInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput>;
};
export type MessageFeedbackCreateManyAppClientInputEnvelope = {
    data: Prisma.MessageFeedbackCreateManyAppClientInput | Prisma.MessageFeedbackCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type MessageFeedbackUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedCreateWithoutAppClientInput>;
};
export type MessageFeedbackUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutAppClientInput, Prisma.MessageFeedbackUncheckedUpdateWithoutAppClientInput>;
};
export type MessageFeedbackUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.MessageFeedbackScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyWithoutAppClientInput>;
};
export type MessageFeedbackCreateWithoutSessionInput = {
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    message: Prisma.MessageCreateNestedOneWithoutFeedbacksInput;
    user: Prisma.UserCreateNestedOneWithoutMessageFeedbacksInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutMessageFeedbacksInput;
};
export type MessageFeedbackUncheckedCreateWithoutSessionInput = {
    id?: number;
    messageId: number;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackCreateOrConnectWithoutSessionInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput>;
};
export type MessageFeedbackCreateManySessionInputEnvelope = {
    data: Prisma.MessageFeedbackCreateManySessionInput | Prisma.MessageFeedbackCreateManySessionInput[];
    skipDuplicates?: boolean;
};
export type MessageFeedbackUpsertWithWhereUniqueWithoutSessionInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutSessionInput, Prisma.MessageFeedbackUncheckedUpdateWithoutSessionInput>;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutSessionInput, Prisma.MessageFeedbackUncheckedCreateWithoutSessionInput>;
};
export type MessageFeedbackUpdateWithWhereUniqueWithoutSessionInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutSessionInput, Prisma.MessageFeedbackUncheckedUpdateWithoutSessionInput>;
};
export type MessageFeedbackUpdateManyWithWhereWithoutSessionInput = {
    where: Prisma.MessageFeedbackScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyWithoutSessionInput>;
};
export type MessageFeedbackCreateWithoutMessageInput = {
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutMessageFeedbacksInput;
    user: Prisma.UserCreateNestedOneWithoutMessageFeedbacksInput;
    appClient: Prisma.AppClientCreateNestedOneWithoutMessageFeedbacksInput;
};
export type MessageFeedbackUncheckedCreateWithoutMessageInput = {
    id?: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackCreateOrConnectWithoutMessageInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput>;
};
export type MessageFeedbackCreateManyMessageInputEnvelope = {
    data: Prisma.MessageFeedbackCreateManyMessageInput | Prisma.MessageFeedbackCreateManyMessageInput[];
    skipDuplicates?: boolean;
};
export type MessageFeedbackUpsertWithWhereUniqueWithoutMessageInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutMessageInput, Prisma.MessageFeedbackUncheckedUpdateWithoutMessageInput>;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateWithoutMessageInput, Prisma.MessageFeedbackUncheckedCreateWithoutMessageInput>;
};
export type MessageFeedbackUpdateWithWhereUniqueWithoutMessageInput = {
    where: Prisma.MessageFeedbackWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateWithoutMessageInput, Prisma.MessageFeedbackUncheckedUpdateWithoutMessageInput>;
};
export type MessageFeedbackUpdateManyWithWhereWithoutMessageInput = {
    where: Prisma.MessageFeedbackScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyWithoutMessageInput>;
};
export type MessageFeedbackCreateManyUserInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateWithoutUserInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.MessageUpdateOneRequiredWithoutFeedbacksNestedInput;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
};
export type MessageFeedbackUncheckedUpdateWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackCreateManyAppClientInput = {
    id?: number;
    messageId: number;
    sessionId: string;
    userId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateWithoutAppClientInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.MessageUpdateOneRequiredWithoutFeedbacksNestedInput;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
};
export type MessageFeedbackUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackCreateManySessionInput = {
    id?: number;
    messageId: number;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateWithoutSessionInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    message?: Prisma.MessageUpdateOneRequiredWithoutFeedbacksNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
};
export type MessageFeedbackUncheckedUpdateWithoutSessionInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackUncheckedUpdateManyWithoutSessionInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    messageId?: Prisma.IntFieldUpdateOperationsInput | number;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackCreateManyMessageInput = {
    id?: number;
    sessionId: string;
    userId: number;
    appClientId: number;
    turnId?: number | null;
    agentId?: number | null;
    rating: $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MessageFeedbackUpdateWithoutMessageInput = {
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutMessageFeedbacksNestedInput;
};
export type MessageFeedbackUncheckedUpdateWithoutMessageInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackUncheckedUpdateManyWithoutMessageInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    turnId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    agentId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    rating?: Prisma.EnumMessageFeedbackRatingFieldUpdateOperationsInput | $Enums.MessageFeedbackRating;
    reasonTags?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    comment?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageFeedbackSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messageId?: boolean;
    sessionId?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    turnId?: boolean;
    agentId?: boolean;
    rating?: boolean;
    reasonTags?: boolean;
    comment?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["messageFeedback"]>;
export type MessageFeedbackSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messageId?: boolean;
    sessionId?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    turnId?: boolean;
    agentId?: boolean;
    rating?: boolean;
    reasonTags?: boolean;
    comment?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["messageFeedback"]>;
export type MessageFeedbackSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    messageId?: boolean;
    sessionId?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    turnId?: boolean;
    agentId?: boolean;
    rating?: boolean;
    reasonTags?: boolean;
    comment?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["messageFeedback"]>;
export type MessageFeedbackSelectScalar = {
    id?: boolean;
    messageId?: boolean;
    sessionId?: boolean;
    userId?: boolean;
    appClientId?: boolean;
    turnId?: boolean;
    agentId?: boolean;
    rating?: boolean;
    reasonTags?: boolean;
    comment?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type MessageFeedbackOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "messageId" | "sessionId" | "userId" | "appClientId" | "turnId" | "agentId" | "rating" | "reasonTags" | "comment" | "createdAt" | "updatedAt", ExtArgs["result"]["messageFeedback"]>;
export type MessageFeedbackInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type MessageFeedbackIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type MessageFeedbackIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    message?: boolean | Prisma.MessageDefaultArgs<ExtArgs>;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
};
export type $MessageFeedbackPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "MessageFeedback";
    objects: {
        message: Prisma.$MessagePayload<ExtArgs>;
        session: Prisma.$SessionPayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
        appClient: Prisma.$AppClientPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        messageId: number;
        sessionId: string;
        userId: number;
        appClientId: number;
        turnId: number | null;
        agentId: number | null;
        rating: $Enums.MessageFeedbackRating;
        reasonTags: runtime.JsonValue | null;
        comment: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["messageFeedback"]>;
    composites: {};
};
export type MessageFeedbackGetPayload<S extends boolean | null | undefined | MessageFeedbackDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload, S>;
export type MessageFeedbackCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MessageFeedbackFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MessageFeedbackCountAggregateInputType | true;
};
export interface MessageFeedbackDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['MessageFeedback'];
        meta: {
            name: 'MessageFeedback';
        };
    };
    findUnique<T extends MessageFeedbackFindUniqueArgs>(args: Prisma.SelectSubset<T, MessageFeedbackFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MessageFeedbackFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MessageFeedbackFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MessageFeedbackFindFirstArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackFindFirstArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MessageFeedbackFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MessageFeedbackFindManyArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MessageFeedbackCreateArgs>(args: Prisma.SelectSubset<T, MessageFeedbackCreateArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MessageFeedbackCreateManyArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MessageFeedbackCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MessageFeedbackDeleteArgs>(args: Prisma.SelectSubset<T, MessageFeedbackDeleteArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MessageFeedbackUpdateArgs>(args: Prisma.SelectSubset<T, MessageFeedbackUpdateArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MessageFeedbackDeleteManyArgs>(args?: Prisma.SelectSubset<T, MessageFeedbackDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MessageFeedbackUpdateManyArgs>(args: Prisma.SelectSubset<T, MessageFeedbackUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MessageFeedbackUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MessageFeedbackUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MessageFeedbackUpsertArgs>(args: Prisma.SelectSubset<T, MessageFeedbackUpsertArgs<ExtArgs>>): Prisma.Prisma__MessageFeedbackClient<runtime.Types.Result.GetResult<Prisma.$MessageFeedbackPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MessageFeedbackCountArgs>(args?: Prisma.Subset<T, MessageFeedbackCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MessageFeedbackCountAggregateOutputType> : number>;
    aggregate<T extends MessageFeedbackAggregateArgs>(args: Prisma.Subset<T, MessageFeedbackAggregateArgs>): Prisma.PrismaPromise<GetMessageFeedbackAggregateType<T>>;
    groupBy<T extends MessageFeedbackGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MessageFeedbackGroupByArgs['orderBy'];
    } : {
        orderBy?: MessageFeedbackGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MessageFeedbackGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageFeedbackGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MessageFeedbackFieldRefs;
}
export interface Prisma__MessageFeedbackClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    message<T extends Prisma.MessageDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.MessageDefaultArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    session<T extends Prisma.SessionDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SessionDefaultArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MessageFeedbackFieldRefs {
    readonly id: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly messageId: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly sessionId: Prisma.FieldRef<"MessageFeedback", 'String'>;
    readonly userId: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly turnId: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly agentId: Prisma.FieldRef<"MessageFeedback", 'Int'>;
    readonly rating: Prisma.FieldRef<"MessageFeedback", 'MessageFeedbackRating'>;
    readonly reasonTags: Prisma.FieldRef<"MessageFeedback", 'Json'>;
    readonly comment: Prisma.FieldRef<"MessageFeedback", 'String'>;
    readonly createdAt: Prisma.FieldRef<"MessageFeedback", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"MessageFeedback", 'DateTime'>;
}
export type MessageFeedbackFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    where: Prisma.MessageFeedbackWhereUniqueInput;
};
export type MessageFeedbackFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    where: Prisma.MessageFeedbackWhereUniqueInput;
};
export type MessageFeedbackFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageFeedbackFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageFeedbackFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type MessageFeedbackCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageFeedbackCreateInput, Prisma.MessageFeedbackUncheckedCreateInput>;
};
export type MessageFeedbackCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MessageFeedbackCreateManyInput | Prisma.MessageFeedbackCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MessageFeedbackCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    data: Prisma.MessageFeedbackCreateManyInput | Prisma.MessageFeedbackCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.MessageFeedbackIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type MessageFeedbackUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateInput, Prisma.MessageFeedbackUncheckedUpdateInput>;
    where: Prisma.MessageFeedbackWhereUniqueInput;
};
export type MessageFeedbackUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyInput>;
    where?: Prisma.MessageFeedbackWhereInput;
    limit?: number;
};
export type MessageFeedbackUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageFeedbackUpdateManyMutationInput, Prisma.MessageFeedbackUncheckedUpdateManyInput>;
    where?: Prisma.MessageFeedbackWhereInput;
    limit?: number;
    include?: Prisma.MessageFeedbackIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type MessageFeedbackUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    where: Prisma.MessageFeedbackWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageFeedbackCreateInput, Prisma.MessageFeedbackUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MessageFeedbackUpdateInput, Prisma.MessageFeedbackUncheckedUpdateInput>;
};
export type MessageFeedbackDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
    where: Prisma.MessageFeedbackWhereUniqueInput;
};
export type MessageFeedbackDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageFeedbackWhereInput;
    limit?: number;
};
export type MessageFeedbackDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageFeedbackSelect<ExtArgs> | null;
    omit?: Prisma.MessageFeedbackOmit<ExtArgs> | null;
    include?: Prisma.MessageFeedbackInclude<ExtArgs> | null;
};
