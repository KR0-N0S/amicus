/**
 * Interfejs dla filtrów listy klientów
 */
export interface ClientFilterState {
    status: string;
    type: string;
    dateFrom: string | null;
    dateTo: string | null;
    city: string;
    organization: string;
    tags: string[];
    hasOrders: boolean | null;
    lastActivityFrom: string | null;
    lastActivityTo: string | null;
  }