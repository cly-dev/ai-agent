"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImagePanelVisionEnabled = void 0;
const runtime_env_util_1 = require("../security/runtime-env.util");
function isImagePanelVisionEnabled() {
    if ((0, runtime_env_util_1.isFalsyEnv)(process.env.ENABLE_IMAGE_PANEL_VISION)) {
        return false;
    }
    return true;
}
exports.isImagePanelVisionEnabled = isImagePanelVisionEnabled;
//# sourceMappingURL=image-panel-env.util.js.map