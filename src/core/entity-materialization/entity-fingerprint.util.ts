import { createHash } from 'node:crypto';
import type { EntityMaterializationSource } from './entity-materialization.types';

/** 同 run 内辅助去重/重跑比对；不读业务 id。 */
export function buildEntityFingerprint(input: {
  source: EntityMaterializationSource;
  path: string;
}): string {
  const normalized = `${input.source}\0${input.path.trim()}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}
