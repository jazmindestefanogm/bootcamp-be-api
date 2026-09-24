import * as AuthorsRepository from "../repositories/authors.repository.js";
import * as BooksRepository from "../repositories/books.repository.js";
import { Author, NewAuthor, UpdateAuthor } from "../types/author.js";

export async function list(): Promise<Author[]> {
  return AuthorsRepository.findAll();
}

export async function getOne(id: number): Promise<Author | null> {
  return AuthorsRepository.findById(id);
}

export async function create(data: NewAuthor): Promise<Author> {
  return AuthorsRepository.create(data);
}

export async function update(id: number, changes: UpdateAuthor): Promise<Author | null> {
  return AuthorsRepository.update(id, changes);
}

// Regla: no se puede borrar un autor que tiene libros.
export async function remove(id: number): Promise<"DELETED" | "AUTHOR_NOT_FOUND" | "HAS_BOOKS"> {
  const author = await AuthorsRepository.findById(id);
  if (!author) return "AUTHOR_NOT_FOUND";

  const bookCount = await BooksRepository.countByAuthor(id);
  if (bookCount > 0) return "HAS_BOOKS";

  await AuthorsRepository.remove(id);
  return "DELETED";
}
