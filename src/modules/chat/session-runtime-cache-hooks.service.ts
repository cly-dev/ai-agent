import { Injectable, OnModuleInit } from '@nestjs/common';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { SessionPrepareStore } from './session-prepare.store';

@Injectable()
export class SessionRuntimeCacheHooksService implements OnModuleInit {
  constructor(
    private readonly invalidator: RuntimeCacheInvalidator,
    private readonly sessionPrepareStore: SessionPrepareStore,
  ) {}

  onModuleInit(): void {
    this.invalidator.registerSessionRuntimeHooks({
      invalidateSnapshotsForAgent: (agentId) =>
        this.sessionPrepareStore.invalidateSnapshotsForAgent(agentId),
      invalidateSnapshotsContainingToolIds: (toolIds) =>
        this.sessionPrepareStore.invalidateSnapshotsContainingToolIds(toolIds),
      deleteSession: (sessionId) =>
        this.sessionPrepareStore.delete(sessionId),
    });
  }
}
