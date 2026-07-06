"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OMNIX_DEPLOYMENT_UNITS = exports.OMNIX_SERVICES = void 0;
exports.OMNIX_SERVICES = {
    api: { name: 'omnix-api', port: 3020 },
    runtime: { name: 'omnix-runtime', port: 3030 },
    worker: { name: 'omnix-worker', port: 3031 },
    page: { name: 'omnix-page', port: 3040 },
    agentServerLegacy: { name: '@omnix/agent-server', port: 3030 },
};
exports.OMNIX_DEPLOYMENT_UNITS = [
    'api',
    'runtime',
    'worker',
    'page',
];
//# sourceMappingURL=services.js.map