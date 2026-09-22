import { Author as AuthorModel } from "../models/index.js";
import { Author } from "../types/author.js";

export async function findAll(): Promise<Author[]> {
  const rows = await AuthorModel.findAll({ order: [["id", "ASC"]] });
  return rows.map((row) => row.toJSON());
}

export async function findById(id: number): Promise<Author | null> {
  const row = await AuthorModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function remove(id: number): Promise<boolean> {
  const row = await AuthorModel.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}
