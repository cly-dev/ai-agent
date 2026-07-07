import { Injectable, Logger } from '@nestjs/common';
import { assertOutboundUrlAllowed } from '../security/outbound-url-guard.util';
import {
  OutboundHttpError,
  type OutboundHttpPolicy,
} from './outbound-http.types';

@Injectable()
export class OutboundHttpService {
  private readonly logger = new Logger(OutboundHttpService.name);

  async fetchWithPolicy(
    url: string | URL,
    init: RequestInit,
    policy: OutboundHttpPolicy,
  ): Promise<Response> {
    const resolvedUrl = typeof url === 'string' ? url : url.toString();
    if (policy.ssrf !== false) {
      try {
        assertOutboundUrlAllowed(resolvedUrl);
      } catch (error) {
        throw new OutboundHttpError(
          error instanceof Error ? error.message : String(error),
          'ssrf',
        );
      }
    }

    const deadlineController = new AbortController();
    const upstreamSignals: AbortSignal[] = [];
    if (policy.signal) {
      upstreamSignals.push(policy.signal);
    }

    const onUpstreamAbort = () => deadlineController.abort();
    for (const signal of upstreamSignals) {
      if (signal.aborted) {
        deadlineController.abort();
        break;
      }
      signal.addEventListener('abort', onUpstreamAbort, { once: true });
    }

    const timer = setTimeout(() => deadlineController.abort(), policy.timeoutMs);
    try {
      return await fetch(resolvedUrl, {
        ...init,
        signal: deadlineController.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      if (aborted) {
        if (policy.signal?.aborted) {
          throw new OutboundHttpError('request aborted', 'abort');
        }
        const message = `request timed out after ${policy.timeoutMs}ms`;
        if (policy.label) {
          this.logger.warn(`[${policy.label}] ${message} url=${resolvedUrl}`);
        }
        throw new OutboundHttpError(message, 'timeout');
      }
      const message = this.formatFetchError(error);
      if (policy.label) {
        this.logger.warn(`[${policy.label}] ${message} url=${resolvedUrl}`);
      }
      throw new OutboundHttpError(message, 'network');
    } finally {
      clearTimeout(timer);
      for (const signal of upstreamSignals) {
        signal.removeEventListener('abort', onUpstreamAbort);
      }
    }
  }

  private formatFetchError(error: unknown): string {
    if (!(error instanceof Error)) {
      return String(error);
    }
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) {
      const code =
        'code' in cause && typeof cause.code === 'string' ? cause.code : '';
      return code ? `${cause.message} (${code})` : cause.message;
    }
    return error.message;
  }
}
