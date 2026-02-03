/**
 * Where is my Money - 贷款服务
 * 贷款管理相关操作
 */

import type {
  ICreateLoanParams,
  ILoan,
  ILoanStatistics,
  IRepaymentRecord,
} from '@/types/loan'
import dayjs from 'dayjs'
import { calculateMonthlyPayment } from '@/types/loan'
import { generateId } from '@/utils/id'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'

/**
 * 获取所有贷款
 */
export function getAllLoans(): ILoan[] {
  return getStorageSync<ILoan[]>(StorageKey.LOANS, []) || []
}

/**
 * 保存所有贷款
 */
function saveLoans(loans: ILoan[]): boolean {
  return setStorageSync(StorageKey.LOANS, loans)
}

/**
 * 获取所有还款记录
 */
export function getAllRepayments(): IRepaymentRecord[] {
  return getStorageSync<IRepaymentRecord[]>(StorageKey.REPAYMENTS, []) || []
}

/**
 * 保存所有还款记录
 */
function saveRepayments(repayments: IRepaymentRecord[]): boolean {
  return setStorageSync(StorageKey.REPAYMENTS, repayments)
}

/**
 * 计算下次还款日期
 */
function calculateNextRepaymentDate(repaymentDay: number, startFrom?: number): number {
  const now = startFrom ? dayjs(startFrom) : dayjs()
  let next = now.date(repaymentDay)

  // 如果当月还款日已过，则下个月
  if (next.isBefore(now) || next.isSame(now, 'day')) {
    next = next.add(1, 'month')
  }

  return next.valueOf()
}

/**
 * 创建贷款
 */
export function createLoan(params: ICreateLoanParams): ILoan | null {
  try {
    const now = Date.now()
    const monthlyPayment = calculateMonthlyPayment(
      params.principal,
      params.annualRate,
      params.totalPeriods,
    )

    const loan: ILoan = {
      id: generateId('loan'),
      name: params.name,
      type: params.type,
      institution: params.institution,
      principal: params.principal,
      remainingPrincipal: params.principal,
      annualRate: params.annualRate,
      totalPeriods: params.totalPeriods,
      paidPeriods: 0,
      monthlyPayment,
      repaymentMethod: params.repaymentMethod,
      repaymentDay: params.repaymentDay,
      startDate: params.startDate,
      endDate: dayjs(params.startDate).add(params.totalPeriods, 'month').valueOf(),
      nextRepaymentDate: calculateNextRepaymentDate(params.repaymentDay, params.startDate),
      status: 'active',
      remark: params.remark || '',
      reminderDays: params.reminderDays ?? 3,
      reminderEnabled: params.reminderEnabled ?? true,
      autoRecord: params.autoRecord ?? true,
      categoryId: params.categoryId || '',
      createdAt: now,
      updatedAt: now,
      totalPaidPrincipal: 0,
      totalPaidInterest: 0,
    }

    const loans = getAllLoans()
    loans.push(loan)
    saveLoans(loans)

    return loan
  }
  catch (error) {
    console.error('[LoanService] Failed to create loan:', error)
    return null
  }
}

/**
 * 更新贷款
 */
export function updateLoan(id: string, updates: Partial<ILoan>): ILoan | null {
  try {
    const loans = getAllLoans()
    const index = loans.findIndex(l => l.id === id)
    if (index === -1)
      return null

    loans[index] = {
      ...loans[index],
      ...updates,
      updatedAt: Date.now(),
    }

    saveLoans(loans)
    return loans[index]
  }
  catch (error) {
    console.error('[LoanService] Failed to update loan:', error)
    return null
  }
}

/**
 * 删除贷款
 */
export function deleteLoan(id: string): boolean {
  try {
    const loans = getAllLoans()
    const filtered = loans.filter(l => l.id !== id)
    saveLoans(filtered)

    // 同时删除关联的还款记录
    const repayments = getAllRepayments()
    const filteredRepayments = repayments.filter(r => r.loanId !== id)
    saveRepayments(filteredRepayments)

    return true
  }
  catch (error) {
    console.error('[LoanService] Failed to delete loan:', error)
    return false
  }
}

/**
 * 获取贷款详情
 */
export function getLoanById(id: string): ILoan | null {
  const loans = getAllLoans()
  return loans.find(l => l.id === id) || null
}

/**
 * 获取活跃的贷款
 */
export function getActiveLoans(): ILoan[] {
  return getAllLoans()
    .filter(l => l.status === 'active')
    .sort((a, b) => a.nextRepaymentDate - b.nextRepaymentDate)
}

/**
 * 获取即将还款的贷款
 */
export function getUpcomingLoans(days: number = 7): ILoan[] {
  const now = Date.now()
  const deadline = now + days * 24 * 60 * 60 * 1000

  return getAllLoans()
    .filter(l => l.status === 'active' && l.nextRepaymentDate <= deadline)
    .sort((a, b) => a.nextRepaymentDate - b.nextRepaymentDate)
}

/**
 * 记录还款
 */
export function recordRepayment(
  loanId: string,
  amount: number,
  principal: number,
  interest: number,
  repaymentDate?: number,
  billId?: string,
): IRepaymentRecord | null {
  try {
    const loan = getLoanById(loanId)
    if (!loan)
      return null

    const now = Date.now()
    const repayment: IRepaymentRecord = {
      id: generateId('repay'),
      loanId,
      period: loan.paidPeriods + 1,
      amount,
      principal,
      interest,
      repaymentDate: repaymentDate || now,
      isOverdue: (repaymentDate || now) > loan.nextRepaymentDate,
      billId,
      remark: '',
      createdAt: now,
    }

    // 保存还款记录
    const repayments = getAllRepayments()
    repayments.push(repayment)
    saveRepayments(repayments)

    // 更新贷款状态
    const newRemainingPrincipal = loan.remainingPrincipal - principal
    const isCompleted = loan.paidPeriods + 1 >= loan.totalPeriods || newRemainingPrincipal <= 0

    updateLoan(loanId, {
      paidPeriods: loan.paidPeriods + 1,
      remainingPrincipal: Math.max(0, newRemainingPrincipal),
      totalPaidPrincipal: loan.totalPaidPrincipal + principal,
      totalPaidInterest: loan.totalPaidInterest + interest,
      nextRepaymentDate: isCompleted
        ? loan.nextRepaymentDate
        : calculateNextRepaymentDate(loan.repaymentDay),
      status: isCompleted ? 'completed' : 'active',
    })

    return repayment
  }
  catch (error) {
    console.error('[LoanService] Failed to record repayment:', error)
    return null
  }
}

/**
 * 获取贷款的还款记录
 */
export function getLoanRepayments(loanId: string): IRepaymentRecord[] {
  return getAllRepayments()
    .filter(r => r.loanId === loanId)
    .sort((a, b) => b.repaymentDate - a.repaymentDate)
}

/**
 * 获取贷款统计
 */
export function getLoanStatistics(): ILoanStatistics {
  const loans = getAllLoans().filter(l => l.status === 'active')

  const totalDebt = loans.reduce((sum, l) => sum + l.remainingPrincipal, 0)
  const monthlyRepayment = loans.reduce((sum, l) => sum + l.monthlyPayment, 0)
  const totalRepaid = loans.reduce((sum, l) => sum + l.totalPaidPrincipal + l.totalPaidInterest, 0)
  const totalInterest = loans.reduce((sum, l) => sum + l.totalPaidInterest, 0)

  return {
    activeCount: loans.length,
    totalDebt,
    monthlyRepayment,
    totalRepaid,
    totalInterest,
  }
}

/**
 * 检查需要提醒的贷款
 */
export function checkLoanReminders(): ILoan[] {
  const now = Date.now()

  return getAllLoans().filter((loan) => {
    if (loan.status !== 'active' || !loan.reminderEnabled)
      return false

    const reminderTime = loan.nextRepaymentDate - loan.reminderDays * 24 * 60 * 60 * 1000
    return now >= reminderTime && now < loan.nextRepaymentDate
  })
}

/**
 * 计算等额本息还款计划
 */
export function calculateRepaymentSchedule(loan: ILoan): {
  period: number
  date: string
  payment: number
  principal: number
  interest: number
  remainingPrincipal: number
}[] {
  const schedule = []
  let remainingPrincipal = loan.principal
  const monthlyRate = loan.annualRate / 100 / 12
  const monthlyPayment = loan.monthlyPayment
  let currentDate = dayjs(loan.startDate)

  for (let i = 1; i <= loan.totalPeriods; i++) {
    currentDate = currentDate.add(1, 'month')
    const interest = Math.round(remainingPrincipal * monthlyRate)
    const principal = monthlyPayment - interest
    remainingPrincipal = Math.max(0, remainingPrincipal - principal)

    schedule.push({
      period: i,
      date: currentDate.format('YYYY-MM-DD'),
      payment: monthlyPayment,
      principal,
      interest,
      remainingPrincipal,
    })
  }

  return schedule
}
