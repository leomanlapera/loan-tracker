import Decimal from 'decimal.js'

export type InterestMethod = 'compound' | 'simple'
export type RepaymentType = 'lump_sum' | 'equal_installments' | 'custom'
export type AfterMaturity = 'continue_accruing' | 'stop_accruing'
export type PeriodStatus = 'paid' | 'partial' | 'unpaid' | 'upcoming'

export type DecimalLike = Decimal.Value

export interface CustomScheduleEntry {
  period: number
  plannedAmount: DecimalLike
}

export interface LoanInput {
  principal: DecimalLike
  monthlyRate: DecimalLike
  tenureMonths: number
  startDate: Date
  interestMethod: InterestMethod
  repaymentType: RepaymentType
  afterMaturity: AfterMaturity
  graceDays: number
  customSchedule?: CustomScheduleEntry[]
}

export interface PaymentInput {
  amount: DecimalLike
  paidOn: Date
}

export interface EngineInput {
  loan: LoanInput
  payments: PaymentInput[]
  asOf: Date
}

export interface PeriodRow {
  period: number
  dueDate: Date
  openingBalance: Decimal
  interestAccrued: Decimal
  scheduledPayment: Decimal
  actualPayment: Decimal
  closingBalance: Decimal
  status: PeriodStatus
  isOverdue: boolean
}

export interface EngineOutput {
  schedule: PeriodRow[]
  currentBalance: Decimal
  totalPaid: Decimal
  interestEarnedToDate: Decimal
  nextDueDate: Date | null
  nextDueAmount: Decimal
  payoffAmount: Decimal
  isPaid: boolean
  maturityDate: Date
}

export interface ValidatePaymentResult {
  ok: boolean
  payoffAmount: Decimal
}
