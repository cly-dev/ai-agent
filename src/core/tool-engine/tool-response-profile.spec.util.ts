import { BadRequestException } from '@nestjs/common';
import { parseResponseProfile } from './tool-output-projection.util';
import type {
  ToolResponseFieldSpec,
  ToolResponseProfile,
} from './tool-response-profile.types';

/** 常见列表容器路径（按优先级）。 */
export const RESPONSE_PROFILE_LIST_PATH_CANDIDATES = [
  'data',
  'list',
  'records',
  'items',
  'data.list',
  'data.records',
] as const;

/** 列表响应根级元字段（放 listMetaFields，不放 coreFields）。 */
export const RESPONSE_PROFILE_ROOT_META_KEYS = [
  'total',
  'page',
  'pageSize',
  'pages',
  'size',
] as const;

export type ResponseProfileValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type NormalizeResponseProfileResult = {
  profile: ToolResponseProfile;
  adjustments: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getByPath(root: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = root;
  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function listPathKey(listPath: string): string {
  return listPath.split('.').filter(Boolean).pop() ?? listPath;
}

function cloneField(field: ToolResponseFieldSpec): ToolResponseFieldSpec {
  return {
    ...field,
    keywords: field.keywords ? [...field.keywords] : undefined,
    enumLabels: field.enumLabels ? { ...field.enumLabels } : undefined,
  };
}

function detectListPathFromSample(sampleData: unknown): string | undefined {
  for (const candidate of RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
    const value = getByPath(sampleData, candidate);
    if (Array.isArray(value)) {
      return candidate;
    }
  }
  return undefined;
}

function countListItemPrefixFields(
  fields: ToolResponseFieldSpec[],
  listPath: string,
): number {
  const prefix = `${listPath}.`;
  return fields.filter((field) => field.path.startsWith(prefix)).length;
}

function inferListPath(
  profile: ToolResponseProfile,
  sampleData?: unknown,
): string | undefined {
  const fromSample = sampleData ? detectListPathFromSample(sampleData) : undefined;
  const profileListPath = profile.listPath?.trim();

  if (profileListPath && sampleData) {
    const listValue = getByPath(sampleData, profileListPath);
    if (Array.isArray(listValue)) {
      return profileListPath;
    }
  } else if (profileListPath && !sampleData) {
    return profileListPath;
  }

  if (fromSample) {
    return fromSample;
  }

  let bestPath: string | undefined;
  let bestCount = 0;
  for (const candidate of RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
    const count =
      countListItemPrefixFields(profile.coreFields, candidate) +
      countListItemPrefixFields(profile.optionalFields ?? [], candidate);
    if (count > bestCount) {
      bestCount = count;
      bestPath = candidate;
    }
  }
  return bestCount > 0 ? bestPath : profileListPath || undefined;
}

function stripListPrefix(path: string, listPath: string): string | null {
  if (path === listPath) {
    return null;
  }
  const prefix = `${listPath}.`;
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }
  return path;
}

function isRootMetaPath(path: string, listPath: string): boolean {
  if (path.startsWith(`${listPath}.`)) {
    return false;
  }
  return RESPONSE_PROFILE_ROOT_META_KEYS.includes(
    path as (typeof RESPONSE_PROFILE_ROOT_META_KEYS)[number],
  );
}

function dedupeFields(fields: ToolResponseFieldSpec[]): ToolResponseFieldSpec[] {
  const seen = new Set<string>();
  const result: ToolResponseFieldSpec[] = [];
  for (const field of fields) {
    if (seen.has(field.path)) {
      continue;
    }
    seen.add(field.path);
    result.push(field);
  }
  return result;
}

/**
 * 将 responseProfile 规范化为可落库形态：
 * - 列表响应：设置 listPath，core/optional 路径相对列表元素
 * - 根级 meta（total/page）放入 listMetaFields
 */
export function normalizeResponseProfile(
  profile: ToolResponseProfile,
  sampleData?: unknown,
): NormalizeResponseProfileResult {
  const adjustments: string[] = [];
  const listPath = inferListPath(profile, sampleData);

  if (!listPath) {
    return { profile, adjustments };
  }

  const itemCore: ToolResponseFieldSpec[] = [];
  const itemOptional: ToolResponseFieldSpec[] = [];
  const metaFields: ToolResponseFieldSpec[] = [...(profile.listMetaFields ?? [])];
  const metaSeen = new Set(metaFields.map((field) => field.path));

  const classifyFields = (
    fields: ToolResponseFieldSpec[] | undefined,
    target: ToolResponseFieldSpec[],
  ): void => {
    for (const field of fields ?? []) {
      const stripped = stripListPrefix(field.path, listPath);
      if (stripped == null) {
        adjustments.push(`skip array container field: ${field.path}`);
        continue;
      }
      if (
        isRootMetaPath(field.path, listPath) &&
        !field.path.startsWith(`${listPath}.`)
      ) {
        if (!metaSeen.has(field.path)) {
          metaFields.push(cloneField(field));
          metaSeen.add(field.path);
          adjustments.push(`move root meta field: ${field.path}`);
        }
        continue;
      }
      if (field.path.startsWith(`${listPath}.`)) {
        target.push({ ...cloneField(field), path: stripped });
        adjustments.push(`rewrite item field: ${field.path} -> ${stripped}`);
        continue;
      }
      target.push(cloneField(field));
    }
  };

  classifyFields(profile.coreFields, itemCore);
  classifyFields(profile.optionalFields, itemOptional);

  for (const key of RESPONSE_PROFILE_ROOT_META_KEYS) {
    if (metaSeen.has(key)) {
      continue;
    }
    if (sampleData && getByPath(sampleData, key) === undefined) {
      continue;
    }
    if (!sampleData) {
      continue;
    }
    metaFields.push({
      path: key,
      label: key,
      description: key,
    });
    metaSeen.add(key);
    adjustments.push(`auto add list meta field: ${key}`);
  }

  const listKey = listPathKey(listPath);
  const arrayLimits = {
    ...(profile.arrayLimits ?? {}),
    [listKey]:
      profile.arrayLimits?.[listKey] ??
      profile.arrayLimits?.list ??
      profile.arrayLimits?.data ??
      5,
  };

  return {
    profile: {
      coreFields: dedupeFields(itemCore),
      optionalFields: dedupeFields(itemOptional),
      listPath,
      listMetaFields: dedupeFields(metaFields),
      arrayLimits,
    },
    adjustments,
  };
}

export function validateResponseProfile(
  profile: ToolResponseProfile,
  sampleData?: unknown,
): ResponseProfileValidationIssue[] {
  const issues: ResponseProfileValidationIssue[] = [];

  if (profile.coreFields.length === 0) {
    issues.push({
      code: 'CORE_FIELDS_EMPTY',
      message: 'responseProfile.coreFields 不能为空',
    });
  }

  const listPath = profile.listPath?.trim();
  if (listPath) {
    const prefix = `${listPath}.`;
    for (const field of profile.coreFields) {
      if (field.path.startsWith(prefix)) {
        issues.push({
          code: 'LIST_ITEM_PATH_INVALID',
          path: field.path,
          message: `listPath=${listPath} 时 coreFields.path 应相对列表元素，不能写成 ${field.path}`,
        });
      }
      if (field.path === listPath) {
        issues.push({
          code: 'LIST_CONTAINER_IN_CORE',
          path: field.path,
          message: `不能把列表容器 ${listPath} 放进 coreFields`,
        });
      }
    }
    for (const field of profile.optionalFields ?? []) {
      if (field.path.startsWith(prefix)) {
        issues.push({
          code: 'LIST_ITEM_PATH_INVALID',
          path: field.path,
          message: `listPath=${listPath} 时 optionalFields.path 应相对列表元素，不能写成 ${field.path}`,
        });
      }
    }

    if (sampleData) {
      const listValue = getByPath(sampleData, listPath);
      if (!Array.isArray(listValue)) {
        issues.push({
          code: 'LIST_PATH_NOT_ARRAY',
          message: `sample 中 ${listPath} 不是数组，不能设置 listPath=${listPath}`,
        });
      } else if (listValue.length > 0 && isRecord(listValue[0])) {
        const firstItem = listValue[0];
        const missingCore = profile.coreFields.filter(
          (field) => getByPath(firstItem, field.path) === undefined,
        );
        if (missingCore.length === profile.coreFields.length) {
          issues.push({
            code: 'CORE_FIELDS_NOT_IN_LIST_ITEM',
            message: `coreFields 在 ${listPath}[0] 上全部缺失，请检查 path 规范`,
          });
        }
      }
    }
  } else if (sampleData && detectListPathFromSample(sampleData)) {
    issues.push({
      code: 'LIST_PATH_REQUIRED',
      message:
        'sample 是列表响应（如 data: []），必须设置 listPath，且 core/optional 路径相对列表元素',
    });
  }

  return issues;
}

export function assertValidResponseProfile(
  profile: ToolResponseProfile,
  sampleData?: unknown,
): ToolResponseProfile {
  const normalized = normalizeResponseProfile(profile, sampleData);
  const issues = validateResponseProfile(normalized.profile, sampleData);
  if (issues.length > 0) {
    throw new BadRequestException({
      message: 'responseProfile 不符合规范',
      issues,
      adjustments: normalized.adjustments,
    });
  }
  return normalized.profile;
}

/** 解析 + 规范化 + 校验，供 Tool 落库使用。 */
export function parseAndNormalizeResponseProfile(
  raw: unknown,
  sampleData?: unknown,
): ToolResponseProfile | null {
  const parsed = parseResponseProfile(raw);
  if (!parsed) {
    return null;
  }
  return assertValidResponseProfile(parsed, sampleData);
}
