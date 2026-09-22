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
