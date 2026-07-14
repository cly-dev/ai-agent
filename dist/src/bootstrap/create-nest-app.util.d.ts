import type { NestExpressApplication } from '@nestjs/platform-express';
export declare function createNestApp(): Promise<NestExpressApplication>;
export declare function listenRuntimeHttp(app: NestExpressApplication, port?: number): Promise<void>;
export declare function initBackgroundOnly(app: NestExpressApplication, label: string): Promise<void>;
