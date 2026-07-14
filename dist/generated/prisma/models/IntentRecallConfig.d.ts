import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type IntentRecallConfigModel = runtime.Types.Result.DefaultSelection<Prisma.$IntentRecallConfigPayload>;
export type AggregateIntentRecallConfig = {
    _count: IntentRecallConfigCountAggregateOutputType | null;
    _avg: IntentRecallConfigAvgAggregateOutputType | null;
    _sum: IntentRecallConfigSumAggregateOutputType | null;
    _min: IntentRecallConfigMinAggregateOutputType | null;
    _max: IntentRecallConfigMaxAggregateOutputType | null;
};
export type IntentRecallConfigAvgAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    vectorTopK: number | null;
    vectorMinScore: number | null;
    bindToolsMax: number | null;
};
export type IntentRecallConfigSumAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    vectorTopK: number | null;
    vectorMinScore: number | null;
    bindToolsMax: number | null;
};
export type IntentRecallConfigMinAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    recallMode: string | null;
    vectorTopK: number | null;
    vectorMinScore: number | null;
    bindToolsMax: number | null;
    fallbackToKeyword: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type IntentRecallConfigMaxAggregateOutputType = {
    id: number | null;
    singletonKey: number | null;
    recallMode: string | null;
    vectorTopK: number | null;
    vectorMinScore: number | null;
    bindToolsMax: number | null;
    fallbackToKeyword: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type IntentRecallConfigCountAggregateOutputType = {
    id: number;
    singletonKey: number;
    recallMode: number;
    vectorTopK: number;
    vectorMinScore: number;
    bindToolsMax: number;
    fallbackToKeyword: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type IntentRecallConfigAvgAggregateInputType = {
    id?: true;
    singletonKey?: true;
    vectorTopK?: true;
    vectorMinScore?: true;
    bindToolsMax?: true;
};
export type IntentRecallConfigSumAggregateInputType = {
    id?: true;
    singletonKey?: true;
    vectorTopK?: true;
    vectorMinScore?: true;
    bindToolsMax?: true;
};
export type IntentRecallConfigMinAggregateInputType = {
    id?: true;
    singletonKey?: true;
    recallMode?: true;
    vectorTopK?: true;
    vectorMinScore?: true;
    bindToolsMax?: true;
    fallbackToKeyword?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type IntentRecallConfigMaxAggregateInputType = {
    id?: true;
    singletonKey?: true;
    recallMode?: true;
    vectorTopK?: true;
    vectorMinScore?: true;
    bindToolsMax?: true;
    fallbackToKeyword?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type IntentRecallConfigCountAggregateInputType = {
    id?: true;
    singletonKey?: true;
    recallMode?: true;
    vectorTopK?: true;
    vectorMinScore?: true;
    bindToolsMax?: true;
    fallbackToKeyword?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type IntentRecallConfigAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntentRecallConfigWhereInput;
    orderBy?: Prisma.IntentRecallConfigOrderByWithRelationInput | Prisma.IntentRecallConfigOrderByWithRelationInput[];
    cursor?: Prisma.IntentRecallConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | IntentRecallConfigCountAggregateInputType;
    _avg?: IntentRecallConfigAvgAggregateInputType;
    _sum?: IntentRecallConfigSumAggregateInputType;
    _min?: IntentRecallConfigMinAggregateInputType;
    _max?: IntentRecallConfigMaxAggregateInputType;
};
export type GetIntentRecallConfigAggregateType<T extends IntentRecallConfigAggregateArgs> = {
    [P in keyof T & keyof AggregateIntentRecallConfig]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateIntentRecallConfig[P]> : Prisma.GetScalarType<T[P], AggregateIntentRecallConfig[P]>;
};
export type IntentRecallConfigGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntentRecallConfigWhereInput;
    orderBy?: Prisma.IntentRecallConfigOrderByWithAggregationInput | Prisma.IntentRecallConfigOrderByWithAggregationInput[];
    by: Prisma.IntentRecallConfigScalarFieldEnum[] | Prisma.IntentRecallConfigScalarFieldEnum;
    having?: Prisma.IntentRecallConfigScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: IntentRecallConfigCountAggregateInputType | true;
    _avg?: IntentRecallConfigAvgAggregateInputType;
    _sum?: IntentRecallConfigSumAggregateInputType;
    _min?: IntentRecallConfigMinAggregateInputType;
    _max?: IntentRecallConfigMaxAggregateInputType;
};
export type IntentRecallConfigGroupByOutputType = {
    id: number;
    singletonKey: number;
    recallMode: string;
    vectorTopK: number;
    vectorMinScore: number;
    bindToolsMax: number;
    fallbackToKeyword: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: IntentRecallConfigCountAggregateOutputType | null;
    _avg: IntentRecallConfigAvgAggregateOutputType | null;
    _sum: IntentRecallConfigSumAggregateOutputType | null;
    _min: IntentRecallConfigMinAggregateOutputType | null;
    _max: IntentRecallConfigMaxAggregateOutputType | null;
};
export type GetIntentRecallConfigGroupByPayload<T extends IntentRecallConfigGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<IntentRecallConfigGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof IntentRecallConfigGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], IntentRecallConfigGroupByOutputType[P]> : Prisma.GetScalarType<T[P], IntentRecallConfigGroupByOutputType[P]>;
}>>;
export type IntentRecallConfigWhereInput = {
    AND?: Prisma.IntentRecallConfigWhereInput | Prisma.IntentRecallConfigWhereInput[];
    OR?: Prisma.IntentRecallConfigWhereInput[];
    NOT?: Prisma.IntentRecallConfigWhereInput | Prisma.IntentRecallConfigWhereInput[];
    id?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    singletonKey?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    recallMode?: Prisma.StringFilter<"IntentRecallConfig"> | string;
    vectorTopK?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    vectorMinScore?: Prisma.FloatFilter<"IntentRecallConfig"> | number;
    bindToolsMax?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    fallbackToKeyword?: Prisma.BoolFilter<"IntentRecallConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"IntentRecallConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"IntentRecallConfig"> | Date | string;
};
export type IntentRecallConfigOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    recallMode?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
    fallbackToKeyword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntentRecallConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    singletonKey?: number;
    AND?: Prisma.IntentRecallConfigWhereInput | Prisma.IntentRecallConfigWhereInput[];
    OR?: Prisma.IntentRecallConfigWhereInput[];
    NOT?: Prisma.IntentRecallConfigWhereInput | Prisma.IntentRecallConfigWhereInput[];
    recallMode?: Prisma.StringFilter<"IntentRecallConfig"> | string;
    vectorTopK?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    vectorMinScore?: Prisma.FloatFilter<"IntentRecallConfig"> | number;
    bindToolsMax?: Prisma.IntFilter<"IntentRecallConfig"> | number;
    fallbackToKeyword?: Prisma.BoolFilter<"IntentRecallConfig"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"IntentRecallConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"IntentRecallConfig"> | Date | string;
}, "id" | "singletonKey">;
export type IntentRecallConfigOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    recallMode?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
    fallbackToKeyword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.IntentRecallConfigCountOrderByAggregateInput;
    _avg?: Prisma.IntentRecallConfigAvgOrderByAggregateInput;
    _max?: Prisma.IntentRecallConfigMaxOrderByAggregateInput;
    _min?: Prisma.IntentRecallConfigMinOrderByAggregateInput;
    _sum?: Prisma.IntentRecallConfigSumOrderByAggregateInput;
};
export type IntentRecallConfigScalarWhereWithAggregatesInput = {
    AND?: Prisma.IntentRecallConfigScalarWhereWithAggregatesInput | Prisma.IntentRecallConfigScalarWhereWithAggregatesInput[];
    OR?: Prisma.IntentRecallConfigScalarWhereWithAggregatesInput[];
    NOT?: Prisma.IntentRecallConfigScalarWhereWithAggregatesInput | Prisma.IntentRecallConfigScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"IntentRecallConfig"> | number;
    singletonKey?: Prisma.IntWithAggregatesFilter<"IntentRecallConfig"> | number;
    recallMode?: Prisma.StringWithAggregatesFilter<"IntentRecallConfig"> | string;
    vectorTopK?: Prisma.IntWithAggregatesFilter<"IntentRecallConfig"> | number;
    vectorMinScore?: Prisma.FloatWithAggregatesFilter<"IntentRecallConfig"> | number;
    bindToolsMax?: Prisma.IntWithAggregatesFilter<"IntentRecallConfig"> | number;
    fallbackToKeyword?: Prisma.BoolWithAggregatesFilter<"IntentRecallConfig"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"IntentRecallConfig"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"IntentRecallConfig"> | Date | string;
};
export type IntentRecallConfigCreateInput = {
    id?: number;
    singletonKey?: number;
    recallMode?: string;
    vectorTopK?: number;
    vectorMinScore?: number;
    bindToolsMax?: number;
    fallbackToKeyword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type IntentRecallConfigUncheckedCreateInput = {
    id?: number;
    singletonKey?: number;
    recallMode?: string;
    vectorTopK?: number;
    vectorMinScore?: number;
    bindToolsMax?: number;
    fallbackToKeyword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type IntentRecallConfigUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    singletonKey?: Prisma.IntFieldUpdateOperationsInput | number;
    recallMode?: Prisma.StringFieldUpdateOperationsInput | string;
    vectorTopK?: Prisma.IntFieldUpdateOperationsInput | number;
    vectorMinScore?: Prisma.FloatFieldUpdateOperationsInput | number;
    bindToolsMax?: Prisma.IntFieldUpdateOperationsInput | number;
    fallbackToKeyword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntentRecallConfigUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    singletonKey?: Prisma.IntFieldUpdateOperationsInput | number;
    recallMode?: Prisma.StringFieldUpdateOperationsInput | string;
    vectorTopK?: Prisma.IntFieldUpdateOperationsInput | number;
    vectorMinScore?: Prisma.FloatFieldUpdateOperationsInput | number;
    bindToolsMax?: Prisma.IntFieldUpdateOperationsInput | number;
    fallbackToKeyword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntentRecallConfigCreateManyInput = {
    id?: number;
    singletonKey?: number;
    recallMode?: string;
    vectorTopK?: number;
    vectorMinScore?: number;
    bindToolsMax?: number;
    fallbackToKeyword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type IntentRecallConfigUpdateManyMutationInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    singletonKey?: Prisma.IntFieldUpdateOperationsInput | number;
    recallMode?: Prisma.StringFieldUpdateOperationsInput | string;
    vectorTopK?: Prisma.IntFieldUpdateOperationsInput | number;
    vectorMinScore?: Prisma.FloatFieldUpdateOperationsInput | number;
    bindToolsMax?: Prisma.IntFieldUpdateOperationsInput | number;
    fallbackToKeyword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntentRecallConfigUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    singletonKey?: Prisma.IntFieldUpdateOperationsInput | number;
    recallMode?: Prisma.StringFieldUpdateOperationsInput | string;
    vectorTopK?: Prisma.IntFieldUpdateOperationsInput | number;
    vectorMinScore?: Prisma.FloatFieldUpdateOperationsInput | number;
    bindToolsMax?: Prisma.IntFieldUpdateOperationsInput | number;
    fallbackToKeyword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type IntentRecallConfigCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    recallMode?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
    fallbackToKeyword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntentRecallConfigAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
};
export type IntentRecallConfigMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    recallMode?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
    fallbackToKeyword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntentRecallConfigMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    recallMode?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
    fallbackToKeyword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type IntentRecallConfigSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    singletonKey?: Prisma.SortOrder;
    vectorTopK?: Prisma.SortOrder;
    vectorMinScore?: Prisma.SortOrder;
    bindToolsMax?: Prisma.SortOrder;
};
export type FloatFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type IntentRecallConfigSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    singletonKey?: boolean;
    recallMode?: boolean;
    vectorTopK?: boolean;
    vectorMinScore?: boolean;
    bindToolsMax?: boolean;
    fallbackToKeyword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["intentRecallConfig"]>;
export type IntentRecallConfigSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    singletonKey?: boolean;
    recallMode?: boolean;
    vectorTopK?: boolean;
    vectorMinScore?: boolean;
    bindToolsMax?: boolean;
    fallbackToKeyword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["intentRecallConfig"]>;
export type IntentRecallConfigSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    singletonKey?: boolean;
    recallMode?: boolean;
    vectorTopK?: boolean;
    vectorMinScore?: boolean;
    bindToolsMax?: boolean;
    fallbackToKeyword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["intentRecallConfig"]>;
export type IntentRecallConfigSelectScalar = {
    id?: boolean;
    singletonKey?: boolean;
    recallMode?: boolean;
    vectorTopK?: boolean;
    vectorMinScore?: boolean;
    bindToolsMax?: boolean;
    fallbackToKeyword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type IntentRecallConfigOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "singletonKey" | "recallMode" | "vectorTopK" | "vectorMinScore" | "bindToolsMax" | "fallbackToKeyword" | "createdAt" | "updatedAt", ExtArgs["result"]["intentRecallConfig"]>;
export type $IntentRecallConfigPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "IntentRecallConfig";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        singletonKey: number;
        recallMode: string;
        vectorTopK: number;
        vectorMinScore: number;
        bindToolsMax: number;
        fallbackToKeyword: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["intentRecallConfig"]>;
    composites: {};
};
export type IntentRecallConfigGetPayload<S extends boolean | null | undefined | IntentRecallConfigDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload, S>;
export type IntentRecallConfigCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<IntentRecallConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: IntentRecallConfigCountAggregateInputType | true;
};
export interface IntentRecallConfigDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['IntentRecallConfig'];
        meta: {
            name: 'IntentRecallConfig';
        };
    };
    findUnique<T extends IntentRecallConfigFindUniqueArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigFindUniqueArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends IntentRecallConfigFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends IntentRecallConfigFindFirstArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigFindFirstArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends IntentRecallConfigFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends IntentRecallConfigFindManyArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends IntentRecallConfigCreateArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigCreateArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends IntentRecallConfigCreateManyArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends IntentRecallConfigCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends IntentRecallConfigDeleteArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigDeleteArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends IntentRecallConfigUpdateArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigUpdateArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends IntentRecallConfigDeleteManyArgs>(args?: Prisma.SelectSubset<T, IntentRecallConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends IntentRecallConfigUpdateManyArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends IntentRecallConfigUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends IntentRecallConfigUpsertArgs>(args: Prisma.SelectSubset<T, IntentRecallConfigUpsertArgs<ExtArgs>>): Prisma.Prisma__IntentRecallConfigClient<runtime.Types.Result.GetResult<Prisma.$IntentRecallConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends IntentRecallConfigCountArgs>(args?: Prisma.Subset<T, IntentRecallConfigCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], IntentRecallConfigCountAggregateOutputType> : number>;
    aggregate<T extends IntentRecallConfigAggregateArgs>(args: Prisma.Subset<T, IntentRecallConfigAggregateArgs>): Prisma.PrismaPromise<GetIntentRecallConfigAggregateType<T>>;
    groupBy<T extends IntentRecallConfigGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: IntentRecallConfigGroupByArgs['orderBy'];
    } : {
        orderBy?: IntentRecallConfigGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, IntentRecallConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIntentRecallConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: IntentRecallConfigFieldRefs;
}
export interface Prisma__IntentRecallConfigClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface IntentRecallConfigFieldRefs {
    readonly id: Prisma.FieldRef<"IntentRecallConfig", 'Int'>;
    readonly singletonKey: Prisma.FieldRef<"IntentRecallConfig", 'Int'>;
    readonly recallMode: Prisma.FieldRef<"IntentRecallConfig", 'String'>;
    readonly vectorTopK: Prisma.FieldRef<"IntentRecallConfig", 'Int'>;
    readonly vectorMinScore: Prisma.FieldRef<"IntentRecallConfig", 'Float'>;
    readonly bindToolsMax: Prisma.FieldRef<"IntentRecallConfig", 'Int'>;
    readonly fallbackToKeyword: Prisma.FieldRef<"IntentRecallConfig", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"IntentRecallConfig", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"IntentRecallConfig", 'DateTime'>;
}
export type IntentRecallConfigFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where: Prisma.IntentRecallConfigWhereUniqueInput;
};
export type IntentRecallConfigFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where: Prisma.IntentRecallConfigWhereUniqueInput;
};
export type IntentRecallConfigFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where?: Prisma.IntentRecallConfigWhereInput;
    orderBy?: Prisma.IntentRecallConfigOrderByWithRelationInput | Prisma.IntentRecallConfigOrderByWithRelationInput[];
    cursor?: Prisma.IntentRecallConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntentRecallConfigScalarFieldEnum | Prisma.IntentRecallConfigScalarFieldEnum[];
};
export type IntentRecallConfigFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where?: Prisma.IntentRecallConfigWhereInput;
    orderBy?: Prisma.IntentRecallConfigOrderByWithRelationInput | Prisma.IntentRecallConfigOrderByWithRelationInput[];
    cursor?: Prisma.IntentRecallConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntentRecallConfigScalarFieldEnum | Prisma.IntentRecallConfigScalarFieldEnum[];
};
export type IntentRecallConfigFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where?: Prisma.IntentRecallConfigWhereInput;
    orderBy?: Prisma.IntentRecallConfigOrderByWithRelationInput | Prisma.IntentRecallConfigOrderByWithRelationInput[];
    cursor?: Prisma.IntentRecallConfigWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IntentRecallConfigScalarFieldEnum | Prisma.IntentRecallConfigScalarFieldEnum[];
};
export type IntentRecallConfigCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntentRecallConfigCreateInput, Prisma.IntentRecallConfigUncheckedCreateInput>;
};
export type IntentRecallConfigCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.IntentRecallConfigCreateManyInput | Prisma.IntentRecallConfigCreateManyInput[];
    skipDuplicates?: boolean;
};
export type IntentRecallConfigCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    data: Prisma.IntentRecallConfigCreateManyInput | Prisma.IntentRecallConfigCreateManyInput[];
    skipDuplicates?: boolean;
};
export type IntentRecallConfigUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntentRecallConfigUpdateInput, Prisma.IntentRecallConfigUncheckedUpdateInput>;
    where: Prisma.IntentRecallConfigWhereUniqueInput;
};
export type IntentRecallConfigUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.IntentRecallConfigUpdateManyMutationInput, Prisma.IntentRecallConfigUncheckedUpdateManyInput>;
    where?: Prisma.IntentRecallConfigWhereInput;
    limit?: number;
};
export type IntentRecallConfigUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IntentRecallConfigUpdateManyMutationInput, Prisma.IntentRecallConfigUncheckedUpdateManyInput>;
    where?: Prisma.IntentRecallConfigWhereInput;
    limit?: number;
};
export type IntentRecallConfigUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where: Prisma.IntentRecallConfigWhereUniqueInput;
    create: Prisma.XOR<Prisma.IntentRecallConfigCreateInput, Prisma.IntentRecallConfigUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.IntentRecallConfigUpdateInput, Prisma.IntentRecallConfigUncheckedUpdateInput>;
};
export type IntentRecallConfigDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
    where: Prisma.IntentRecallConfigWhereUniqueInput;
};
export type IntentRecallConfigDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IntentRecallConfigWhereInput;
    limit?: number;
};
export type IntentRecallConfigDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IntentRecallConfigSelect<ExtArgs> | null;
    omit?: Prisma.IntentRecallConfigOmit<ExtArgs> | null;
};
