import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models";
import { type PrismaClient } from "./class";
export type * from '../models';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
export declare const prismaVersion: PrismaVersion;
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
export declare const NullTypes: {
    DbNull: new (secret: never) => typeof runtime.DbNull;
    JsonNull: new (secret: never) => typeof runtime.JsonNull;
    AnyNull: new (secret: never) => typeof runtime.AnyNull;
};
export declare const DbNull: runtime.DbNullClass;
export declare const JsonNull: runtime.JsonNullClass;
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly User: "User";
    readonly Role: "Role";
    readonly AdminUser: "AdminUser";
    readonly AppClient: "AppClient";
    readonly LlmModelConfig: "LlmModelConfig";
    readonly PageAgentLlmProxyAudit: "PageAgentLlmProxyAudit";
    readonly IntentRecallConfig: "IntentRecallConfig";
    readonly UserLlmModelConfig: "UserLlmModelConfig";
    readonly Session: "Session";
    readonly SessionGoaMemory: "SessionGoaMemory";
    readonly Message: "Message";
    readonly MessageFeedback: "MessageFeedback";
    readonly ToolCategory: "ToolCategory";
    readonly Tool: "Tool";
    readonly Integration: "Integration";
    readonly UserIntegration: "UserIntegration";
    readonly Skill: "Skill";
    readonly AgentSkill: "AgentSkill";
    readonly RoleSkill: "RoleSkill";
    readonly SkillTool: "SkillTool";
    readonly UserApp: "UserApp";
    readonly RoleTool: "RoleTool";
    readonly Agent: "Agent";
    readonly PromptTemplate: "PromptTemplate";
    readonly MessageTurn: "MessageTurn";
    readonly AgentRun: "AgentRun";
    readonly AgentTool: "AgentTool";
    readonly HostPage: "HostPage";
    readonly HostTool: "HostTool";
    readonly AgentHostTool: "AgentHostTool";
    readonly SkillHostTool: "SkillHostTool";
    readonly RoleHostTool: "RoleHostTool";
    readonly PageAction: "PageAction";
    readonly PageActionRun: "PageActionRun";
    readonly ApprovalRequest: "ApprovalRequest";
    readonly Workflow: "Workflow";
    readonly WorkflowRevision: "WorkflowRevision";
    readonly WorkflowTool: "WorkflowTool";
    readonly WorkflowHostTool: "WorkflowHostTool";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "user" | "role" | "adminUser" | "appClient" | "llmModelConfig" | "pageAgentLlmProxyAudit" | "intentRecallConfig" | "userLlmModelConfig" | "session" | "sessionGoaMemory" | "message" | "messageFeedback" | "toolCategory" | "tool" | "integration" | "userIntegration" | "skill" | "agentSkill" | "roleSkill" | "skillTool" | "userApp" | "roleTool" | "agent" | "promptTemplate" | "messageTurn" | "agentRun" | "agentTool" | "hostPage" | "hostTool" | "agentHostTool" | "skillHostTool" | "roleHostTool" | "pageAction" | "pageActionRun" | "approvalRequest" | "workflow" | "workflowRevision" | "workflowTool" | "workflowHostTool";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        Role: {
            payload: Prisma.$RolePayload<ExtArgs>;
            fields: Prisma.RoleFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findFirst: {
                    args: Prisma.RoleFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findMany: {
                    args: Prisma.RoleFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                create: {
                    args: Prisma.RoleCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                createMany: {
                    args: Prisma.RoleCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RoleCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                delete: {
                    args: Prisma.RoleDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                update: {
                    args: Prisma.RoleUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                deleteMany: {
                    args: Prisma.RoleDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RoleUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                upsert: {
                    args: Prisma.RoleUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                aggregate: {
                    args: Prisma.RoleAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRole>;
                };
                groupBy: {
                    args: Prisma.RoleGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RoleCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleCountAggregateOutputType> | number;
                };
            };
        };
        AdminUser: {
            payload: Prisma.$AdminUserPayload<ExtArgs>;
            fields: Prisma.AdminUserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AdminUserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AdminUserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                findFirst: {
                    args: Prisma.AdminUserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AdminUserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                findMany: {
                    args: Prisma.AdminUserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>[];
                };
                create: {
                    args: Prisma.AdminUserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                createMany: {
                    args: Prisma.AdminUserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AdminUserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>[];
                };
                delete: {
                    args: Prisma.AdminUserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                update: {
                    args: Prisma.AdminUserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                deleteMany: {
                    args: Prisma.AdminUserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AdminUserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AdminUserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>[];
                };
                upsert: {
                    args: Prisma.AdminUserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdminUserPayload>;
                };
                aggregate: {
                    args: Prisma.AdminUserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAdminUser>;
                };
                groupBy: {
                    args: Prisma.AdminUserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AdminUserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AdminUserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AdminUserCountAggregateOutputType> | number;
                };
            };
        };
        AppClient: {
            payload: Prisma.$AppClientPayload<ExtArgs>;
            fields: Prisma.AppClientFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AppClientFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AppClientFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                findFirst: {
                    args: Prisma.AppClientFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AppClientFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                findMany: {
                    args: Prisma.AppClientFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>[];
                };
                create: {
                    args: Prisma.AppClientCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                createMany: {
                    args: Prisma.AppClientCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AppClientCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>[];
                };
                delete: {
                    args: Prisma.AppClientDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                update: {
                    args: Prisma.AppClientUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                deleteMany: {
                    args: Prisma.AppClientDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AppClientUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AppClientUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>[];
                };
                upsert: {
                    args: Prisma.AppClientUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AppClientPayload>;
                };
                aggregate: {
                    args: Prisma.AppClientAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAppClient>;
                };
                groupBy: {
                    args: Prisma.AppClientGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AppClientGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AppClientCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AppClientCountAggregateOutputType> | number;
                };
            };
        };
        LlmModelConfig: {
            payload: Prisma.$LlmModelConfigPayload<ExtArgs>;
            fields: Prisma.LlmModelConfigFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.LlmModelConfigFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.LlmModelConfigFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                findFirst: {
                    args: Prisma.LlmModelConfigFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.LlmModelConfigFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                findMany: {
                    args: Prisma.LlmModelConfigFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>[];
                };
                create: {
                    args: Prisma.LlmModelConfigCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                createMany: {
                    args: Prisma.LlmModelConfigCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.LlmModelConfigCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>[];
                };
                delete: {
                    args: Prisma.LlmModelConfigDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                update: {
                    args: Prisma.LlmModelConfigUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                deleteMany: {
                    args: Prisma.LlmModelConfigDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.LlmModelConfigUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.LlmModelConfigUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>[];
                };
                upsert: {
                    args: Prisma.LlmModelConfigUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$LlmModelConfigPayload>;
                };
                aggregate: {
                    args: Prisma.LlmModelConfigAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLlmModelConfig>;
                };
                groupBy: {
                    args: Prisma.LlmModelConfigGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.LlmModelConfigGroupByOutputType>[];
                };
                count: {
                    args: Prisma.LlmModelConfigCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.LlmModelConfigCountAggregateOutputType> | number;
                };
            };
        };
        PageAgentLlmProxyAudit: {
            payload: Prisma.$PageAgentLlmProxyAuditPayload<ExtArgs>;
            fields: Prisma.PageAgentLlmProxyAuditFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PageAgentLlmProxyAuditFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PageAgentLlmProxyAuditFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                findFirst: {
                    args: Prisma.PageAgentLlmProxyAuditFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PageAgentLlmProxyAuditFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                findMany: {
                    args: Prisma.PageAgentLlmProxyAuditFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>[];
                };
                create: {
                    args: Prisma.PageAgentLlmProxyAuditCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                createMany: {
                    args: Prisma.PageAgentLlmProxyAuditCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PageAgentLlmProxyAuditCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>[];
                };
                delete: {
                    args: Prisma.PageAgentLlmProxyAuditDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                update: {
                    args: Prisma.PageAgentLlmProxyAuditUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                deleteMany: {
                    args: Prisma.PageAgentLlmProxyAuditDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PageAgentLlmProxyAuditUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PageAgentLlmProxyAuditUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>[];
                };
                upsert: {
                    args: Prisma.PageAgentLlmProxyAuditUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageAgentLlmProxyAuditPayload>;
                };
                aggregate: {
                    args: Prisma.PageAgentLlmProxyAuditAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePageAgentLlmProxyAudit>;
                };
                groupBy: {
                    args: Prisma.PageAgentLlmProxyAuditGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageAgentLlmProxyAuditGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PageAgentLlmProxyAuditCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageAgentLlmProxyAuditCountAggregateOutputType> | number;
                };
            };
        };
        IntentRecallConfig: {
            payload: Prisma.$IntentRecallConfigPayload<ExtArgs>;
            fields: Prisma.IntentRecallConfigFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.IntentRecallConfigFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.IntentRecallConfigFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                findFirst: {
                    args: Prisma.IntentRecallConfigFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.IntentRecallConfigFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                findMany: {
                    args: Prisma.IntentRecallConfigFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>[];
                };
                create: {
                    args: Prisma.IntentRecallConfigCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                createMany: {
                    args: Prisma.IntentRecallConfigCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.IntentRecallConfigCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>[];
                };
                delete: {
                    args: Prisma.IntentRecallConfigDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                update: {
                    args: Prisma.IntentRecallConfigUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                deleteMany: {
                    args: Prisma.IntentRecallConfigDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.IntentRecallConfigUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.IntentRecallConfigUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>[];
                };
                upsert: {
                    args: Prisma.IntentRecallConfigUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntentRecallConfigPayload>;
                };
                aggregate: {
                    args: Prisma.IntentRecallConfigAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateIntentRecallConfig>;
                };
                groupBy: {
                    args: Prisma.IntentRecallConfigGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.IntentRecallConfigGroupByOutputType>[];
                };
                count: {
                    args: Prisma.IntentRecallConfigCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.IntentRecallConfigCountAggregateOutputType> | number;
                };
            };
        };
        UserLlmModelConfig: {
            payload: Prisma.$UserLlmModelConfigPayload<ExtArgs>;
            fields: Prisma.UserLlmModelConfigFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserLlmModelConfigFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserLlmModelConfigFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                findFirst: {
                    args: Prisma.UserLlmModelConfigFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserLlmModelConfigFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                findMany: {
                    args: Prisma.UserLlmModelConfigFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>[];
                };
                create: {
                    args: Prisma.UserLlmModelConfigCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                createMany: {
                    args: Prisma.UserLlmModelConfigCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserLlmModelConfigCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>[];
                };
                delete: {
                    args: Prisma.UserLlmModelConfigDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                update: {
                    args: Prisma.UserLlmModelConfigUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                deleteMany: {
                    args: Prisma.UserLlmModelConfigDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserLlmModelConfigUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserLlmModelConfigUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>[];
                };
                upsert: {
                    args: Prisma.UserLlmModelConfigUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserLlmModelConfigPayload>;
                };
                aggregate: {
                    args: Prisma.UserLlmModelConfigAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUserLlmModelConfig>;
                };
                groupBy: {
                    args: Prisma.UserLlmModelConfigGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserLlmModelConfigGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserLlmModelConfigCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserLlmModelConfigCountAggregateOutputType> | number;
                };
            };
        };
        Session: {
            payload: Prisma.$SessionPayload<ExtArgs>;
            fields: Prisma.SessionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SessionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                findFirst: {
                    args: Prisma.SessionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                findMany: {
                    args: Prisma.SessionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>[];
                };
                create: {
                    args: Prisma.SessionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                createMany: {
                    args: Prisma.SessionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>[];
                };
                delete: {
                    args: Prisma.SessionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                update: {
                    args: Prisma.SessionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                deleteMany: {
                    args: Prisma.SessionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SessionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>[];
                };
                upsert: {
                    args: Prisma.SessionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionPayload>;
                };
                aggregate: {
                    args: Prisma.SessionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSession>;
                };
                groupBy: {
                    args: Prisma.SessionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SessionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SessionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SessionCountAggregateOutputType> | number;
                };
            };
        };
        SessionGoaMemory: {
            payload: Prisma.$SessionGoaMemoryPayload<ExtArgs>;
            fields: Prisma.SessionGoaMemoryFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SessionGoaMemoryFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SessionGoaMemoryFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                findFirst: {
                    args: Prisma.SessionGoaMemoryFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SessionGoaMemoryFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                findMany: {
                    args: Prisma.SessionGoaMemoryFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>[];
                };
                create: {
                    args: Prisma.SessionGoaMemoryCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                createMany: {
                    args: Prisma.SessionGoaMemoryCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SessionGoaMemoryCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>[];
                };
                delete: {
                    args: Prisma.SessionGoaMemoryDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                update: {
                    args: Prisma.SessionGoaMemoryUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                deleteMany: {
                    args: Prisma.SessionGoaMemoryDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SessionGoaMemoryUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SessionGoaMemoryUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>[];
                };
                upsert: {
                    args: Prisma.SessionGoaMemoryUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SessionGoaMemoryPayload>;
                };
                aggregate: {
                    args: Prisma.SessionGoaMemoryAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSessionGoaMemory>;
                };
                groupBy: {
                    args: Prisma.SessionGoaMemoryGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SessionGoaMemoryGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SessionGoaMemoryCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SessionGoaMemoryCountAggregateOutputType> | number;
                };
            };
        };
        Message: {
            payload: Prisma.$MessagePayload<ExtArgs>;
            fields: Prisma.MessageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MessageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                findFirst: {
                    args: Prisma.MessageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                findMany: {
                    args: Prisma.MessageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                create: {
                    args: Prisma.MessageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                createMany: {
                    args: Prisma.MessageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                delete: {
                    args: Prisma.MessageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                update: {
                    args: Prisma.MessageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                deleteMany: {
                    args: Prisma.MessageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MessageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                upsert: {
                    args: Prisma.MessageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                aggregate: {
                    args: Prisma.MessageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMessage>;
                };
                groupBy: {
                    args: Prisma.MessageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MessageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageCountAggregateOutputType> | number;
                };
            };
        };
        MessageFeedback: {
            payload: Prisma.$MessageFeedbackPayload<ExtArgs>;
            fields: Prisma.MessageFeedbackFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MessageFeedbackFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MessageFeedbackFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                findFirst: {
                    args: Prisma.MessageFeedbackFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MessageFeedbackFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                findMany: {
                    args: Prisma.MessageFeedbackFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>[];
                };
                create: {
                    args: Prisma.MessageFeedbackCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                createMany: {
                    args: Prisma.MessageFeedbackCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MessageFeedbackCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>[];
                };
                delete: {
                    args: Prisma.MessageFeedbackDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                update: {
                    args: Prisma.MessageFeedbackUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                deleteMany: {
                    args: Prisma.MessageFeedbackDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MessageFeedbackUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MessageFeedbackUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>[];
                };
                upsert: {
                    args: Prisma.MessageFeedbackUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageFeedbackPayload>;
                };
                aggregate: {
                    args: Prisma.MessageFeedbackAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMessageFeedback>;
                };
                groupBy: {
                    args: Prisma.MessageFeedbackGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageFeedbackGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MessageFeedbackCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageFeedbackCountAggregateOutputType> | number;
                };
            };
        };
        ToolCategory: {
            payload: Prisma.$ToolCategoryPayload<ExtArgs>;
            fields: Prisma.ToolCategoryFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ToolCategoryFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ToolCategoryFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                findFirst: {
                    args: Prisma.ToolCategoryFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ToolCategoryFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                findMany: {
                    args: Prisma.ToolCategoryFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>[];
                };
                create: {
                    args: Prisma.ToolCategoryCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                createMany: {
                    args: Prisma.ToolCategoryCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ToolCategoryCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>[];
                };
                delete: {
                    args: Prisma.ToolCategoryDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                update: {
                    args: Prisma.ToolCategoryUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                deleteMany: {
                    args: Prisma.ToolCategoryDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ToolCategoryUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ToolCategoryUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>[];
                };
                upsert: {
                    args: Prisma.ToolCategoryUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolCategoryPayload>;
                };
                aggregate: {
                    args: Prisma.ToolCategoryAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateToolCategory>;
                };
                groupBy: {
                    args: Prisma.ToolCategoryGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ToolCategoryGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ToolCategoryCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ToolCategoryCountAggregateOutputType> | number;
                };
            };
        };
        Tool: {
            payload: Prisma.$ToolPayload<ExtArgs>;
            fields: Prisma.ToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                findFirst: {
                    args: Prisma.ToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                findMany: {
                    args: Prisma.ToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>[];
                };
                create: {
                    args: Prisma.ToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                createMany: {
                    args: Prisma.ToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>[];
                };
                delete: {
                    args: Prisma.ToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                update: {
                    args: Prisma.ToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                deleteMany: {
                    args: Prisma.ToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>[];
                };
                upsert: {
                    args: Prisma.ToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ToolPayload>;
                };
                aggregate: {
                    args: Prisma.ToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTool>;
                };
                groupBy: {
                    args: Prisma.ToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ToolCountAggregateOutputType> | number;
                };
            };
        };
        Integration: {
            payload: Prisma.$IntegrationPayload<ExtArgs>;
            fields: Prisma.IntegrationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.IntegrationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.IntegrationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                findFirst: {
                    args: Prisma.IntegrationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.IntegrationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                findMany: {
                    args: Prisma.IntegrationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>[];
                };
                create: {
                    args: Prisma.IntegrationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                createMany: {
                    args: Prisma.IntegrationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.IntegrationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>[];
                };
                delete: {
                    args: Prisma.IntegrationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                update: {
                    args: Prisma.IntegrationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                deleteMany: {
                    args: Prisma.IntegrationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.IntegrationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.IntegrationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>[];
                };
                upsert: {
                    args: Prisma.IntegrationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$IntegrationPayload>;
                };
                aggregate: {
                    args: Prisma.IntegrationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateIntegration>;
                };
                groupBy: {
                    args: Prisma.IntegrationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.IntegrationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.IntegrationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.IntegrationCountAggregateOutputType> | number;
                };
            };
        };
        UserIntegration: {
            payload: Prisma.$UserIntegrationPayload<ExtArgs>;
            fields: Prisma.UserIntegrationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserIntegrationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserIntegrationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                findFirst: {
                    args: Prisma.UserIntegrationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserIntegrationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                findMany: {
                    args: Prisma.UserIntegrationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>[];
                };
                create: {
                    args: Prisma.UserIntegrationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                createMany: {
                    args: Prisma.UserIntegrationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserIntegrationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>[];
                };
                delete: {
                    args: Prisma.UserIntegrationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                update: {
                    args: Prisma.UserIntegrationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                deleteMany: {
                    args: Prisma.UserIntegrationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserIntegrationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserIntegrationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>[];
                };
                upsert: {
                    args: Prisma.UserIntegrationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserIntegrationPayload>;
                };
                aggregate: {
                    args: Prisma.UserIntegrationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUserIntegration>;
                };
                groupBy: {
                    args: Prisma.UserIntegrationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserIntegrationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserIntegrationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserIntegrationCountAggregateOutputType> | number;
                };
            };
        };
        Skill: {
            payload: Prisma.$SkillPayload<ExtArgs>;
            fields: Prisma.SkillFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SkillFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SkillFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                findFirst: {
                    args: Prisma.SkillFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SkillFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                findMany: {
                    args: Prisma.SkillFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>[];
                };
                create: {
                    args: Prisma.SkillCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                createMany: {
                    args: Prisma.SkillCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SkillCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>[];
                };
                delete: {
                    args: Prisma.SkillDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                update: {
                    args: Prisma.SkillUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                deleteMany: {
                    args: Prisma.SkillDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SkillUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SkillUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>[];
                };
                upsert: {
                    args: Prisma.SkillUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillPayload>;
                };
                aggregate: {
                    args: Prisma.SkillAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSkill>;
                };
                groupBy: {
                    args: Prisma.SkillGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SkillCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillCountAggregateOutputType> | number;
                };
            };
        };
        AgentSkill: {
            payload: Prisma.$AgentSkillPayload<ExtArgs>;
            fields: Prisma.AgentSkillFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AgentSkillFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AgentSkillFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                findFirst: {
                    args: Prisma.AgentSkillFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AgentSkillFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                findMany: {
                    args: Prisma.AgentSkillFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>[];
                };
                create: {
                    args: Prisma.AgentSkillCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                createMany: {
                    args: Prisma.AgentSkillCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AgentSkillCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>[];
                };
                delete: {
                    args: Prisma.AgentSkillDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                update: {
                    args: Prisma.AgentSkillUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                deleteMany: {
                    args: Prisma.AgentSkillDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AgentSkillUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AgentSkillUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>[];
                };
                upsert: {
                    args: Prisma.AgentSkillUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentSkillPayload>;
                };
                aggregate: {
                    args: Prisma.AgentSkillAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAgentSkill>;
                };
                groupBy: {
                    args: Prisma.AgentSkillGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentSkillGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AgentSkillCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentSkillCountAggregateOutputType> | number;
                };
            };
        };
        RoleSkill: {
            payload: Prisma.$RoleSkillPayload<ExtArgs>;
            fields: Prisma.RoleSkillFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleSkillFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleSkillFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                findFirst: {
                    args: Prisma.RoleSkillFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleSkillFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                findMany: {
                    args: Prisma.RoleSkillFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>[];
                };
                create: {
                    args: Prisma.RoleSkillCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                createMany: {
                    args: Prisma.RoleSkillCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RoleSkillCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>[];
                };
                delete: {
                    args: Prisma.RoleSkillDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                update: {
                    args: Prisma.RoleSkillUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                deleteMany: {
                    args: Prisma.RoleSkillDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleSkillUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RoleSkillUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>[];
                };
                upsert: {
                    args: Prisma.RoleSkillUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleSkillPayload>;
                };
                aggregate: {
                    args: Prisma.RoleSkillAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRoleSkill>;
                };
                groupBy: {
                    args: Prisma.RoleSkillGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleSkillGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RoleSkillCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleSkillCountAggregateOutputType> | number;
                };
            };
        };
        SkillTool: {
            payload: Prisma.$SkillToolPayload<ExtArgs>;
            fields: Prisma.SkillToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SkillToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SkillToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                findFirst: {
                    args: Prisma.SkillToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SkillToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                findMany: {
                    args: Prisma.SkillToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>[];
                };
                create: {
                    args: Prisma.SkillToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                createMany: {
                    args: Prisma.SkillToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SkillToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>[];
                };
                delete: {
                    args: Prisma.SkillToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                update: {
                    args: Prisma.SkillToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                deleteMany: {
                    args: Prisma.SkillToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SkillToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SkillToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>[];
                };
                upsert: {
                    args: Prisma.SkillToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillToolPayload>;
                };
                aggregate: {
                    args: Prisma.SkillToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSkillTool>;
                };
                groupBy: {
                    args: Prisma.SkillToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SkillToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillToolCountAggregateOutputType> | number;
                };
            };
        };
        UserApp: {
            payload: Prisma.$UserAppPayload<ExtArgs>;
            fields: Prisma.UserAppFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserAppFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserAppFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                findFirst: {
                    args: Prisma.UserAppFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserAppFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                findMany: {
                    args: Prisma.UserAppFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>[];
                };
                create: {
                    args: Prisma.UserAppCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                createMany: {
                    args: Prisma.UserAppCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserAppCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>[];
                };
                delete: {
                    args: Prisma.UserAppDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                update: {
                    args: Prisma.UserAppUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                deleteMany: {
                    args: Prisma.UserAppDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserAppUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserAppUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>[];
                };
                upsert: {
                    args: Prisma.UserAppUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserAppPayload>;
                };
                aggregate: {
                    args: Prisma.UserAppAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUserApp>;
                };
                groupBy: {
                    args: Prisma.UserAppGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserAppGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserAppCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserAppCountAggregateOutputType> | number;
                };
            };
        };
        RoleTool: {
            payload: Prisma.$RoleToolPayload<ExtArgs>;
            fields: Prisma.RoleToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                findFirst: {
                    args: Prisma.RoleToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                findMany: {
                    args: Prisma.RoleToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>[];
                };
                create: {
                    args: Prisma.RoleToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                createMany: {
                    args: Prisma.RoleToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RoleToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>[];
                };
                delete: {
                    args: Prisma.RoleToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                update: {
                    args: Prisma.RoleToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                deleteMany: {
                    args: Prisma.RoleToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RoleToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>[];
                };
                upsert: {
                    args: Prisma.RoleToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleToolPayload>;
                };
                aggregate: {
                    args: Prisma.RoleToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRoleTool>;
                };
                groupBy: {
                    args: Prisma.RoleToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RoleToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleToolCountAggregateOutputType> | number;
                };
            };
        };
        Agent: {
            payload: Prisma.$AgentPayload<ExtArgs>;
            fields: Prisma.AgentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AgentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AgentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                findFirst: {
                    args: Prisma.AgentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AgentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                findMany: {
                    args: Prisma.AgentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>[];
                };
                create: {
                    args: Prisma.AgentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                createMany: {
                    args: Prisma.AgentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AgentCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>[];
                };
                delete: {
                    args: Prisma.AgentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                update: {
                    args: Prisma.AgentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                deleteMany: {
                    args: Prisma.AgentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AgentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AgentUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>[];
                };
                upsert: {
                    args: Prisma.AgentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentPayload>;
                };
                aggregate: {
                    args: Prisma.AgentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAgent>;
                };
                groupBy: {
                    args: Prisma.AgentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AgentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentCountAggregateOutputType> | number;
                };
            };
        };
        PromptTemplate: {
            payload: Prisma.$PromptTemplatePayload<ExtArgs>;
            fields: Prisma.PromptTemplateFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PromptTemplateFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PromptTemplateFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                findFirst: {
                    args: Prisma.PromptTemplateFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PromptTemplateFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                findMany: {
                    args: Prisma.PromptTemplateFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>[];
                };
                create: {
                    args: Prisma.PromptTemplateCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                createMany: {
                    args: Prisma.PromptTemplateCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PromptTemplateCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>[];
                };
                delete: {
                    args: Prisma.PromptTemplateDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                update: {
                    args: Prisma.PromptTemplateUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                deleteMany: {
                    args: Prisma.PromptTemplateDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PromptTemplateUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PromptTemplateUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>[];
                };
                upsert: {
                    args: Prisma.PromptTemplateUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PromptTemplatePayload>;
                };
                aggregate: {
                    args: Prisma.PromptTemplateAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePromptTemplate>;
                };
                groupBy: {
                    args: Prisma.PromptTemplateGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PromptTemplateGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PromptTemplateCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PromptTemplateCountAggregateOutputType> | number;
                };
            };
        };
        MessageTurn: {
            payload: Prisma.$MessageTurnPayload<ExtArgs>;
            fields: Prisma.MessageTurnFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MessageTurnFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MessageTurnFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                findFirst: {
                    args: Prisma.MessageTurnFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MessageTurnFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                findMany: {
                    args: Prisma.MessageTurnFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>[];
                };
                create: {
                    args: Prisma.MessageTurnCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                createMany: {
                    args: Prisma.MessageTurnCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MessageTurnCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>[];
                };
                delete: {
                    args: Prisma.MessageTurnDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                update: {
                    args: Prisma.MessageTurnUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                deleteMany: {
                    args: Prisma.MessageTurnDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MessageTurnUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MessageTurnUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>[];
                };
                upsert: {
                    args: Prisma.MessageTurnUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessageTurnPayload>;
                };
                aggregate: {
                    args: Prisma.MessageTurnAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMessageTurn>;
                };
                groupBy: {
                    args: Prisma.MessageTurnGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageTurnGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MessageTurnCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageTurnCountAggregateOutputType> | number;
                };
            };
        };
        AgentRun: {
            payload: Prisma.$AgentRunPayload<ExtArgs>;
            fields: Prisma.AgentRunFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AgentRunFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AgentRunFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                findFirst: {
                    args: Prisma.AgentRunFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AgentRunFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                findMany: {
                    args: Prisma.AgentRunFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>[];
                };
                create: {
                    args: Prisma.AgentRunCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                createMany: {
                    args: Prisma.AgentRunCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AgentRunCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>[];
                };
                delete: {
                    args: Prisma.AgentRunDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                update: {
                    args: Prisma.AgentRunUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                deleteMany: {
                    args: Prisma.AgentRunDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AgentRunUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AgentRunUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>[];
                };
                upsert: {
                    args: Prisma.AgentRunUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentRunPayload>;
                };
                aggregate: {
                    args: Prisma.AgentRunAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAgentRun>;
                };
                groupBy: {
                    args: Prisma.AgentRunGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentRunGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AgentRunCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentRunCountAggregateOutputType> | number;
                };
            };
        };
        AgentTool: {
            payload: Prisma.$AgentToolPayload<ExtArgs>;
            fields: Prisma.AgentToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AgentToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AgentToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                findFirst: {
                    args: Prisma.AgentToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AgentToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                findMany: {
                    args: Prisma.AgentToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>[];
                };
                create: {
                    args: Prisma.AgentToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                createMany: {
                    args: Prisma.AgentToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AgentToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>[];
                };
                delete: {
                    args: Prisma.AgentToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                update: {
                    args: Prisma.AgentToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                deleteMany: {
                    args: Prisma.AgentToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AgentToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AgentToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>[];
                };
                upsert: {
                    args: Prisma.AgentToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentToolPayload>;
                };
                aggregate: {
                    args: Prisma.AgentToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAgentTool>;
                };
                groupBy: {
                    args: Prisma.AgentToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AgentToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentToolCountAggregateOutputType> | number;
                };
            };
        };
        HostPage: {
            payload: Prisma.$HostPagePayload<ExtArgs>;
            fields: Prisma.HostPageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.HostPageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.HostPageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                findFirst: {
                    args: Prisma.HostPageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.HostPageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                findMany: {
                    args: Prisma.HostPageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>[];
                };
                create: {
                    args: Prisma.HostPageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                createMany: {
                    args: Prisma.HostPageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.HostPageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>[];
                };
                delete: {
                    args: Prisma.HostPageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                update: {
                    args: Prisma.HostPageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                deleteMany: {
                    args: Prisma.HostPageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.HostPageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.HostPageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>[];
                };
                upsert: {
                    args: Prisma.HostPageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostPagePayload>;
                };
                aggregate: {
                    args: Prisma.HostPageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateHostPage>;
                };
                groupBy: {
                    args: Prisma.HostPageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.HostPageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.HostPageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.HostPageCountAggregateOutputType> | number;
                };
            };
        };
        HostTool: {
            payload: Prisma.$HostToolPayload<ExtArgs>;
            fields: Prisma.HostToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.HostToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.HostToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                findFirst: {
                    args: Prisma.HostToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.HostToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                findMany: {
                    args: Prisma.HostToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>[];
                };
                create: {
                    args: Prisma.HostToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                createMany: {
                    args: Prisma.HostToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.HostToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>[];
                };
                delete: {
                    args: Prisma.HostToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                update: {
                    args: Prisma.HostToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                deleteMany: {
                    args: Prisma.HostToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.HostToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.HostToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>[];
                };
                upsert: {
                    args: Prisma.HostToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$HostToolPayload>;
                };
                aggregate: {
                    args: Prisma.HostToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateHostTool>;
                };
                groupBy: {
                    args: Prisma.HostToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.HostToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.HostToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.HostToolCountAggregateOutputType> | number;
                };
            };
        };
        AgentHostTool: {
            payload: Prisma.$AgentHostToolPayload<ExtArgs>;
            fields: Prisma.AgentHostToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AgentHostToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AgentHostToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                findFirst: {
                    args: Prisma.AgentHostToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AgentHostToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                findMany: {
                    args: Prisma.AgentHostToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>[];
                };
                create: {
                    args: Prisma.AgentHostToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                createMany: {
                    args: Prisma.AgentHostToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AgentHostToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>[];
                };
                delete: {
                    args: Prisma.AgentHostToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                update: {
                    args: Prisma.AgentHostToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                deleteMany: {
                    args: Prisma.AgentHostToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AgentHostToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AgentHostToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>[];
                };
                upsert: {
                    args: Prisma.AgentHostToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AgentHostToolPayload>;
                };
                aggregate: {
                    args: Prisma.AgentHostToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAgentHostTool>;
                };
                groupBy: {
                    args: Prisma.AgentHostToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentHostToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AgentHostToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AgentHostToolCountAggregateOutputType> | number;
                };
            };
        };
        SkillHostTool: {
            payload: Prisma.$SkillHostToolPayload<ExtArgs>;
            fields: Prisma.SkillHostToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SkillHostToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SkillHostToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                findFirst: {
                    args: Prisma.SkillHostToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SkillHostToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                findMany: {
                    args: Prisma.SkillHostToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>[];
                };
                create: {
                    args: Prisma.SkillHostToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                createMany: {
                    args: Prisma.SkillHostToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SkillHostToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>[];
                };
                delete: {
                    args: Prisma.SkillHostToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                update: {
                    args: Prisma.SkillHostToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                deleteMany: {
                    args: Prisma.SkillHostToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SkillHostToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SkillHostToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>[];
                };
                upsert: {
                    args: Prisma.SkillHostToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SkillHostToolPayload>;
                };
                aggregate: {
                    args: Prisma.SkillHostToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSkillHostTool>;
                };
                groupBy: {
                    args: Prisma.SkillHostToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillHostToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SkillHostToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SkillHostToolCountAggregateOutputType> | number;
                };
            };
        };
        RoleHostTool: {
            payload: Prisma.$RoleHostToolPayload<ExtArgs>;
            fields: Prisma.RoleHostToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleHostToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleHostToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                findFirst: {
                    args: Prisma.RoleHostToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleHostToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                findMany: {
                    args: Prisma.RoleHostToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>[];
                };
                create: {
                    args: Prisma.RoleHostToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                createMany: {
                    args: Prisma.RoleHostToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RoleHostToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>[];
                };
                delete: {
                    args: Prisma.RoleHostToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                update: {
                    args: Prisma.RoleHostToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                deleteMany: {
                    args: Prisma.RoleHostToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleHostToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RoleHostToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>[];
                };
                upsert: {
                    args: Prisma.RoleHostToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RoleHostToolPayload>;
                };
                aggregate: {
                    args: Prisma.RoleHostToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRoleHostTool>;
                };
                groupBy: {
                    args: Prisma.RoleHostToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleHostToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RoleHostToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleHostToolCountAggregateOutputType> | number;
                };
            };
        };
        PageAction: {
            payload: Prisma.$PageActionPayload<ExtArgs>;
            fields: Prisma.PageActionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PageActionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PageActionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                findFirst: {
                    args: Prisma.PageActionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PageActionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                findMany: {
                    args: Prisma.PageActionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>[];
                };
                create: {
                    args: Prisma.PageActionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                createMany: {
                    args: Prisma.PageActionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PageActionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>[];
                };
                delete: {
                    args: Prisma.PageActionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                update: {
                    args: Prisma.PageActionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                deleteMany: {
                    args: Prisma.PageActionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PageActionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PageActionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>[];
                };
                upsert: {
                    args: Prisma.PageActionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionPayload>;
                };
                aggregate: {
                    args: Prisma.PageActionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePageAction>;
                };
                groupBy: {
                    args: Prisma.PageActionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageActionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PageActionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageActionCountAggregateOutputType> | number;
                };
            };
        };
        PageActionRun: {
            payload: Prisma.$PageActionRunPayload<ExtArgs>;
            fields: Prisma.PageActionRunFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PageActionRunFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PageActionRunFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                findFirst: {
                    args: Prisma.PageActionRunFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PageActionRunFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                findMany: {
                    args: Prisma.PageActionRunFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>[];
                };
                create: {
                    args: Prisma.PageActionRunCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                createMany: {
                    args: Prisma.PageActionRunCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PageActionRunCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>[];
                };
                delete: {
                    args: Prisma.PageActionRunDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                update: {
                    args: Prisma.PageActionRunUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                deleteMany: {
                    args: Prisma.PageActionRunDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PageActionRunUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PageActionRunUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>[];
                };
                upsert: {
                    args: Prisma.PageActionRunUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PageActionRunPayload>;
                };
                aggregate: {
                    args: Prisma.PageActionRunAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePageActionRun>;
                };
                groupBy: {
                    args: Prisma.PageActionRunGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageActionRunGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PageActionRunCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PageActionRunCountAggregateOutputType> | number;
                };
            };
        };
        ApprovalRequest: {
            payload: Prisma.$ApprovalRequestPayload<ExtArgs>;
            fields: Prisma.ApprovalRequestFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ApprovalRequestFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ApprovalRequestFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                findFirst: {
                    args: Prisma.ApprovalRequestFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ApprovalRequestFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                findMany: {
                    args: Prisma.ApprovalRequestFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>[];
                };
                create: {
                    args: Prisma.ApprovalRequestCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                createMany: {
                    args: Prisma.ApprovalRequestCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ApprovalRequestCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>[];
                };
                delete: {
                    args: Prisma.ApprovalRequestDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                update: {
                    args: Prisma.ApprovalRequestUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                deleteMany: {
                    args: Prisma.ApprovalRequestDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ApprovalRequestUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ApprovalRequestUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>[];
                };
                upsert: {
                    args: Prisma.ApprovalRequestUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApprovalRequestPayload>;
                };
                aggregate: {
                    args: Prisma.ApprovalRequestAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateApprovalRequest>;
                };
                groupBy: {
                    args: Prisma.ApprovalRequestGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ApprovalRequestGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ApprovalRequestCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ApprovalRequestCountAggregateOutputType> | number;
                };
            };
        };
        Workflow: {
            payload: Prisma.$WorkflowPayload<ExtArgs>;
            fields: Prisma.WorkflowFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkflowFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkflowFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                findFirst: {
                    args: Prisma.WorkflowFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkflowFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                findMany: {
                    args: Prisma.WorkflowFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>[];
                };
                create: {
                    args: Prisma.WorkflowCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                createMany: {
                    args: Prisma.WorkflowCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkflowCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>[];
                };
                delete: {
                    args: Prisma.WorkflowDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                update: {
                    args: Prisma.WorkflowUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                deleteMany: {
                    args: Prisma.WorkflowDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkflowUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkflowUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>[];
                };
                upsert: {
                    args: Prisma.WorkflowUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowPayload>;
                };
                aggregate: {
                    args: Prisma.WorkflowAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkflow>;
                };
                groupBy: {
                    args: Prisma.WorkflowGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkflowCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowCountAggregateOutputType> | number;
                };
            };
        };
        WorkflowRevision: {
            payload: Prisma.$WorkflowRevisionPayload<ExtArgs>;
            fields: Prisma.WorkflowRevisionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkflowRevisionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkflowRevisionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                findFirst: {
                    args: Prisma.WorkflowRevisionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkflowRevisionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                findMany: {
                    args: Prisma.WorkflowRevisionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>[];
                };
                create: {
                    args: Prisma.WorkflowRevisionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                createMany: {
                    args: Prisma.WorkflowRevisionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkflowRevisionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>[];
                };
                delete: {
                    args: Prisma.WorkflowRevisionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                update: {
                    args: Prisma.WorkflowRevisionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                deleteMany: {
                    args: Prisma.WorkflowRevisionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkflowRevisionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkflowRevisionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>[];
                };
                upsert: {
                    args: Prisma.WorkflowRevisionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowRevisionPayload>;
                };
                aggregate: {
                    args: Prisma.WorkflowRevisionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkflowRevision>;
                };
                groupBy: {
                    args: Prisma.WorkflowRevisionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowRevisionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkflowRevisionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowRevisionCountAggregateOutputType> | number;
                };
            };
        };
        WorkflowTool: {
            payload: Prisma.$WorkflowToolPayload<ExtArgs>;
            fields: Prisma.WorkflowToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkflowToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkflowToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                findFirst: {
                    args: Prisma.WorkflowToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkflowToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                findMany: {
                    args: Prisma.WorkflowToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>[];
                };
                create: {
                    args: Prisma.WorkflowToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                createMany: {
                    args: Prisma.WorkflowToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkflowToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>[];
                };
                delete: {
                    args: Prisma.WorkflowToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                update: {
                    args: Prisma.WorkflowToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                deleteMany: {
                    args: Prisma.WorkflowToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkflowToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkflowToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>[];
                };
                upsert: {
                    args: Prisma.WorkflowToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowToolPayload>;
                };
                aggregate: {
                    args: Prisma.WorkflowToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkflowTool>;
                };
                groupBy: {
                    args: Prisma.WorkflowToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkflowToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowToolCountAggregateOutputType> | number;
                };
            };
        };
        WorkflowHostTool: {
            payload: Prisma.$WorkflowHostToolPayload<ExtArgs>;
            fields: Prisma.WorkflowHostToolFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WorkflowHostToolFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WorkflowHostToolFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                findFirst: {
                    args: Prisma.WorkflowHostToolFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WorkflowHostToolFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                findMany: {
                    args: Prisma.WorkflowHostToolFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>[];
                };
                create: {
                    args: Prisma.WorkflowHostToolCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                createMany: {
                    args: Prisma.WorkflowHostToolCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WorkflowHostToolCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>[];
                };
                delete: {
                    args: Prisma.WorkflowHostToolDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                update: {
                    args: Prisma.WorkflowHostToolUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                deleteMany: {
                    args: Prisma.WorkflowHostToolDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WorkflowHostToolUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WorkflowHostToolUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>[];
                };
                upsert: {
                    args: Prisma.WorkflowHostToolUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WorkflowHostToolPayload>;
                };
                aggregate: {
                    args: Prisma.WorkflowHostToolAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWorkflowHostTool>;
                };
                groupBy: {
                    args: Prisma.WorkflowHostToolGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowHostToolGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WorkflowHostToolCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WorkflowHostToolCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly employeeId: "employeeId";
    readonly email: "email";
    readonly password: "password";
    readonly username: "username";
    readonly status: "status";
    readonly mustChangePassword: "mustChangePassword";
    readonly createdAt: "createdAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const RoleScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly description: "description";
    readonly allowToolLevel: "allowToolLevel";
    readonly createdAt: "createdAt";
};
export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum];
export declare const AdminUserScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly password: "password";
    readonly username: "username";
    readonly role: "role";
    readonly isActive: "isActive";
    readonly mustChangePassword: "mustChangePassword";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AdminUserScalarFieldEnum = (typeof AdminUserScalarFieldEnum)[keyof typeof AdminUserScalarFieldEnum];
export declare const AppClientScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly dsn: "dsn";
    readonly description: "description";
    readonly authConfig: "authConfig";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AppClientScalarFieldEnum = (typeof AppClientScalarFieldEnum)[keyof typeof AppClientScalarFieldEnum];
export declare const LlmModelConfigScalarFieldEnum: {
    readonly id: "id";
    readonly kind: "kind";
    readonly singletonKey: "singletonKey";
    readonly provider: "provider";
    readonly model: "model";
    readonly apiKey: "apiKey";
    readonly baseUrl: "baseUrl";
    readonly chatPath: "chatPath";
    readonly parameters: "parameters";
    readonly stream: "stream";
    readonly maxTokens: "maxTokens";
    readonly temperature: "temperature";
    readonly enabled: "enabled";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type LlmModelConfigScalarFieldEnum = (typeof LlmModelConfigScalarFieldEnum)[keyof typeof LlmModelConfigScalarFieldEnum];
export declare const PageAgentLlmProxyAuditScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly userId: "userId";
    readonly modelConfigId: "modelConfigId";
    readonly requestedModel: "requestedModel";
    readonly provider: "provider";
    readonly providerModel: "providerModel";
    readonly status: "status";
    readonly upstreamStatus: "upstreamStatus";
    readonly durationMs: "durationMs";
    readonly promptTokens: "promptTokens";
    readonly completionTokens: "completionTokens";
    readonly totalTokens: "totalTokens";
    readonly requestMeta: "requestMeta";
    readonly errorMessage: "errorMessage";
    readonly createdAt: "createdAt";
    readonly finishedAt: "finishedAt";
};
export type PageAgentLlmProxyAuditScalarFieldEnum = (typeof PageAgentLlmProxyAuditScalarFieldEnum)[keyof typeof PageAgentLlmProxyAuditScalarFieldEnum];
export declare const IntentRecallConfigScalarFieldEnum: {
    readonly id: "id";
    readonly singletonKey: "singletonKey";
    readonly recallMode: "recallMode";
    readonly vectorTopK: "vectorTopK";
    readonly vectorMinScore: "vectorMinScore";
    readonly bindToolsMax: "bindToolsMax";
    readonly fallbackToKeyword: "fallbackToKeyword";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type IntentRecallConfigScalarFieldEnum = (typeof IntentRecallConfigScalarFieldEnum)[keyof typeof IntentRecallConfigScalarFieldEnum];
export declare const UserLlmModelConfigScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly provider: "provider";
    readonly model: "model";
    readonly apiKey: "apiKey";
    readonly baseUrl: "baseUrl";
    readonly temperature: "temperature";
    readonly maxTokens: "maxTokens";
    readonly enabled: "enabled";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserLlmModelConfigScalarFieldEnum = (typeof UserLlmModelConfigScalarFieldEnum)[keyof typeof UserLlmModelConfigScalarFieldEnum];
export declare const SessionScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly appClientId: "appClientId";
    readonly agentId: "agentId";
    readonly title: "title";
    readonly createdAt: "createdAt";
};
export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum];
export declare const SessionGoaMemoryScalarFieldEnum: {
    readonly sessionId: "sessionId";
    readonly payload: "payload";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SessionGoaMemoryScalarFieldEnum = (typeof SessionGoaMemoryScalarFieldEnum)[keyof typeof SessionGoaMemoryScalarFieldEnum];
export declare const MessageScalarFieldEnum: {
    readonly id: "id";
    readonly sessionId: "sessionId";
    readonly role: "role";
    readonly content: "content";
    readonly toolName: "toolName";
    readonly toolInput: "toolInput";
    readonly toolOutput: "toolOutput";
    readonly pageContextJson: "pageContextJson";
    readonly createdAt: "createdAt";
};
export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum];
export declare const MessageFeedbackScalarFieldEnum: {
    readonly id: "id";
    readonly messageId: "messageId";
    readonly sessionId: "sessionId";
    readonly userId: "userId";
    readonly appClientId: "appClientId";
    readonly turnId: "turnId";
    readonly agentId: "agentId";
    readonly rating: "rating";
    readonly reasonTags: "reasonTags";
    readonly comment: "comment";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type MessageFeedbackScalarFieldEnum = (typeof MessageFeedbackScalarFieldEnum)[keyof typeof MessageFeedbackScalarFieldEnum];
export declare const ToolCategoryScalarFieldEnum: {
    readonly id: "id";
    readonly label: "label";
    readonly description: "description";
    readonly sortOrder: "sortOrder";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ToolCategoryScalarFieldEnum = (typeof ToolCategoryScalarFieldEnum)[keyof typeof ToolCategoryScalarFieldEnum];
export declare const ToolScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly definitionKey: "definitionKey";
    readonly name: "name";
    readonly description: "description";
    readonly riskLevel: "riskLevel";
    readonly schema: "schema";
    readonly inputSchema: "inputSchema";
    readonly outputSchema: "outputSchema";
    readonly responseProfile: "responseProfile";
    readonly agentMetadata: "agentMetadata";
    readonly method: "method";
    readonly path: "path";
    readonly integrationId: "integrationId";
    readonly toolCategoryId: "toolCategoryId";
    readonly isActive: "isActive";
    readonly timeout: "timeout";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ToolScalarFieldEnum = (typeof ToolScalarFieldEnum)[keyof typeof ToolScalarFieldEnum];
export declare const IntegrationScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly name: "name";
    readonly baseUrl: "baseUrl";
    readonly apiKey: "apiKey";
    readonly authMode: "authMode";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type IntegrationScalarFieldEnum = (typeof IntegrationScalarFieldEnum)[keyof typeof IntegrationScalarFieldEnum];
export declare const UserIntegrationScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly integrationId: "integrationId";
    readonly userApiKey: "userApiKey";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserIntegrationScalarFieldEnum = (typeof UserIntegrationScalarFieldEnum)[keyof typeof UserIntegrationScalarFieldEnum];
export declare const SkillScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly name: "name";
    readonly capabilityKey: "capabilityKey";
    readonly description: "description";
    readonly prompt: "prompt";
    readonly riskLevel: "riskLevel";
    readonly config: "config";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly workflowId: "workflowId";
    readonly workflowVersion: "workflowVersion";
    readonly workflowOverrides: "workflowOverrides";
};
export type SkillScalarFieldEnum = (typeof SkillScalarFieldEnum)[keyof typeof SkillScalarFieldEnum];
export declare const AgentSkillScalarFieldEnum: {
    readonly id: "id";
    readonly agentId: "agentId";
    readonly skillId: "skillId";
};
export type AgentSkillScalarFieldEnum = (typeof AgentSkillScalarFieldEnum)[keyof typeof AgentSkillScalarFieldEnum];
export declare const RoleSkillScalarFieldEnum: {
    readonly id: "id";
    readonly roleId: "roleId";
    readonly skillId: "skillId";
};
export type RoleSkillScalarFieldEnum = (typeof RoleSkillScalarFieldEnum)[keyof typeof RoleSkillScalarFieldEnum];
export declare const SkillToolScalarFieldEnum: {
    readonly id: "id";
    readonly skillId: "skillId";
    readonly toolId: "toolId";
    readonly isRequired: "isRequired";
};
export type SkillToolScalarFieldEnum = (typeof SkillToolScalarFieldEnum)[keyof typeof SkillToolScalarFieldEnum];
export declare const UserAppScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly appId: "appId";
    readonly roleId: "roleId";
    readonly createdAt: "createdAt";
};
export type UserAppScalarFieldEnum = (typeof UserAppScalarFieldEnum)[keyof typeof UserAppScalarFieldEnum];
export declare const RoleToolScalarFieldEnum: {
    readonly id: "id";
    readonly roleId: "roleId";
    readonly toolId: "toolId";
    readonly createdAt: "createdAt";
};
export type RoleToolScalarFieldEnum = (typeof RoleToolScalarFieldEnum)[keyof typeof RoleToolScalarFieldEnum];
export declare const AgentScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly name: "name";
    readonly description: "description";
    readonly systemPrompt: "systemPrompt";
    readonly maxSteps: "maxSteps";
    readonly enableToolCall: "enableToolCall";
    readonly restrictTools: "restrictTools";
    readonly restrictHostTools: "restrictHostTools";
    readonly restrictSkills: "restrictSkills";
    readonly config: "config";
    readonly createdAt: "createdAt";
};
export type AgentScalarFieldEnum = (typeof AgentScalarFieldEnum)[keyof typeof AgentScalarFieldEnum];
export declare const PromptTemplateScalarFieldEnum: {
    readonly id: "id";
    readonly key: "key";
    readonly version: "version";
    readonly appClientId: "appClientId";
    readonly agentId: "agentId";
    readonly locale: "locale";
    readonly category: "category";
    readonly title: "title";
    readonly description: "description";
    readonly content: "content";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PromptTemplateScalarFieldEnum = (typeof PromptTemplateScalarFieldEnum)[keyof typeof PromptTemplateScalarFieldEnum];
export declare const MessageTurnScalarFieldEnum: {
    readonly id: "id";
    readonly messageId: "messageId";
    readonly sessionId: "sessionId";
    readonly userId: "userId";
    readonly appClientId: "appClientId";
    readonly userInput: "userInput";
    readonly finalOutput: "finalOutput";
    readonly status: "status";
    readonly primaryAgentId: "primaryAgentId";
    readonly agentRunCount: "agentRunCount";
    readonly durationMs: "durationMs";
    readonly llmDurationMs: "llmDurationMs";
    readonly toolDurationMs: "toolDurationMs";
    readonly model: "model";
    readonly promptTokens: "promptTokens";
    readonly completionTokens: "completionTokens";
    readonly totalTokens: "totalTokens";
    readonly llmCallCount: "llmCallCount";
    readonly toolCallCount: "toolCallCount";
    readonly toolsUsed: "toolsUsed";
    readonly finishReason: "finishReason";
    readonly outputMessageId: "outputMessageId";
    readonly startedAt: "startedAt";
    readonly finishedAt: "finishedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type MessageTurnScalarFieldEnum = (typeof MessageTurnScalarFieldEnum)[keyof typeof MessageTurnScalarFieldEnum];
export declare const AgentRunScalarFieldEnum: {
    readonly id: "id";
    readonly turnId: "turnId";
    readonly agentId: "agentId";
    readonly appClientId: "appClientId";
    readonly sessionId: "sessionId";
    readonly userId: "userId";
    readonly role: "role";
    readonly sequence: "sequence";
    readonly parentRunId: "parentRunId";
    readonly input: "input";
    readonly output: "output";
    readonly status: "status";
    readonly steps: "steps";
    readonly currentStep: "currentStep";
    readonly maxSteps: "maxSteps";
    readonly error: "error";
    readonly startedAt: "startedAt";
    readonly finishedAt: "finishedAt";
    readonly durationMs: "durationMs";
    readonly llmDurationMs: "llmDurationMs";
    readonly toolDurationMs: "toolDurationMs";
    readonly model: "model";
    readonly promptTokens: "promptTokens";
    readonly completionTokens: "completionTokens";
    readonly totalTokens: "totalTokens";
    readonly llmCallCount: "llmCallCount";
    readonly toolCallCount: "toolCallCount";
    readonly toolsUsed: "toolsUsed";
    readonly finishReason: "finishReason";
    readonly scopedToolCount: "scopedToolCount";
    readonly outputMessageId: "outputMessageId";
    readonly goaSnapshot: "goaSnapshot";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AgentRunScalarFieldEnum = (typeof AgentRunScalarFieldEnum)[keyof typeof AgentRunScalarFieldEnum];
export declare const AgentToolScalarFieldEnum: {
    readonly id: "id";
    readonly agentId: "agentId";
    readonly toolId: "toolId";
};
export type AgentToolScalarFieldEnum = (typeof AgentToolScalarFieldEnum)[keyof typeof AgentToolScalarFieldEnum];
export declare const HostPageScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly scope: "scope";
    readonly label: "label";
    readonly description: "description";
    readonly routePattern: "routePattern";
    readonly sortOrder: "sortOrder";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type HostPageScalarFieldEnum = (typeof HostPageScalarFieldEnum)[keyof typeof HostPageScalarFieldEnum];
export declare const HostToolScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly hostPageId: "hostPageId";
    readonly definitionKey: "definitionKey";
    readonly name: "name";
    readonly description: "description";
    readonly argsSchema: "argsSchema";
    readonly argsTemplate: "argsTemplate";
    readonly sortOrder: "sortOrder";
    readonly isActive: "isActive";
    readonly config: "config";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type HostToolScalarFieldEnum = (typeof HostToolScalarFieldEnum)[keyof typeof HostToolScalarFieldEnum];
export declare const AgentHostToolScalarFieldEnum: {
    readonly id: "id";
    readonly agentId: "agentId";
    readonly hostToolId: "hostToolId";
    readonly createdAt: "createdAt";
};
export type AgentHostToolScalarFieldEnum = (typeof AgentHostToolScalarFieldEnum)[keyof typeof AgentHostToolScalarFieldEnum];
export declare const SkillHostToolScalarFieldEnum: {
    readonly id: "id";
    readonly skillId: "skillId";
    readonly hostToolId: "hostToolId";
    readonly trigger: "trigger";
    readonly argsTemplate: "argsTemplate";
    readonly priority: "priority";
    readonly isRequired: "isRequired";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SkillHostToolScalarFieldEnum = (typeof SkillHostToolScalarFieldEnum)[keyof typeof SkillHostToolScalarFieldEnum];
export declare const RoleHostToolScalarFieldEnum: {
    readonly id: "id";
    readonly roleId: "roleId";
    readonly hostToolId: "hostToolId";
    readonly createdAt: "createdAt";
};
export type RoleHostToolScalarFieldEnum = (typeof RoleHostToolScalarFieldEnum)[keyof typeof RoleHostToolScalarFieldEnum];
export declare const PageActionScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly actionKey: "actionKey";
    readonly name: "name";
    readonly description: "description";
    readonly hostToolId: "hostToolId";
    readonly pageScope: "pageScope";
    readonly systemPrompt: "systemPrompt";
    readonly defaultDelivery: "defaultDelivery";
    readonly allowCustomInstruction: "allowCustomInstruction";
    readonly isActive: "isActive";
    readonly sortOrder: "sortOrder";
    readonly config: "config";
    readonly sourceSkillId: "sourceSkillId";
    readonly workflowId: "workflowId";
    readonly workflowVersion: "workflowVersion";
    readonly workflowOverrides: "workflowOverrides";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PageActionScalarFieldEnum = (typeof PageActionScalarFieldEnum)[keyof typeof PageActionScalarFieldEnum];
export declare const PageActionRunScalarFieldEnum: {
    readonly id: "id";
    readonly pageActionId: "pageActionId";
    readonly appClientId: "appClientId";
    readonly userId: "userId";
    readonly delivery: "delivery";
    readonly status: "status";
    readonly instruction: "instruction";
    readonly context: "context";
    readonly pageContext: "pageContext";
    readonly fillText: "fillText";
    readonly dslOutcome: "dslOutcome";
    readonly errorCode: "errorCode";
    readonly errorMessage: "errorMessage";
    readonly streamId: "streamId";
    readonly model: "model";
    readonly promptTokens: "promptTokens";
    readonly completionTokens: "completionTokens";
    readonly durationMs: "durationMs";
    readonly idempotencyKey: "idempotencyKey";
    readonly pageActionKey: "pageActionKey";
    readonly clientActionId: "clientActionId";
    readonly steps: "steps";
    readonly workflowId: "workflowId";
    readonly workflowVersion: "workflowVersion";
    readonly workflowRun: "workflowRun";
    readonly generation: "generation";
    readonly createdAt: "createdAt";
    readonly finishedAt: "finishedAt";
};
export type PageActionRunScalarFieldEnum = (typeof PageActionRunScalarFieldEnum)[keyof typeof PageActionRunScalarFieldEnum];
export declare const ApprovalRequestScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly source: "source";
    readonly status: "status";
    readonly initiatorUserId: "initiatorUserId";
    readonly approverUserId: "approverUserId";
    readonly workflowId: "workflowId";
    readonly workflowVersion: "workflowVersion";
    readonly nodeId: "nodeId";
    readonly title: "title";
    readonly summary: "summary";
    readonly previewBlocks: "previewBlocks";
    readonly resumeSnapshot: "resumeSnapshot";
    readonly pageActionRunId: "pageActionRunId";
    readonly sessionId: "sessionId";
    readonly idempotencyKey: "idempotencyKey";
    readonly decidedByUserId: "decidedByUserId";
    readonly decidedAt: "decidedAt";
    readonly decisionNote: "decisionNote";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ApprovalRequestScalarFieldEnum = (typeof ApprovalRequestScalarFieldEnum)[keyof typeof ApprovalRequestScalarFieldEnum];
export declare const WorkflowScalarFieldEnum: {
    readonly id: "id";
    readonly appClientId: "appClientId";
    readonly workflowKey: "workflowKey";
    readonly name: "name";
    readonly description: "description";
    readonly goal: "goal";
    readonly profile: "profile";
    readonly deliverable: "deliverable";
    readonly nodes: "nodes";
    readonly version: "version";
    readonly constraints: "constraints";
    readonly isActive: "isActive";
    readonly sortOrder: "sortOrder";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WorkflowScalarFieldEnum = (typeof WorkflowScalarFieldEnum)[keyof typeof WorkflowScalarFieldEnum];
export declare const WorkflowRevisionScalarFieldEnum: {
    readonly id: "id";
    readonly workflowId: "workflowId";
    readonly version: "version";
    readonly nodes: "nodes";
    readonly deliverable: "deliverable";
    readonly constraints: "constraints";
    readonly changeNote: "changeNote";
    readonly createdAt: "createdAt";
};
export type WorkflowRevisionScalarFieldEnum = (typeof WorkflowRevisionScalarFieldEnum)[keyof typeof WorkflowRevisionScalarFieldEnum];
export declare const WorkflowToolScalarFieldEnum: {
    readonly id: "id";
    readonly workflowId: "workflowId";
    readonly toolId: "toolId";
    readonly isRequired: "isRequired";
};
export type WorkflowToolScalarFieldEnum = (typeof WorkflowToolScalarFieldEnum)[keyof typeof WorkflowToolScalarFieldEnum];
export declare const WorkflowHostToolScalarFieldEnum: {
    readonly id: "id";
    readonly workflowId: "workflowId";
    readonly hostToolId: "hostToolId";
    readonly isRequired: "isRequired";
};
export type WorkflowHostToolScalarFieldEnum = (typeof WorkflowHostToolScalarFieldEnum)[keyof typeof WorkflowHostToolScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
    readonly AnyNull: runtime.AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type EnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus'>;
export type ListEnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus[]'>;
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type EnumToolLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ToolLevel'>;
export type ListEnumToolLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ToolLevel[]'>;
export type EnumAdminRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AdminRole'>;
export type ListEnumAdminRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AdminRole[]'>;
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
export type EnumLlmModelKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LlmModelKind'>;
export type ListEnumLlmModelKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LlmModelKind[]'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
export type EnumMessageFeedbackRatingFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageFeedbackRating'>;
export type ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MessageFeedbackRating[]'>;
export type EnumHttpMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HttpMethod'>;
export type ListEnumHttpMethodFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HttpMethod[]'>;
export type EnumIntegrationAuthModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationAuthMode'>;
export type ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntegrationAuthMode[]'>;
export type EnumAgentRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunStatus'>;
export type ListEnumAgentRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunStatus[]'>;
export type EnumAgentRunRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunRole'>;
export type ListEnumAgentRunRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentRunRole[]'>;
export type EnumHostToolSkillTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HostToolSkillTrigger'>;
export type ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HostToolSkillTrigger[]'>;
export type EnumPageActionDeliveryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PageActionDelivery'>;
export type ListEnumPageActionDeliveryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PageActionDelivery[]'>;
export type EnumPageActionRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PageActionRunStatus'>;
export type ListEnumPageActionRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PageActionRunStatus[]'>;
export type EnumApprovalSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApprovalSource'>;
export type ListEnumApprovalSourceFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApprovalSource[]'>;
export type EnumApprovalStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApprovalStatus'>;
export type ListEnumApprovalStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApprovalStatus[]'>;
export type EnumWorkflowProfileFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowProfile'>;
export type ListEnumWorkflowProfileFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowProfile[]'>;
export type EnumWorkflowDeliverableFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowDeliverable'>;
export type ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowDeliverable[]'>;
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.ExtendsHook<"define", TypeMapCb<{}>, runtime.DefaultArgs, TypeMap<runtime.InternalArgs & runtime.DefaultArgs, {}>>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    accelerateUrl: string;
    adapter?: never;
}) & {
    errorFormat?: ErrorFormat;
    log?: (LogLevel | LogDefinition)[];
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    omit?: GlobalOmitConfig;
    comments?: runtime.SqlCommenterPlugin[];
};
export type GlobalOmitConfig = {
    user?: Prisma.UserOmit;
    role?: Prisma.RoleOmit;
    adminUser?: Prisma.AdminUserOmit;
    appClient?: Prisma.AppClientOmit;
    llmModelConfig?: Prisma.LlmModelConfigOmit;
    pageAgentLlmProxyAudit?: Prisma.PageAgentLlmProxyAuditOmit;
    intentRecallConfig?: Prisma.IntentRecallConfigOmit;
    userLlmModelConfig?: Prisma.UserLlmModelConfigOmit;
    session?: Prisma.SessionOmit;
    sessionGoaMemory?: Prisma.SessionGoaMemoryOmit;
    message?: Prisma.MessageOmit;
    messageFeedback?: Prisma.MessageFeedbackOmit;
    toolCategory?: Prisma.ToolCategoryOmit;
    tool?: Prisma.ToolOmit;
    integration?: Prisma.IntegrationOmit;
    userIntegration?: Prisma.UserIntegrationOmit;
    skill?: Prisma.SkillOmit;
    agentSkill?: Prisma.AgentSkillOmit;
    roleSkill?: Prisma.RoleSkillOmit;
    skillTool?: Prisma.SkillToolOmit;
    userApp?: Prisma.UserAppOmit;
    roleTool?: Prisma.RoleToolOmit;
    agent?: Prisma.AgentOmit;
    promptTemplate?: Prisma.PromptTemplateOmit;
    messageTurn?: Prisma.MessageTurnOmit;
    agentRun?: Prisma.AgentRunOmit;
    agentTool?: Prisma.AgentToolOmit;
    hostPage?: Prisma.HostPageOmit;
    hostTool?: Prisma.HostToolOmit;
    agentHostTool?: Prisma.AgentHostToolOmit;
    skillHostTool?: Prisma.SkillHostToolOmit;
    roleHostTool?: Prisma.RoleHostToolOmit;
    pageAction?: Prisma.PageActionOmit;
    pageActionRun?: Prisma.PageActionRunOmit;
    approvalRequest?: Prisma.ApprovalRequestOmit;
    workflow?: Prisma.WorkflowOmit;
    workflowRevision?: Prisma.WorkflowRevisionOmit;
    workflowTool?: Prisma.WorkflowToolOmit;
    workflowHostTool?: Prisma.WorkflowHostToolOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
