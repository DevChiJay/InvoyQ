export interface APIError {
  message: string;
  detail?: any;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ListParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 1 | -1;
}
