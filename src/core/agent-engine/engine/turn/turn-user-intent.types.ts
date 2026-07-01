import type { TurnPageReadKind } from '../../../host-bridge/page-context-usage.types';

export type { TurnPageReadKind };

/** 读路径：用户是否消费页上内联/实体数据，以及如何消费。 */
export type TurnPageReadIntent = {
  applies: boolean;
  kind: TurnPageReadKind;
};
