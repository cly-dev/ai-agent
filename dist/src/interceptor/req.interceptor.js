"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReqInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let ReqInterceptor = class ReqInterceptor {
    intercept(context, next) {
        if (this.shouldBypass(context)) {
            return next.handle();
        }
        return next.handle().pipe((0, rxjs_1.map)((data) => {
            return {
                data,
                status: 200,
                message: 'success',
            };
        }));
    }
    shouldBypass(context) {
        var _a, _b;
        if (context.getType() !== 'http') {
            return false;
        }
        const req = context.switchToHttp().getRequest();
        const path = ((_a = req.url) !== null && _a !== void 0 ? _a : '').split('?')[0];
        if (path.endsWith('/stream')) {
            return true;
        }
        const accept = (_b = req.headers) === null || _b === void 0 ? void 0 : _b.accept;
        if (typeof accept === 'string' && accept.includes('text/event-stream')) {
            return true;
        }
        if (Array.isArray(accept) && accept.some((v) => v.includes('text/event-stream'))) {
            return true;
        }
        return false;
    }
};
ReqInterceptor = __decorate([
    (0, common_1.Injectable)()
], ReqInterceptor);
exports.ReqInterceptor = ReqInterceptor;
//# sourceMappingURL=req.interceptor.js.map