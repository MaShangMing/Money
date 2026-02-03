/**
 * Where is my Money - 账单服务
 * 账单数据的CRUD操作和统计分析
 */

import type {
  IBillQueryParams,
  IBillRecord,
  IBillStatistics,
  ICategoryStatistics,
  ICreateBillParams,
  IDailyStatistics,
  IMonthlyStatistics,
} from '@/types/bill'
import dayjs from 'dayjs'
import { generateId } from '@/utils/id'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'
import { getCategoryById } from './categoryService'

/**
 * 获取所有账单
 */
export function getAllBills(): IBillRecord[] {
  return getStorageSync<IBillRecord[]>(StorageKey.BILLS, []) || []
}

/**
 * 保存所有账单
 */
function saveBills(bills: IBillRecord[]): boolean {
  return setStorageSync(StorageKey.BILLS, bills)
}

/**
 * 创建账单
 */
export function createBill(params: ICreateBillParams): IBillRecord | null {
  try {
    const category = getCategoryById(params.categoryId)
    if (!category) {
      console.error('[BillService] Category not found:', params.categoryId)
      return null
    }

    const now = Date.now()
    const bill: IBillRecord = {
      id: generateId('bill'),
      type: params.type,
      amount: params.amount,
      categoryId: params.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      remark: params.remark || '',
      paymentMethod: params.paymentMethod || 'other',
      transactionTime: params.transactionTime || now,
      createdAt: now,
      updatedAt: now,
      source: params.source || 'manual',
      rawNotification: params.rawNotification,
      merchant: params.merchant,
      orderNo: params.orderNo,
      subscriptionId: params.subscriptionId,
      loanId: params.loanId,
      status: 'confirmed',
      synced: false,
      tags: params.tags || [],
    }

    const bills = getAllBills()
    bills.unshift(bill) // 新记录放在最前面
    saveBills(bills)

    return bill
  }
  catch (error) {
    console.error('[BillService] Failed to create bill:', error)
    return null
  }
}

/**
 * 更新账单
 */
export function updateBill(id: string, updates: Partial<IBillRecord>): IBillRecord | null {
  try {
    const bills = getAllBills()
    const index = bills.findIndex(b => b.id === id)
    if (index === -1)
      return null

    // 如果更新了分类，同步更新分类名称和图标
    if (updates.categoryId) {
      const category = getCategoryById(updates.categoryId)
      if (category) {
        updates.categoryName = category.name
        updates.categoryIcon = category.icon
      }
    }

    bills[index] = {
      ...bills[index],
      ...updates,
      updatedAt: Date.now(),
      synced: false,
    }

    saveBills(bills)
    return bills[index]
  }
  catch (error) {
    console.error('[BillService] Failed to update bill:', error)
    return null
  }
}

/**
 * 删除账单(软删除)
 */
export function deleteBill(id: string): boolean {
  try {
    const bills = getAllBills()
    const index = bills.findIndex(b => b.id === id)
    if (index === -1)
      return false

    bills[index].status = 'deleted'
    bills[index].updatedAt = Date.now()
    bills[index].synced = false

    saveBills(bills)
    return true
  }
  catch (error) {
    console.error('[BillService] Failed to delete bill:', error)
    return false
  }
}

/**
 * 彻底删除账单
 */
export function permanentDeleteBill(id: string): boolean {
  try {
    const bills = getAllBills()
    const filtered = bills.filter(b => b.id !== id)
    saveBills(filtered)
    return true
  }
  catch (error) {
    console.error('[BillService] Failed to permanent delete bill:', error)
    return false
  }
}

/**
 * 获取账单详情
 */
export function getBillById(id: string): IBillRecord | null {
  const bills = getAllBills()
  return bills.find(b => b.id === id) || null
}

/**
 * 查询账单列表
 */
export function queryBills(params: IBillQueryParams = {}): {
  list: IBillRecord[]
  total: number
  hasMore: boolean
} {
  let bills = getAllBills().filter(b => b.status !== 'deleted')

  // 时间范围筛选
  if (params.startTime) {
    bills = bills.filter(b => b.transactionTime >= params.startTime!)
  }
  if (params.endTime) {
    bills = bills.filter(b => b.transactionTime <= params.endTime!)
  }

  // 交易类型筛选
  if (params.type) {
    bills = bills.filter(b => b.type === params.type)
  }

  // 分类筛选
  if (params.categoryId) {
    bills = bills.filter(b => b.categoryId === params.categoryId)
  }

  // 支付方式筛选
  if (params.paymentMethod) {
    bills = bills.filter(b => b.paymentMethod === params.paymentMethod)
  }

  // 来源筛选
  if (params.source) {
    bills = bills.filter(b => b.source === params.source)
  }

  // 标签筛选
  if (params.tags && params.tags.length > 0) {
    bills = bills.filter(b => params.tags!.some(tag => b.tags.includes(tag)))
  }

  // 关键词搜索
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    bills = bills.filter(
      b =>
        b.remark.toLowerCase().includes(keyword)
        || b.categoryName.toLowerCase().includes(keyword)
        || b.merchant?.toLowerCase().includes(keyword),
    )
  }

  // 按交易时间排序(最新在前)
  bills.sort((a, b) => b.transactionTime - a.transactionTime)

  const total = bills.length

  // 分页
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const start = (page - 1) * pageSize
  const list = bills.slice(start, start + pageSize)

  return {
    list,
    total,
    hasMore: start + pageSize < total,
  }
}

/**
 * 获取账单统计
 */
export function getBillStatistics(startTime: number, endTime: number): IBillStatistics {
  const bills = getAllBills().filter(
    b =>
      b.status !== 'deleted'
      && b.transactionTime >= startTime
      && b.transactionTime <= endTime,
  )

  let totalIncome = 0
  let totalExpense = 0

  bills.forEach((bill) => {
    if (bill.type === 'income') {
      totalIncome += bill.amount
    }
    else if (bill.type === 'expense') {
      totalExpense += bill.amount
    }
  })

  return {
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    count: bills.length,
    startTime,
    endTime,
  }
}

/**
 * 获取分类统计
 */
export function getCategoryStatistics(
  startTime: number,
  endTime: number,
  type: 'income' | 'expense' = 'expense',
): ICategoryStatistics[] {
  const bills = getAllBills().filter(
    b =>
      b.status !== 'deleted'
      && b.type === type
      && b.transactionTime >= startTime
      && b.transactionTime <= endTime,
  )

  const categoryMap = new Map<string, { amount: number, count: number, name: string, icon: string }>()

  bills.forEach((bill) => {
    const existing = categoryMap.get(bill.categoryId)
    if (existing) {
      existing.amount += bill.amount
      existing.count += 1
    }
    else {
      categoryMap.set(bill.categoryId, {
        amount: bill.amount,
        count: 1,
        name: bill.categoryName,
        icon: bill.categoryIcon,
      })
    }
  })

  const totalAmount = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0)

  const stats: ICategoryStatistics[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categoryIcon: data.icon,
      amount: data.amount,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 10000) / 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)

  return stats
}

/**
 * 获取日统计
 */
export function getDailyStatistics(startTime: number, endTime: number): IDailyStatistics[] {
  const bills = getAllBills().filter(
    b =>
      b.status !== 'deleted'
      && b.transactionTime >= startTime
      && b.transactionTime <= endTime,
  )

  const dailyMap = new Map<string, { income: number, expense: number, count: number }>()

  // 初始化日期范围内的所有天
  let current = dayjs(startTime).startOf('day')
  const end = dayjs(endTime).startOf('day')
  while (current.isBefore(end) || current.isSame(end)) {
    const dateStr = current.format('YYYY-MM-DD')
    dailyMap.set(dateStr, { income: 0, expense: 0, count: 0 })
    current = current.add(1, 'day')
  }

  // 统计每天的数据
  bills.forEach((bill) => {
    const dateStr = dayjs(bill.transactionTime).format('YYYY-MM-DD')
    const daily = dailyMap.get(dateStr)
    if (daily) {
      if (bill.type === 'income') {
        daily.income += bill.amount
      }
      else if (bill.type === 'expense') {
        daily.expense += bill.amount
      }
      daily.count += 1
    }
  })

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 获取月统计
 */
export function getMonthlyStatistics(year: number, month: number): IMonthlyStatistics {
  const startTime = dayjs().year(year).month(month - 1).startOf('month').valueOf()
  const endTime = dayjs().year(year).month(month - 1).endOf('month').valueOf()

  const basicStats = getBillStatistics(startTime, endTime)
  const categoryStats = getCategoryStatistics(startTime, endTime, 'expense')
  const dailyStats = getDailyStatistics(startTime, endTime)

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    income: basicStats.totalIncome,
    expense: basicStats.totalExpense,
    netIncome: basicStats.netIncome,
    count: basicStats.count,
    categoryStats,
    dailyStats,
  }
}

/**
 * 获取最近的账单
 */
export function getRecentBills(limit: number = 10): IBillRecord[] {
  return getAllBills()
    .filter(b => b.status !== 'deleted')
    .sort((a, b) => b.transactionTime - a.transactionTime)
    .slice(0, limit)
}

/**
 * 检查是否存在重复账单(用于通知监听去重)
 */
export function checkDuplicateBill(
  amount: number,
  merchant: string | undefined,
  transactionTime: number,
  tolerance: number = 60000, // 默认1分钟内
): IBillRecord | null {
  const bills = getAllBills()
  return bills.find(
    b =>
      b.amount === amount
      && b.merchant === merchant
      && Math.abs(b.transactionTime - transactionTime) < tolerance,
  ) || null
}
