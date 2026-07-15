import { isFalsyEnv } from '../security/runtime-env.util';

/**
 * 多模态识图环境开关。
 * - 默认开启：画布有 `summarize_images` 才真正调用；未配节点的环境不受影响。
 * - `ENABLE_IMAGE_PANEL_VISION=0|false|off|no`：即便画布有节点也 skip vision（degrade），
 *   用于未配 VL / 未装 sharp 的部署，避免超时或硬失败。
 */
export function isImagePanelVisionEnabled(): boolean {
  if (isFalsyEnv(process.env.ENABLE_IMAGE_PANEL_VISION)) {
    return false;
  }
  return true;
}
