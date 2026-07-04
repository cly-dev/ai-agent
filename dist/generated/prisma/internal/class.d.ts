import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    $connect(): runtime.Types.Utils.JsPromise<void>;
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get role(): Prisma.RoleDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get adminUser(): Prisma.AdminUserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get appClient(): Prisma.AppClientDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get llmModelConfig(): Prisma.LlmModelConfigDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get pageAgentLlmProxyAudit(): Prisma.PageAgentLlmProxyAuditDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get intentRecallConfig(): Prisma.IntentRecallConfigDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get userLlmModelConfig(): Prisma.UserLlmModelConfigDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get session(): Prisma.SessionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get sessionGoaMemory(): Prisma.SessionGoaMemoryDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get message(): Prisma.MessageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get messageFeedback(): Prisma.MessageFeedbackDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get toolCategory(): Prisma.ToolCategoryDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get tool(): Prisma.ToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get integration(): Prisma.IntegrationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get userIntegration(): Prisma.UserIntegrationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get skill(): Prisma.SkillDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get agentSkill(): Prisma.AgentSkillDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get roleSkill(): Prisma.RoleSkillDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get skillTool(): Prisma.SkillToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get userApp(): Prisma.UserAppDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get roleTool(): Prisma.RoleToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get agent(): Prisma.AgentDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get promptTemplate(): Prisma.PromptTemplateDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get messageTurn(): Prisma.MessageTurnDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get agentRun(): Prisma.AgentRunDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get agentTool(): Prisma.AgentToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get hostPage(): Prisma.HostPageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get hostTool(): Prisma.HostToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get agentHostTool(): Prisma.AgentHostToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get skillHostTool(): Prisma.SkillHostToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get roleHostTool(): Prisma.RoleHostToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get pageAction(): Prisma.PageActionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get pageActionRun(): Prisma.PageActionRunDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get approvalRequest(): Prisma.ApprovalRequestDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get workflow(): Prisma.WorkflowDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get workflowRevision(): Prisma.WorkflowRevisionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get workflowTool(): Prisma.WorkflowToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get workflowHostTool(): Prisma.WorkflowHostToolDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
