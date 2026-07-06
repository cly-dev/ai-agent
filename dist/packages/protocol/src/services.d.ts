export declare const OMNIX_SERVICES: {
    readonly api: {
        readonly name: "omnix-api";
        readonly port: 3020;
    };
    readonly runtime: {
        readonly name: "omnix-runtime";
        readonly port: 3030;
    };
    readonly worker: {
        readonly name: "omnix-worker";
        readonly port: 3031;
    };
    readonly page: {
        readonly name: "omnix-page";
        readonly port: 3040;
    };
    readonly agentServerLegacy: {
        readonly name: "@omnix/agent-server";
        readonly port: 3030;
    };
};
export type OmnixServiceKey = keyof typeof OMNIX_SERVICES;
export declare const OMNIX_DEPLOYMENT_UNITS: readonly ["api", "runtime", "worker", "page"];
export type OmnixDeploymentUnit = (typeof OMNIX_DEPLOYMENT_UNITS)[number];
