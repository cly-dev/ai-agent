import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';
export declare class PendingWriteConfirmationStore {
    private readonly redis;
    private readonly logger;
    private readonly memory;
    constructor(redis: RedisConnectionService);
    set(snapshot: PendingWriteConfirmationSnapshot): Promise<void>;
    get(sessionId: string, userId: number): Promise<PendingWriteConfirmationSnapshot | null>;
    consume(sessionId: string, userId: number): Promise<PendingWriteConfirmationSnapshot | null>;
    clear(sessionId: string): Promise<void>;
    private parseAndValidate;
}
