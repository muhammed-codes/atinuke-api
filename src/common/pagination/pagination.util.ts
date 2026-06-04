export interface PaginatedResult<T> {
  totalRecords: number;
  data: T[];
}

export function paginate<T>(data: T[], totalRecords: number): PaginatedResult<T> {
  return { totalRecords, data };
}
