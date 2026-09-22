import { Op } from "sequelize";
import { Book as BookModel } from "../models/index.js";
import { Book, NewBook, UpdateBook, BookFilters } from "../types/book.js";
import { Pagination, Page } from "../types/common.js";

export async function findById(id: number): Promise<Book | null> {
  const row = await BookModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function search(filters: BookFilters, pagination: Pagination): Promise<Page<Book>> {
  const where: Record<string, unknown> = {};
  if (filters.title !== undefined) where.title = { [Op.iLike]: `%${filters.title}%` };
  if (filters.available !== undefined) where.available = filters.available;
  if (filters.author_id !== undefined) where.author_id = filters.author_id;

  const { rows, count } = await BookModel.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit,
    order: [["id", "ASC"]],
  });

  return {
    data: rows.map((row) => row.toJSON()),
    total: count,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export async function create(data: NewBook): Promise<Book> {
  const row = await BookModel.create(data);
  return row.toJSON();
}

export async function update(id: number, changes: UpdateBook): Promise<Book | null> {
  const row = await BookModel.findByPk(id);
  if (!row) return null;
  await row.update(changes);
  return row.toJSON();
}

export async function remove(id: number): Promise<boolean> {
  const row = await BookModel.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}

export async function countByAuthor(authorId: number): Promise<number> {
  return BookModel.count({ where: { author_id: authorId } });
}

export async function setAvailability(id: number, available: boolean): Promise<void> {
  const row = await BookModel.findByPk(id);
  if (row) await row.update({ available });
}
