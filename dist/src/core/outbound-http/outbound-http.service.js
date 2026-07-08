"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OutboundHttpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboundHttpService = void 0;
const common_1 = require("@nestjs/common");
const outbound_url_guard_util_1 = require("../security/outbound-url-guard.util");
const outbound_http_types_1 = require("./outbound-http.types");
let OutboundHttpService = OutboundHttpService_1 = class OutboundHttpService {
    constructor() {
        this.logger = new common_1.Logger(OutboundHttpService_1.name);
    }
    async fetchWithPolicy(url, init, policy) {
        var _a;
        const resolvedUrl = typeof url === 'string' ? url : url.toString();
        if (policy.ssrf !== false) {
            try {
                (0, outbound_url_guard_util_1.assertOutboundUrlAllowed)(resolvedUrl);
            }
            catch (error) {
                throw new outbound_http_types_1.OutboundHttpError(error instanceof Error ? error.message : String(error), 'ssrf');
            }
        }
        const deadlineController = new AbortController();
        const upstreamSignals = [];
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
            return await fetch(resolvedUrl, Object.assign(Object.assign({}, init), { signal: deadlineController.signal }));
        }
        catch (error) {
            const aborted = error instanceof Error && error.name === 'AbortError';
            if (aborted) {
                if ((_a = policy.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
                    throw new outbound_http_types_1.OutboundHttpError('request aborted', 'abort');
                }
                const message = `request timed out after ${policy.timeoutMs}ms`;
                if (policy.label) {
                    this.logger.warn(`[${policy.label}] ${message} url=${resolvedUrl}`);
                }
                throw new outbound_http_types_1.OutboundHttpError(message, 'timeout');
            }
            const message = this.formatFetchError(error);
            if (policy.label) {
                this.logger.warn(`[${policy.label}] ${message} url=${resolvedUrl}`);
            }
            throw new outbound_http_types_1.OutboundHttpError(message, 'network');
        }
        finally {
            clearTimeout(timer);
            for (const signal of upstreamSignals) {
                signal.removeEventListener('abort', onUpstreamAbort);
            }
        }
    }
    formatFetchError(error) {
        if (!(error instanceof Error)) {
            return String(error);
        }
        const cause = error.cause;
        if (cause instanceof Error) {
            const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
            return code ? `${cause.message} (${code})` : cause.message;
        }
        return error.message;
    }
};
OutboundHttpService = OutboundHttpService_1 = __decorate([
    (0, common_1.Injectable)()
], OutboundHttpService);
exports.OutboundHttpService = OutboundHttpService;
//# sourceMappingURL=outbound-http.service.js.map