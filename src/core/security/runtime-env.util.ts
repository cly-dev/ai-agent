const PRODUCTION_NODE_ENVS = new Set(['prod', 'production']);

export function isProductionRuntime(): boolean {
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase() ?? '';
  return PRODUCTION_NODE_ENVS.has(nodeEnv);
}

export function isTruthyEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

export function isFalsyEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no';
}

/** 开发调试静态页（www/index.html）；生产默认关闭，可用 ENABLE_DEV_STATIC=1 显式开启。 */
export function isDevStaticAssetsEnabled(): boolean {
  if (isTruthyEnv(process.env.ENABLE_DEV_STATIC)) {
    return true;
  }
  if (isFalsyEnv(process.env.ENABLE_DEV_STATIC)) {
    return false;
  }
  return !isProductionRuntime();
}

/** Swagger UI；生产默认关闭，可用 ENABLE_SWAGGER=1 显式开启。 */
export function isSwaggerEnabled(): boolean {
  if (isTruthyEnv(process.env.ENABLE_SWAGGER)) {
    return true;
  }
  if (isFalsyEnv(process.env.ENABLE_SWAGGER)) {
    return false;
  }
  return !isProductionRuntime();
}
