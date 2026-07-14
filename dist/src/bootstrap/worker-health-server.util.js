"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkerHealthServer = void 0;
const node_http_1 = require("node:http");
const common_1 = require("@nestjs/common");
function startWorkerHealthServer(input) {
    var _a, _b, _c;
    const port = (_a = input === null || input === void 0 ? void 0 : input.port) !== null && _a !== void 0 ? _a : Number((_b = process.env.WORKER_HEALTH_PORT) !== null && _b !== void 0 ? _b : 3031);
    const serviceName = (_c = input === null || input === void 0 ? void 0 : input.serviceName) !== null && _c !== void 0 ? _c : 'omnix-worker';
    const server = (0, node_http_1.createServer)((req, res) => {
        if (req.url === '/health' || req.url === '/health/') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                service: serviceName,
                port,
                role: 'bullmq_langgraph_executor',
            }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    server.listen(port, () => {
        common_1.Logger.log(`${serviceName} health listening on http://localhost:${port}/health`, 'Bootstrap');
    });
    return server;
}
exports.startWorkerHealthServer = startWorkerHealthServer;
//# sourceMappingURL=worker-health-server.util.js.map