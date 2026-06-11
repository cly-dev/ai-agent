function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** 会话内保留的最近回合叙事条数。 */
export function getSessionMemoryMaxEpisodes(): number {
  return readPositiveInt('SESSION_MEMORY_MAX_EPISODES', 8);
}

/** 会话内保留的数据工件条数。 */
export function getSessionMemoryMaxArtifacts(): number {
  return readPositiveInt('SESSION_MEMORY_MAX_ARTIFACTS', 12);
}

export const EPISODE_GOAL_MAX_CHARS = 240;
export const EPISODE_OUTCOME_MAX_CHARS = 600;
export const ARTIFACT_SUMMARY_MAX_CHARS = 480;

/** activeTask.observationLog 条数上限（约 snapshots × 50）。 */
export function getSessionMemoryMaxObservationSnapshots(): number {
  return readPositiveInt('SESSION_MEMORY_MAX_OBSERVATION_SNAPSHOTS', 4);
}

/** 会话级 observation ledger 条数上限（跨 turn 只读复用）。 */
export function getSessionMemoryMaxObservationLedgerEntries(): number {
  return readPositiveInt('SESSION_MEMORY_MAX_OBSERVATION_LEDGER', 200);
}
