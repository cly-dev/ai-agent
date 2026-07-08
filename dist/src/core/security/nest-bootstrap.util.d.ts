import { ConsoleLogger, type LogLevel } from '@nestjs/common';
export declare function resolveNestBootstrapLogger(): ConsoleLogger | LogLevel[] | undefined;
export declare function logStartupInfo(message: string): void;
