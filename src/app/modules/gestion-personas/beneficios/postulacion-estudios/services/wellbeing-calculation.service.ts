import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingCalculationService {

  constructor() {}

  // =========================================
  // 🔥 TOTAL INCOMES
  // =========================================

  totalIncomes(
    incomes: any[],
  ): number {

    return incomes.reduce(
      (sum, i) =>
        sum + (Number(i.amount) || 0),
      0,
    );
  }

  // =========================================
  // 🔥 TOTAL HEALTH
  // =========================================

  totalHealthExpenses(
    items: any[],
  ): number {

    return items.reduce(
      (sum, i) =>
        sum + (Number(i.monthlyExpense) || 0),
      0,
    );
  }

  // =========================================
  // 🔥 TOTAL OTHER EXPENSES
  // =========================================

  totalOtherExpenses(
    items: any[],
  ): number {

    return items.reduce(
      (sum, i) =>
        sum + (Number(i.amount) || 0),
      0,
    );
  }

  // =========================================
  // 🔥 TOTAL EXPENSES
  // =========================================

  totalExpenses(
    expenses: any,
  ): number {

    return (
      (Number(expenses?.rentOrMortgage) || 0) +
      (Number(expenses?.electricity) || 0) +
      (Number(expenses?.water) || 0) +
      (Number(expenses?.gas) || 0) +
      (Number(expenses?.phone) || 0) +
      (Number(expenses?.credits) || 0) +
      (Number(expenses?.tuition) || 0) +
      (Number(expenses?.monthlyFee) || 0) +
      (Number(expenses?.accommodation) || 0)
    );
  }

  // =========================================
  // 🔥 FAMILY BALANCE
  // =========================================

  familyBalance(
    incomes: number,
    expenses: number,
  ): number {

    return incomes - expenses;
  }

  // =========================================
  // 🔥 DOCUMENT PROGRESS
  // =========================================

  documentProgress(
    uploaded: number,
    total: number,
  ): number {

    if (!total) {
      return 0;
    }

    return Math.round(
      (uploaded / total) * 100,
    );
  }
}