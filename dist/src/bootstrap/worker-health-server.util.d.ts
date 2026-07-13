/// <reference types="node" />
import { type Server } from 'node:http';
export declare function startWorkerHealthServer(input?: {
    port?: number;
    serviceName?: string;
}): Server;
