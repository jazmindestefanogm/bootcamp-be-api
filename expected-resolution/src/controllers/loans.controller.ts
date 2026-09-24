import { Request, Response } from "express";
import * as LoansService from "../services/loans.service.js";
import { NewLoan, LoanReturn } from "../types/loan.js";

export async function list(req: Request, res: Response) {
  const { active } = req.query;
  if (active !== undefined && active !== "true" && active !== "false") {
    return res.status(400).json({ error: "active must be true or false" });
  }

  const loans = await LoansService.list(active === "true");
  res.json(loans);
}

export async function create(req: Request, res: Response) {
  const data: NewLoan = { book_id: req.body.book_id, member_name: req.body.member_name };

  const result = await LoansService.create(data);
  if (result === "BOOK_NOT_FOUND") return res.status(404).json({ error: "Book not found" });
  if (result === "BOOK_NOT_AVAILABLE") return res.status(409).json({ error: "Book is not available" });

  res.status(201).json(result);
}

export async function registerReturn(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const data: LoanReturn = { return_date: req.body.return_date };

  const result = await LoansService.registerReturn(id, data);
  if (result === "LOAN_NOT_FOUND") return res.status(404).json({ error: "Loan not found" });
  if (result === "ALREADY_RETURNED") return res.status(409).json({ error: "Loan already returned" });

  res.json(result);
}
