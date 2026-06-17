function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type SkillHostBridgeConfig = {
  reason?: string;
};

/** 从 Skill.config.hostBridge 读取可选 reason（埋点/日志，不驱动 UI）。 */
export function parseSkillHostBridgeConfig(
  skillConfig: unknown,
): SkillHostBridgeConfig | null {
  if (!isRecord(skillConfig)) {
    return null;
  }
  const hostBridge = skillConfig.hostBridge;
  if (!isRecord(hostBridge)) {
    return null;
  }
  const reason =
    typeof hostBridge.reason === 'string' ? hostBridge.reason.trim() : '';
  return reason ? { reason } : null;
}

/** 镜像入站 pageContext.metadata（透传，服务端不解释）。 */
export function resolveHostActionMetadata(
  pageContext?: { metadata?: Record<string, unknown> } | null,
): Record<string, unknown> | undefined {
  const metadata = pageContext?.metadata;
  if (!metadata || !isRecord(metadata)) {
    return undefined;
  }
  return Object.keys(metadata).length > 0 ? { ...metadata } : undefined;
}
