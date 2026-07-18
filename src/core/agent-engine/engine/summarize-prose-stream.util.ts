import {
  createSummarizeMessageStreamState,
  extractProseFromSummarizeLlmRaw,
  looksLikeBlocksJsonOutput,
  nextSanitizedSummarizeStreamDelta,
  processSummarizeMessageStreamChunk,
  sanitizeSummarizeUserFacingProse,
  summarizeStreamedProseFromState,
  type SummarizeMessageStreamState,
} from './message/message-blocks.util';
import { sanitizeLlmFinalOutput } from './llm-output-sanitize.util';
import {
  createLlmStreamRouterState,
  extractRoutedMessageFromLlmText,
  routeLlmStreamChunk,
  type LlmStreamRouterState,
} from './llm-stream-router.util';

export type SummarizeProseStreamCallbacks = {
  onProseDelta: (delta: string) => void;
  onThinkDelta?: (delta: string) => void;
};

/** summarize / plan present 共用的用户正文流式会话（think 路由 + sanitize delta/full）。 */
export type SummarizeProseStreamSession = {
  ingestLlmDelta: (contentDelta: string) => void;
  /**
   * reasoning_content 通道（DashScope thinking 等）：直通 think 出口，
   * 不进正文 sanitize / prose 流。与 content 内 <think> 标签路由互补。
   */
  ingestReasoningDelta: (reasoningDelta: string) => void;
  replayRoutedMessage: (routedMessage: string) => void;
  resolveUserMarkdown: (input: {
    llmFinal?: string;
    routedMessage?: string;
  }) => string;
  readonly sanitizedEmitted: string;
  readonly messageDeltaEmitted: boolean;
  /**
   * 确认无法增量流式的 blocks 协议后停 prose delta，定稿由 authoritative full 覆盖。
   * json_text 仍可推 content 字段 delta，不会因此 superseded。
   */
  readonly proseStreamSuperseded: boolean;
};

/**
 * 仅在确认无法增量流式的 blocks 协议时停 prose delta。
 * json_text 可从 content 继续推 delta；buffer 仅在已出现协议键时 superseded。
 */
function shouldStopProseStreamForBlocksProtocol(
  state: SummarizeMessageStreamState,
): boolean {
  if (state.mode === 'json_text') {
    return false;
  }
  if (state.mode === 'buffer') {
    const remainder = state.messageText.slice(state.emittedProseLength);
    return (
      looksLikeBlocksJsonOutput(remainder) ||
      looksLikeBlocksJsonOutput(state.messageText)
    );
  }
  return false;
}

export function createSummarizeProseStreamSession(
  callbacks: SummarizeProseStreamCallbacks,
): SummarizeProseStreamSession {
  let streamRouter: LlmStreamRouterState = createLlmStreamRouterState();
  let summarizeState: SummarizeMessageStreamState =
    createSummarizeMessageStreamState();
  let sanitizedEmitted = '';
  let messageDeltaEmitted = false;
  let proseStreamSuperseded = false;

  const emitProseProgress = (state: SummarizeMessageStreamState) => {
    if (proseStreamSuperseded) {
      return;
    }
    const proseSnapshot = summarizeStreamedProseFromState(state);
    if (!proseSnapshot) {
      return;
    }
    const next = nextSanitizedSummarizeStreamDelta(
      proseSnapshot,
      sanitizedEmitted,
    );
    sanitizedEmitted = next.emitted;
    if (!next.delta) {
      return;
    }
    messageDeltaEmitted = true;
    callbacks.onProseDelta(next.delta);
  };

  const markProseStreamSuperseded = (state: SummarizeMessageStreamState) => {
    if (proseStreamSuperseded) {
      return;
    }
    if (!shouldStopProseStreamForBlocksProtocol(state)) {
      return;
    }
    proseStreamSuperseded = true;
  };

  const replayRoutedMessage = (routedMessage: string) => {
    if (proseStreamSuperseded) {
      return;
    }
    let replayState = createSummarizeMessageStreamState();
    for (const ch of routedMessage) {
      const processed = processSummarizeMessageStreamChunk(replayState, ch);
      replayState = processed.state;
      markProseStreamSuperseded(replayState);
      if (proseStreamSuperseded) {
        break;
      }
      if (processed.delta) {
        emitProseProgress(replayState);
      }
    }
    summarizeState = replayState;
  };

  return {
    get sanitizedEmitted() {
      return sanitizedEmitted;
    },
    get messageDeltaEmitted() {
      return messageDeltaEmitted;
    },
    get proseStreamSuperseded() {
      return proseStreamSuperseded;
    },
    ingestReasoningDelta(reasoningDelta: string) {
      if (!reasoningDelta) {
        return;
      }
      callbacks.onThinkDelta?.(reasoningDelta);
    },
    ingestLlmDelta(contentDelta: string) {
      if (!contentDelta || proseStreamSuperseded) {
        return;
      }
      const routed = routeLlmStreamChunk(streamRouter, contentDelta);
      streamRouter = routed.state;
      if (routed.think) {
        callbacks.onThinkDelta?.(routed.think);
      }
      if (!routed.message) {
        return;
      }
      const processed = processSummarizeMessageStreamChunk(
        summarizeState,
        routed.message,
      );
      summarizeState = processed.state;
      markProseStreamSuperseded(summarizeState);
      if (proseStreamSuperseded || !processed.delta) {
        return;
      }
      emitProseProgress(summarizeState);
    },
    replayRoutedMessage,
    resolveUserMarkdown(input) {
      const llmFinal = input.llmFinal?.trim() ?? '';
      const routedMessage =
        input.routedMessage?.trim() ||
        (llmFinal ? extractRoutedMessageFromLlmText(llmFinal) : '');
      if (!messageDeltaEmitted && routedMessage) {
        replayRoutedMessage(routedMessage);
      }
      const fromState = sanitizeSummarizeUserFacingProse(
        sanitizeLlmFinalOutput(summarizeStreamedProseFromState(summarizeState)),
      ).trim();
      if (fromState) {
        return fromState;
      }
      if (sanitizedEmitted.trim()) {
        return sanitizeSummarizeUserFacingProse(sanitizedEmitted).trim();
      }
      return sanitizeSummarizeUserFacingProse(
        sanitizeLlmFinalOutput(routedMessage || llmFinal),
      ).trim();
    },
  };
}

/** streamChat 结束后解析用户可见正文（无 delta 时在 resolve 内 replay）。 */
export function finalizeSummarizeProseStreamAfterLlm(input: {
  session: SummarizeProseStreamSession;
  rawStreamedText: string;
  rawResultText: string;
  onReplay?: (reason: 'invoke_fallback' | 'buffer_or_json_no_delta') => void;
}): { userMarkdown: string; routedMessage: string; rawLlmSource: string } {
  const rawStreamedText = input.rawStreamedText.trim();
  const rawResultText = input.rawResultText.trim();
  const rawLlmSource = rawStreamedText || rawResultText;
  const routedMessage = rawLlmSource
    ? extractRoutedMessageFromLlmText(rawLlmSource)
    : '';
  if (!input.session.messageDeltaEmitted && routedMessage) {
    input.onReplay?.(
      rawStreamedText ? 'buffer_or_json_no_delta' : 'invoke_fallback',
    );
  }
  const userMarkdown = input.session.resolveUserMarkdown({
    llmFinal: rawLlmSource,
    routedMessage,
  });
  return { userMarkdown, routedMessage, rawLlmSource };
}

/** 定稿时合并流式正文与 raw 提取，取更长且更完整的用户可见 prose。 */
export function resolveSummarizeLlmProseForStorage(input: {
  proseSession: SummarizeProseStreamSession;
  rawSource: string;
  userMarkdown: string;
  routedMessage: string;
  fallbackPlainText: string;
}): string {
  let prose = '';
  if (
    input.proseSession.messageDeltaEmitted &&
    input.proseSession.sanitizedEmitted.trim()
  ) {
    prose = sanitizeSummarizeUserFacingProse(
      input.proseSession.sanitizedEmitted,
    ).trim();
  }
  if (!prose) {
    prose = sanitizeSummarizeUserFacingProse(
      sanitizeLlmFinalOutput(
        input.userMarkdown ||
          input.routedMessage ||
          input.rawSource ||
          input.fallbackPlainText,
      ),
    ).trim();
  }
  const extracted = extractProseFromSummarizeLlmRaw(input.rawSource);
  if (extracted && extracted.length > prose.length) {
    return extracted;
  }
  return prose;
}
