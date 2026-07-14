import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
export type SessionGoaMemoryModel = runtime.Types.Result.DefaultSelection<Prisma.$SessionGoaMemoryPayload>;
export type AggregateSessionGoaMemory = {
    _count: SessionGoaMemoryCountAggregateOutputType | null;
    _min: SessionGoaMemoryMinAggregateOutputType | null;
    _max: SessionGoaMemoryMaxAggregateOutputType | null;
};
export type SessionGoaMemoryMinAggregateOutputType = {
    sessionId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SessionGoaMemoryMaxAggregateOutputType = {
    sessionId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SessionGoaMemoryCountAggregateOutputType = {
    sessionId: number;
    payload: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type SessionGoaMemoryMinAggregateInputType = {
    sessionId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SessionGoaMemoryMaxAggregateInputType = {
    sessionId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SessionGoaMemoryCountAggregateInputType = {
    sessionId?: true;
    payload?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type SessionGoaMemoryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionGoaMemoryWhereInput;
    orderBy?: Prisma.SessionGoaMemoryOrderByWithRelationInput | Prisma.SessionGoaMemoryOrderByWithRelationInput[];
    cursor?: Prisma.SessionGoaMemoryWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SessionGoaMemoryCountAggregateInputType;
    _min?: SessionGoaMemoryMinAggregateInputType;
    _max?: SessionGoaMemoryMaxAggregateInputType;
};
export type GetSessionGoaMemoryAggregateType<T extends SessionGoaMemoryAggregateArgs> = {
    [P in keyof T & keyof AggregateSessionGoaMemory]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSessionGoaMemory[P]> : Prisma.GetScalarType<T[P], AggregateSessionGoaMemory[P]>;
};
export type SessionGoaMemoryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionGoaMemoryWhereInput;
    orderBy?: Prisma.SessionGoaMemoryOrderByWithAggregationInput | Prisma.SessionGoaMemoryOrderByWithAggregationInput[];
    by: Prisma.SessionGoaMemoryScalarFieldEnum[] | Prisma.SessionGoaMemoryScalarFieldEnum;
    having?: Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SessionGoaMemoryCountAggregateInputType | true;
    _min?: SessionGoaMemoryMinAggregateInputType;
    _max?: SessionGoaMemoryMaxAggregateInputType;
};
export type SessionGoaMemoryGroupByOutputType = {
    sessionId: string;
    payload: runtime.JsonValue;
    createdAt: Date;
    updatedAt: Date;
    _count: SessionGoaMemoryCountAggregateOutputType | null;
    _min: SessionGoaMemoryMinAggregateOutputType | null;
    _max: SessionGoaMemoryMaxAggregateOutputType | null;
};
export type GetSessionGoaMemoryGroupByPayload<T extends SessionGoaMemoryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SessionGoaMemoryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SessionGoaMemoryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SessionGoaMemoryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SessionGoaMemoryGroupByOutputType[P]>;
}>>;
export type SessionGoaMemoryWhereInput = {
    AND?: Prisma.SessionGoaMemoryWhereInput | Prisma.SessionGoaMemoryWhereInput[];
    OR?: Prisma.SessionGoaMemoryWhereInput[];
    NOT?: Prisma.SessionGoaMemoryWhereInput | Prisma.SessionGoaMemoryWhereInput[];
    sessionId?: Prisma.StringFilter<"SessionGoaMemory"> | string;
    payload?: Prisma.JsonFilter<"SessionGoaMemory">;
    createdAt?: Prisma.DateTimeFilter<"SessionGoaMemory"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SessionGoaMemory"> | Date | string;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
};
export type SessionGoaMemoryOrderByWithRelationInput = {
    sessionId?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    session?: Prisma.SessionOrderByWithRelationInput;
};
export type SessionGoaMemoryWhereUniqueInput = Prisma.AtLeast<{
    sessionId?: string;
    AND?: Prisma.SessionGoaMemoryWhereInput | Prisma.SessionGoaMemoryWhereInput[];
    OR?: Prisma.SessionGoaMemoryWhereInput[];
    NOT?: Prisma.SessionGoaMemoryWhereInput | Prisma.SessionGoaMemoryWhereInput[];
    payload?: Prisma.JsonFilter<"SessionGoaMemory">;
    createdAt?: Prisma.DateTimeFilter<"SessionGoaMemory"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SessionGoaMemory"> | Date | string;
    session?: Prisma.XOR<Prisma.SessionScalarRelationFilter, Prisma.SessionWhereInput>;
}, "sessionId">;
export type SessionGoaMemoryOrderByWithAggregationInput = {
    sessionId?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.SessionGoaMemoryCountOrderByAggregateInput;
    _max?: Prisma.SessionGoaMemoryMaxOrderByAggregateInput;
    _min?: Prisma.SessionGoaMemoryMinOrderByAggregateInput;
};
export type SessionGoaMemoryScalarWhereWithAggregatesInput = {
    AND?: Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput | Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput[];
    OR?: Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput | Prisma.SessionGoaMemoryScalarWhereWithAggregatesInput[];
    sessionId?: Prisma.StringWithAggregatesFilter<"SessionGoaMemory"> | string;
    payload?: Prisma.JsonWithAggregatesFilter<"SessionGoaMemory">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SessionGoaMemory"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"SessionGoaMemory"> | Date | string;
};
export type SessionGoaMemoryCreateInput = {
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    session: Prisma.SessionCreateNestedOneWithoutSessionGoaMemoryInput;
};
export type SessionGoaMemoryUncheckedCreateInput = {
    sessionId: string;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SessionGoaMemoryUpdateInput = {
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    session?: Prisma.SessionUpdateOneRequiredWithoutSessionGoaMemoryNestedInput;
};
export type SessionGoaMemoryUncheckedUpdateInput = {
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionGoaMemoryCreateManyInput = {
    sessionId: string;
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SessionGoaMemoryUpdateManyMutationInput = {
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionGoaMemoryUncheckedUpdateManyInput = {
    sessionId?: Prisma.StringFieldUpdateOperationsInput | string;
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionGoaMemoryNullableScalarRelationFilter = {
    is?: Prisma.SessionGoaMemoryWhereInput | null;
    isNot?: Prisma.SessionGoaMemoryWhereInput | null;
};
export type SessionGoaMemoryCountOrderByAggregateInput = {
    sessionId?: Prisma.SortOrder;
    payload?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SessionGoaMemoryMaxOrderByAggregateInput = {
    sessionId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SessionGoaMemoryMinOrderByAggregateInput = {
    sessionId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SessionGoaMemoryCreateNestedOneWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
    connectOrCreate?: Prisma.SessionGoaMemoryCreateOrConnectWithoutSessionInput;
    connect?: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryUncheckedCreateNestedOneWithoutSessionInput = {
    create?: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
    connectOrCreate?: Prisma.SessionGoaMemoryCreateOrConnectWithoutSessionInput;
    connect?: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryUpdateOneWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
    connectOrCreate?: Prisma.SessionGoaMemoryCreateOrConnectWithoutSessionInput;
    upsert?: Prisma.SessionGoaMemoryUpsertWithoutSessionInput;
    disconnect?: Prisma.SessionGoaMemoryWhereInput | boolean;
    delete?: Prisma.SessionGoaMemoryWhereInput | boolean;
    connect?: Prisma.SessionGoaMemoryWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionGoaMemoryUpdateToOneWithWhereWithoutSessionInput, Prisma.SessionGoaMemoryUpdateWithoutSessionInput>, Prisma.SessionGoaMemoryUncheckedUpdateWithoutSessionInput>;
};
export type SessionGoaMemoryUncheckedUpdateOneWithoutSessionNestedInput = {
    create?: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
    connectOrCreate?: Prisma.SessionGoaMemoryCreateOrConnectWithoutSessionInput;
    upsert?: Prisma.SessionGoaMemoryUpsertWithoutSessionInput;
    disconnect?: Prisma.SessionGoaMemoryWhereInput | boolean;
    delete?: Prisma.SessionGoaMemoryWhereInput | boolean;
    connect?: Prisma.SessionGoaMemoryWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SessionGoaMemoryUpdateToOneWithWhereWithoutSessionInput, Prisma.SessionGoaMemoryUpdateWithoutSessionInput>, Prisma.SessionGoaMemoryUncheckedUpdateWithoutSessionInput>;
};
export type SessionGoaMemoryCreateWithoutSessionInput = {
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SessionGoaMemoryUncheckedCreateWithoutSessionInput = {
    payload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SessionGoaMemoryCreateOrConnectWithoutSessionInput = {
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
};
export type SessionGoaMemoryUpsertWithoutSessionInput = {
    update: Prisma.XOR<Prisma.SessionGoaMemoryUpdateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedUpdateWithoutSessionInput>;
    create: Prisma.XOR<Prisma.SessionGoaMemoryCreateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedCreateWithoutSessionInput>;
    where?: Prisma.SessionGoaMemoryWhereInput;
};
export type SessionGoaMemoryUpdateToOneWithWhereWithoutSessionInput = {
    where?: Prisma.SessionGoaMemoryWhereInput;
    data: Prisma.XOR<Prisma.SessionGoaMemoryUpdateWithoutSessionInput, Prisma.SessionGoaMemoryUncheckedUpdateWithoutSessionInput>;
};
export type SessionGoaMemoryUpdateWithoutSessionInput = {
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionGoaMemoryUncheckedUpdateWithoutSessionInput = {
    payload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SessionGoaMemorySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    sessionId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["sessionGoaMemory"]>;
export type SessionGoaMemorySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    sessionId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["sessionGoaMemory"]>;
export type SessionGoaMemorySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    sessionId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["sessionGoaMemory"]>;
export type SessionGoaMemorySelectScalar = {
    sessionId?: boolean;
    payload?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type SessionGoaMemoryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"sessionId" | "payload" | "createdAt" | "updatedAt", ExtArgs["result"]["sessionGoaMemory"]>;
export type SessionGoaMemoryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
};
export type SessionGoaMemoryIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
};
export type SessionGoaMemoryIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    session?: boolean | Prisma.SessionDefaultArgs<ExtArgs>;
};
export type $SessionGoaMemoryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SessionGoaMemory";
    objects: {
        session: Prisma.$SessionPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        sessionId: string;
        payload: runtime.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["sessionGoaMemory"]>;
    composites: {};
};
export type SessionGoaMemoryGetPayload<S extends boolean | null | undefined | SessionGoaMemoryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload, S>;
export type SessionGoaMemoryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SessionGoaMemoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SessionGoaMemoryCountAggregateInputType | true;
};
export interface SessionGoaMemoryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SessionGoaMemory'];
        meta: {
            name: 'SessionGoaMemory';
        };
    };
    findUnique<T extends SessionGoaMemoryFindUniqueArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SessionGoaMemoryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SessionGoaMemoryFindFirstArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryFindFirstArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SessionGoaMemoryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SessionGoaMemoryFindManyArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SessionGoaMemoryCreateArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryCreateArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SessionGoaMemoryCreateManyArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SessionGoaMemoryCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SessionGoaMemoryDeleteArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryDeleteArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SessionGoaMemoryUpdateArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryUpdateArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SessionGoaMemoryDeleteManyArgs>(args?: Prisma.SelectSubset<T, SessionGoaMemoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SessionGoaMemoryUpdateManyArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SessionGoaMemoryUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SessionGoaMemoryUpsertArgs>(args: Prisma.SelectSubset<T, SessionGoaMemoryUpsertArgs<ExtArgs>>): Prisma.Prisma__SessionGoaMemoryClient<runtime.Types.Result.GetResult<Prisma.$SessionGoaMemoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SessionGoaMemoryCountArgs>(args?: Prisma.Subset<T, SessionGoaMemoryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SessionGoaMemoryCountAggregateOutputType> : number>;
    aggregate<T extends SessionGoaMemoryAggregateArgs>(args: Prisma.Subset<T, SessionGoaMemoryAggregateArgs>): Prisma.PrismaPromise<GetSessionGoaMemoryAggregateType<T>>;
    groupBy<T extends SessionGoaMemoryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SessionGoaMemoryGroupByArgs['orderBy'];
    } : {
        orderBy?: SessionGoaMemoryGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SessionGoaMemoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGoaMemoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SessionGoaMemoryFieldRefs;
}
export interface Prisma__SessionGoaMemoryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    session<T extends Prisma.SessionDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SessionDefaultArgs<ExtArgs>>): Prisma.Prisma__SessionClient<runtime.Types.Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SessionGoaMemoryFieldRefs {
    readonly sessionId: Prisma.FieldRef<"SessionGoaMemory", 'String'>;
    readonly payload: Prisma.FieldRef<"SessionGoaMemory", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"SessionGoaMemory", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"SessionGoaMemory", 'DateTime'>;
}
export type SessionGoaMemoryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where?: Prisma.SessionGoaMemoryWhereInput;
    orderBy?: Prisma.SessionGoaMemoryOrderByWithRelationInput | Prisma.SessionGoaMemoryOrderByWithRelationInput[];
    cursor?: Prisma.SessionGoaMemoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SessionGoaMemoryScalarFieldEnum | Prisma.SessionGoaMemoryScalarFieldEnum[];
};
export type SessionGoaMemoryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where?: Prisma.SessionGoaMemoryWhereInput;
    orderBy?: Prisma.SessionGoaMemoryOrderByWithRelationInput | Prisma.SessionGoaMemoryOrderByWithRelationInput[];
    cursor?: Prisma.SessionGoaMemoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SessionGoaMemoryScalarFieldEnum | Prisma.SessionGoaMemoryScalarFieldEnum[];
};
export type SessionGoaMemoryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where?: Prisma.SessionGoaMemoryWhereInput;
    orderBy?: Prisma.SessionGoaMemoryOrderByWithRelationInput | Prisma.SessionGoaMemoryOrderByWithRelationInput[];
    cursor?: Prisma.SessionGoaMemoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SessionGoaMemoryScalarFieldEnum | Prisma.SessionGoaMemoryScalarFieldEnum[];
};
export type SessionGoaMemoryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionGoaMemoryCreateInput, Prisma.SessionGoaMemoryUncheckedCreateInput>;
};
export type SessionGoaMemoryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SessionGoaMemoryCreateManyInput | Prisma.SessionGoaMemoryCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SessionGoaMemoryCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    data: Prisma.SessionGoaMemoryCreateManyInput | Prisma.SessionGoaMemoryCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.SessionGoaMemoryIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type SessionGoaMemoryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionGoaMemoryUpdateInput, Prisma.SessionGoaMemoryUncheckedUpdateInput>;
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SessionGoaMemoryUpdateManyMutationInput, Prisma.SessionGoaMemoryUncheckedUpdateManyInput>;
    where?: Prisma.SessionGoaMemoryWhereInput;
    limit?: number;
};
export type SessionGoaMemoryUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SessionGoaMemoryUpdateManyMutationInput, Prisma.SessionGoaMemoryUncheckedUpdateManyInput>;
    where?: Prisma.SessionGoaMemoryWhereInput;
    limit?: number;
    include?: Prisma.SessionGoaMemoryIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type SessionGoaMemoryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.SessionGoaMemoryCreateInput, Prisma.SessionGoaMemoryUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SessionGoaMemoryUpdateInput, Prisma.SessionGoaMemoryUncheckedUpdateInput>;
};
export type SessionGoaMemoryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
    where: Prisma.SessionGoaMemoryWhereUniqueInput;
};
export type SessionGoaMemoryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SessionGoaMemoryWhereInput;
    limit?: number;
};
export type SessionGoaMemoryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SessionGoaMemorySelect<ExtArgs> | null;
    omit?: Prisma.SessionGoaMemoryOmit<ExtArgs> | null;
    include?: Prisma.SessionGoaMemoryInclude<ExtArgs> | null;
};
