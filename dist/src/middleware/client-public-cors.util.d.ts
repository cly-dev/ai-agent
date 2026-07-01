import type { Request, Response } from 'express';
export declare function shouldApplyClientPublicCors(req: Request): boolean;
export declare function applyClientPublicCors(req: Request, res: Response): void;
export declare function handleClientPublicCorsPreflight(req: Request, res: Response): boolean;
