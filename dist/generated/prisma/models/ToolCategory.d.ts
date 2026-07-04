import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type ToolCategoryModel = runtime.Types.Result.DefaultSelection<Prisma.$ToolCategoryPayload>;
export type AggregateToolCategory = {
    _count: ToolCategoryCountAggregateOutputType | null;
    _avg: ToolCategoryAvgAggregateOutputType | null;
    _sum: ToolCategorySumAggregateOutputType | null;
    _min: ToolCategoryMinAggregateOutputType | null;
    _max: ToolCategoryMaxAggregateOutputType | null;
};
export type ToolCategoryAvgAggregateOutputType = {
    id: number | null;
    sortOrder: number | null;
};
export type ToolCategorySumAggregateOutputType = {
    id: number | null;
    sortOrder: number | null;
};
export type ToolCategoryMinAggregateOutputType = {
    id: number | null;
    label: string | null;
    description: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ToolCategoryMaxAggregateOutputType = {
    id: number | null;
    label: string | null;
    description: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ToolCategoryCountAggregateOutputType = {
    id: number;
    label: number;
    description: number;
    sortOrder: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type ToolCategoryAvgAggregateInputType = {
    id?: true;
    sortOrder?: true;
};
export type ToolCategorySumAggregateInputType = {
    id?: true;
    sortOrder?: true;
};
export type ToolCategoryMinAggregateInputType = {
    id?: true;
    label?: true;
    description?: true;
    sortOrder?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ToolCategoryMaxAggregateInputType = {
    id?: true;
    label?: true;
    description?: true;
    sortOrder?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ToolCategoryCountAggregateInputType = {
    id?: true;
    label?: true;
    description?: true;
    sortOrder?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type ToolCategoryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ToolCategoryWhereInput;
    orderBy?: Prisma.ToolCategoryOrderByWithRelationInput | Prisma.ToolCategoryOrderByWithRelationInput[];
    cursor?: Prisma.ToolCategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ToolCategoryCountAggregateInputType;
    _avg?: ToolCategoryAvgAggregateInputType;
    _sum?: ToolCategorySumAggregateInputType;
    _min?: ToolCategoryMinAggregateInputType;
    _max?: ToolCategoryMaxAggregateInputType;
};
export type GetToolCategoryAggregateType<T extends ToolCategoryAggregateArgs> = {
    [P in keyof T & keyof AggregateToolCategory]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateToolCategory[P]> : Prisma.GetScalarType<T[P], AggregateToolCategory[P]>;
};
export type ToolCategoryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ToolCategoryWhereInput;
    orderBy?: Prisma.ToolCategoryOrderByWithAggregationInput | Prisma.ToolCategoryOrderByWithAggregationInput[];
    by: Prisma.ToolCategoryScalarFieldEnum[] | Prisma.ToolCategoryScalarFieldEnum;
    having?: Prisma.ToolCategoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ToolCategoryCountAggregateInputType | true;
    _avg?: ToolCategoryAvgAggregateInputType;
    _sum?: ToolCategorySumAggregateInputType;
    _min?: ToolCategoryMinAggregateInputType;
    _max?: ToolCategoryMaxAggregateInputType;
};
export type ToolCategoryGroupByOutputType = {
    id: number;
    label: string;
    description: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    _count: ToolCategoryCountAggregateOutputType | null;
    _avg: ToolCategoryAvgAggregateOutputType | null;
    _sum: ToolCategorySumAggregateOutputType | null;
    _min: ToolCategoryMinAggregateOutputType | null;
    _max: ToolCategoryMaxAggregateOutputType | null;
};
export type GetToolCategoryGroupByPayload<T extends ToolCategoryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ToolCategoryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ToolCategoryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ToolCategoryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ToolCategoryGroupByOutputType[P]>;
}>>;
export type ToolCategoryWhereInput = {
    AND?: Prisma.ToolCategoryWhereInput | Prisma.ToolCategoryWhereInput[];
    OR?: Prisma.ToolCategoryWhereInput[];
    NOT?: Prisma.ToolCategoryWhereInput | Prisma.ToolCategoryWhereInput[];
    id?: Prisma.IntFilter<"ToolCategory"> | number;
    label?: Prisma.StringFilter<"ToolCategory"> | string;
    description?: Prisma.StringNullableFilter<"ToolCategory"> | string | null;
    sortOrder?: Prisma.IntFilter<"ToolCategory"> | number;
    createdAt?: Prisma.DateTimeFilter<"ToolCategory"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"ToolCategory"> | Date | string;
    tools?: Prisma.ToolListRelationFilter;
};
export type ToolCategoryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    tools?: Prisma.ToolOrderByRelationAggregateInput;
};
export type ToolCategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.ToolCategoryWhereInput | Prisma.ToolCategoryWhereInput[];
    OR?: Prisma.ToolCategoryWhereInput[];
    NOT?: Prisma.ToolCategoryWhereInput | Prisma.ToolCategoryWhereInput[];
    label?: Prisma.StringFilter<"ToolCategory"> | string;
    description?: Prisma.StringNullableFilter<"ToolCategory"> | string | null;
    sortOrder?: Prisma.IntFilter<"ToolCategory"> | number;
    createdAt?: Prisma.DateTimeFilter<"ToolCategory"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"ToolCategory"> | Date | string;
    tools?: Prisma.ToolListRelationFilter;
}, "id">;
export type ToolCategoryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.ToolCategoryCountOrderByAggregateInput;
    _avg?: Prisma.ToolCategoryAvgOrderByAggregateInput;
    _max?: Prisma.ToolCategoryMaxOrderByAggregateInput;
    _min?: Prisma.ToolCategoryMinOrderByAggregateInput;
    _sum?: Prisma.ToolCategorySumOrderByAggregateInput;
};
export type ToolCategoryScalarWhereWithAggregatesInput = {
    AND?: Prisma.ToolCategoryScalarWhereWithAggregatesInput | Prisma.ToolCategoryScalarWhereWithAggregatesInput[];
    OR?: Prisma.ToolCategoryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ToolCategoryScalarWhereWithAggregatesInput | Prisma.ToolCategoryScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"ToolCategory"> | number;
    label?: Prisma.StringWithAggregatesFilter<"ToolCategory"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"ToolCategory"> | string | null;
    sortOrder?: Prisma.IntWithAggregatesFilter<"ToolCategory"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"ToolCategory"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"ToolCategory"> | Date | string;
};
export type ToolCategoryCreateInput = {
    label: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolCreateNestedManyWithoutToolCategoryInput;
};
export type ToolCategoryUncheckedCreateInput = {
    id?: number;
    label: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tools?: Prisma.ToolUncheckedCreateNestedManyWithoutToolCategoryInput;
};
export type ToolCategoryUpdateInput = {
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUpdateManyWithoutToolCategoryNestedInput;
};
export type ToolCategoryUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tools?: Prisma.ToolUncheckedUpdateManyWithoutToolCategoryNestedInput;
};
export type ToolCategoryCreateManyInput = {
    id?: number;
    label: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ToolCategoryUpdateManyMutationInput = {
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ToolCategoryUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ToolCategoryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ToolCategoryAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type ToolCategoryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ToolCategoryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ToolCategorySumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type ToolCategoryNullableScalarRelationFilter = {
    is?: Prisma.ToolCategoryWhereInput | null;
    isNot?: Prisma.ToolCategoryWhereInput | null;
};
export type ToolCategoryCreateNestedOneWithoutToolsInput = {
    create?: Prisma.XOR<Prisma.ToolCategoryCreateWithoutToolsInput, Prisma.ToolCategoryUncheckedCreateWithoutToolsInput>;
    connectOrCreate?: Prisma.ToolCategoryCreateOrConnectWithoutToolsInput;
    connect?: Prisma.ToolCategoryWhereUniqueInput;
};
export type ToolCategoryUpdateOneWithoutToolsNestedInput = {
    create?: Prisma.XOR<Prisma.ToolCategoryCreateWithoutToolsInput, Prisma.ToolCategoryUncheckedCreateWithoutToolsInput>;
    connectOrCreate?: Prisma.ToolCategoryCreateOrConnectWithoutToolsInput;
    upsert?: Prisma.ToolCategoryUpsertWithoutToolsInput;
    disconnect?: Prisma.ToolCategoryWhereInput | boolean;
    delete?: Prisma.ToolCategoryWhereInput | boolean;
    connect?: Prisma.ToolCategoryWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ToolCategoryUpdateToOneWithWhereWithoutToolsInput, Prisma.ToolCategoryUpdateWithoutToolsInput>, Prisma.ToolCategoryUncheckedUpdateWithoutToolsInput>;
};
export type ToolCategoryCreateWithoutToolsInput = {
    label: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ToolCategoryUncheckedCreateWithoutToolsInput = {
    id?: number;
    label: string;
    description?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ToolCategoryCreateOrConnectWithoutToolsInput = {
    where: Prisma.ToolCategoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.ToolCategoryCreateWithoutToolsInput, Prisma.ToolCategoryUncheckedCreateWithoutToolsInput>;
};
export type ToolCategoryUpsertWithoutToolsInput = {
    update: Prisma.XOR<Prisma.ToolCategoryUpdateWithoutToolsInput, Prisma.ToolCategoryUncheckedUpdateWithoutToolsInput>;
    create: Prisma.XOR<Prisma.ToolCategoryCreateWithoutToolsInput, Prisma.ToolCategoryUncheckedCreateWithoutToolsInput>;
    where?: Prisma.ToolCategoryWhereInput;
};
export type ToolCategoryUpdateToOneWithWhereWithoutToolsInput = {
    where?: Prisma.ToolCategoryWhereInput;
    data: Prisma.XOR<Prisma.ToolCategoryUpdateWithoutToolsInput, Prisma.ToolCategoryUncheckedUpdateWithoutToolsInput>;
};
export type ToolCategoryUpdateWithoutToolsInput = {
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ToolCategoryUncheckedUpdateWithoutToolsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ToolCategoryCountOutputType = {
    tools: number;
};
export type ToolCategoryCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tools?: boolean | ToolCategoryCountOutputTypeCountToolsArgs;
};
export type ToolCategoryCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategoryCountOutputTypeSelect<ExtArgs> | null;
};
export type ToolCategoryCountOutputTypeCountToolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ToolWhereInput;
};
export type ToolCategorySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    label?: boolean;
    description?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    tools?: boolean | Prisma.ToolCategory$toolsArgs<ExtArgs>;
    _count?: boolean | Prisma.ToolCategoryCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["toolCategory"]>;
export type ToolCategorySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    label?: boolean;
    description?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["toolCategory"]>;
export type ToolCategorySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    label?: boolean;
    description?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["toolCategory"]>;
export type ToolCategorySelectScalar = {
    id?: boolean;
    label?: boolean;
    description?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type ToolCategoryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "label" | "description" | "sortOrder" | "createdAt" | "updatedAt", ExtArgs["result"]["toolCategory"]>;
export type ToolCategoryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    tools?: boolean | Prisma.ToolCategory$toolsArgs<ExtArgs>;
    _count?: boolean | Prisma.ToolCategoryCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ToolCategoryIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type ToolCategoryIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $ToolCategoryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ToolCategory";
    objects: {
        tools: Prisma.$ToolPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        label: string;
        description: string | null;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["toolCategory"]>;
    composites: {};
};
export type ToolCategoryGetPayload<S extends boolean | null | undefined | ToolCategoryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload, S>;
export type ToolCategoryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ToolCategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ToolCategoryCountAggregateInputType | true;
};
export interface ToolCategoryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ToolCategory'];
        meta: {
            name: 'ToolCategory';
        };
    };
    findUnique<T extends ToolCategoryFindUniqueArgs>(args: Prisma.SelectSubset<T, ToolCategoryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ToolCategoryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ToolCategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ToolCategoryFindFirstArgs>(args?: Prisma.SelectSubset<T, ToolCategoryFindFirstArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ToolCategoryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ToolCategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ToolCategoryFindManyArgs>(args?: Prisma.SelectSubset<T, ToolCategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ToolCategoryCreateArgs>(args: Prisma.SelectSubset<T, ToolCategoryCreateArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ToolCategoryCreateManyArgs>(args?: Prisma.SelectSubset<T, ToolCategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ToolCategoryCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ToolCategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ToolCategoryDeleteArgs>(args: Prisma.SelectSubset<T, ToolCategoryDeleteArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ToolCategoryUpdateArgs>(args: Prisma.SelectSubset<T, ToolCategoryUpdateArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ToolCategoryDeleteManyArgs>(args?: Prisma.SelectSubset<T, ToolCategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ToolCategoryUpdateManyArgs>(args: Prisma.SelectSubset<T, ToolCategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ToolCategoryUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ToolCategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ToolCategoryUpsertArgs>(args: Prisma.SelectSubset<T, ToolCategoryUpsertArgs<ExtArgs>>): Prisma.Prisma__ToolCategoryClient<runtime.Types.Result.GetResult<Prisma.$ToolCategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ToolCategoryCountArgs>(args?: Prisma.Subset<T, ToolCategoryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ToolCategoryCountAggregateOutputType> : number>;
    aggregate<T extends ToolCategoryAggregateArgs>(args: Prisma.Subset<T, ToolCategoryAggregateArgs>): Prisma.PrismaPromise<GetToolCategoryAggregateType<T>>;
    groupBy<T extends ToolCategoryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ToolCategoryGroupByArgs['orderBy'];
    } : {
        orderBy?: ToolCategoryGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ToolCategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetToolCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ToolCategoryFieldRefs;
}
export interface Prisma__ToolCategoryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    tools<T extends Prisma.ToolCategory$toolsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ToolCategory$toolsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ToolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ToolCategoryFieldRefs {
    readonly id: Prisma.FieldRef<"ToolCategory", 'Int'>;
    readonly label: Prisma.FieldRef<"ToolCategory", 'String'>;
    readonly description: Prisma.FieldRef<"ToolCategory", 'String'>;
    readonly sortOrder: Prisma.FieldRef<"ToolCategory", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"ToolCategory", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"ToolCategory", 'DateTime'>;
}
export type ToolCategoryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where: Prisma.ToolCategoryWhereUniqueInput;
};
export type ToolCategoryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where: Prisma.ToolCategoryWhereUniqueInput;
};
export type ToolCategoryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where?: Prisma.ToolCategoryWhereInput;
    orderBy?: Prisma.ToolCategoryOrderByWithRelationInput | Prisma.ToolCategoryOrderByWithRelationInput[];
    cursor?: Prisma.ToolCategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ToolCategoryScalarFieldEnum | Prisma.ToolCategoryScalarFieldEnum[];
};
export type ToolCategoryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where?: Prisma.ToolCategoryWhereInput;
    orderBy?: Prisma.ToolCategoryOrderByWithRelationInput | Prisma.ToolCategoryOrderByWithRelationInput[];
    cursor?: Prisma.ToolCategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ToolCategoryScalarFieldEnum | Prisma.ToolCategoryScalarFieldEnum[];
};
export type ToolCategoryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where?: Prisma.ToolCategoryWhereInput;
    orderBy?: Prisma.ToolCategoryOrderByWithRelationInput | Prisma.ToolCategoryOrderByWithRelationInput[];
    cursor?: Prisma.ToolCategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ToolCategoryScalarFieldEnum | Prisma.ToolCategoryScalarFieldEnum[];
};
export type ToolCategoryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ToolCategoryCreateInput, Prisma.ToolCategoryUncheckedCreateInput>;
};
export type ToolCategoryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ToolCategoryCreateManyInput | Prisma.ToolCategoryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ToolCategoryCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    data: Prisma.ToolCategoryCreateManyInput | Prisma.ToolCategoryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ToolCategoryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ToolCategoryUpdateInput, Prisma.ToolCategoryUncheckedUpdateInput>;
    where: Prisma.ToolCategoryWhereUniqueInput;
};
export type ToolCategoryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ToolCategoryUpdateManyMutationInput, Prisma.ToolCategoryUncheckedUpdateManyInput>;
    where?: Prisma.ToolCategoryWhereInput;
    limit?: number;
};
export type ToolCategoryUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ToolCategoryUpdateManyMutationInput, Prisma.ToolCategoryUncheckedUpdateManyInput>;
    where?: Prisma.ToolCategoryWhereInput;
    limit?: number;
};
export type ToolCategoryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where: Prisma.ToolCategoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.ToolCategoryCreateInput, Prisma.ToolCategoryUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ToolCategoryUpdateInput, Prisma.ToolCategoryUncheckedUpdateInput>;
};
export type ToolCategoryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
    where: Prisma.ToolCategoryWhereUniqueInput;
};
export type ToolCategoryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ToolCategoryWhereInput;
    limit?: number;
};
export type ToolCategory$toolsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolSelect<ExtArgs> | null;
    omit?: Prisma.ToolOmit<ExtArgs> | null;
    include?: Prisma.ToolInclude<ExtArgs> | null;
    where?: Prisma.ToolWhereInput;
    orderBy?: Prisma.ToolOrderByWithRelationInput | Prisma.ToolOrderByWithRelationInput[];
    cursor?: Prisma.ToolWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ToolScalarFieldEnum | Prisma.ToolScalarFieldEnum[];
};
export type ToolCategoryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ToolCategorySelect<ExtArgs> | null;
    omit?: Prisma.ToolCategoryOmit<ExtArgs> | null;
    include?: Prisma.ToolCategoryInclude<ExtArgs> | null;
};
