import { IntegrationAuthMode } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const INTEGRATION_ORDER_BY_FIELDS: readonly ["id", "name", "createdAt", "updatedAt", "baseUrl"];
export type IntegrationOrderByField = (typeof INTEGRATION_ORDER_BY_FIELDS)[number];
export declare class QueryIntegrationDto extends PaginationQueryDto {
    id?: number;
    appClientId?: number;
    name?: string;
    baseUrl?: string;
    keyword?: string;
    authMode?: IntegrationAuthMode;
    orderBy?: IntegrationOrderByField;
    order?: 'asc' | 'desc';
}
export { INTEGRATION_ORDER_BY_FIELDS };
