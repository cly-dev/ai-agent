export type ListPaginationMeta = {
  total?: number;
  page: number;
  pageSize: number;
  rowCount: number;
  hasMore: boolean;
  pageParam: string;
  sizeParam: string;
};

export type ListPaginationCursor = {
  pageParam: string;
  sizeParam: string;
  nextPage: number;
  pageSize: number;
};
