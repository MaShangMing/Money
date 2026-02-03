/**
 * Where is my Money - 贷款状态管理
 */

import type {
  ICreateLoanParams,
  ILoan,
  ILoanStatistics,
  IRepaymentRecord,
} from '@/types/loan'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  calculateRepaymentSchedule,
  checkLoanReminders,
  createLoan,
  deleteLoan,
  getAllLoans,
  getLoanById,
  getLoanRepayments,
  getLoanStatistics,
  getUpcomingLoans,
  recordRepayment,
  updateLoan,
} from '@/services/loanService'

export const useLoanStore = defineStore('loan', () => {
  // ==================== State ====================

  /** 贷款列表 */
  const loans = ref<ILoan[]>([])

  /** 统计数据 */
  const statistics = ref<ILoanStatistics | null>(null)

  /** 是否已初始化 */
  const initialized = ref(false)

  // ==================== Getters ====================

  /** 活跃贷款 */
  const activeLoans = computed(() => {
    return loans.value
      .filter(l => l.status === 'active')
      .sort((a, b) => a.nextRepaymentDate - b.nextRepaymentDate)
  })

  /** 已结清贷款 */
  const completedLoans = computed(() => {
    return loans.value.filter(l => l.status === 'completed')
  })

  /** 活跃贷款数量 */
  const activeCount = computed(() => activeLoans.value.length)

  /** 总负债 */
  const totalDebt = computed(() => statistics.value?.totalDebt || 0)

  /** 月还款额 */
  const monthlyRepayment = computed(() => statistics.value?.monthlyRepayment || 0)

  /** 累计已还 */
  const totalRepaid = computed(() => statistics.value?.totalRepaid || 0)

  // ==================== Actions ====================

  /**
   * 初始化
   */
  function init() {
    if (initialized.value)
      return

    refresh()
    initialized.value = true
  }

  /**
   * 刷新数据
   */
  function refresh() {
    loans.value = getAllLoans()
    statistics.value = getLoanStatistics()
  }

  /**
   * 添加贷款
   */
  function addLoan(params: ICreateLoanParams): ILoan | null {
    const loan = createLoan(params)
    if (loan) {
      loans.value.push(loan)
      statistics.value = getLoanStatistics()
    }
    return loan
  }

  /**
   * 修改贷款
   */
  function editLoan(id: string, updates: Partial<ILoan>): ILoan | null {
    const loan = updateLoan(id, updates)
    if (loan) {
      const index = loans.value.findIndex(l => l.id === id)
      if (index !== -1) {
        loans.value[index] = loan
      }
      statistics.value = getLoanStatistics()
    }
    return loan
  }

  /**
   * 删除贷款
   */
  function removeLoan(id: string): boolean {
    const success = deleteLoan(id)
    if (success) {
      const index = loans.value.findIndex(l => l.id === id)
      if (index !== -1) {
        loans.value.splice(index, 1)
      }
      statistics.value = getLoanStatistics()
    }
    return success
  }

  /**
   * 获取贷款详情
   */
  function getLoan(id: string): ILoan | null {
    const cached = loans.value.find(l => l.id === id)
    if (cached)
      return cached
    return getLoanById(id)
  }

  /**
   * 记录还款
   */
  function addRepayment(
    loanId: string,
    amount: number,
    principal: number,
    interest: number,
    repaymentDate?: number,
    billId?: string,
  ): IRepaymentRecord | null {
    const repayment = recordRepayment(loanId, amount, principal, interest, repaymentDate, billId)
    if (repayment) {
      refresh()
    }
    return repayment
  }

  /**
   * 获取还款记录
   */
  function getRepayments(loanId: string): IRepaymentRecord[] {
    return getLoanRepayments(loanId)
  }

  /**
   * 获取还款计划
   */
  function getRepaymentSchedule(loanId: string) {
    const loan = getLoan(loanId)
    if (!loan)
      return []
    return calculateRepaymentSchedule(loan)
  }

  /**
   * 获取即将还款的贷款
   */
  function getUpcoming(days: number = 7): ILoan[] {
    return getUpcomingLoans(days)
  }

  /**
   * 检查需要提醒的贷款
   */
  function checkReminders(): ILoan[] {
    return checkLoanReminders()
  }

  return {
    // State
    loans,
    statistics,
    initialized,

    // Getters
    activeLoans,
    completedLoans,
    activeCount,
    totalDebt,
    monthlyRepayment,
    totalRepaid,

    // Actions
    init,
    refresh,
    addLoan,
    editLoan,
    removeLoan,
    getLoan,
    addRepayment,
    getRepayments,
    getRepaymentSchedule,
    getUpcoming,
    checkReminders,
  }
})
