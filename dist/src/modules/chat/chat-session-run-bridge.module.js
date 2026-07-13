"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSessionRunBridgeModule = void 0;
const common_1 = require("@nestjs/common");
const run_event_publisher_1 = require("../../core/session-run/run-event.publisher");
const write_confirmation_port_1 = require("../../core/session-run/write-confirmation.port");
const chat_events_module_1 = require("./chat-events.module");
const chat_run_event_publisher_1 = require("./chat-run-event.publisher");
const chat_write_confirmation_port_1 = require("./chat-write-confirmation.port");
let ChatSessionRunBridgeModule = class ChatSessionRunBridgeModule {
};
ChatSessionRunBridgeModule = __decorate([
    (0, common_1.Module)({
        imports: [chat_events_module_1.ChatEventsModule],
        providers: [
            chat_run_event_publisher_1.ChatRunEventPublisher,
            chat_write_confirmation_port_1.ChatWriteConfirmationPort,
            {
                provide: run_event_publisher_1.RunEventPublisher,
                useExisting: chat_run_event_publisher_1.ChatRunEventPublisher,
            },
            {
                provide: write_confirmation_port_1.WriteConfirmationPort,
                useExisting: chat_write_confirmation_port_1.ChatWriteConfirmationPort,
            },
        ],
        exports: [run_event_publisher_1.RunEventPublisher, write_confirmation_port_1.WriteConfirmationPort],
    })
], ChatSessionRunBridgeModule);
exports.ChatSessionRunBridgeModule = ChatSessionRunBridgeModule;
//# sourceMappingURL=chat-session-run-bridge.module.js.map