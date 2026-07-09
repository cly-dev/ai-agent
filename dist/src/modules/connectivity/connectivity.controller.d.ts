import { ConnectivityService } from './connectivity.service';
import { RunConnectivityChecksDto } from './dto/run-connectivity-checks.dto';
export declare class ConnectivityController {
    private readonly service;
    constructor(service: ConnectivityService);
    checkDatabase(): Promise<import("./connectivity.types").ConnectivityCheckResult>;
    checkRedis(): Promise<import("./connectivity.types").ConnectivityCheckResult>;
    checkLlmChat(): Promise<import("./connectivity.types").ConnectivityCheckResult>;
    checkLlmEmbedding(): Promise<import("./connectivity.types").ConnectivityCheckResult>;
    runBatch(body: RunConnectivityChecksDto): Promise<import("./connectivity.types").ConnectivityBatchResult>;
    summary(): Promise<import("./connectivity.types").ConnectivityBatchResult>;
}
