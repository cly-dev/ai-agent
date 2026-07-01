import type { SessionGoaSection } from './prompt-budget.types';
import { getPromptGoaMaxEpisodesL1 } from './prompt-budget.constants';
import { excerptText } from './text-degrade.util';

export function detectSessionGoaSection(text: string): SessionGoaSection {
  if (text.includes('<session_goa_coverage>')) {
    return 'coverage';
  }
  if (text.includes('<recent_episodes>')) {
    return 'episodes';
  }
  if (text.includes('<artifact_summaries>')) {
    return 'artifacts';
  }
  if (text.includes('<observation_inventory>')) {
    return 'inventory';
  }
  if (text.includes('<active_task>')) {
    return 'active_task';
  }
  if (text.includes('<session_entities>')) {
    return 'entities';
  }
  return 'unknown';
}

function trimEpisodesBlock(text: string, maxEpisodes: number): string {
  const match = text.match(/<recent_episodes>\s*([\s\S]*?)\s*<\/recent_episodes>/i);
  if (!match) {
    return excerptText(text, 2000);
  }
  const body = match[1] ?? '';
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '));
  if (lines.length <= maxEpisodes) {
    return text;
  }
  const kept = lines.slice(-maxEpisodes);
  return `<recent_episodes>\n${kept.join('\n')}\n</recent_episodes>`;
}

export function degradeSessionGoaText(
  text: string,
  section: SessionGoaSection,
  level: 1 | 2 | 3,
): string | null {
  if (level === 1) {
    if (section === 'episodes') {
      return trimEpisodesBlock(text, getPromptGoaMaxEpisodesL1());
    }
    return text;
  }
  if (level === 2) {
    if (section === 'active_task' || section === 'inventory') {
      return text;
    }
    return null;
  }
  if (level === 3) {
    if (section === 'coverage') {
      return '<session_goa_coverage>\ncoverage=degraded_session_goa\n</session_goa_coverage>';
    }
    return null;
  }
  return text;
}

export function degradeSessionHistorySummary(text: string, level: 1 | 2): string | null {
  if (level === 1) {
    return excerptText(text, Math.max(400, Math.floor(text.length * 0.5)));
  }
  return null;
}

export function degradePageContext(text: string, level: 1 | 2): string {
  if (level === 1) {
    return excerptText(text, 4000);
  }
  const idMatch = text.match(/\bid[=:]\s*["']?([^"'\s},]+)/i);
  const titleMatch = text.match(/title[=:]\s*["']?([^"'\n},]+)/i);
  const parts = ['<page_context_minimal>'];
  if (idMatch?.[1]) {
    parts.push(`entityId=${idMatch[1]}`);
  }
  if (titleMatch?.[1]) {
    parts.push(`title=${titleMatch[1].trim()}`);
  }
  parts.push('Inline large fields omitted due to prompt budget.');
  parts.push('</page_context_minimal>');
  return parts.join('\n');
}
