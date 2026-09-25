import { Request, Response } from "express";
import * as AuthorsService from "../services/authors.service.js";
import { NewAuthor, UpdateAuthor } from "../types/author.js";

export async function list(req: Request, res: Response) {
  const authors = await AuthorsService.list();
  res.json({ data: authors });
}

export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const author = await AuthorsService.getOne(id);
  if (!author) return res.status(404).json({ error: "Author not found" });

  res.json({ data: author });
}

export async function create(req: Request, res: Response) {
  const data: NewAuthor = { name: req.body.name, nationality: req.body.nationality };

  const author = await AuthorsService.create(data);
  res.status(201).json({ data: author });
}

// PATCH: solo los campos que vinieron.
export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const changes: UpdateAuthor = {};
  if (req.body.name !== undefined) changes.name = req.body.name;
  if (req.body.nationality !== undefined) changes.nationality = req.body.nationality;

  const author = await AuthorsService.update(id, changes);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  res.json({ data: author });
}

// PUT: todos los campos.
export async function replace(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const data: NewAuthor = { name: req.body.name, nationality: req.body.nationality };

  const author = await AuthorsService.update(id, data);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  res.json({ data: author });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const result = await AuthorsService.remove(id);
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
  if (result === "HAS_BOOKS") return res.status(409).json({ error: "Author has books" });

  res.status(204).send();
}
