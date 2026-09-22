import { Loan as LoanModel } from "../models/index.js";
import { Loan, NewLoan } from "../types/loan.js";

export async function findAll(activeOnly: boolean): Promise<Loan[]> {
  const where = activeOnly ? { return_date: null } : {};
  const rows = await LoanModel.findAll({ where, order: [["id", "ASC"]] });
  return rows.map((row) => row.toJSON());
}

export async function findById(id: number): Promise<Loan | null> {
  const row = await LoanModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function create(data: NewLoan, loanDate: string): Promise<Loan> {
  const row = await LoanModel.create({ ...data, loan_date: loanDate });
  return row.toJSON();
}

export async function registerReturn(id: number, returnDate: string): Promise<Loan | null> {
  const row = await LoanModel.findByPk(id);
  if (!row) return null;
  await row.update({ return_date: returnDate });
  return row.toJSON();
}

export async function countByBook(bookId: number): Promise<number> {
  return LoanModel.count({ where: { book_id: bookId } });
}
