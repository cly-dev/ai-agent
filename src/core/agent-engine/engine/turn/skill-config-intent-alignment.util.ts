import type {
  SkillIntentMismatchCode,
  SkillIntentMismatchPolicy,
} from './skill-intent-alignment.types';

const MISMATCH_CODES: SkillIntentMismatchCode[] = [
  'read_intent_vs_http_skill',
  'read_intent_vs_host_only_skill',
  'write_intent_vs_http_only_skill',
  'write_intent_vs_no_host_skill',
  'direct_answer_vs_any_skill',
  'orchestrated_http_vs_host_only_skill',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function parsePolicy(value: unknown): SkillIntentMismatchPolicy | null {
  if (value === 'intent_first' || value === 'clarify') {
    return value;
  }
  return null;
}

/**
 * 从 Skill.config.intentMismatchPolicy 读取按 code 覆盖的默认策略。
 *
 * @example
 * { "intentMismatchPolicy": { "write_intent_vs_http_only_skill": "intent_first" } }
 */
export function parseSkillIntentMismatchPolicyOverrides(
  config: unknown,
): Partial<Record<SkillIntentMismatchCode, SkillIntentMismatchPolicy>> {
  if (!isRecord(config)) {
    return {};
  }
  const raw = config.intentMismatchPolicy;
  if (!isRecord(raw)) {
    return {};
  }
  const overrides: Partial<
    Record<SkillIntentMismatchCode, SkillIntentMismatchPolicy>
  > = {};
  for (const code of MISMATCH_CODES) {
    const policy = parsePolicy(raw[code]);
    if (policy) {
      overrides[code] = policy;
    }
  }
  return overrides;
}
