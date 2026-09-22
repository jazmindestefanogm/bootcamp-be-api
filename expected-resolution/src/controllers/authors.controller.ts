import { Request, Response } from "express";
import * as AuthorsService from "../services/authors.service.js";
import { parseId } from "./validations.js";

export async function list(req: Request, res: Response) {
  const authors = await AuthorsService.list();
  res.json(authors);
}

export async function getOne(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const author = await AuthorsService.getOne(id);
  if (!author) return res.status(404).json({ error: "Author not found" });

  res.json(author);
}

export async function remove(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const result = await AuthorsService.remove(id);
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
  if (result === "HAS_BOOKS") return res.status(409).json({ error: "Author has books" });

  res.status(204).send();
}
