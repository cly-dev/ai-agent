import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type AgentSkillModel = runtime.Types.Result.DefaultSelection<Prisma.$AgentSkillPayload>;
export type AggregateAgentSkill = {
    _count: AgentSkillCountAggregateOutputType | null;
    _avg: AgentSkillAvgAggregateOutputType | null;
    _sum: AgentSkillSumAggregateOutputType | null;
    _min: AgentSkillMinAggregateOutputType | null;
    _max: AgentSkillMaxAggregateOutputType | null;
};
export type AgentSkillAvgAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    skillId: number | null;
};
export type AgentSkillSumAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    skillId: number | null;
};
export type AgentSkillMinAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    skillId: number | null;
};
export type AgentSkillMaxAggregateOutputType = {
    id: number | null;
    agentId: number | null;
    skillId: number | null;
};
export type AgentSkillCountAggregateOutputType = {
    id: number;
    agentId: number;
    skillId: number;
    _all: number;
};
export type AgentSkillAvgAggregateInputType = {
    id?: true;
    agentId?: true;
    skillId?: true;
};
export type AgentSkillSumAggregateInputType = {
    id?: true;
    agentId?: true;
    skillId?: true;
};
export type AgentSkillMinAggregateInputType = {
    id?: true;
    agentId?: true;
    skillId?: true;
};
export type AgentSkillMaxAggregateInputType = {
    id?: true;
    agentId?: true;
    skillId?: true;
};
export type AgentSkillCountAggregateInputType = {
    id?: true;
    agentId?: true;
    skillId?: true;
    _all?: true;
};
export type AgentSkillAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithRelationInput | Prisma.AgentSkillOrderByWithRelationInput[];
    cursor?: Prisma.AgentSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AgentSkillCountAggregateInputType;
    _avg?: AgentSkillAvgAggregateInputType;
    _sum?: AgentSkillSumAggregateInputType;
    _min?: AgentSkillMinAggregateInputType;
    _max?: AgentSkillMaxAggregateInputType;
};
export type GetAgentSkillAggregateType<T extends AgentSkillAggregateArgs> = {
    [P in keyof T & keyof AggregateAgentSkill]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAgentSkill[P]> : Prisma.GetScalarType<T[P], AggregateAgentSkill[P]>;
};
export type AgentSkillGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithAggregationInput | Prisma.AgentSkillOrderByWithAggregationInput[];
    by: Prisma.AgentSkillScalarFieldEnum[] | Prisma.AgentSkillScalarFieldEnum;
    having?: Prisma.AgentSkillScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AgentSkillCountAggregateInputType | true;
    _avg?: AgentSkillAvgAggregateInputType;
    _sum?: AgentSkillSumAggregateInputType;
    _min?: AgentSkillMinAggregateInputType;
    _max?: AgentSkillMaxAggregateInputType;
};
export type AgentSkillGroupByOutputType = {
    id: number;
    agentId: number;
    skillId: number;
    _count: AgentSkillCountAggregateOutputType | null;
    _avg: AgentSkillAvgAggregateOutputType | null;
    _sum: AgentSkillSumAggregateOutputType | null;
    _min: AgentSkillMinAggregateOutputType | null;
    _max: AgentSkillMaxAggregateOutputType | null;
};
export type GetAgentSkillGroupByPayload<T extends AgentSkillGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AgentSkillGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AgentSkillGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AgentSkillGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AgentSkillGroupByOutputType[P]>;
}>>;
export type AgentSkillWhereInput = {
    AND?: Prisma.AgentSkillWhereInput | Prisma.AgentSkillWhereInput[];
    OR?: Prisma.AgentSkillWhereInput[];
    NOT?: Prisma.AgentSkillWhereInput | Prisma.AgentSkillWhereInput[];
    id?: Prisma.IntFilter<"AgentSkill"> | number;
    agentId?: Prisma.IntFilter<"AgentSkill"> | number;
    skillId?: Prisma.IntFilter<"AgentSkill"> | number;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
};
export type AgentSkillOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    agent?: Prisma.AgentOrderByWithRelationInput;
    skill?: Prisma.SkillOrderByWithRelationInput;
};
export type AgentSkillWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    agentId_skillId?: Prisma.AgentSkillAgentIdSkillIdCompoundUniqueInput;
    AND?: Prisma.AgentSkillWhereInput | Prisma.AgentSkillWhereInput[];
    OR?: Prisma.AgentSkillWhereInput[];
    NOT?: Prisma.AgentSkillWhereInput | Prisma.AgentSkillWhereInput[];
    agentId?: Prisma.IntFilter<"AgentSkill"> | number;
    skillId?: Prisma.IntFilter<"AgentSkill"> | number;
    agent?: Prisma.XOR<Prisma.AgentScalarRelationFilter, Prisma.AgentWhereInput>;
    skill?: Prisma.XOR<Prisma.SkillScalarRelationFilter, Prisma.SkillWhereInput>;
}, "id" | "agentId_skillId">;
export type AgentSkillOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
    _count?: Prisma.AgentSkillCountOrderByAggregateInput;
    _avg?: Prisma.AgentSkillAvgOrderByAggregateInput;
    _max?: Prisma.AgentSkillMaxOrderByAggregateInput;
    _min?: Prisma.AgentSkillMinOrderByAggregateInput;
    _sum?: Prisma.AgentSkillSumOrderByAggregateInput;
};
export type AgentSkillScalarWhereWithAggregatesInput = {
    AND?: Prisma.AgentSkillScalarWhereWithAggregatesInput | Prisma.AgentSkillScalarWhereWithAggregatesInput[];
    OR?: Prisma.AgentSkillScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AgentSkillScalarWhereWithAggregatesInput | Prisma.AgentSkillScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"AgentSkill"> | number;
    agentId?: Prisma.IntWithAggregatesFilter<"AgentSkill"> | number;
    skillId?: Prisma.IntWithAggregatesFilter<"AgentSkill"> | number;
};
export type AgentSkillCreateInput = {
    agent: Prisma.AgentCreateNestedOneWithoutAgentSkillsInput;
    skill: Prisma.SkillCreateNestedOneWithoutAgentSkillsInput;
};
export type AgentSkillUncheckedCreateInput = {
    id?: number;
    agentId: number;
    skillId: number;
};
export type AgentSkillUpdateInput = {
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentSkillsNestedInput;
    skill?: Prisma.SkillUpdateOneRequiredWithoutAgentSkillsNestedInput;
};
export type AgentSkillUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillCreateManyInput = {
    id?: number;
    agentId: number;
    skillId: number;
};
export type AgentSkillUpdateManyMutationInput = {};
export type AgentSkillUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillListRelationFilter = {
    every?: Prisma.AgentSkillWhereInput;
    some?: Prisma.AgentSkillWhereInput;
    none?: Prisma.AgentSkillWhereInput;
};
export type AgentSkillOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AgentSkillAgentIdSkillIdCompoundUniqueInput = {
    agentId: number;
    skillId: number;
};
export type AgentSkillCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type AgentSkillAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type AgentSkillMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type AgentSkillMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type AgentSkillSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    agentId?: Prisma.SortOrder;
    skillId?: Prisma.SortOrder;
};
export type AgentSkillCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput> | Prisma.AgentSkillCreateWithoutSkillInput[] | Prisma.AgentSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutSkillInput | Prisma.AgentSkillCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.AgentSkillCreateManySkillInputEnvelope;
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
};
export type AgentSkillUncheckedCreateNestedManyWithoutSkillInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput> | Prisma.AgentSkillCreateWithoutSkillInput[] | Prisma.AgentSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutSkillInput | Prisma.AgentSkillCreateOrConnectWithoutSkillInput[];
    createMany?: Prisma.AgentSkillCreateManySkillInputEnvelope;
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
};
export type AgentSkillUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput> | Prisma.AgentSkillCreateWithoutSkillInput[] | Prisma.AgentSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutSkillInput | Prisma.AgentSkillCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.AgentSkillUpsertWithWhereUniqueWithoutSkillInput | Prisma.AgentSkillUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.AgentSkillCreateManySkillInputEnvelope;
    set?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    disconnect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    delete?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    update?: Prisma.AgentSkillUpdateWithWhereUniqueWithoutSkillInput | Prisma.AgentSkillUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.AgentSkillUpdateManyWithWhereWithoutSkillInput | Prisma.AgentSkillUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
};
export type AgentSkillUncheckedUpdateManyWithoutSkillNestedInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput> | Prisma.AgentSkillCreateWithoutSkillInput[] | Prisma.AgentSkillUncheckedCreateWithoutSkillInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutSkillInput | Prisma.AgentSkillCreateOrConnectWithoutSkillInput[];
    upsert?: Prisma.AgentSkillUpsertWithWhereUniqueWithoutSkillInput | Prisma.AgentSkillUpsertWithWhereUniqueWithoutSkillInput[];
    createMany?: Prisma.AgentSkillCreateManySkillInputEnvelope;
    set?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    disconnect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    delete?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    update?: Prisma.AgentSkillUpdateWithWhereUniqueWithoutSkillInput | Prisma.AgentSkillUpdateWithWhereUniqueWithoutSkillInput[];
    updateMany?: Prisma.AgentSkillUpdateManyWithWhereWithoutSkillInput | Prisma.AgentSkillUpdateManyWithWhereWithoutSkillInput[];
    deleteMany?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
};
export type AgentSkillCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput> | Prisma.AgentSkillCreateWithoutAgentInput[] | Prisma.AgentSkillUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutAgentInput | Prisma.AgentSkillCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentSkillCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
};
export type AgentSkillUncheckedCreateNestedManyWithoutAgentInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput> | Prisma.AgentSkillCreateWithoutAgentInput[] | Prisma.AgentSkillUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutAgentInput | Prisma.AgentSkillCreateOrConnectWithoutAgentInput[];
    createMany?: Prisma.AgentSkillCreateManyAgentInputEnvelope;
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
};
export type AgentSkillUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput> | Prisma.AgentSkillCreateWithoutAgentInput[] | Prisma.AgentSkillUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutAgentInput | Prisma.AgentSkillCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentSkillUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentSkillUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentSkillCreateManyAgentInputEnvelope;
    set?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    disconnect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    delete?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    update?: Prisma.AgentSkillUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentSkillUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentSkillUpdateManyWithWhereWithoutAgentInput | Prisma.AgentSkillUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
};
export type AgentSkillUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput> | Prisma.AgentSkillCreateWithoutAgentInput[] | Prisma.AgentSkillUncheckedCreateWithoutAgentInput[];
    connectOrCreate?: Prisma.AgentSkillCreateOrConnectWithoutAgentInput | Prisma.AgentSkillCreateOrConnectWithoutAgentInput[];
    upsert?: Prisma.AgentSkillUpsertWithWhereUniqueWithoutAgentInput | Prisma.AgentSkillUpsertWithWhereUniqueWithoutAgentInput[];
    createMany?: Prisma.AgentSkillCreateManyAgentInputEnvelope;
    set?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    disconnect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    delete?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    connect?: Prisma.AgentSkillWhereUniqueInput | Prisma.AgentSkillWhereUniqueInput[];
    update?: Prisma.AgentSkillUpdateWithWhereUniqueWithoutAgentInput | Prisma.AgentSkillUpdateWithWhereUniqueWithoutAgentInput[];
    updateMany?: Prisma.AgentSkillUpdateManyWithWhereWithoutAgentInput | Prisma.AgentSkillUpdateManyWithWhereWithoutAgentInput[];
    deleteMany?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
};
export type AgentSkillCreateWithoutSkillInput = {
    agent: Prisma.AgentCreateNestedOneWithoutAgentSkillsInput;
};
export type AgentSkillUncheckedCreateWithoutSkillInput = {
    id?: number;
    agentId: number;
};
export type AgentSkillCreateOrConnectWithoutSkillInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput>;
};
export type AgentSkillCreateManySkillInputEnvelope = {
    data: Prisma.AgentSkillCreateManySkillInput | Prisma.AgentSkillCreateManySkillInput[];
    skipDuplicates?: boolean;
};
export type AgentSkillUpsertWithWhereUniqueWithoutSkillInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentSkillUpdateWithoutSkillInput, Prisma.AgentSkillUncheckedUpdateWithoutSkillInput>;
    create: Prisma.XOR<Prisma.AgentSkillCreateWithoutSkillInput, Prisma.AgentSkillUncheckedCreateWithoutSkillInput>;
};
export type AgentSkillUpdateWithWhereUniqueWithoutSkillInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentSkillUpdateWithoutSkillInput, Prisma.AgentSkillUncheckedUpdateWithoutSkillInput>;
};
export type AgentSkillUpdateManyWithWhereWithoutSkillInput = {
    where: Prisma.AgentSkillScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentSkillUpdateManyMutationInput, Prisma.AgentSkillUncheckedUpdateManyWithoutSkillInput>;
};
export type AgentSkillScalarWhereInput = {
    AND?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
    OR?: Prisma.AgentSkillScalarWhereInput[];
    NOT?: Prisma.AgentSkillScalarWhereInput | Prisma.AgentSkillScalarWhereInput[];
    id?: Prisma.IntFilter<"AgentSkill"> | number;
    agentId?: Prisma.IntFilter<"AgentSkill"> | number;
    skillId?: Prisma.IntFilter<"AgentSkill"> | number;
};
export type AgentSkillCreateWithoutAgentInput = {
    skill: Prisma.SkillCreateNestedOneWithoutAgentSkillsInput;
};
export type AgentSkillUncheckedCreateWithoutAgentInput = {
    id?: number;
    skillId: number;
};
export type AgentSkillCreateOrConnectWithoutAgentInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput>;
};
export type AgentSkillCreateManyAgentInputEnvelope = {
    data: Prisma.AgentSkillCreateManyAgentInput | Prisma.AgentSkillCreateManyAgentInput[];
    skipDuplicates?: boolean;
};
export type AgentSkillUpsertWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    update: Prisma.XOR<Prisma.AgentSkillUpdateWithoutAgentInput, Prisma.AgentSkillUncheckedUpdateWithoutAgentInput>;
    create: Prisma.XOR<Prisma.AgentSkillCreateWithoutAgentInput, Prisma.AgentSkillUncheckedCreateWithoutAgentInput>;
};
export type AgentSkillUpdateWithWhereUniqueWithoutAgentInput = {
    where: Prisma.AgentSkillWhereUniqueInput;
    data: Prisma.XOR<Prisma.AgentSkillUpdateWithoutAgentInput, Prisma.AgentSkillUncheckedUpdateWithoutAgentInput>;
};
export type AgentSkillUpdateManyWithWhereWithoutAgentInput = {
    where: Prisma.AgentSkillScalarWhereInput;
    data: Prisma.XOR<Prisma.AgentSkillUpdateManyMutationInput, Prisma.AgentSkillUncheckedUpdateManyWithoutAgentInput>;
};
export type AgentSkillCreateManySkillInput = {
    id?: number;
    agentId: number;
};
export type AgentSkillUpdateWithoutSkillInput = {
    agent?: Prisma.AgentUpdateOneRequiredWithoutAgentSkillsNestedInput;
};
export type AgentSkillUncheckedUpdateWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillUncheckedUpdateManyWithoutSkillInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    agentId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillCreateManyAgentInput = {
    id?: number;
    skillId: number;
};
export type AgentSkillUpdateWithoutAgentInput = {
    skill?: Prisma.SkillUpdateOneRequiredWithoutAgentSkillsNestedInput;
};
export type AgentSkillUncheckedUpdateWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillUncheckedUpdateManyWithoutAgentInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    skillId?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type AgentSkillSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    skillId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentSkill"]>;
export type AgentSkillSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    skillId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentSkill"]>;
export type AgentSkillSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    agentId?: boolean;
    skillId?: boolean;
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["agentSkill"]>;
export type AgentSkillSelectScalar = {
    id?: boolean;
    agentId?: boolean;
    skillId?: boolean;
};
export type AgentSkillOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "agentId" | "skillId", ExtArgs["result"]["agentSkill"]>;
export type AgentSkillInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type AgentSkillIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type AgentSkillIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agent?: boolean | Prisma.AgentDefaultArgs<ExtArgs>;
    skill?: boolean | Prisma.SkillDefaultArgs<ExtArgs>;
};
export type $AgentSkillPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AgentSkill";
    objects: {
        agent: Prisma.$AgentPayload<ExtArgs>;
        skill: Prisma.$SkillPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        agentId: number;
        skillId: number;
    }, ExtArgs["result"]["agentSkill"]>;
    composites: {};
};
export type AgentSkillGetPayload<S extends boolean | null | undefined | AgentSkillDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload, S>;
export type AgentSkillCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AgentSkillFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AgentSkillCountAggregateInputType | true;
};
export interface AgentSkillDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AgentSkill'];
        meta: {
            name: 'AgentSkill';
        };
    };
    findUnique<T extends AgentSkillFindUniqueArgs>(args: Prisma.SelectSubset<T, AgentSkillFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AgentSkillFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AgentSkillFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AgentSkillFindFirstArgs>(args?: Prisma.SelectSubset<T, AgentSkillFindFirstArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AgentSkillFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AgentSkillFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AgentSkillFindManyArgs>(args?: Prisma.SelectSubset<T, AgentSkillFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AgentSkillCreateArgs>(args: Prisma.SelectSubset<T, AgentSkillCreateArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AgentSkillCreateManyArgs>(args?: Prisma.SelectSubset<T, AgentSkillCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AgentSkillCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AgentSkillCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AgentSkillDeleteArgs>(args: Prisma.SelectSubset<T, AgentSkillDeleteArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AgentSkillUpdateArgs>(args: Prisma.SelectSubset<T, AgentSkillUpdateArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AgentSkillDeleteManyArgs>(args?: Prisma.SelectSubset<T, AgentSkillDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AgentSkillUpdateManyArgs>(args: Prisma.SelectSubset<T, AgentSkillUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AgentSkillUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AgentSkillUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AgentSkillUpsertArgs>(args: Prisma.SelectSubset<T, AgentSkillUpsertArgs<ExtArgs>>): Prisma.Prisma__AgentSkillClient<runtime.Types.Result.GetResult<Prisma.$AgentSkillPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AgentSkillCountArgs>(args?: Prisma.Subset<T, AgentSkillCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AgentSkillCountAggregateOutputType> : number>;
    aggregate<T extends AgentSkillAggregateArgs>(args: Prisma.Subset<T, AgentSkillAggregateArgs>): Prisma.PrismaPromise<GetAgentSkillAggregateType<T>>;
    groupBy<T extends AgentSkillGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AgentSkillGroupByArgs['orderBy'];
    } : {
        orderBy?: AgentSkillGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AgentSkillGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentSkillGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AgentSkillFieldRefs;
}
export interface Prisma__AgentSkillClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    agent<T extends Prisma.AgentDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AgentDefaultArgs<ExtArgs>>): Prisma.Prisma__AgentClient<runtime.Types.Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    skill<T extends Prisma.SkillDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SkillDefaultArgs<ExtArgs>>): Prisma.Prisma__SkillClient<runtime.Types.Result.GetResult<Prisma.$SkillPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AgentSkillFieldRefs {
    readonly id: Prisma.FieldRef<"AgentSkill", 'Int'>;
    readonly agentId: Prisma.FieldRef<"AgentSkill", 'Int'>;
    readonly skillId: Prisma.FieldRef<"AgentSkill", 'Int'>;
}
export type AgentSkillFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where: Prisma.AgentSkillWhereUniqueInput;
};
export type AgentSkillFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where: Prisma.AgentSkillWhereUniqueInput;
};
export type AgentSkillFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithRelationInput | Prisma.AgentSkillOrderByWithRelationInput[];
    cursor?: Prisma.AgentSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentSkillScalarFieldEnum | Prisma.AgentSkillScalarFieldEnum[];
};
export type AgentSkillFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithRelationInput | Prisma.AgentSkillOrderByWithRelationInput[];
    cursor?: Prisma.AgentSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentSkillScalarFieldEnum | Prisma.AgentSkillScalarFieldEnum[];
};
export type AgentSkillFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where?: Prisma.AgentSkillWhereInput;
    orderBy?: Prisma.AgentSkillOrderByWithRelationInput | Prisma.AgentSkillOrderByWithRelationInput[];
    cursor?: Prisma.AgentSkillWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentSkillScalarFieldEnum | Prisma.AgentSkillScalarFieldEnum[];
};
export type AgentSkillCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentSkillCreateInput, Prisma.AgentSkillUncheckedCreateInput>;
};
export type AgentSkillCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AgentSkillCreateManyInput | Prisma.AgentSkillCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AgentSkillCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    data: Prisma.AgentSkillCreateManyInput | Prisma.AgentSkillCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.AgentSkillIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type AgentSkillUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentSkillUpdateInput, Prisma.AgentSkillUncheckedUpdateInput>;
    where: Prisma.AgentSkillWhereUniqueInput;
};
export type AgentSkillUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AgentSkillUpdateManyMutationInput, Prisma.AgentSkillUncheckedUpdateManyInput>;
    where?: Prisma.AgentSkillWhereInput;
    limit?: number;
};
export type AgentSkillUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AgentSkillUpdateManyMutationInput, Prisma.AgentSkillUncheckedUpdateManyInput>;
    where?: Prisma.AgentSkillWhereInput;
    limit?: number;
    include?: Prisma.AgentSkillIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type AgentSkillUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where: Prisma.AgentSkillWhereUniqueInput;
    create: Prisma.XOR<Prisma.AgentSkillCreateInput, Prisma.AgentSkillUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AgentSkillUpdateInput, Prisma.AgentSkillUncheckedUpdateInput>;
};
export type AgentSkillDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
    where: Prisma.AgentSkillWhereUniqueInput;
};
export type AgentSkillDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentSkillWhereInput;
    limit?: number;
};
export type AgentSkillDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentSkillSelect<ExtArgs> | null;
    omit?: Prisma.AgentSkillOmit<ExtArgs> | null;
    include?: Prisma.AgentSkillInclude<ExtArgs> | null;
};
