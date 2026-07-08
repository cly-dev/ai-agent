"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_public_cors_util_1 = require("../middleware/client-public-cors.util");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        var _a;
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        try {
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let message = 'system busy';
            let data = null;
            if (exception instanceof common_1.HttpException) {
                status = exception.getStatus();
                const exceptionResponse = exception.getResponse();
                data = exceptionResponse;
                if (typeof exceptionResponse === 'string') {
                    message = exceptionResponse;
                }
                else if (typeof exceptionResponse === 'object' && exceptionResponse) {
                    const rawMessage = exceptionResponse.message;
                    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
                        message = rawMessage[0];
                    }
                    else if (typeof rawMessage === 'string') {
                        message = rawMessage;
                    }
                }
            }
            this.logException(exception, req, status, message);
            (0, client_public_cors_util_1.applyHttpCors)(req, res);
            if (this.shouldReturnOpenAiCompatibleError(req)) {
                res.status(status).send({
                    error: {
                        message,
                        type: status >= 500 ? 'server_error' : 'invalid_request_error',
                        code: status,
                    },
                });
                return;
            }
            res.status(200).send({
                status,
                data,
                message,
            });
        }
        catch (filterError) {
            this.logger.error(`Exception filter failed: ${req.method} ${(_a = req.originalUrl) !== null && _a !== void 0 ? _a : req.url}`, filterError instanceof Error ? filterError.stack : String(filterError));
            (0, client_public_cors_util_1.applyHttpCors)(req, res);
            res.status(200).send({
                status: 500,
                data: null,
                message: 'system busy',
            });
        }
    }
    shouldReturnOpenAiCompatibleError(req) {
        var _a;
        const path = ((_a = req.originalUrl) !== null && _a !== void 0 ? _a : req.url).split('?')[0];
        return (req.method === 'POST' &&
            path === '/page-agent/compatible-mode/v1/chat/completions');
    }
    logException(exception, req, status, message) {
        var _a;
        const method = req.method;
        const path = (_a = req.originalUrl) !== null && _a !== void 0 ? _a : req.url;
        const prefix = `${method} ${path} -> ${status} ${message}`;
        if (exception instanceof common_1.HttpException && status < 500) {
            this.logger.warn(prefix);
            return;
        }
        if (exception instanceof Error) {
            this.logger.error(prefix, exception.stack);
            return;
        }
        this.logger.error(prefix, String(exception));
    }
};
HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
exports.HttpExceptionFilter = HttpExceptionFilter;
//# sourceMappingURL=http.exception.js.map