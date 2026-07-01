import type { Request, Response } from 'express';
export declare function shouldApplyHttpCors(_req: Request): boolean;
export declare const shouldApplyClientPublicCors: typeof shouldApplyHttpCors;
export declare function applyHttpCors(req: Request, res: Response): void;
export declare const applyClientPublicCors: typeof applyHttpCors;
export declare function handleHttpCorsPreflight(req: Request, res: Response): boolean;
export declare const handleClientPublicCorsPreflight: typeof handleHttpCorsPreflight;
