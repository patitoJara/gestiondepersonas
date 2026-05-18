export interface OtherExpense {
  description: string;

  amount: number;
}

export interface ExpenseRequest {
  rentOrMortgage: number;

  electricity: number;

  water: number;

  gas: number;

  phone: number;

  credits: number;

  tuition: number;

  monthlyFee: number;

  accommodation: number;

  otherExpenses: OtherExpense[];
}