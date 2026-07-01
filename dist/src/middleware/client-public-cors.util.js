"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClientPublicCorsPreflight = exports.applyClientPublicCors = exports.shouldApplyClientPublicCors = void 0;
const client_cors_origins_util_1 = require("./client-cors-origins.util");
const client_public_api_paths_1 = require("./client-public-api-paths");
const DEFAULT_ALLOW_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-App-Dsn',
    'X-Account-Token',
    'Accept',
    'Accept-Language',
    'Cache-Control',
    'Last-Event-ID',
].join(', ');
function shouldApplyClientPublicCors(req) {
    return (0, client_public_api_paths_1.matchesClientPublicApiPath)(req.path);
}
exports.shouldApplyClientPublicCors = shouldApplyClientPublicCors;
function applyClientPublicCors(req, res) {
    const origin = req.headers.origin;
    const allowedOrigin = (0, client_cors_origins_util_1.resolveAllowedClientCorsOrigin)(typeof origin === 'string' ? origin : undefined);
    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    else if (typeof origin !== 'string' || origin.length === 0) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    const requestedHeaders = req.headers['access-control-request-headers'];
    if (typeof requestedHeaders === 'string' && requestedHeaders.trim().length > 0) {
        res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
    }
    else {
        res.setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOW_HEADERS);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
}
exports.applyClientPublicCors = applyClientPublicCors;
function handleClientPublicCorsPreflight(req, res) {
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return true;
    }
    return false;
}
exports.handleClientPublicCorsPreflight = handleClientPublicCorsPreflight;
//# sourceMappingURL=client-public-cors.util.js.map