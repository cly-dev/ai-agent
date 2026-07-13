"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertOutboundUrlAllowed = void 0;
const common_1 = require("@nestjs/common");
const node_net_1 = require("node:net");
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
    'metadata.goog',
]);
function isPrivateOrReservedIpv4(parts) {
    const [a, b] = parts;
    if (a === 0)
        return true;
    if (a === 10)
        return true;
    if (a === 127)
        return true;
    if (a === 169 && b === 254)
        return true;
    if (a === 172 && b >= 16 && b <= 31)
        return true;
    if (a === 192 && b === 168)
        return true;
    if (a === 100 && b >= 64 && b <= 127)
        return true;
    return false;
}
function isPrivateOrReservedIpv6(normalized) {
    const lower = normalized.toLowerCase();
    if (lower === '::1' || lower === '::')
        return true;
    if (lower.startsWith('fc') || lower.startsWith('fd'))
        return true;
    if (lower.startsWith('fe80:'))
        return true;
    return false;
}
function isBlockedHostname(hostname) {
    const host = hostname.trim().toLowerCase().replace(/\.$/, '');
    if (!host)
        return true;
    if (BLOCKED_HOSTNAMES.has(host))
        return true;
    if (host.endsWith('.localhost') || host.endsWith('.local'))
        return true;
    return false;
}
function isBlockedIpHost(hostname) {
    const version = (0, node_net_1.isIP)(hostname);
    if (version === 4) {
        const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
        if (parts.some((part) => Number.isNaN(part)))
            return true;
        return isPrivateOrReservedIpv4(parts);
    }
    if (version === 6) {
        return isPrivateOrReservedIpv6(hostname);
    }
    return false;
}
function assertOutboundUrlAllowed(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch (_a) {
        throw new common_1.BadRequestException('url must be a valid absolute URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new common_1.BadRequestException('url must use http or https');
    }
    const hostname = url.hostname.trim();
    if (isBlockedHostname(hostname) || isBlockedIpHost(hostname)) {
        throw new common_1.BadRequestException('outbound requests to private or local addresses are not allowed');
    }
    return url;
}
exports.assertOutboundUrlAllowed = assertOutboundUrlAllowed;
//# sourceMappingURL=outbound-url-guard.util.js.map