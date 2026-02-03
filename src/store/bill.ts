/**
 * Where is my Money - 账单状态管理
 */

import type {
  IBillQueryParams,
  IBillRecord,
  IBillStatistics,
  ICategoryStatistics,
  ICreateBillParams,
  IDailyStatistics,
} from '@/types/bill'
import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createBill,
  deleteBill,
  getBillById,
  getBillStatistics,
  getCategoryStatistics,
  getDailyStatistics,
  getRecentBills,
  queryBills,
  updateBill,
} from '@/services/billService'

export const useBillStore = defineStore('bill', () => {
  // ==================== State ====================

  /** 账单列表 */
  const billList = ref<IBillRecord[]>([])

  /** 当前查询参数 */
  const queryParams = ref<IBillQueryParams>({
    page: 1,
    pageSize: 20,
  })

  /** 是否有更多数据 */
  const hasMore = ref(true)

  /** 总数 */
  const total = ref(0)

  /** 加载状态 */
  const loading = ref(false)

  /** 当前月份统计 */
  const currentMonthStats = ref<IBillStatistics | null>(null)

  /** 分类统计 */
  const categoryStats = ref<ICategoryStatistics[]>([])

  /** 日统计 */
  const dailyStats = ref<IDailyStatistics[]>([])

  // ==================== Getters ====================

  /** 今日账单 */
  const todayBills = computed(() => {
    const todayStart = dayjs().startOf('day').valueOf()
    const todayEnd = dayjs().endOf('day').valueOf()
    return billList.value.filter(
      b => b.transactionTime >= todayStart && b.transactionTime <= todayEnd,
    )
  })

  /** 今日支出 */
  const todayExpense = computed(() => {
    return todayBills.value
      .filter(b => b.type === 'expense')
      .reduce((sum, b) => sum + b.amount, 0)
  })

  /** 今日收入 */
  const todayIncome = computed(() => {
    return todayBills.value
      .filter(b => b.type === 'income')
      .reduce((sum, b) => sum + b.amount, 0)
  })

  /** 本月支出 */
  const monthExpense = computed(() => currentMonthStats.value?.totalExpense || 0)

  /** 本月收入 */
  const monthIncome = computed(() => currentMonthStats.value?.totalIncome || 0)

  /** 本月净收入 */
  const monthNetIncome = computed(() => currentMonthStats.value?.netIncome || 0)

  // ==================== Actions ====================

  /**
   * 加载账单列表
   */
  function loadBills(params?: IBillQueryParams, append = false) {
    loading.value = true

    try {
      const mergedParams = { ...queryParams.value, ...params }
      const result = queryBills(mergedParams)

      if (append) {
        billList.value = [...billList.value, ...result.list]
      }
      else {
        billList.value = result.list
      }

      hasMore.value = result.hasMore
      total.value = result.total
      queryParams.value = mergedParams
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 加载更多账单
   */
  function loadMoreBills() {
    if (!hasMore.value || loading.value)
      return

    loadBills({
      ...queryParams.value,
      page: (queryParams.value.page || 1) + 1,
    }, true)
  }

  /**
   * 刷新账单列表
   */
  function refreshBills() {
    loadBills({ ...queryParams.value, page: 1 }, false)
  }

  /**
   * 添加账单
   */
  function addBill(params: ICreateBillParams): IBillRecord | null {
    const bill = createBill(params)
    if (bill) {
      // 将新账单添加到列表开头
      billList.value.unshift(bill)
      total.value += 1
      // 更新统计
      refreshCurrentMonthStats()
    }
    return bill
  }

  /**
   * 修改账单
   */
  function editBill(id: string, updates: Partial<IBillRecord>): IBillRecord | null {
    const bill = updateBill(id, updates)
    if (bill) {
      const index = billList.value.findIndex(b => b.id === id)
      if (index !== -1) {
        billList.value[index] = bill
      }
      refreshCurrentMonthStats()
    }
    return bill
  }

  /**
   * 删除账单
   */
  function removeBill(id: string): boolean {
    const success = deleteBill(id)
    if (success) {
      const index = billList.value.findIndex(b => b.id === id)
      if (index !== -1) {
        billList.value.splice(index, 1)
        total.value -= 1
      }
      refreshCurrentMonthStats()
    }
    return success
  }

  /**
   * 获取账单详情
   */
  function getBill(id: string): IBillRecord | null {
    // 先从缓存查找
    const cached = billList.value.find(b => b.id === id)
    if (cached)
      return cached

    // 从存储查找
    return getBillById(id)
  }

  /**
   * 获取最近账单
   */
  function loadRecentBills(limit: number = 10): IBillRecord[] {
    const recent = getRecentBills(limit)
    return recent
  }

  /**
   * 刷新当月统计
   */
  function refreshCurrentMonthStats() {
    const startTime = dayjs().startOf('month').valueOf()
    const endTime = dayjs().endOf('month').valueOf()
    currentMonthStats.value = getBillStatistics(startTime, endTime)
  }

  /**
   * 加载分类统计
   */
  function loadCategoryStats(startTime: number, endTime: number, type: 'income' | 'expense' = 'expense') {
    categoryStats.value = getCategoryStatistics(startTime, endTime, type)
    return categoryStats.value
  }

  /**
   * 加载日统计
   */
  function loadDailyStats(startTime: number, endTime: number) {
    dailyStats.value = getDailyStatistics(startTime, endTime)
    return dailyStats.value
  }

  /**
   * 初始化
   */
  function init() {
    refreshCurrentMonthStats()
    loadBills()
  }

  return {
    // State
    billList,
    queryParams,
    hasMore,
    total,
    loading,
    currentMonthStats,
    categoryStats,
    dailyStats,

    // Getters
    todayBills,
    todayExpense,
    todayIncome,
    monthExpense,
    monthIncome,
    monthNetIncome,

    // Actions
    loadBills,
    loadMoreBills,
    refreshBills,
    addBill,
    editBill,
    removeBill,
    getBill,
    loadRecentBills,
    refreshCurrentMonthStats,
    loadCategoryStats,
    loadDailyStats,
    init,
  }
})
