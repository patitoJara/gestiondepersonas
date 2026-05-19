import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingValidationService {

  constructor() {}

  // =========================================
  // 🔥 MINIMUM AFFILIATION
  // =========================================

  hasMinimumAffiliation(
    months: number,
  ): boolean {

    return months >= 6;
  }

  // =========================================
  // 🔥 VALIDATE FAMILY MEMBERS
  // =========================================

  hasFamilyMembers(
    familiares: any[],
  ): boolean {

    return familiares.length > 0;
  }

  // =========================================
  // 🔥 VALIDATE DOCUMENTS
  // =========================================

  hasRequiredDocuments(
    uploaded: number,
    required: number,
  ): boolean {

    return uploaded >= required;
  }

  // =========================================
  // 🔥 VALIDATE STEP
  // =========================================

  isStepValid(
    form: any,
  ): boolean {

    return form?.valid ?? false;
  }

  // =========================================
  // 🔥 VALIDATE INCOME
  // =========================================

  hasIncome(
    incomes: any[],
  ): boolean {

    return incomes.some(
      (i) => i.amount > 0,
    );
  }

  // =========================================
  // 🔥 VALIDATE EXPENSES
  // =========================================

  hasExpenses(
    expenses: any,
  ): boolean {

    return (
      expenses?.rentOrMortgage > 0 ||
      expenses?.electricity > 0 ||
      expenses?.water > 0
    );
  }
}