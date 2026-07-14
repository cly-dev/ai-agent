"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.harnessSensorsForWorkflowAction = void 0;
const empty_fill_sensor_1 = require("./empty-fill.sensor");
const empty_summary_sensor_1 = require("./empty-summary.sensor");
const tool_empty_sensor_1 = require("./tool-empty.sensor");
const SENSORS_BY_ACTION = {
    fetch_data: [tool_empty_sensor_1.toolEmptySensor],
    generate_and_push: [empty_fill_sensor_1.emptyFillSensor],
    summarize: [empty_summary_sensor_1.emptySummarySensor],
};
function harnessSensorsForWorkflowAction(action) {
    var _a;
    return (_a = SENSORS_BY_ACTION[action]) !== null && _a !== void 0 ? _a : [];
}
exports.harnessSensorsForWorkflowAction = harnessSensorsForWorkflowAction;
//# sourceMappingURL=index.js.map