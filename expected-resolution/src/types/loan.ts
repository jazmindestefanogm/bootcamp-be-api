export interface Loan {
  id: number;
  book_id: number;
  member_name: string;
  loan_date: string;
  return_date: string | null;
}

export interface NewLoan {
  book_id: number;
  member_name: string;
}

export interface LoanReturn {
  return_date: string;
}
