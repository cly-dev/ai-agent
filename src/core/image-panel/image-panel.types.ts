/** IMAGE_PANEL/v1：多图网格协议类型（像素层编号 + 清单层 URL 映射）。 */

export const IMAGE_PANEL_VERSION = 1 as const;

export type ImagePanelLayout = {
  rows: number;
  cols: number;
  cellPx: number;
  fit: 'contain';
};

export type ImagePanelCellStatus = 'ok' | 'fetch_failed';

export type ImagePanelCellManifest = {
  index: number;
  url: string;
  status: ImagePanelCellStatus;
  sourceSize?: { w: number; h: number };
  fetchMs?: number;
  error?: string;
};

export type ImagePanelManifest = {
  panelVersion: typeof IMAGE_PANEL_VERSION;
  layout: ImagePanelLayout;
  cells: ImagePanelCellManifest[];
  omittedCount: number;
  omittedUrls: string[];
};

export type ImagePanelRenderTiming = {
  fetchMs: number;
  renderMs: number;
  totalMs: number;
};

export type ImagePanelRenderResult = {
  png: Buffer;
  width: number;
  height: number;
  manifest: ImagePanelManifest;
  timing: ImagePanelRenderTiming;
};

export type ImagePanelBuildOptions = {
  /** 正方形格边长，默认 512。 */
  cellPx?: number;
  /** 最多拼入格数，默认 6。 */
  maxCells?: number;
  /** 单张下载超时 ms。 */
  fetchTimeoutMs?: number;
  /** 单张最大字节，默认 8MB。 */
  maxBytesPerImage?: number;
  /** 拉图并发，默认 3。 */
  fetchConcurrency?: number;
};
