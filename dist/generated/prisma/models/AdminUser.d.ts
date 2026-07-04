import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
export type AdminUserModel = runtime.Types.Result.DefaultSelection<Prisma.$AdminUserPayload>;
export type AggregateAdminUser = {
    _count: AdminUserCountAggregateOutputType | null;
    _avg: AdminUserAvgAggregateOutputType | null;
    _sum: AdminUserSumAggregateOutputType | null;
    _min: AdminUserMinAggregateOutputType | null;
    _max: AdminUserMaxAggregateOutputType | null;
};
export type AdminUserAvgAggregateOutputType = {
    id: number | null;
};
export type AdminUserSumAggregateOutputType = {
    id: number | null;
};
export type AdminUserMinAggregateOutputType = {
    id: number | null;
    email: string | null;
    password: string | null;
    username: string | null;
    role: $Enums.AdminRole | null;
    isActive: boolean | null;
    mustChangePassword: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AdminUserMaxAggregateOutputType = {
    id: number | null;
    email: string | null;
    password: string | null;
    username: string | null;
    role: $Enums.AdminRole | null;
    isActive: boolean | null;
    mustChangePassword: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AdminUserCountAggregateOutputType = {
    id: number;
    email: number;
    password: number;
    username: number;
    role: number;
    isActive: number;
    mustChangePassword: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type AdminUserAvgAggregateInputType = {
    id?: true;
};
export type AdminUserSumAggregateInputType = {
    id?: true;
};
export type AdminUserMinAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    username?: true;
    role?: true;
    isActive?: true;
    mustChangePassword?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AdminUserMaxAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    username?: true;
    role?: true;
    isActive?: true;
    mustChangePassword?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AdminUserCountAggregateInputType = {
    id?: true;
    email?: true;
    password?: true;
    username?: true;
    role?: true;
    isActive?: true;
    mustChangePassword?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type AdminUserAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AdminUserWhereInput;
    orderBy?: Prisma.AdminUserOrderByWithRelationInput | Prisma.AdminUserOrderByWithRelationInput[];
    cursor?: Prisma.AdminUserWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AdminUserCountAggregateInputType;
    _avg?: AdminUserAvgAggregateInputType;
    _sum?: AdminUserSumAggregateInputType;
    _min?: AdminUserMinAggregateInputType;
    _max?: AdminUserMaxAggregateInputType;
};
export type GetAdminUserAggregateType<T extends AdminUserAggregateArgs> = {
    [P in keyof T & keyof AggregateAdminUser]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAdminUser[P]> : Prisma.GetScalarType<T[P], AggregateAdminUser[P]>;
};
export type AdminUserGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AdminUserWhereInput;
    orderBy?: Prisma.AdminUserOrderByWithAggregationInput | Prisma.AdminUserOrderByWithAggregationInput[];
    by: Prisma.AdminUserScalarFieldEnum[] | Prisma.AdminUserScalarFieldEnum;
    having?: Prisma.AdminUserScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AdminUserCountAggregateInputType | true;
    _avg?: AdminUserAvgAggregateInputType;
    _sum?: AdminUserSumAggregateInputType;
    _min?: AdminUserMinAggregateInputType;
    _max?: AdminUserMaxAggregateInputType;
};
export type AdminUserGroupByOutputType = {
    id: number;
    email: string;
    password: string;
    username: string;
    role: $Enums.AdminRole;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: AdminUserCountAggregateOutputType | null;
    _avg: AdminUserAvgAggregateOutputType | null;
    _sum: AdminUserSumAggregateOutputType | null;
    _min: AdminUserMinAggregateOutputType | null;
    _max: AdminUserMaxAggregateOutputType | null;
};
export type GetAdminUserGroupByPayload<T extends AdminUserGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AdminUserGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AdminUserGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AdminUserGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AdminUserGroupByOutputType[P]>;
}>>;
export type AdminUserWhereInput = {
    AND?: Prisma.AdminUserWhereInput | Prisma.AdminUserWhereInput[];
    OR?: Prisma.AdminUserWhereInput[];
    NOT?: Prisma.AdminUserWhereInput | Prisma.AdminUserWhereInput[];
    id?: Prisma.IntFilter<"AdminUser"> | number;
    email?: Prisma.StringFilter<"AdminUser"> | string;
    password?: Prisma.StringFilter<"AdminUser"> | string;
    username?: Prisma.StringFilter<"AdminUser"> | string;
    role?: Prisma.EnumAdminRoleFilter<"AdminUser"> | $Enums.AdminRole;
    isActive?: Prisma.BoolFilter<"AdminUser"> | boolean;
    mustChangePassword?: Prisma.BoolFilter<"AdminUser"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"AdminUser"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"AdminUser"> | Date | string;
};
export type AdminUserOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AdminUserWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    email?: string;
    AND?: Prisma.AdminUserWhereInput | Prisma.AdminUserWhereInput[];
    OR?: Prisma.AdminUserWhereInput[];
    NOT?: Prisma.AdminUserWhereInput | Prisma.AdminUserWhereInput[];
    password?: Prisma.StringFilter<"AdminUser"> | string;
    username?: Prisma.StringFilter<"AdminUser"> | string;
    role?: Prisma.EnumAdminRoleFilter<"AdminUser"> | $Enums.AdminRole;
    isActive?: Prisma.BoolFilter<"AdminUser"> | boolean;
    mustChangePassword?: Prisma.BoolFilter<"AdminUser"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"AdminUser"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"AdminUser"> | Date | string;
}, "id" | "email">;
export type AdminUserOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.AdminUserCountOrderByAggregateInput;
    _avg?: Prisma.AdminUserAvgOrderByAggregateInput;
    _max?: Prisma.AdminUserMaxOrderByAggregateInput;
    _min?: Prisma.AdminUserMinOrderByAggregateInput;
    _sum?: Prisma.AdminUserSumOrderByAggregateInput;
};
export type AdminUserScalarWhereWithAggregatesInput = {
    AND?: Prisma.AdminUserScalarWhereWithAggregatesInput | Prisma.AdminUserScalarWhereWithAggregatesInput[];
    OR?: Prisma.AdminUserScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AdminUserScalarWhereWithAggregatesInput | Prisma.AdminUserScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"AdminUser"> | number;
    email?: Prisma.StringWithAggregatesFilter<"AdminUser"> | string;
    password?: Prisma.StringWithAggregatesFilter<"AdminUser"> | string;
    username?: Prisma.StringWithAggregatesFilter<"AdminUser"> | string;
    role?: Prisma.EnumAdminRoleWithAggregatesFilter<"AdminUser"> | $Enums.AdminRole;
    isActive?: Prisma.BoolWithAggregatesFilter<"AdminUser"> | boolean;
    mustChangePassword?: Prisma.BoolWithAggregatesFilter<"AdminUser"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"AdminUser"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"AdminUser"> | Date | string;
};
export type AdminUserCreateInput = {
    email: string;
    password: string;
    username: string;
    role: $Enums.AdminRole;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AdminUserUncheckedCreateInput = {
    id?: number;
    email: string;
    password: string;
    username: string;
    role: $Enums.AdminRole;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AdminUserUpdateInput = {
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumAdminRoleFieldUpdateOperationsInput | $Enums.AdminRole;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdminUserUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumAdminRoleFieldUpdateOperationsInput | $Enums.AdminRole;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdminUserCreateManyInput = {
    id?: number;
    email: string;
    password: string;
    username: string;
    role: $Enums.AdminRole;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AdminUserUpdateManyMutationInput = {
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumAdminRoleFieldUpdateOperationsInput | $Enums.AdminRole;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdminUserUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    password?: Prisma.StringFieldUpdateOperationsInput | string;
    username?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumAdminRoleFieldUpdateOperationsInput | $Enums.AdminRole;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    mustChangePassword?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdminUserCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AdminUserAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type AdminUserMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AdminUserMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    password?: Prisma.SortOrder;
    username?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    mustChangePassword?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AdminUserSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type EnumAdminRoleFieldUpdateOperationsInput = {
    set?: $Enums.AdminRole;
};
export type AdminUserSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    role?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["adminUser"]>;
export type AdminUserSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    role?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["adminUser"]>;
export type AdminUserSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    role?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["adminUser"]>;
export type AdminUserSelectScalar = {
    id?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
    role?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type AdminUserOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "email" | "password" | "username" | "role" | "isActive" | "mustChangePassword" | "createdAt" | "updatedAt", ExtArgs["result"]["adminUser"]>;
export type $AdminUserPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AdminUser";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        email: string;
        password: string;
        username: string;
        role: $Enums.AdminRole;
        isActive: boolean;
        mustChangePassword: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["adminUser"]>;
    composites: {};
};
export type AdminUserGetPayload<S extends boolean | null | undefined | AdminUserDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AdminUserPayload, S>;
export type AdminUserCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AdminUserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AdminUserCountAggregateInputType | true;
};
export interface AdminUserDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AdminUser'];
        meta: {
            name: 'AdminUser';
        };
    };
    findUnique<T extends AdminUserFindUniqueArgs>(args: Prisma.SelectSubset<T, AdminUserFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AdminUserFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AdminUserFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AdminUserFindFirstArgs>(args?: Prisma.SelectSubset<T, AdminUserFindFirstArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AdminUserFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AdminUserFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AdminUserFindManyArgs>(args?: Prisma.SelectSubset<T, AdminUserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AdminUserCreateArgs>(args: Prisma.SelectSubset<T, AdminUserCreateArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AdminUserCreateManyArgs>(args?: Prisma.SelectSubset<T, AdminUserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AdminUserCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AdminUserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AdminUserDeleteArgs>(args: Prisma.SelectSubset<T, AdminUserDeleteArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AdminUserUpdateArgs>(args: Prisma.SelectSubset<T, AdminUserUpdateArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AdminUserDeleteManyArgs>(args?: Prisma.SelectSubset<T, AdminUserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AdminUserUpdateManyArgs>(args: Prisma.SelectSubset<T, AdminUserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AdminUserUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AdminUserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AdminUserUpsertArgs>(args: Prisma.SelectSubset<T, AdminUserUpsertArgs<ExtArgs>>): Prisma.Prisma__AdminUserClient<runtime.Types.Result.GetResult<Prisma.$AdminUserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AdminUserCountArgs>(args?: Prisma.Subset<T, AdminUserCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AdminUserCountAggregateOutputType> : number>;
    aggregate<T extends AdminUserAggregateArgs>(args: Prisma.Subset<T, AdminUserAggregateArgs>): Prisma.PrismaPromise<GetAdminUserAggregateType<T>>;
    groupBy<T extends AdminUserGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AdminUserGroupByArgs['orderBy'];
    } : {
        orderBy?: AdminUserGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AdminUserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AdminUserFieldRefs;
}
export interface Prisma__AdminUserClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AdminUserFieldRefs {
    readonly id: Prisma.FieldRef<"AdminUser", 'Int'>;
    readonly email: Prisma.FieldRef<"AdminUser", 'String'>;
    readonly password: Prisma.FieldRef<"AdminUser", 'String'>;
    readonly username: Prisma.FieldRef<"AdminUser", 'String'>;
    readonly role: Prisma.FieldRef<"AdminUser", 'AdminRole'>;
    readonly isActive: Prisma.FieldRef<"AdminUser", 'Boolean'>;
    readonly mustChangePassword: Prisma.FieldRef<"AdminUser", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"AdminUser", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"AdminUser", 'DateTime'>;
}
export type AdminUserFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where: Prisma.AdminUserWhereUniqueInput;
};
export type AdminUserFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where: Prisma.AdminUserWhereUniqueInput;
};
export type AdminUserFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where?: Prisma.AdminUserWhereInput;
    orderBy?: Prisma.AdminUserOrderByWithRelationInput | Prisma.AdminUserOrderByWithRelationInput[];
    cursor?: Prisma.AdminUserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AdminUserScalarFieldEnum | Prisma.AdminUserScalarFieldEnum[];
};
export type AdminUserFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where?: Prisma.AdminUserWhereInput;
    orderBy?: Prisma.AdminUserOrderByWithRelationInput | Prisma.AdminUserOrderByWithRelationInput[];
    cursor?: Prisma.AdminUserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AdminUserScalarFieldEnum | Prisma.AdminUserScalarFieldEnum[];
};
export type AdminUserFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where?: Prisma.AdminUserWhereInput;
    orderBy?: Prisma.AdminUserOrderByWithRelationInput | Prisma.AdminUserOrderByWithRelationInput[];
    cursor?: Prisma.AdminUserWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AdminUserScalarFieldEnum | Prisma.AdminUserScalarFieldEnum[];
};
export type AdminUserCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AdminUserCreateInput, Prisma.AdminUserUncheckedCreateInput>;
};
export type AdminUserCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AdminUserCreateManyInput | Prisma.AdminUserCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AdminUserCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    data: Prisma.AdminUserCreateManyInput | Prisma.AdminUserCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AdminUserUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AdminUserUpdateInput, Prisma.AdminUserUncheckedUpdateInput>;
    where: Prisma.AdminUserWhereUniqueInput;
};
export type AdminUserUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AdminUserUpdateManyMutationInput, Prisma.AdminUserUncheckedUpdateManyInput>;
    where?: Prisma.AdminUserWhereInput;
    limit?: number;
};
export type AdminUserUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AdminUserUpdateManyMutationInput, Prisma.AdminUserUncheckedUpdateManyInput>;
    where?: Prisma.AdminUserWhereInput;
    limit?: number;
};
export type AdminUserUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where: Prisma.AdminUserWhereUniqueInput;
    create: Prisma.XOR<Prisma.AdminUserCreateInput, Prisma.AdminUserUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AdminUserUpdateInput, Prisma.AdminUserUncheckedUpdateInput>;
};
export type AdminUserDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
    where: Prisma.AdminUserWhereUniqueInput;
};
export type AdminUserDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AdminUserWhereInput;
    limit?: number;
};
export type AdminUserDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AdminUserSelect<ExtArgs> | null;
    omit?: Prisma.AdminUserOmit<ExtArgs> | null;
};
