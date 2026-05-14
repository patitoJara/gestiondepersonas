import { Injectable, inject } from '@angular/core';

import {
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class WellbeingFormService {

  // =========================================
  // 🔥 INJECTS
  // =========================================

  private fb =
    inject(FormBuilder);

  constructor() {}

  // =========================================
  // 🔥 AFFILIATE
  // =========================================

  affiliate(): FormGroup {

    return this.fb.group({

      rut: [
        '',
        Validators.required,
      ],

      fullName: [
        '',
        Validators.required,
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],

      phone: [''],
    });
  }

  // =========================================
  // 🔥 BENEFICIARY
  // =========================================

  beneficiary(): FormGroup {

    return this.fb.group({

      beneficiaryType: [
        'AFFILIATE',
        Validators.required,
      ],

      familyMemberId: [
        null,
      ],
    });
  }

  // =========================================
  // 🔥 HEALTH RECORD
  // =========================================

  healthRecord(): FormGroup {

    return this.fb.group({

      name: [''],

      familyMemberId: [null],

      pathology: [''],

      monthlyExpense: [0],
    });
  }

  // =========================================
  // 🔥 OTHER EXPENSE
  // =========================================

  otherExpense(): FormGroup {

    return this.fb.group({

      description: [''],

      amount: [0],
    });
  }
}