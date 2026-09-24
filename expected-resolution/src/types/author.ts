export interface Author {
  id: number;
  name: string;
  nationality: string;
}

export interface NewAuthor {
  name: string;
  nationality: string;
}

export interface UpdateAuthor {
  name?: string;
  nationality?: string;
}
