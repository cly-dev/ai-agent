export declare class CreateHostPageDto {
    appClientId: number;
    scope: string;
    label: string;
    description?: string;
    routePattern?: string;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateHostPageDto {
    scope?: string;
    label?: string;
    description?: string | null;
    routePattern?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
