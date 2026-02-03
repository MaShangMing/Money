/**
 * Where is my Money - 订阅服务
 * 订阅管理相关操作
 */

import type {
  ICreateSubscriptionParams,
  ISubscription,
  ISubscriptionStatistics,
  SubscriptionCycle,
} from '@/types/subscription'
import dayjs from 'dayjs'
import { calculateMonthlyAmount } from '@/types/subscription'
import { generateId } from '@/utils/id'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'
import { getCategoryById } from './categoryService'

/**
 * 获取所有订阅
 */
export function getAllSubscriptions(): ISubscription[] {
  return getStorageSync<ISubscription[]>(StorageKey.SUBSCRIPTIONS, []) || []
}

/**
 * 保存所有订阅
 */
function saveSubscriptions(subscriptions: ISubscription[]): boolean {
  return setStorageSync(StorageKey.SUBSCRIPTIONS, subscriptions)
}

/**
 * 计算下次扣费日期
 */
function calculateNextBillingDate(startDate: number, cycle: SubscriptionCycle): number {
  const start = dayjs(startDate)
  const now = dayjs()

  let next = start
  while (next.isBefore(now)) {
    switch (cycle) {
      case 'daily':
        next = next.add(1, 'day')
        break
      case 'weekly':
        next = next.add(1, 'week')
        break
      case 'monthly':
        next = next.add(1, 'month')
        break
      case 'quarterly':
        next = next.add(3, 'month')
        break
      case 'yearly':
        next = next.add(1, 'year')
        break
    }
  }

  return next.valueOf()
}

/**
 * 创建订阅
 */
export function createSubscription(params: ICreateSubscriptionParams): ISubscription | null {
  try {
    const category = getCategoryById(params.categoryId)
    if (!category) {
      console.error('[SubscriptionService] Category not found:', params.categoryId)
      return null
    }

    const now = Date.now()
    const subscription: ISubscription = {
      id: generateId('sub'),
      name: params.name,
      icon: params.icon || 'i-carbon-renewal',
      iconBgColor: params.iconBgColor || '#0ea5e9',
      amount: params.amount,
      cycle: params.cycle,
      categoryId: params.categoryId,
      categoryName: category.name,
      startDate: params.startDate,
      endDate: params.endDate,
      nextBillingDate: calculateNextBillingDate(params.startDate, params.cycle),
      paymentMethod: params.paymentMethod || '',
      status: 'active',
      remark: params.remark || '',
      reminderDays: params.reminderDays ?? 3,
      reminderEnabled: params.reminderEnabled ?? true,
      autoRecord: params.autoRecord ?? true,
      createdAt: now,
      updatedAt: now,
      totalPaid: 0,
      paymentCount: 0,
    }

    const subscriptions = getAllSubscriptions()
    subscriptions.push(subscription)
    saveSubscriptions(subscriptions)

    return subscription
  }
  catch (error) {
    console.error('[SubscriptionService] Failed to create subscription:', error)
    return null
  }
}

/**
 * 更新订阅
 */
export function updateSubscription(id: string, updates: Partial<ISubscription>): ISubscription | null {
  try {
    const subscriptions = getAllSubscriptions()
    const index = subscriptions.findIndex(s => s.id === id)
    if (index === -1)
      return null

    // 如果更新了分类，同步更新分类名称
    if (updates.categoryId) {
      const category = getCategoryById(updates.categoryId)
      if (category) {
        updates.categoryName = category.name
      }
    }

    // 如果更新了开始日期或周期，重新计算下次扣费日期
    if (updates.startDate || updates.cycle) {
      const startDate = updates.startDate || subscriptions[index].startDate
      const cycle = updates.cycle || subscriptions[index].cycle
      updates.nextBillingDate = calculateNextBillingDate(startDate, cycle)
    }

    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updatedAt: Date.now(),
    }

    saveSubscriptions(subscriptions)
    return subscriptions[index]
  }
  catch (error) {
    console.error('[SubscriptionService] Failed to update subscription:', error)
    return null
  }
}

/**
 * 删除订阅
 */
export function deleteSubscription(id: string): boolean {
  try {
    const subscriptions = getAllSubscriptions()
    const filtered = subscriptions.filter(s => s.id !== id)
    saveSubscriptions(filtered)
    return true
  }
  catch (error) {
    console.error('[SubscriptionService] Failed to delete subscription:', error)
    return false
  }
}

/**
 * 获取订阅详情
 */
export function getSubscriptionById(id: string): ISubscription | null {
  const subscriptions = getAllSubscriptions()
  return subscriptions.find(s => s.id === id) || null
}

/**
 * 获取活跃的订阅
 */
export function getActiveSubscriptions(): ISubscription[] {
  return getAllSubscriptions()
    .filter(s => s.status === 'active')
    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
}

/**
 * 获取即将到期的订阅(指定天数内)
 */
export function getUpcomingSubscriptions(days: number = 7): ISubscription[] {
  const now = Date.now()
  const deadline = now + days * 24 * 60 * 60 * 1000

  return getAllSubscriptions()
    .filter(s => s.status === 'active' && s.nextBillingDate <= deadline)
    .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
}

/**
 * 记录订阅扣费
 */
export function recordSubscriptionPayment(id: string): ISubscription | null {
  const subscription = getSubscriptionById(id)
  if (!subscription)
    return null

  // 更新统计数据
  const nextBillingDate = calculateNextBillingDate(
    subscription.nextBillingDate + 1000, // +1s 避免死循环
    subscription.cycle,
  )

  return updateSubscription(id, {
    totalPaid: subscription.totalPaid + subscription.amount,
    paymentCount: subscription.paymentCount + 1,
    nextBillingDate,
  })
}

/**
 * 暂停订阅
 */
export function pauseSubscription(id: string): ISubscription | null {
  return updateSubscription(id, { status: 'paused' })
}

/**
 * 恢复订阅
 */
export function resumeSubscription(id: string): ISubscription | null {
  const subscription = getSubscriptionById(id)
  if (!subscription)
    return null

  return updateSubscription(id, {
    status: 'active',
    nextBillingDate: calculateNextBillingDate(Date.now(), subscription.cycle),
  })
}

/**
 * 取消订阅
 */
export function cancelSubscription(id: string): ISubscription | null {
  return updateSubscription(id, { status: 'cancelled' })
}

/**
 * 获取订阅统计
 */
export function getSubscriptionStatistics(): ISubscriptionStatistics {
  const subscriptions = getAllSubscriptions().filter(s => s.status === 'active')

  let monthlyTotal = 0
  let yearlyTotal = 0
  const categoryMap = new Map<string, { amount: number, count: number, name: string }>()

  subscriptions.forEach((sub) => {
    const monthlyAmount = calculateMonthlyAmount(sub.amount, sub.cycle)
    monthlyTotal += monthlyAmount
    yearlyTotal += monthlyAmount * 12

    const existing = categoryMap.get(sub.categoryId)
    if (existing) {
      existing.amount += monthlyAmount
      existing.count += 1
    }
    else {
      categoryMap.set(sub.categoryId, {
        amount: monthlyAmount,
        count: 1,
        name: sub.categoryName,
      })
    }
  })

  const categoryDistribution = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    activeCount: subscriptions.length,
    monthlyTotal,
    yearlyTotal,
    categoryDistribution,
  }
}

/**
 * 检查需要提醒的订阅
 */
export function checkSubscriptionReminders(): ISubscription[] {
  const now = Date.now()

  return getAllSubscriptions().filter((sub) => {
    if (sub.status !== 'active' || !sub.reminderEnabled)
      return false

    const reminderTime = sub.nextBillingDate - sub.reminderDays * 24 * 60 * 60 * 1000
    return now >= reminderTime && now < sub.nextBillingDate
  })
}
