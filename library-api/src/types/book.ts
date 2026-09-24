export interface Book {
  id: number;
  title: string;
  year: number;
  author_id: number;
  available: boolean;
}

export interface NewBook {
  title: string;
  year: number;
  author_id: number;
}

export interface UpdateBook {
  title?: string;
  year?: number;
  author_id?: number;
}

export interface BookFilters {
  title?: string;
  available?: boolean;
  author_id?: number;
}
