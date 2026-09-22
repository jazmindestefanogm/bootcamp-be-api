import { Request, Response } from "express";
import * as BooksService from "../services/books.service.js";
import { BookFilters, NewBook, UpdateBook } from "../types/book.js";
import { Pagination } from "../types/common.js";
import { parseId, parseBoolean, validateBook } from "./validations.js";

const MAX_LIMIT = 50;

export async function search(req: Request, res: Response) {
  const filters: BookFilters = {};

  if (req.query.title !== undefined) filters.title = String(req.query.title);

  if (req.query.available !== undefined) {
    const available = parseBoolean(String(req.query.available));
    if (available === null) return res.status(400).json({ error: "available must be true or false" });
    filters.available = available;
  }

  if (req.query.author_id !== undefined) {
    const authorId = parseId(String(req.query.author_id));
    if (authorId === null) return res.status(400).json({ error: "author_id must be an integer" });
    filters.author_id = authorId;
  }

  let page = 1;
  if (req.query.page !== undefined) {
    page = Number(req.query.page);
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ error: "page must be an integer greater than 0" });
    }
  }

  let limit = 10;
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1) {
      return res.status(400).json({ error: "limit must be an integer greater than 0" });
    }
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  }

  const pagination: Pagination = { page, limit };
  const result = await BooksService.search(filters, pagination);
  res.json(result);
}

export async function getOne(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const book = await BooksService.getOne(id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  res.json(book);
}

export async function create(req: Request, res: Response) {
  const error = validateBook(req.body, true);
  if (error) return res.status(400).json({ error });

  const data: NewBook = {
    title: req.body.title,
    year: req.body.year,
    author_id: req.body.author_id,
  };

  const result = await BooksService.create(data);
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });

  res.status(201).json(result);
}

// PATCH: solo los campos que vinieron.
export async function update(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  if (Object.keys(req.body).length === 0) return res.status(400).json({ error: "Body cannot be empty" });

  const error = validateBook(req.body, false);
  if (error) return res.status(400).json({ error });

  const changes: UpdateBook = {};
  if (req.body.title !== undefined) changes.title = req.body.title;
  if (req.body.year !== undefined) changes.year = req.body.year;
  if (req.body.author_id !== undefined) changes.author_id = req.body.author_id;

  const result = await BooksService.update(id, changes);
  if (result === "BOOK_NOT_FOUND") return res.status(404).json({ error: "Book not found" });
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });

  res.json(result);
}

// PUT: todos los campos son obligatorios.
export async function replace(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const error = validateBook(req.body, true);
  if (error) return res.status(400).json({ error });

  const data: NewBook = {
    title: req.body.title,
    year: req.body.year,
    author_id: req.body.author_id,
  };

  const result = await BooksService.update(id, data);
  if (result === "BOOK_NOT_FOUND") return res.status(404).json({ error: "Book not found" });
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });

  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const result = await BooksService.remove(id);
  if (result === "BOOK_NOT_FOUND") return res.status(404).json({ error: "Book not found" });
  if (result === "HAS_LOANS") return res.status(409).json({ error: "Book has loans" });

  res.status(204).send();
}
