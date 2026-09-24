import { Request, Response } from "express";
import * as BooksService from "../services/books.service.js";
import { BookFilters, NewBook, UpdateBook } from "../types/book.js";

export async function search(req: Request, res: Response) {
  const { title, available, author_id } = req.query;
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (available !== undefined && available !== "true" && available !== "false") {
    return res.status(400).json({ error: "available must be true or false" });
  }
  if (author_id !== undefined && (!Number.isInteger(Number(author_id)) || Number(author_id) < 1)) {
    return res.status(400).json({ error: "author_id must be an integer greater than 0" });
  }
  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: "page must be an integer greater than 0" });
  }
  if (!Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ error: "limit must be an integer greater than 0" });
  }

  const filters: BookFilters = {};
  if (title !== undefined) filters.title = String(title);
  if (available !== undefined) filters.available = available === "true";
  if (author_id !== undefined) filters.author_id = Number(author_id);

  const result = await BooksService.search(filters, { page, limit: Math.min(limit, 50) });
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const book = await BooksService.getOne(id);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }

  res.json(book);
}

export async function create(req: Request, res: Response) {
  const data: NewBook = { title: req.body.title, year: req.body.year, author_id: req.body.author_id };

  const result = await BooksService.create(data);
  if (result === "AUTHOR_NOT_FOUND") {
    return res.status(404).json({ error: "Author not found" });
  }

  res.status(201).json(result);
}

// PATCH: solo los campos que vinieron.
export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const changes: UpdateBook = {};
  if (req.body.title !== undefined) changes.title = req.body.title;
  if (req.body.year !== undefined) changes.year = req.body.year;
  if (req.body.author_id !== undefined) changes.author_id = req.body.author_id;

  const result = await BooksService.update(id, changes);
  if (result === "BOOK_NOT_FOUND") {
    return res.status(404).json({ error: "Book not found" });
  }
  if (result === "AUTHOR_NOT_FOUND") {
    return res.status(404).json({ error: "Author not found" });
  }

  res.json(result);
}

// PUT: todos los campos son obligatorios.
export async function replace(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const data: NewBook = { title: req.body.title, year: req.body.year, author_id: req.body.author_id };

  const result = await BooksService.update(id, data);
  if (result === "BOOK_NOT_FOUND") {
    return res.status(404).json({ error: "Book not found" });
  }
  if (result === "AUTHOR_NOT_FOUND") {
    return res.status(404).json({ error: "Author not found" });
  }

  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const result = await BooksService.remove(id);
  if (result === "BOOK_NOT_FOUND") {
    return res.status(404).json({ error: "Book not found" });
  }
  if (result === "HAS_LOANS") {
    return res.status(409).json({ error: "Book has loans" });
  }

  res.status(204).send();
}
