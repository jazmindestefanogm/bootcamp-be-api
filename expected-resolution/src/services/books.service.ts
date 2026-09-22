import * as AuthorsRepository from "../repositories/authors.repository.js";
import * as BooksRepository from "../repositories/books.repository.js";
import * as LoansRepository from "../repositories/loans.repository.js";
import { Book, NewBook, UpdateBook, BookFilters } from "../types/book.js";
import { Pagination, Page } from "../types/common.js";

export async function search(filters: BookFilters, pagination: Pagination): Promise<Page<Book>> {
  return BooksRepository.search(filters, pagination);
}

export async function getOne(id: number): Promise<Book | null> {
  return BooksRepository.findById(id);
}

// Regla: el autor del libro tiene que existir.
export async function create(data: NewBook): Promise<Book | "AUTHOR_NOT_FOUND"> {
  const author = await AuthorsRepository.findById(data.author_id);
  if (!author) return "AUTHOR_NOT_FOUND";

  return BooksRepository.create(data);
}

// Regla: si cambia el autor, el nuevo autor tiene que existir.
export async function update(
  id: number,
  changes: UpdateBook
): Promise<Book | "BOOK_NOT_FOUND" | "AUTHOR_NOT_FOUND"> {
  const book = await BooksRepository.findById(id);
  if (!book) return "BOOK_NOT_FOUND";

  if (changes.author_id !== undefined) {
    const author = await AuthorsRepository.findById(changes.author_id);
    if (!author) return "AUTHOR_NOT_FOUND";
  }

  const updated = await BooksRepository.update(id, changes);
  return updated ?? "BOOK_NOT_FOUND";
}

// Regla: no se puede borrar un libro que alguna vez se prestó.
export async function remove(id: number): Promise<"DELETED" | "BOOK_NOT_FOUND" | "HAS_LOANS"> {
  const book = await BooksRepository.findById(id);
  if (!book) return "BOOK_NOT_FOUND";

  const loanCount = await LoansRepository.countByBook(id);
  if (loanCount > 0) return "HAS_LOANS";

  await BooksRepository.remove(id);
  return "DELETED";
}
