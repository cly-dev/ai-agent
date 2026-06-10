/** 从 Redis session context 移除已迁入 DB 的旧版 GOA 字段。 */
export function stripLegacyGoaFieldsFromContext(
  current: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...current };
  delete next.recentEpisodes;
  delete next.sessionArtifacts;
  delete next.taskState;
  delete next.resumeTaskPlan;
  delete next.observationSnapshots;
  delete next.workingMemory;
  return next;
}
