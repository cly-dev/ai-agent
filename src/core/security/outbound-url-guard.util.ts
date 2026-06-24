import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
]);

function isPrivateOrReservedIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateOrReservedIpv6(normalized: string): boolean {
  const lower = normalized.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('fe80:')) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.local')) return true;
  return false;
}

function isBlockedIpHost(hostname: string): boolean {
  const version = isIP(hostname);
  if (version === 4) {
    const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
    if (parts.some((part) => Number.isNaN(part))) return true;
    return isPrivateOrReservedIpv4(parts);
  }
  if (version === 6) {
    return isPrivateOrReservedIpv6(hostname);
  }
  return false;
}

/**
 * 阻止服务端 fetch 访问内网/本机/云元数据地址，降低 SSRF 风险。
 * 仅允许 http(s) 协议；hostname 为 IP 时按私网段拦截。
 */
export function assertOutboundUrlAllowed(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException('url must be a valid absolute URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('url must use http or https');
  }

  const hostname = url.hostname.trim();
  if (isBlockedHostname(hostname) || isBlockedIpHost(hostname)) {
    throw new BadRequestException(
      'outbound requests to private or local addresses are not allowed',
    );
  }

  return url;
}
