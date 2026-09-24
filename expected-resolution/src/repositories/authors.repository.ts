import { Author as AuthorModel } from "../models/index.js";
import { Author, NewAuthor, UpdateAuthor } from "../types/author.js";

export async function findAll(): Promise<Author[]> {
  const rows = await AuthorModel.findAll({ order: [["id", "ASC"]] });
  return rows.map((row) => row.toJSON());
}

export async function findById(id: number): Promise<Author | null> {
  const row = await AuthorModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function create(data: NewAuthor): Promise<Author> {
  const row = await AuthorModel.create(data);
  return row.toJSON();
}

export async function update(id: number, changes: UpdateAuthor): Promise<Author | null> {
  const row = await AuthorModel.findByPk(id);
  if (!row) return null;
  await row.update(changes);
  return row.toJSON();
}

export async function remove(id: number): Promise<boolean> {
  const row = await AuthorModel.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}
