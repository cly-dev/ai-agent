import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type HostToolModel = runtime.Types.Result.DefaultSelection<Prisma.$HostToolPayload>;
export type AggregateHostTool = {
    _count: HostToolCountAggregateOutputType | null;
    _avg: HostToolAvgAggregateOutputType | null;
    _sum: HostToolSumAggregateOutputType | null;
    _min: HostToolMinAggregateOutputType | null;
    _max: HostToolMaxAggregateOutputType | null;
};
export type HostToolAvgAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    hostPageId: number | null;
    sortOrder: number | null;
};
export type HostToolSumAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    hostPageId: number | null;
    sortOrder: number | null;
};
export type HostToolMinAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    hostPageId: number | null;
    definitionKey: string | null;
    name: string | null;
    description: string | null;
    sortOrder: number | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type HostToolMaxAggregateOutputType = {
    id: number | null;
    appClientId: number | null;
    hostPageId: number | null;
    definitionKey: string | null;
    name: string | null;
    description: string | null;
    sortOrder: number | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type HostToolCountAggregateOutputType = {
    id: number;
    appClientId: number;
    hostPageId: number;
    definitionKey: number;
    name: number;
    description: number;
    argsSchema: number;
    argsTemplate: number;
    sortOrder: number;
    isActive: number;
    config: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type HostToolAvgAggregateInputType = {
    id?: true;
    appClientId?: true;
    hostPageId?: true;
    sortOrder?: true;
};
export type HostToolSumAggregateInputType = {
    id?: true;
    appClientId?: true;
    hostPageId?: true;
    sortOrder?: true;
};
export type HostToolMinAggregateInputType = {
    id?: true;
    appClientId?: true;
    hostPageId?: true;
    definitionKey?: true;
    name?: true;
    description?: true;
    sortOrder?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type HostToolMaxAggregateInputType = {
    id?: true;
    appClientId?: true;
    hostPageId?: true;
    definitionKey?: true;
    name?: true;
    description?: true;
    sortOrder?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type HostToolCountAggregateInputType = {
    id?: true;
    appClientId?: true;
    hostPageId?: true;
    definitionKey?: true;
    name?: true;
    description?: true;
    argsSchema?: true;
    argsTemplate?: true;
    sortOrder?: true;
    isActive?: true;
    config?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type HostToolAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithRelationInput | Prisma.HostToolOrderByWithRelationInput[];
    cursor?: Prisma.HostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | HostToolCountAggregateInputType;
    _avg?: HostToolAvgAggregateInputType;
    _sum?: HostToolSumAggregateInputType;
    _min?: HostToolMinAggregateInputType;
    _max?: HostToolMaxAggregateInputType;
};
export type GetHostToolAggregateType<T extends HostToolAggregateArgs> = {
    [P in keyof T & keyof AggregateHostTool]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateHostTool[P]> : Prisma.GetScalarType<T[P], AggregateHostTool[P]>;
};
export type HostToolGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithAggregationInput | Prisma.HostToolOrderByWithAggregationInput[];
    by: Prisma.HostToolScalarFieldEnum[] | Prisma.HostToolScalarFieldEnum;
    having?: Prisma.HostToolScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: HostToolCountAggregateInputType | true;
    _avg?: HostToolAvgAggregateInputType;
    _sum?: HostToolSumAggregateInputType;
    _min?: HostToolMinAggregateInputType;
    _max?: HostToolMaxAggregateInputType;
};
export type HostToolGroupByOutputType = {
    id: number;
    appClientId: number;
    hostPageId: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: runtime.JsonValue;
    argsTemplate: runtime.JsonValue | null;
    sortOrder: number;
    isActive: boolean;
    config: runtime.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    _count: HostToolCountAggregateOutputType | null;
    _avg: HostToolAvgAggregateOutputType | null;
    _sum: HostToolSumAggregateOutputType | null;
    _min: HostToolMinAggregateOutputType | null;
    _max: HostToolMaxAggregateOutputType | null;
};
export type GetHostToolGroupByPayload<T extends HostToolGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<HostToolGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof HostToolGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], HostToolGroupByOutputType[P]> : Prisma.GetScalarType<T[P], HostToolGroupByOutputType[P]>;
}>>;
export type HostToolWhereInput = {
    AND?: Prisma.HostToolWhereInput | Prisma.HostToolWhereInput[];
    OR?: Prisma.HostToolWhereInput[];
    NOT?: Prisma.HostToolWhereInput | Prisma.HostToolWhereInput[];
    id?: Prisma.IntFilter<"HostTool"> | number;
    appClientId?: Prisma.IntFilter<"HostTool"> | number;
    hostPageId?: Prisma.IntNullableFilter<"HostTool"> | number | null;
    definitionKey?: Prisma.StringFilter<"HostTool"> | string;
    name?: Prisma.StringFilter<"HostTool"> | string;
    description?: Prisma.StringFilter<"HostTool"> | string;
    argsSchema?: Prisma.JsonFilter<"HostTool">;
    argsTemplate?: Prisma.JsonNullableFilter<"HostTool">;
    sortOrder?: Prisma.IntFilter<"HostTool"> | number;
    isActive?: Prisma.BoolFilter<"HostTool"> | boolean;
    config?: Prisma.JsonNullableFilter<"HostTool">;
    createdAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    hostPage?: Prisma.XOR<Prisma.HostPageNullableScalarRelationFilter, Prisma.HostPageWhereInput> | null;
    agentHostTools?: Prisma.AgentHostToolListRelationFilter;
    skillHostTools?: Prisma.SkillHostToolListRelationFilter;
    roleHostTools?: Prisma.RoleHostToolListRelationFilter;
    pageActions?: Prisma.PageActionListRelationFilter;
    workflowHostTools?: Prisma.WorkflowHostToolListRelationFilter;
    flowHostTools?: Prisma.FlowHostToolListRelationFilter;
};
export type HostToolOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrderInput | Prisma.SortOrder;
    definitionKey?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    argsSchema?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    config?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    appClient?: Prisma.AppClientOrderByWithRelationInput;
    hostPage?: Prisma.HostPageOrderByWithRelationInput;
    agentHostTools?: Prisma.AgentHostToolOrderByRelationAggregateInput;
    skillHostTools?: Prisma.SkillHostToolOrderByRelationAggregateInput;
    roleHostTools?: Prisma.RoleHostToolOrderByRelationAggregateInput;
    pageActions?: Prisma.PageActionOrderByRelationAggregateInput;
    workflowHostTools?: Prisma.WorkflowHostToolOrderByRelationAggregateInput;
    flowHostTools?: Prisma.FlowHostToolOrderByRelationAggregateInput;
};
export type HostToolWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    appClientId_definitionKey?: Prisma.HostToolAppClientIdDefinitionKeyCompoundUniqueInput;
    appClientId_name?: Prisma.HostToolAppClientIdNameCompoundUniqueInput;
    AND?: Prisma.HostToolWhereInput | Prisma.HostToolWhereInput[];
    OR?: Prisma.HostToolWhereInput[];
    NOT?: Prisma.HostToolWhereInput | Prisma.HostToolWhereInput[];
    appClientId?: Prisma.IntFilter<"HostTool"> | number;
    hostPageId?: Prisma.IntNullableFilter<"HostTool"> | number | null;
    definitionKey?: Prisma.StringFilter<"HostTool"> | string;
    name?: Prisma.StringFilter<"HostTool"> | string;
    description?: Prisma.StringFilter<"HostTool"> | string;
    argsSchema?: Prisma.JsonFilter<"HostTool">;
    argsTemplate?: Prisma.JsonNullableFilter<"HostTool">;
    sortOrder?: Prisma.IntFilter<"HostTool"> | number;
    isActive?: Prisma.BoolFilter<"HostTool"> | boolean;
    config?: Prisma.JsonNullableFilter<"HostTool">;
    createdAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
    appClient?: Prisma.XOR<Prisma.AppClientScalarRelationFilter, Prisma.AppClientWhereInput>;
    hostPage?: Prisma.XOR<Prisma.HostPageNullableScalarRelationFilter, Prisma.HostPageWhereInput> | null;
    agentHostTools?: Prisma.AgentHostToolListRelationFilter;
    skillHostTools?: Prisma.SkillHostToolListRelationFilter;
    roleHostTools?: Prisma.RoleHostToolListRelationFilter;
    pageActions?: Prisma.PageActionListRelationFilter;
    workflowHostTools?: Prisma.WorkflowHostToolListRelationFilter;
    flowHostTools?: Prisma.FlowHostToolListRelationFilter;
}, "id" | "appClientId_definitionKey" | "appClientId_name">;
export type HostToolOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrderInput | Prisma.SortOrder;
    definitionKey?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    argsSchema?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    config?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.HostToolCountOrderByAggregateInput;
    _avg?: Prisma.HostToolAvgOrderByAggregateInput;
    _max?: Prisma.HostToolMaxOrderByAggregateInput;
    _min?: Prisma.HostToolMinOrderByAggregateInput;
    _sum?: Prisma.HostToolSumOrderByAggregateInput;
};
export type HostToolScalarWhereWithAggregatesInput = {
    AND?: Prisma.HostToolScalarWhereWithAggregatesInput | Prisma.HostToolScalarWhereWithAggregatesInput[];
    OR?: Prisma.HostToolScalarWhereWithAggregatesInput[];
    NOT?: Prisma.HostToolScalarWhereWithAggregatesInput | Prisma.HostToolScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"HostTool"> | number;
    appClientId?: Prisma.IntWithAggregatesFilter<"HostTool"> | number;
    hostPageId?: Prisma.IntNullableWithAggregatesFilter<"HostTool"> | number | null;
    definitionKey?: Prisma.StringWithAggregatesFilter<"HostTool"> | string;
    name?: Prisma.StringWithAggregatesFilter<"HostTool"> | string;
    description?: Prisma.StringWithAggregatesFilter<"HostTool"> | string;
    argsSchema?: Prisma.JsonWithAggregatesFilter<"HostTool">;
    argsTemplate?: Prisma.JsonNullableWithAggregatesFilter<"HostTool">;
    sortOrder?: Prisma.IntWithAggregatesFilter<"HostTool"> | number;
    isActive?: Prisma.BoolWithAggregatesFilter<"HostTool"> | boolean;
    config?: Prisma.JsonNullableWithAggregatesFilter<"HostTool">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"HostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"HostTool"> | Date | string;
};
export type HostToolCreateInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolUpdateInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateManyInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostToolUpdateManyMutationInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostToolUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostToolListRelationFilter = {
    every?: Prisma.HostToolWhereInput;
    some?: Prisma.HostToolWhereInput;
    none?: Prisma.HostToolWhereInput;
};
export type HostToolOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type HostToolAppClientIdDefinitionKeyCompoundUniqueInput = {
    appClientId: number;
    definitionKey: string;
};
export type HostToolAppClientIdNameCompoundUniqueInput = {
    appClientId: number;
    name: string;
};
export type HostToolCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrder;
    definitionKey?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    argsSchema?: Prisma.SortOrder;
    argsTemplate?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    config?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostToolAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type HostToolMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrder;
    definitionKey?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostToolMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrder;
    definitionKey?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type HostToolSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    appClientId?: Prisma.SortOrder;
    hostPageId?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type HostToolScalarRelationFilter = {
    is?: Prisma.HostToolWhereInput;
    isNot?: Prisma.HostToolWhereInput;
};
export type HostToolNullableScalarRelationFilter = {
    is?: Prisma.HostToolWhereInput | null;
    isNot?: Prisma.HostToolWhereInput | null;
};
export type HostToolCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput> | Prisma.HostToolCreateWithoutAppClientInput[] | Prisma.HostToolUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAppClientInput | Prisma.HostToolCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.HostToolCreateManyAppClientInputEnvelope;
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
};
export type HostToolUncheckedCreateNestedManyWithoutAppClientInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput> | Prisma.HostToolCreateWithoutAppClientInput[] | Prisma.HostToolUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAppClientInput | Prisma.HostToolCreateOrConnectWithoutAppClientInput[];
    createMany?: Prisma.HostToolCreateManyAppClientInputEnvelope;
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
};
export type HostToolUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput> | Prisma.HostToolCreateWithoutAppClientInput[] | Prisma.HostToolUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAppClientInput | Prisma.HostToolCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.HostToolUpsertWithWhereUniqueWithoutAppClientInput | Prisma.HostToolUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.HostToolCreateManyAppClientInputEnvelope;
    set?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    disconnect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    delete?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    update?: Prisma.HostToolUpdateWithWhereUniqueWithoutAppClientInput | Prisma.HostToolUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.HostToolUpdateManyWithWhereWithoutAppClientInput | Prisma.HostToolUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
};
export type HostToolUncheckedUpdateManyWithoutAppClientNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput> | Prisma.HostToolCreateWithoutAppClientInput[] | Prisma.HostToolUncheckedCreateWithoutAppClientInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAppClientInput | Prisma.HostToolCreateOrConnectWithoutAppClientInput[];
    upsert?: Prisma.HostToolUpsertWithWhereUniqueWithoutAppClientInput | Prisma.HostToolUpsertWithWhereUniqueWithoutAppClientInput[];
    createMany?: Prisma.HostToolCreateManyAppClientInputEnvelope;
    set?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    disconnect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    delete?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    update?: Prisma.HostToolUpdateWithWhereUniqueWithoutAppClientInput | Prisma.HostToolUpdateWithWhereUniqueWithoutAppClientInput[];
    updateMany?: Prisma.HostToolUpdateManyWithWhereWithoutAppClientInput | Prisma.HostToolUpdateManyWithWhereWithoutAppClientInput[];
    deleteMany?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
};
export type HostToolCreateNestedManyWithoutHostPageInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput> | Prisma.HostToolCreateWithoutHostPageInput[] | Prisma.HostToolUncheckedCreateWithoutHostPageInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutHostPageInput | Prisma.HostToolCreateOrConnectWithoutHostPageInput[];
    createMany?: Prisma.HostToolCreateManyHostPageInputEnvelope;
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
};
export type HostToolUncheckedCreateNestedManyWithoutHostPageInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput> | Prisma.HostToolCreateWithoutHostPageInput[] | Prisma.HostToolUncheckedCreateWithoutHostPageInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutHostPageInput | Prisma.HostToolCreateOrConnectWithoutHostPageInput[];
    createMany?: Prisma.HostToolCreateManyHostPageInputEnvelope;
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
};
export type HostToolUpdateManyWithoutHostPageNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput> | Prisma.HostToolCreateWithoutHostPageInput[] | Prisma.HostToolUncheckedCreateWithoutHostPageInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutHostPageInput | Prisma.HostToolCreateOrConnectWithoutHostPageInput[];
    upsert?: Prisma.HostToolUpsertWithWhereUniqueWithoutHostPageInput | Prisma.HostToolUpsertWithWhereUniqueWithoutHostPageInput[];
    createMany?: Prisma.HostToolCreateManyHostPageInputEnvelope;
    set?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    disconnect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    delete?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    update?: Prisma.HostToolUpdateWithWhereUniqueWithoutHostPageInput | Prisma.HostToolUpdateWithWhereUniqueWithoutHostPageInput[];
    updateMany?: Prisma.HostToolUpdateManyWithWhereWithoutHostPageInput | Prisma.HostToolUpdateManyWithWhereWithoutHostPageInput[];
    deleteMany?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
};
export type HostToolUncheckedUpdateManyWithoutHostPageNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput> | Prisma.HostToolCreateWithoutHostPageInput[] | Prisma.HostToolUncheckedCreateWithoutHostPageInput[];
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutHostPageInput | Prisma.HostToolCreateOrConnectWithoutHostPageInput[];
    upsert?: Prisma.HostToolUpsertWithWhereUniqueWithoutHostPageInput | Prisma.HostToolUpsertWithWhereUniqueWithoutHostPageInput[];
    createMany?: Prisma.HostToolCreateManyHostPageInputEnvelope;
    set?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    disconnect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    delete?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    connect?: Prisma.HostToolWhereUniqueInput | Prisma.HostToolWhereUniqueInput[];
    update?: Prisma.HostToolUpdateWithWhereUniqueWithoutHostPageInput | Prisma.HostToolUpdateWithWhereUniqueWithoutHostPageInput[];
    updateMany?: Prisma.HostToolUpdateManyWithWhereWithoutHostPageInput | Prisma.HostToolUpdateManyWithWhereWithoutHostPageInput[];
    deleteMany?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
};
export type HostToolCreateNestedOneWithoutAgentHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedCreateWithoutAgentHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAgentHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneRequiredWithoutAgentHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedCreateWithoutAgentHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutAgentHostToolsInput;
    upsert?: Prisma.HostToolUpsertWithoutAgentHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutAgentHostToolsInput, Prisma.HostToolUpdateWithoutAgentHostToolsInput>, Prisma.HostToolUncheckedUpdateWithoutAgentHostToolsInput>;
};
export type HostToolCreateNestedOneWithoutSkillHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedCreateWithoutSkillHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutSkillHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneRequiredWithoutSkillHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedCreateWithoutSkillHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutSkillHostToolsInput;
    upsert?: Prisma.HostToolUpsertWithoutSkillHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutSkillHostToolsInput, Prisma.HostToolUpdateWithoutSkillHostToolsInput>, Prisma.HostToolUncheckedUpdateWithoutSkillHostToolsInput>;
};
export type HostToolCreateNestedOneWithoutRoleHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedCreateWithoutRoleHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutRoleHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneRequiredWithoutRoleHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedCreateWithoutRoleHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutRoleHostToolsInput;
    upsert?: Prisma.HostToolUpsertWithoutRoleHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutRoleHostToolsInput, Prisma.HostToolUpdateWithoutRoleHostToolsInput>, Prisma.HostToolUncheckedUpdateWithoutRoleHostToolsInput>;
};
export type HostToolCreateNestedOneWithoutPageActionsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutPageActionsInput, Prisma.HostToolUncheckedCreateWithoutPageActionsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutPageActionsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneWithoutPageActionsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutPageActionsInput, Prisma.HostToolUncheckedCreateWithoutPageActionsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutPageActionsInput;
    upsert?: Prisma.HostToolUpsertWithoutPageActionsInput;
    disconnect?: Prisma.HostToolWhereInput | boolean;
    delete?: Prisma.HostToolWhereInput | boolean;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutPageActionsInput, Prisma.HostToolUpdateWithoutPageActionsInput>, Prisma.HostToolUncheckedUpdateWithoutPageActionsInput>;
};
export type HostToolCreateNestedOneWithoutWorkflowHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutWorkflowHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutWorkflowHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneRequiredWithoutWorkflowHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutWorkflowHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutWorkflowHostToolsInput;
    upsert?: Prisma.HostToolUpsertWithoutWorkflowHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutWorkflowHostToolsInput, Prisma.HostToolUpdateWithoutWorkflowHostToolsInput>, Prisma.HostToolUncheckedUpdateWithoutWorkflowHostToolsInput>;
};
export type HostToolCreateNestedOneWithoutFlowHostToolsInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutFlowHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutFlowHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateOneRequiredWithoutFlowHostToolsNestedInput = {
    create?: Prisma.XOR<Prisma.HostToolCreateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutFlowHostToolsInput>;
    connectOrCreate?: Prisma.HostToolCreateOrConnectWithoutFlowHostToolsInput;
    upsert?: Prisma.HostToolUpsertWithoutFlowHostToolsInput;
    connect?: Prisma.HostToolWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.HostToolUpdateToOneWithWhereWithoutFlowHostToolsInput, Prisma.HostToolUpdateWithoutFlowHostToolsInput>, Prisma.HostToolUncheckedUpdateWithoutFlowHostToolsInput>;
};
export type HostToolCreateWithoutAppClientInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutAppClientInput = {
    id?: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutAppClientInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput>;
};
export type HostToolCreateManyAppClientInputEnvelope = {
    data: Prisma.HostToolCreateManyAppClientInput | Prisma.HostToolCreateManyAppClientInput[];
    skipDuplicates?: boolean;
};
export type HostToolUpsertWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.HostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutAppClientInput, Prisma.HostToolUncheckedUpdateWithoutAppClientInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutAppClientInput, Prisma.HostToolUncheckedCreateWithoutAppClientInput>;
};
export type HostToolUpdateWithWhereUniqueWithoutAppClientInput = {
    where: Prisma.HostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutAppClientInput, Prisma.HostToolUncheckedUpdateWithoutAppClientInput>;
};
export type HostToolUpdateManyWithWhereWithoutAppClientInput = {
    where: Prisma.HostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateManyMutationInput, Prisma.HostToolUncheckedUpdateManyWithoutAppClientInput>;
};
export type HostToolScalarWhereInput = {
    AND?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
    OR?: Prisma.HostToolScalarWhereInput[];
    NOT?: Prisma.HostToolScalarWhereInput | Prisma.HostToolScalarWhereInput[];
    id?: Prisma.IntFilter<"HostTool"> | number;
    appClientId?: Prisma.IntFilter<"HostTool"> | number;
    hostPageId?: Prisma.IntNullableFilter<"HostTool"> | number | null;
    definitionKey?: Prisma.StringFilter<"HostTool"> | string;
    name?: Prisma.StringFilter<"HostTool"> | string;
    description?: Prisma.StringFilter<"HostTool"> | string;
    argsSchema?: Prisma.JsonFilter<"HostTool">;
    argsTemplate?: Prisma.JsonNullableFilter<"HostTool">;
    sortOrder?: Prisma.IntFilter<"HostTool"> | number;
    isActive?: Prisma.BoolFilter<"HostTool"> | boolean;
    config?: Prisma.JsonNullableFilter<"HostTool">;
    createdAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"HostTool"> | Date | string;
};
export type HostToolCreateWithoutHostPageInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutHostPageInput = {
    id?: number;
    appClientId: number;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutHostPageInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput>;
};
export type HostToolCreateManyHostPageInputEnvelope = {
    data: Prisma.HostToolCreateManyHostPageInput | Prisma.HostToolCreateManyHostPageInput[];
    skipDuplicates?: boolean;
};
export type HostToolUpsertWithWhereUniqueWithoutHostPageInput = {
    where: Prisma.HostToolWhereUniqueInput;
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutHostPageInput, Prisma.HostToolUncheckedUpdateWithoutHostPageInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutHostPageInput, Prisma.HostToolUncheckedCreateWithoutHostPageInput>;
};
export type HostToolUpdateWithWhereUniqueWithoutHostPageInput = {
    where: Prisma.HostToolWhereUniqueInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutHostPageInput, Prisma.HostToolUncheckedUpdateWithoutHostPageInput>;
};
export type HostToolUpdateManyWithWhereWithoutHostPageInput = {
    where: Prisma.HostToolScalarWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateManyMutationInput, Prisma.HostToolUncheckedUpdateManyWithoutHostPageInput>;
};
export type HostToolCreateWithoutAgentHostToolsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutAgentHostToolsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutAgentHostToolsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedCreateWithoutAgentHostToolsInput>;
};
export type HostToolUpsertWithoutAgentHostToolsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutAgentHostToolsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedCreateWithoutAgentHostToolsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutAgentHostToolsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutAgentHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutAgentHostToolsInput>;
};
export type HostToolUpdateWithoutAgentHostToolsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutAgentHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateWithoutSkillHostToolsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutSkillHostToolsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutSkillHostToolsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedCreateWithoutSkillHostToolsInput>;
};
export type HostToolUpsertWithoutSkillHostToolsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutSkillHostToolsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedCreateWithoutSkillHostToolsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutSkillHostToolsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutSkillHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutSkillHostToolsInput>;
};
export type HostToolUpdateWithoutSkillHostToolsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutSkillHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateWithoutRoleHostToolsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutRoleHostToolsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutRoleHostToolsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedCreateWithoutRoleHostToolsInput>;
};
export type HostToolUpsertWithoutRoleHostToolsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutRoleHostToolsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedCreateWithoutRoleHostToolsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutRoleHostToolsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutRoleHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutRoleHostToolsInput>;
};
export type HostToolUpdateWithoutRoleHostToolsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutRoleHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateWithoutPageActionsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutPageActionsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutPageActionsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutPageActionsInput, Prisma.HostToolUncheckedCreateWithoutPageActionsInput>;
};
export type HostToolUpsertWithoutPageActionsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutPageActionsInput, Prisma.HostToolUncheckedUpdateWithoutPageActionsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutPageActionsInput, Prisma.HostToolUncheckedCreateWithoutPageActionsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutPageActionsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutPageActionsInput, Prisma.HostToolUncheckedUpdateWithoutPageActionsInput>;
};
export type HostToolUpdateWithoutPageActionsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutPageActionsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateWithoutWorkflowHostToolsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutWorkflowHostToolsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutWorkflowHostToolsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutWorkflowHostToolsInput>;
};
export type HostToolUpsertWithoutWorkflowHostToolsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutWorkflowHostToolsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutWorkflowHostToolsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutWorkflowHostToolsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutWorkflowHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutWorkflowHostToolsInput>;
};
export type HostToolUpdateWithoutWorkflowHostToolsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutWorkflowHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateWithoutFlowHostToolsInput = {
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    appClient: Prisma.AppClientCreateNestedOneWithoutHostToolsInput;
    hostPage?: Prisma.HostPageCreateNestedOneWithoutHostToolsInput;
    agentHostTools?: Prisma.AgentHostToolCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolCreateNestedManyWithoutHostToolInput;
};
export type HostToolUncheckedCreateWithoutFlowHostToolsInput = {
    id?: number;
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedCreateNestedManyWithoutHostToolInput;
    pageActions?: Prisma.PageActionUncheckedCreateNestedManyWithoutHostToolInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedCreateNestedManyWithoutHostToolInput;
};
export type HostToolCreateOrConnectWithoutFlowHostToolsInput = {
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutFlowHostToolsInput>;
};
export type HostToolUpsertWithoutFlowHostToolsInput = {
    update: Prisma.XOR<Prisma.HostToolUpdateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutFlowHostToolsInput>;
    create: Prisma.XOR<Prisma.HostToolCreateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedCreateWithoutFlowHostToolsInput>;
    where?: Prisma.HostToolWhereInput;
};
export type HostToolUpdateToOneWithWhereWithoutFlowHostToolsInput = {
    where?: Prisma.HostToolWhereInput;
    data: Prisma.XOR<Prisma.HostToolUpdateWithoutFlowHostToolsInput, Prisma.HostToolUncheckedUpdateWithoutFlowHostToolsInput>;
};
export type HostToolUpdateWithoutFlowHostToolsInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutFlowHostToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolCreateManyAppClientInput = {
    id?: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostToolUpdateWithoutAppClientInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    hostPage?: Prisma.HostPageUpdateOneWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateManyWithoutAppClientInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hostPageId?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostToolCreateManyHostPageInput = {
    id?: number;
    appClientId: number;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: number;
    isActive?: boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type HostToolUpdateWithoutHostPageInput = {
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    appClient?: Prisma.AppClientUpdateOneRequiredWithoutHostToolsNestedInput;
    agentHostTools?: Prisma.AgentHostToolUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateWithoutHostPageInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    agentHostTools?: Prisma.AgentHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    skillHostTools?: Prisma.SkillHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    roleHostTools?: Prisma.RoleHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    pageActions?: Prisma.PageActionUncheckedUpdateManyWithoutHostToolNestedInput;
    workflowHostTools?: Prisma.WorkflowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
    flowHostTools?: Prisma.FlowHostToolUncheckedUpdateManyWithoutHostToolNestedInput;
};
export type HostToolUncheckedUpdateManyWithoutHostPageInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    appClientId?: Prisma.IntFieldUpdateOperationsInput | number;
    definitionKey?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    argsSchema?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    argsTemplate?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    config?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type HostToolCountOutputType = {
    agentHostTools: number;
    skillHostTools: number;
    roleHostTools: number;
    pageActions: number;
    workflowHostTools: number;
    flowHostTools: number;
};
export type HostToolCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    agentHostTools?: boolean | HostToolCountOutputTypeCountAgentHostToolsArgs;
    skillHostTools?: boolean | HostToolCountOutputTypeCountSkillHostToolsArgs;
    roleHostTools?: boolean | HostToolCountOutputTypeCountRoleHostToolsArgs;
    pageActions?: boolean | HostToolCountOutputTypeCountPageActionsArgs;
    workflowHostTools?: boolean | HostToolCountOutputTypeCountWorkflowHostToolsArgs;
    flowHostTools?: boolean | HostToolCountOutputTypeCountFlowHostToolsArgs;
};
export type HostToolCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolCountOutputTypeSelect<ExtArgs> | null;
};
export type HostToolCountOutputTypeCountAgentHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AgentHostToolWhereInput;
};
export type HostToolCountOutputTypeCountSkillHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SkillHostToolWhereInput;
};
export type HostToolCountOutputTypeCountRoleHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RoleHostToolWhereInput;
};
export type HostToolCountOutputTypeCountPageActionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PageActionWhereInput;
};
export type HostToolCountOutputTypeCountWorkflowHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkflowHostToolWhereInput;
};
export type HostToolCountOutputTypeCountFlowHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FlowHostToolWhereInput;
};
export type HostToolSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    hostPageId?: boolean;
    definitionKey?: boolean;
    name?: boolean;
    description?: boolean;
    argsSchema?: boolean;
    argsTemplate?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    config?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
    agentHostTools?: boolean | Prisma.HostTool$agentHostToolsArgs<ExtArgs>;
    skillHostTools?: boolean | Prisma.HostTool$skillHostToolsArgs<ExtArgs>;
    roleHostTools?: boolean | Prisma.HostTool$roleHostToolsArgs<ExtArgs>;
    pageActions?: boolean | Prisma.HostTool$pageActionsArgs<ExtArgs>;
    workflowHostTools?: boolean | Prisma.HostTool$workflowHostToolsArgs<ExtArgs>;
    flowHostTools?: boolean | Prisma.HostTool$flowHostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.HostToolCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["hostTool"]>;
export type HostToolSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    hostPageId?: boolean;
    definitionKey?: boolean;
    name?: boolean;
    description?: boolean;
    argsSchema?: boolean;
    argsTemplate?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    config?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
}, ExtArgs["result"]["hostTool"]>;
export type HostToolSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    appClientId?: boolean;
    hostPageId?: boolean;
    definitionKey?: boolean;
    name?: boolean;
    description?: boolean;
    argsSchema?: boolean;
    argsTemplate?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    config?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
}, ExtArgs["result"]["hostTool"]>;
export type HostToolSelectScalar = {
    id?: boolean;
    appClientId?: boolean;
    hostPageId?: boolean;
    definitionKey?: boolean;
    name?: boolean;
    description?: boolean;
    argsSchema?: boolean;
    argsTemplate?: boolean;
    sortOrder?: boolean;
    isActive?: boolean;
    config?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type HostToolOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "appClientId" | "hostPageId" | "definitionKey" | "name" | "description" | "argsSchema" | "argsTemplate" | "sortOrder" | "isActive" | "config" | "createdAt" | "updatedAt", ExtArgs["result"]["hostTool"]>;
export type HostToolInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
    agentHostTools?: boolean | Prisma.HostTool$agentHostToolsArgs<ExtArgs>;
    skillHostTools?: boolean | Prisma.HostTool$skillHostToolsArgs<ExtArgs>;
    roleHostTools?: boolean | Prisma.HostTool$roleHostToolsArgs<ExtArgs>;
    pageActions?: boolean | Prisma.HostTool$pageActionsArgs<ExtArgs>;
    workflowHostTools?: boolean | Prisma.HostTool$workflowHostToolsArgs<ExtArgs>;
    flowHostTools?: boolean | Prisma.HostTool$flowHostToolsArgs<ExtArgs>;
    _count?: boolean | Prisma.HostToolCountOutputTypeDefaultArgs<ExtArgs>;
};
export type HostToolIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
};
export type HostToolIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    appClient?: boolean | Prisma.AppClientDefaultArgs<ExtArgs>;
    hostPage?: boolean | Prisma.HostTool$hostPageArgs<ExtArgs>;
};
export type $HostToolPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "HostTool";
    objects: {
        appClient: Prisma.$AppClientPayload<ExtArgs>;
        hostPage: Prisma.$HostPagePayload<ExtArgs> | null;
        agentHostTools: Prisma.$AgentHostToolPayload<ExtArgs>[];
        skillHostTools: Prisma.$SkillHostToolPayload<ExtArgs>[];
        roleHostTools: Prisma.$RoleHostToolPayload<ExtArgs>[];
        pageActions: Prisma.$PageActionPayload<ExtArgs>[];
        workflowHostTools: Prisma.$WorkflowHostToolPayload<ExtArgs>[];
        flowHostTools: Prisma.$FlowHostToolPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        appClientId: number;
        hostPageId: number | null;
        definitionKey: string;
        name: string;
        description: string;
        argsSchema: runtime.JsonValue;
        argsTemplate: runtime.JsonValue | null;
        sortOrder: number;
        isActive: boolean;
        config: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["hostTool"]>;
    composites: {};
};
export type HostToolGetPayload<S extends boolean | null | undefined | HostToolDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$HostToolPayload, S>;
export type HostToolCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<HostToolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: HostToolCountAggregateInputType | true;
};
export interface HostToolDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['HostTool'];
        meta: {
            name: 'HostTool';
        };
    };
    findUnique<T extends HostToolFindUniqueArgs>(args: Prisma.SelectSubset<T, HostToolFindUniqueArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends HostToolFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, HostToolFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends HostToolFindFirstArgs>(args?: Prisma.SelectSubset<T, HostToolFindFirstArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends HostToolFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, HostToolFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends HostToolFindManyArgs>(args?: Prisma.SelectSubset<T, HostToolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends HostToolCreateArgs>(args: Prisma.SelectSubset<T, HostToolCreateArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends HostToolCreateManyArgs>(args?: Prisma.SelectSubset<T, HostToolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends HostToolCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, HostToolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends HostToolDeleteArgs>(args: Prisma.SelectSubset<T, HostToolDeleteArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends HostToolUpdateArgs>(args: Prisma.SelectSubset<T, HostToolUpdateArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends HostToolDeleteManyArgs>(args?: Prisma.SelectSubset<T, HostToolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends HostToolUpdateManyArgs>(args: Prisma.SelectSubset<T, HostToolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends HostToolUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, HostToolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends HostToolUpsertArgs>(args: Prisma.SelectSubset<T, HostToolUpsertArgs<ExtArgs>>): Prisma.Prisma__HostToolClient<runtime.Types.Result.GetResult<Prisma.$HostToolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends HostToolCountArgs>(args?: Prisma.Subset<T, HostToolCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], HostToolCountAggregateOutputType> : number>;
    aggregate<T extends HostToolAggregateArgs>(args: Prisma.Subset<T, HostToolAggregateArgs>): Prisma.PrismaPromise<GetHostToolAggregateType<T>>;
    groupBy<T extends HostToolGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: HostToolGroupByArgs['orderBy'];
    } : {
        orderBy?: HostToolGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, HostToolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHostToolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: HostToolFieldRefs;
}
export interface Prisma__HostToolClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    appClient<T extends Prisma.AppClientDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AppClientDefaultArgs<ExtArgs>>): Prisma.Prisma__AppClientClient<runtime.Types.Result.GetResult<Prisma.$AppClientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    hostPage<T extends Prisma.HostTool$hostPageArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$hostPageArgs<ExtArgs>>): Prisma.Prisma__HostPageClient<runtime.Types.Result.GetResult<Prisma.$HostPagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    agentHostTools<T extends Prisma.HostTool$agentHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$agentHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AgentHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    skillHostTools<T extends Prisma.HostTool$skillHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$skillHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SkillHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    roleHostTools<T extends Prisma.HostTool$roleHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$roleHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RoleHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    pageActions<T extends Prisma.HostTool$pageActionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$pageActionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PageActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    workflowHostTools<T extends Prisma.HostTool$workflowHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$workflowHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkflowHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    flowHostTools<T extends Prisma.HostTool$flowHostToolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.HostTool$flowHostToolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FlowHostToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface HostToolFieldRefs {
    readonly id: Prisma.FieldRef<"HostTool", 'Int'>;
    readonly appClientId: Prisma.FieldRef<"HostTool", 'Int'>;
    readonly hostPageId: Prisma.FieldRef<"HostTool", 'Int'>;
    readonly definitionKey: Prisma.FieldRef<"HostTool", 'String'>;
    readonly name: Prisma.FieldRef<"HostTool", 'String'>;
    readonly description: Prisma.FieldRef<"HostTool", 'String'>;
    readonly argsSchema: Prisma.FieldRef<"HostTool", 'Json'>;
    readonly argsTemplate: Prisma.FieldRef<"HostTool", 'Json'>;
    readonly sortOrder: Prisma.FieldRef<"HostTool", 'Int'>;
    readonly isActive: Prisma.FieldRef<"HostTool", 'Boolean'>;
    readonly config: Prisma.FieldRef<"HostTool", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"HostTool", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"HostTool", 'DateTime'>;
}
export type HostToolFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where: Prisma.HostToolWhereUniqueInput;
};
export type HostToolFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where: Prisma.HostToolWhereUniqueInput;
};
export type HostToolFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithRelationInput | Prisma.HostToolOrderByWithRelationInput[];
    cursor?: Prisma.HostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostToolScalarFieldEnum | Prisma.HostToolScalarFieldEnum[];
};
export type HostToolFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithRelationInput | Prisma.HostToolOrderByWithRelationInput[];
    cursor?: Prisma.HostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostToolScalarFieldEnum | Prisma.HostToolScalarFieldEnum[];
};
export type HostToolFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where?: Prisma.HostToolWhereInput;
    orderBy?: Prisma.HostToolOrderByWithRelationInput | Prisma.HostToolOrderByWithRelationInput[];
    cursor?: Prisma.HostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HostToolScalarFieldEnum | Prisma.HostToolScalarFieldEnum[];
};
export type HostToolCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostToolCreateInput, Prisma.HostToolUncheckedCreateInput>;
};
export type HostToolCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.HostToolCreateManyInput | Prisma.HostToolCreateManyInput[];
    skipDuplicates?: boolean;
};
export type HostToolCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    data: Prisma.HostToolCreateManyInput | Prisma.HostToolCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.HostToolIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type HostToolUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostToolUpdateInput, Prisma.HostToolUncheckedUpdateInput>;
    where: Prisma.HostToolWhereUniqueInput;
};
export type HostToolUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.HostToolUpdateManyMutationInput, Prisma.HostToolUncheckedUpdateManyInput>;
    where?: Prisma.HostToolWhereInput;
    limit?: number;
};
export type HostToolUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.HostToolUpdateManyMutationInput, Prisma.HostToolUncheckedUpdateManyInput>;
    where?: Prisma.HostToolWhereInput;
    limit?: number;
    include?: Prisma.HostToolIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type HostToolUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where: Prisma.HostToolWhereUniqueInput;
    create: Prisma.XOR<Prisma.HostToolCreateInput, Prisma.HostToolUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.HostToolUpdateInput, Prisma.HostToolUncheckedUpdateInput>;
};
export type HostToolDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
    where: Prisma.HostToolWhereUniqueInput;
};
export type HostToolDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HostToolWhereInput;
    limit?: number;
};
export type HostTool$hostPageArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostPageSelect<ExtArgs> | null;
    omit?: Prisma.HostPageOmit<ExtArgs> | null;
    include?: Prisma.HostPageInclude<ExtArgs> | null;
    where?: Prisma.HostPageWhereInput;
};
export type HostTool$agentHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AgentHostToolSelect<ExtArgs> | null;
    omit?: Prisma.AgentHostToolOmit<ExtArgs> | null;
    include?: Prisma.AgentHostToolInclude<ExtArgs> | null;
    where?: Prisma.AgentHostToolWhereInput;
    orderBy?: Prisma.AgentHostToolOrderByWithRelationInput | Prisma.AgentHostToolOrderByWithRelationInput[];
    cursor?: Prisma.AgentHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AgentHostToolScalarFieldEnum | Prisma.AgentHostToolScalarFieldEnum[];
};
export type HostTool$skillHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SkillHostToolSelect<ExtArgs> | null;
    omit?: Prisma.SkillHostToolOmit<ExtArgs> | null;
    include?: Prisma.SkillHostToolInclude<ExtArgs> | null;
    where?: Prisma.SkillHostToolWhereInput;
    orderBy?: Prisma.SkillHostToolOrderByWithRelationInput | Prisma.SkillHostToolOrderByWithRelationInput[];
    cursor?: Prisma.SkillHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SkillHostToolScalarFieldEnum | Prisma.SkillHostToolScalarFieldEnum[];
};
export type HostTool$roleHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type HostTool$pageActionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PageActionSelect<ExtArgs> | null;
    omit?: Prisma.PageActionOmit<ExtArgs> | null;
    include?: Prisma.PageActionInclude<ExtArgs> | null;
    where?: Prisma.PageActionWhereInput;
    orderBy?: Prisma.PageActionOrderByWithRelationInput | Prisma.PageActionOrderByWithRelationInput[];
    cursor?: Prisma.PageActionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PageActionScalarFieldEnum | Prisma.PageActionScalarFieldEnum[];
};
export type HostTool$workflowHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.WorkflowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.WorkflowHostToolOmit<ExtArgs> | null;
    include?: Prisma.WorkflowHostToolInclude<ExtArgs> | null;
    where?: Prisma.WorkflowHostToolWhereInput;
    orderBy?: Prisma.WorkflowHostToolOrderByWithRelationInput | Prisma.WorkflowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.WorkflowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.WorkflowHostToolScalarFieldEnum | Prisma.WorkflowHostToolScalarFieldEnum[];
};
export type HostTool$flowHostToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FlowHostToolSelect<ExtArgs> | null;
    omit?: Prisma.FlowHostToolOmit<ExtArgs> | null;
    include?: Prisma.FlowHostToolInclude<ExtArgs> | null;
    where?: Prisma.FlowHostToolWhereInput;
    orderBy?: Prisma.FlowHostToolOrderByWithRelationInput | Prisma.FlowHostToolOrderByWithRelationInput[];
    cursor?: Prisma.FlowHostToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FlowHostToolScalarFieldEnum | Prisma.FlowHostToolScalarFieldEnum[];
};
export type HostToolDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.HostToolSelect<ExtArgs> | null;
    omit?: Prisma.HostToolOmit<ExtArgs> | null;
    include?: Prisma.HostToolInclude<ExtArgs> | null;
};
