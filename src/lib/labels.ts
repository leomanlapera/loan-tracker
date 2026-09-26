/**
 * Human-readable labels for enum values. Use everywhere raw enums would
 * otherwise leak to the UI (badges, tables, tiles).
 */

import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
} from '@/lib/engine/types'

export type LoanStatus = 'active' | 'paid' | 'written_off' | 'cancelled'

export const loanStatusLabels: Record<LoanStatus, string> = {
  active: 'Active',
  paid: 'Paid',
  written_off: 'Written off',
  cancelled: 'Cancelled',
}

export const interestMethodLabels: Record<InterestMethod, string> = {
  compound: 'Compound',
  simple: 'Simple',
}

export const repaymentTypeLabels: Record<RepaymentType, string> = {
  lump_sum: 'Lump sum',
  equal_installments: 'Equal installments',
  custom: 'Custom schedule',
}

export const afterMaturityLabels: Record<AfterMaturity, string> = {
  continue_accruing: 'Keep accruing after maturity',
  stop_accruing: 'Freeze at maturity',
}

export function loanStatusLabel(v: string): string {
  return loanStatusLabels[v as LoanStatus] ?? v
}

export function interestMethodLabel(v: string): string {
  return interestMethodLabels[v as InterestMethod] ?? v
}

export function repaymentTypeLabel(v: string): string {
  return repaymentTypeLabels[v as RepaymentType] ?? v
}

export function afterMaturityLabel(v: string): string {
  return afterMaturityLabels[v as AfterMaturity] ?? v
}

export type PeriodStatus = 'paid' | 'partial' | 'unpaid' | 'upcoming'

export const periodStatusLabels: Record<PeriodStatus, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  upcoming: 'Upcoming',
}

export function periodStatusLabel(v: string): string {
  return periodStatusLabels[v as PeriodStatus] ?? v
}

export const activityEntityLabels: Record<string, string> = {
  borrower: 'Borrower',
  loan: 'Loan',
  payment: 'Payment',
  loan_custom_schedule: 'Custom schedule',
}

export const activityActionLabels: Record<string, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
}

export function activityEntityLabel(v: string): string {
  return activityEntityLabels[v] ?? v
}

export function activityActionLabel(v: string): string {
  return activityActionLabels[v] ?? v
}

