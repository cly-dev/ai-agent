import { OnModuleInit } from '@nestjs/common';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { SessionPrepareStore } from './session-prepare.store';
export declare class SessionRuntimeCacheHooksService implements OnModuleInit {
    private readonly invalidator;
    private readonly sessionPrepareStore;
    constructor(invalidator: RuntimeCacheInvalidator, sessionPrepareStore: SessionPrepareStore);
    onModuleInit(): void;
}
