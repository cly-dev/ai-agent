import { type OutboundHttpPolicy } from './outbound-http.types';
export declare class OutboundHttpService {
    private readonly logger;
    fetchWithPolicy(url: string | URL, init: RequestInit, policy: OutboundHttpPolicy): Promise<Response>;
    private formatFetchError;
}
