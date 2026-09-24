import * as BooksRepository from "../repositories/books.repository.js";
import * as LoansRepository from "../repositories/loans.repository.js";
import { Loan, NewLoan, LoanReturn } from "../types/loan.js";

export async function list(activeOnly: boolean): Promise<Loan[]> {
  return LoansRepository.findAll(activeOnly);
}

export async function getOne(id: number): Promise<Loan | null> {
  return LoansRepository.findById(id);
}

// Reglas: el libro tiene que existir y estar disponible. Al prestarlo, deja de estar disponible.
export async function create(data: NewLoan): Promise<Loan | "BOOK_NOT_FOUND" | "BOOK_NOT_AVAILABLE"> {
  const book = await BooksRepository.findById(data.book_id);
  if (!book) return "BOOK_NOT_FOUND";
  if (!book.available) return "BOOK_NOT_AVAILABLE";

  const today = new Date().toISOString().slice(0, 10);
  const loan = await LoansRepository.create(data, today);
  await BooksRepository.setAvailability(data.book_id, false);
  return loan;
}

// Reglas: un préstamo se devuelve una sola vez. Al devolverlo, el libro vuelve a estar disponible.
export async function registerReturn(
  id: number,
  data: LoanReturn
): Promise<Loan | "LOAN_NOT_FOUND" | "ALREADY_RETURNED"> {
  const loan = await LoansRepository.findById(id);
  if (!loan) return "LOAN_NOT_FOUND";
  if (loan.return_date !== null) return "ALREADY_RETURNED";

  const updated = await LoansRepository.registerReturn(id, data.return_date);
  await BooksRepository.setAvailability(loan.book_id, true);
  return updated ?? "LOAN_NOT_FOUND";
}

// Regla: si se borra un préstamo que no se devolvió, el libro vuelve a estar disponible.
export async function remove(id: number): Promise<"DELETED" | "LOAN_NOT_FOUND"> {
  const loan = await LoansRepository.findById(id);
  if (!loan) return "LOAN_NOT_FOUND";

  await LoansRepository.remove(id);
  if (loan.return_date === null) await BooksRepository.setAvailability(loan.book_id, true);
  return "DELETED";
}
