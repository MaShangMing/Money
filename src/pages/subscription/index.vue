<script lang="ts" setup>
/**
 * Where is my Money - 订阅管理页面
 * 展示和管理付费订阅
 */

import type { ISubscription } from '@/types/subscription'
import dayjs from 'dayjs'
import { useSettingsStore, useSubscriptionStore } from '@/store'
import { getCycleName } from '@/types/subscription'
import { formatAmount } from '@/utils/format'

defineOptions({
  name: 'Subscription',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const subscriptionStore = useSubscriptionStore()
const settingsStore = useSettingsStore()

// 是否隐藏金额
const hideAmount = computed(() => settingsStore.hideAmount)
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 活跃订阅
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions)

// 月均花费
const monthlyTotal = computed(() => subscriptionStore.monthlyTotal)

// 年度花费
const yearlyTotal = computed(() => subscriptionStore.yearlyTotal)

// 活跃数量
const activeCount = computed(() => subscriptionStore.activeCount)

// 初始化
onMounted(() => {
  subscriptionStore.init()
})

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}

// 计算距离下次扣费天数
function getDaysUntilBilling(subscription: ISubscription): string {
  const days = Math.ceil((subscription.nextBillingDate - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0)
    return '今天'
  if (days === 1)
    return '明天'
  if (days <= 7)
    return `${days}天后`
  return dayjs(subscription.nextBillingDate).format('M月D日')
}

// 跳转到添加订阅
function goToAddSubscription() {
  uni.navigateTo({ url: '/pages/subscription/add' })
}

// 跳转到订阅详情
function goToSubscriptionDetail(subscription: ISubscription) {
  uni.navigateTo({ url: `/pages/subscription/detail?id=${subscription.id}` })
}
</script>

<template>
  <view class="subscription-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部 -->
    <view class="header px-4 py-4">
      <view class="flex items-center justify-between">
        <text class="text-xl text-white font-bold">
          订阅管理
        </text>
        <view
          class="h-10 w-10 flex items-center justify-center rounded-full bg-bg-card"
          @tap="goToAddSubscription"
        >
          <view class="i-carbon-add text-xl text-primary" />
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card mx-4 rounded-2xl bg-bg-card p-5">
      <view class="flex justify-between">
        <view>
          <text class="text-sm text-text-secondary">
            月均花费
          </text>
          <view class="mt-1">
            <text class="text-2xl text-expense font-bold">
              {{ formatDisplayAmount(monthlyTotal) }}
            </text>
          </view>
        </view>

        <view class="text-right">
          <text class="text-sm text-text-secondary">
            年度预计
          </text>
          <view class="mt-1">
            <text class="text-2xl text-text-primary font-bold">
              {{ formatDisplayAmount(yearlyTotal) }}
            </text>
          </view>
        </view>
      </view>

      <view class="border-border-color mt-4 border-t pt-4">
        <view class="flex items-center justify-between">
          <text class="text-sm text-text-secondary">
            活跃订阅
          </text>
          <text class="text-sm text-primary font-semibold">
            {{ activeCount }} 项
          </text>
        </view>
      </view>
    </view>

    <!-- 订阅列表 -->
    <view class="subscription-list mx-4 mt-6 pb-32">
      <text class="mb-3 block text-sm text-text-secondary">
        我的订阅
      </text>

      <!-- 无数据提示 -->
      <view
        v-if="activeSubscriptions.length === 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <view class="i-carbon-renewal mb-4 text-6xl text-text-muted" />
        <text class="mb-2 text-text-secondary">
          还没有添加任何订阅
        </text>
        <text class="mb-4 text-xs text-text-muted">
          记录你的会员、软件订阅等周期性支出
        </text>
        <view
          class="rounded-full bg-primary px-6 py-2"
          @tap="goToAddSubscription"
        >
          <text class="text-sm text-white">
            添加订阅
          </text>
        </view>
      </view>

      <!-- 订阅项 -->
      <view v-else class="space-y-3">
        <view
          v-for="subscription in activeSubscriptions"
          :key="subscription.id"
          class="subscription-item flex items-center rounded-xl bg-bg-card p-4"
          @tap="goToSubscriptionDetail(subscription)"
        >
          <!-- 图标 -->
          <view
            class="mr-3 h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-xl"
            :style="{ backgroundColor: subscription.iconBgColor }"
          >
            <view :class="subscription.icon" class="text-xl text-white" />
          </view>

          <!-- 信息 -->
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between">
              <text class="truncate text-sm text-white font-medium">
                {{ subscription.name }}
              </text>
              <text class="ml-2 text-sm text-expense font-semibold">
                {{ formatDisplayAmount(subscription.amount) }}
              </text>
            </view>
            <view class="mt-1 flex items-center justify-between">
              <view class="flex items-center gap-2">
                <text class="text-xs text-text-muted">
                  {{ getCycleName(subscription.cycle) }}
                </text>
                <view class="h-1 w-1 rounded-full bg-text-muted" />
                <text class="text-xs text-text-muted">
                  {{ subscription.categoryName }}
                </text>
              </view>
              <text class="text-xs text-primary">
                {{ getDaysUntilBilling(subscription) }}
              </text>
            </view>
          </view>

          <!-- 箭头 -->
          <view class="i-carbon-chevron-right ml-2 text-lg text-text-muted" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.subscription-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.stats-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.subscription-item {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
