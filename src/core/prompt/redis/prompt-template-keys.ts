import { REDIS_KEY_PREFIX } from '../../memory/memory.constants';

/** 某 scope 下当前生效的提示词（与 DB isActive 行一一对应） */
export function promptTemplateActiveKey(
  key: string,
  appClientId: number | null | undefined,
  agentId: number | null | undefined,
  locale: string,
): string {
  const app = appClientId == null ? '_' : String(appClientId);
  const agent = agentId == null ? '_' : String(agentId);
  return `${REDIS_KEY_PREFIX}prompt:active:${key}:${app}:${agent}:${locale}`;
}
