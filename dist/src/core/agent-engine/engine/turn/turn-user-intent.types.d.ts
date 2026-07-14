import type { TurnPageReadKind } from '../../../host-bridge/page-context-usage.types';
export type { TurnPageReadKind };
export type TurnPageReadIntent = {
    applies: boolean;
    kind: TurnPageReadKind;
};
