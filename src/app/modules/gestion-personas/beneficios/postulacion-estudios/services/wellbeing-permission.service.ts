import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingPermissionService {

  constructor() {}

  // =========================================
  // 🔥 ADMIN
  // =========================================

  isAdmin(
    roles: string[],
  ): boolean {

    return roles.includes(
      'ROLE_ADMIN',
    );
  }

  // =========================================
  // 🔥 WELLBEING
  // =========================================

  isWellbeing(
    roles: string[],
  ): boolean {

    return roles.includes(
      'ROLE_WELLBEING',
    );
  }

  // =========================================
  // 🔥 REVIEWER
  // =========================================

  isReviewer(
    roles: string[],
  ): boolean {

    return roles.includes(
      'ROLE_REVIEWER',
    );
  }

  // =========================================
  // 🔥 CAN EDIT
  // =========================================

  canEdit(
    status: string,
  ): boolean {

    return (
      status === 'BORRADOR'
    );
  }

  // =========================================
  // 🔥 CAN SUBMIT
  // =========================================

  canSubmit(
    status: string,
  ): boolean {

    return (
      status === 'BORRADOR'
    );
  }

  // =========================================
  // 🔥 CAN REVIEW
  // =========================================

  canReview(
    status: string,
  ): boolean {

    return (
      status === 'EN_REVISION'
    );
  }
}