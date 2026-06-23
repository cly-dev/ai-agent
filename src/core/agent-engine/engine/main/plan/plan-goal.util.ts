/** Plan goal 始终为用户本轮原话；Skill 描述进 constraints。 */

export function resolvePlanGoal(input: {
  userMessage: string;
  skillDescription?: string | null;
  skillName?: string | null;
}): string {
  const userMessage = input.userMessage.trim();
  if (userMessage) {
    return userMessage;
  }
  return (
    input.skillDescription?.trim() ||
    input.skillName?.trim() ||
    'Complete the user request'
  );
}

export function resolveSkillCapabilityConstraints(input: {
  skillDescription?: string | null;
  skillName?: string | null;
}): string[] {
  const desc = input.skillDescription?.trim();
  if (desc) {
    return [`Skill capability: ${desc}`];
  }
  const name = input.skillName?.trim();
  if (name) {
    return [`Skill: ${name}`];
  }
  return [];
}

export function mergePlanConstraints(
  base: string[],
  extra: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of [...base, ...extra]) {
    const trimmed = row.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function formatPlanConstraintsForPrompt(
  constraints: string[] | null | undefined,
): string | null {
  if (!constraints?.length) {
    return null;
  }
  return constraints.map((row) => `- ${row}`).join('\n');
}
