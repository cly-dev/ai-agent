/**
 * lazy-load sharp：未配置 summarize_images 节点的环境可以没有原生二进制，
 * 进程启动不得因顶层 require('sharp') 直接挂掉。
 */
type SharpFn = typeof import('sharp');

let cached: SharpFn | null | undefined;

/** 成功返回 sharp；加载失败返回 null（缓存）。 */
export function tryLoadSharp(): SharpFn | null {
  if (cached !== undefined) {
    return cached;
  }
  try {
    // Nest CJS 下 default import 不可调用；require 稳定。
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('sharp') as SharpFn;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/** 拼图 / jpeg 前调用；缺失时抛 SHARP_UNAVAILABLE 供上层 degrade。 */
export function requireSharp(): SharpFn {
  const sharp = tryLoadSharp();
  if (!sharp) {
    throw new Error('SHARP_UNAVAILABLE');
  }
  return sharp;
}
