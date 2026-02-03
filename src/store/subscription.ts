/**
 * Where is my Money - 订阅状态管理
 */

import type {
  ICreateSubscriptionParams,
  ISubscription,
  ISubscriptionStatistics,
} from '@/types/subscription'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  cancelSubscription,
  checkSubscriptionReminders,
  createSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionStatistics,
  getUpcomingSubscriptions,
  pauseSubscription,
  recordSubscriptionPayment,
  resumeSubscription,
  updateSubscription,
} from '@/services/subscriptionService'

export const useSubscriptionStore = defineStore('subscription', () => {
  // ==================== State ====================

  /** 订阅列表 */
  const subscriptions = ref<ISubscription[]>([])

  /** 统计数据 */
  const statistics = ref<ISubscriptionStatistics | null>(null)

  /** 是否已初始化 */
  const initialized = ref(false)

  // ==================== Getters ====================

  /** 活跃订阅 */
  const activeSubscriptions = computed(() => {
    return subscriptions.value
      .filter(s => s.status === 'active')
      .sort((a, b) => a.nextBillingDate - b.nextBillingDate)
  })

  /** 暂停的订阅 */
  const pausedSubscriptions = computed(() => {
    return subscriptions.value.filter(s => s.status === 'paused')
  })

  /** 已取消的订阅 */
  const cancelledSubscriptions = computed(() => {
    return subscriptions.value.filter(s => s.status === 'cancelled')
  })

  /** 活跃订阅数量 */
  const activeCount = computed(() => activeSubscriptions.value.length)

  /** 月均花费 */
  const monthlyTotal = computed(() => statistics.value?.monthlyTotal || 0)

  /** 年度花费 */
  const yearlyTotal = computed(() => statistics.value?.yearlyTotal || 0)

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
    subscriptions.value = getAllSubscriptions()
    statistics.value = getSubscriptionStatistics()
  }

  /**
   * 添加订阅
   */
  function addSubscription(params: ICreateSubscriptionParams): ISubscription | null {
    const subscription = createSubscription(params)
    if (subscription) {
      subscriptions.value.push(subscription)
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 修改订阅
   */
  function editSubscription(id: string, updates: Partial<ISubscription>): ISubscription | null {
    const subscription = updateSubscription(id, updates)
    if (subscription) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = subscription
      }
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 删除订阅
   */
  function removeSubscription(id: string): boolean {
    const success = deleteSubscription(id)
    if (success) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value.splice(index, 1)
      }
      statistics.value = getSubscriptionStatistics()
    }
    return success
  }

  /**
   * 获取订阅详情
   */
  function getSubscription(id: string): ISubscription | null {
    const cached = subscriptions.value.find(s => s.id === id)
    if (cached)
      return cached
    return getSubscriptionById(id)
  }

  /**
   * 记录扣费
   */
  function recordPayment(id: string): ISubscription | null {
    const subscription = recordSubscriptionPayment(id)
    if (subscription) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = subscription
      }
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 暂停订阅
   */
  function pause(id: string): ISubscription | null {
    const subscription = pauseSubscription(id)
    if (subscription) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = subscription
      }
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 恢复订阅
   */
  function resume(id: string): ISubscription | null {
    const subscription = resumeSubscription(id)
    if (subscription) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = subscription
      }
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 取消订阅
   */
  function cancel(id: string): ISubscription | null {
    const subscription = cancelSubscription(id)
    if (subscription) {
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = subscription
      }
      statistics.value = getSubscriptionStatistics()
    }
    return subscription
  }

  /**
   * 获取即将扣费的订阅
   */
  function getUpcoming(days: number = 7): ISubscription[] {
    return getUpcomingSubscriptions(days)
  }

  /**
   * 检查需要提醒的订阅
   */
  function checkReminders(): ISubscription[] {
    return checkSubscriptionReminders()
  }

  return {
    // State
    subscriptions,
    statistics,
    initialized,

    // Getters
    activeSubscriptions,
    pausedSubscriptions,
    cancelledSubscriptions,
    activeCount,
    monthlyTotal,
    yearlyTotal,

    // Actions
    init,
    refresh,
    addSubscription,
    editSubscription,
    removeSubscription,
    getSubscription,
    recordPayment,
    pause,
    resume,
    cancel,
    getUpcoming,
    checkReminders,
  }
})
