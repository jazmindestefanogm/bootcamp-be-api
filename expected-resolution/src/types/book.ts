export interface Book {
  id: number;
  title: string;
  year: number;
  author_id: number;
  available: boolean;
}

export type NewBook = Omit<Book, "id" | "available">;

export type UpdateBook = Partial<NewBook>;

export interface BookFilters {
  title?: string;
  available?: boolean;
  author_id?: number;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
