import type { DegradeLevel, PromptBlock } from './prompt-budget.types';
import {
  getPromptAgentExcerptChars,
  getPromptAgentExcerptCharsL2,
  getPromptHistoryMaxTurnsL0,
} from './prompt-budget.constants';
import {
  degradeObservations,
} from './observation-degrade.util';
import {
  degradePageContext,
  degradeSessionGoaText,
  degradeSessionHistorySummary,
} from './goa-degrade.util';
import {
  compactToolSchemaJson,
  degradeActiveSkillInToolDecision,
  degradePlainText,
  excerptText,
} from './text-degrade.util';

export function applyDegradeToBlock(
  block: PromptBlock,
  level: DegradeLevel,
): PromptBlock {
  if (level === 0) {
    return { ...block, degradeLevel: 0, payload: clonePayload(block.payload) };
  }
  if (level === 4) {
    return { ...block, degradeLevel: 4, payload: { type: 'text', text: '' } };
  }

  const payload = clonePayload(block.payload);

  switch (block.kind) {
    case 'current_run_observations':
    case 'working_memory_observations':
      if (payload.type === 'observations' && level >= 1 && level <= 3) {
        payload.observations = degradeObservations(
          payload.observations,
          level as 1 | 2 | 3,
        );
      } else if (payload.type === 'text' && level >= 1) {
        payload.text =
          level === 1
            ? excerptText(payload.text, 8000)
            : level === 2
              ? excerptText(payload.text, 3000)
              : excerptText(payload.text, 500);
      }
      break;
    case 'tool_decision':
      if (payload.type === 'text') {
        if (level === 1) {
          payload.text = degradeActiveSkillInToolDecision(payload.text, 1);
        } else if (level === 2) {
          payload.text = degradeActiveSkillInToolDecision(payload.text, 2);
        }
      }
      break;
    case 'tool_schema':
    case 'host_tool_schema':
      if (payload.type === 'tool_schema') {
        if (level === 1 || level === 2) {
          payload.json = compactToolSchemaJson(payload.json);
        }
      }
      break;
    case 'agent_prompt':
      if (payload.type === 'text') {
        payload.text =
          level === 1
            ? degradePlainText(
                payload.text,
                1,
                getPromptAgentExcerptChars(),
                getPromptAgentExcerptCharsL2(),
              )
            : degradePlainText(
                payload.text,
                2,
                getPromptAgentExcerptChars(),
                getPromptAgentExcerptCharsL2(),
              );
      }
      break;
    case 'response_style':
    case 'message_blocks_spec':
    case 'user_memory':
    case 'other':
    case 'tool_result_legacy':
      if (payload.type === 'text') {
        if (level === 1) {
          payload.text = excerptText(payload.text, 2000);
        } else if (level === 2) {
          payload.text = '';
        }
      }
      break;
    case 'session_history_summary':
      if (payload.type === 'text') {
        const degraded =
          level === 1
            ? degradeSessionHistorySummary(payload.text, 1)
            : degradeSessionHistorySummary(payload.text, 2);
        payload.text = degraded ?? '';
      }
      break;
    case 'session_history_guide':
      if (payload.type === 'text' && level === 1) {
        payload.text = excerptText(payload.text, 1200);
      }
      break;
    case 'session_history_turns':
      if (payload.type === 'text') {
        payload.text = excerptText(
          payload.text,
          level === 1 ? 3000 : level === 2 ? 1500 : 800,
        );
      }
      break;
    case 'session_goa':
      if (payload.type === 'session_goa') {
        const degraded = degradeSessionGoaText(
          payload.text,
          payload.section,
          level as 1 | 2 | 3,
        );
        payload.text = degraded ?? '';
      }
      break;
    case 'page_context':
      if (payload.type === 'text') {
        payload.text = degradePageContext(payload.text, level as 1 | 2);
      }
      break;
    case 'plan_context':
      if (payload.type === 'text' && level === 1) {
        const objective = extractTaggedContent(payload.text, 'current_objective')
          ?? extractTaggedContent(payload.text, 'plan_context');
        payload.text = objective
          ? `<plan_context>\n${objective}\n</plan_context>`
          : excerptText(payload.text, 1500);
      }
      break;
    case 'pending_write_tool_call':
      if (payload.type === 'text' && level === 1) {
        payload.text = excerptText(payload.text, 2000);
      }
      break;
    case 'summarize_context':
      if (payload.type === 'text') {
        payload.text =
          level === 1
            ? excerptText(payload.text, 4000)
            : level === 2
              ? excerptText(payload.text, 1500)
              : payload.text;
      }
      break;
    default:
      break;
  }

  return { ...block, degradeLevel: level, payload };
}

function extractTaggedContent(content: string, tag: string): string | null {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const start = content.indexOf(open);
  if (start < 0) {
    return null;
  }
  const end = content.indexOf(close, start + open.length);
  if (end < 0) {
    return null;
  }
  return content.slice(start + open.length, end).trim();
}

function clonePayload(
  payload: PromptBlock['payload'],
): PromptBlock['payload'] {
  if (payload.type === 'observations') {
    return {
      type: 'observations',
      preamble: payload.preamble,
      observations: payload.observations.map((row) => ({ ...row, records: row.records?.map((r) => ({ ...r })) })),
    };
  }
  if (payload.type === 'tool_schema') {
    return { type: 'tool_schema', json: payload.json };
  }
  if (payload.type === 'session_goa') {
    return { type: 'session_goa', section: payload.section, text: payload.text };
  }
  return { type: 'text', text: payload.text };
}

export function mergeSessionHistoryTurnBlocks(blocks: PromptBlock[]): PromptBlock[] {
  const turnBlocks = blocks.filter((b) => b.kind === 'session_history_turns');
  if (turnBlocks.length <= getPromptHistoryMaxTurnsL0()) {
    return blocks;
  }
  const max = getPromptHistoryMaxTurnsL0();
  const keptIds = new Set(turnBlocks.slice(-max).map((row) => row.id));
  return blocks.filter(
    (block) => block.kind !== 'session_history_turns' || keptIds.has(block.id),
  );
}
