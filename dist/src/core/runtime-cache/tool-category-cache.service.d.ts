import { PrismaService } from '../../prisma/prisma.service';
export type ToolCategoryCacheRow = {
    id: number;
    label: string;
    description: string | null;
};
export declare class ToolCategoryCacheService {
    private readonly prisma;
    private readonly cache;
    constructor(prisma: PrismaService);
    fetchByIds(toolCategoryIds: number[]): Promise<ToolCategoryCacheRow[]>;
    clearAll(): void;
    private prune;
}
