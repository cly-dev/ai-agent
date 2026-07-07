export type TurnWriteChannel = 'none' | 'http' | 'host';
export declare function hostMutationIntentFromWriteChannel(channel: TurnWriteChannel): boolean;
