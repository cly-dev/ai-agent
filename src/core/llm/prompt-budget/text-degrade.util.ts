import { getPromptSkillExcerptChars } from './prompt-budget.constants';

export function excerptText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}… [excerpt len=${trimmed.length}]`;
}

export function degradeActiveSkillInToolDecision(
  text: string,
  level: 1 | 2,
): string {
  const skillMatch = text.match(/<active_skill>\s*([\s\S]*?)\s*<\/active_skill>/i);
  if (!skillMatch) {
    if (level === 2) {
      return extractToolDecisionMinimal(text);
    }
    return text;
  }
  const skillBody = skillMatch[1] ?? '';
  const skillReplacement =
    level === 1
      ? `<active_skill>\n${excerptText(skillBody, getPromptSkillExcerptChars())}\n</active_skill>`
      : `<active_skill>\n[skill discipline excerpt only — follow current_objective and observations]\n</active_skill>`;
  const replaced = text.replace(skillMatch[0], skillReplacement);
  return level === 2 ? extractToolDecisionMinimal(replaced) : replaced;
}

function extractToolDecisionMinimal(text: string): string {
  const objectiveMatch = text.match(
    /<current_objective>\s*([\s\S]*?)\s*<\/current_objective>/i,
  );
  const objective = objectiveMatch?.[1]?.trim() ?? '';
  const lines = [
    '<tool_decision_minimal>',
    objective ? `current_objective: ${objective}` : null,
    'Follow observations and tool_schema. Emit tool_calls or answer minimally.',
    '</tool_decision_minimal>',
  ].filter((line): line is string => line != null);
  return lines.join('\n');
}

export function degradePlainText(
  text: string,
  level: 1 | 2,
  maxCharsL1: number,
  maxCharsL2: number,
): string {
  if (level === 1) {
    return excerptText(text, maxCharsL1);
  }
  return excerptText(text, maxCharsL2);
}

export function compactToolSchemaJson(json: string): string {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) {
      return json;
    }
    const compact = parsed.map((row) => {
      if (row == null || typeof row !== 'object' || Array.isArray(row)) {
        return row;
      }
      const tool = row as Record<string, unknown>;
      return {
        name: tool.name,
        description:
          typeof tool.description === 'string'
            ? excerptText(tool.description, 200)
            : tool.description,
        role: tool.role,
        filters: tool.filters,
        returns: tool.returns,
      };
    });
    return JSON.stringify(compact);
  } catch {
    return json;
  }
}
