"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEventsModule = void 0;
const common_1 = require("@nestjs/common");
const chat_events_service_1 = require("./chat-events.service");
const pending_write_confirmation_store_1 = require("./pending-write-confirmation.store");
let ChatEventsModule = class ChatEventsModule {
};
ChatEventsModule = __decorate([
    (0, common_1.Module)({
        providers: [chat_events_service_1.ChatEventsService, pending_write_confirmation_store_1.PendingWriteConfirmationStore],
        exports: [chat_events_service_1.ChatEventsService, pending_write_confirmation_store_1.PendingWriteConfirmationStore],
    })
], ChatEventsModule);
exports.ChatEventsModule = ChatEventsModule;
//# sourceMappingURL=chat-events.module.js.map