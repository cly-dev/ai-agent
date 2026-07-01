type FieldMeta = {
    name: string;
    type: string;
    isOptional: boolean;
    isList: boolean;
    rawAttributes: string;
    hasDefault: boolean;
    isUpdatedAt: boolean;
    isRelation: boolean;
};
type ModelMeta = {
    name: string;
    fields: FieldMeta[];
};
export declare function mapPrismaTypeToTs(type: string): string;
export declare function parseSchemaModels(schema: string): ModelMeta[];
export declare function run(): void;
export {};
