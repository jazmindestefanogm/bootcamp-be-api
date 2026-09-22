import { Request, Response } from "express";
import * as LoansService from "../services/loans.service.js";
import { NewLoan, LoanReturn } from "../types/loan.js";
import { parseId, parseBoolean } from "./validations.js";

export async function list(req: Request, res: Response) {
  let activeOnly = false;
  if (req.query.active !== undefined) {
    const active = parseBoolean(String(req.query.active));
    if (active === null) return res.status(400).json({ error: "active must be true or false" });
    activeOnly = active;
  }

  const loans = await LoansService.list(activeOnly);
  res.json(loans);
}

export async function create(req: Request, res: Response) {
  const { book_id, member_name } = req.body;

  if (!Number.isInteger(book_id) || book_id < 1) {
    return res.status(400).json({ error: "book_id must be an integer greater than 0" });
  }
  if (typeof member_name !== "string" || member_name.length < 1) {
    return res.status(400).json({ error: "member_name must be a non-empty string" });
  }

  const data: NewLoan = { book_id, member_name };

  const result = await LoansService.create(data);
  if (result === "BOOK_NOT_FOUND") return res.status(404).json({ error: "Book not found" });
  if (result === "BOOK_NOT_AVAILABLE") return res.status(409).json({ error: "Book is not available" });

  res.status(201).json(result);
}

export async function registerReturn(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const { return_date } = req.body;
  if (typeof return_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(return_date)) {
    return res.status(400).json({ error: "return_date must have the format YYYY-MM-DD" });
  }

  const data: LoanReturn = { return_date };

  const result = await LoansService.registerReturn(id, data);
  if (result === "LOAN_NOT_FOUND") return res.status(404).json({ error: "Loan not found" });
  if (result === "ALREADY_RETURNED") return res.status(409).json({ error: "Loan already returned" });

  res.json(result);
}
