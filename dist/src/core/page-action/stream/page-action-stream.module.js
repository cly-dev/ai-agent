"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionStreamModule = void 0;
const common_1 = require("@nestjs/common");
const page_action_run_event_bus_types_1 = require("./page-action-run-event-bus.types");
const page_action_run_stream_hub_1 = require("./page-action-run-stream.hub");
let PageActionStreamModule = class PageActionStreamModule {
};
PageActionStreamModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            page_action_run_stream_hub_1.PageActionRunStreamHub,
            {
                provide: page_action_run_event_bus_types_1.PAGE_ACTION_RUN_EVENT_BUS,
                useExisting: page_action_run_stream_hub_1.PageActionRunStreamHub,
            },
        ],
        exports: [page_action_run_stream_hub_1.PageActionRunStreamHub, page_action_run_event_bus_types_1.PAGE_ACTION_RUN_EVENT_BUS],
    })
], PageActionStreamModule);
exports.PageActionStreamModule = PageActionStreamModule;
//# sourceMappingURL=page-action-stream.module.js.map