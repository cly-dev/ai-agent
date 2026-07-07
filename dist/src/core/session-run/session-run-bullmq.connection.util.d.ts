import type { ConnectionOptions } from 'bullmq';
export declare function buildSessionRunBullMqConnection(): ConnectionOptions | null;
export declare function readSessionRunWorkerConcurrency(): number;
export declare function readSessionRunWorkerEnabled(): boolean;
export declare function readSessionRunJobAttempts(): number;
export declare function readHttpServerEnabled(): boolean;
