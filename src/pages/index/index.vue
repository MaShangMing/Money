<script lang="ts" setup>
/**
 * Where is my Money - 首页
 * 显示收支概览和最近账单
 */

import type { IBillRecord } from '@/types/bill'
import dayjs from 'dayjs'
import { useBillStore, useCategoryStore, useSettingsStore } from '@/store'
import { formatAmount, formatFriendlyDate, formatFriendlyTime } from '@/utils/format'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

// 初始化
onMounted(() => {
  categoryStore.init()
  settingsStore.init()
  billStore.init()
})

// 当前日期
const currentDate = ref(dayjs())
const currentMonthDisplay = computed(() => {
  return currentDate.value.format('YYYY年M月')
})

// 是否隐藏金额
const hideAmount = computed(() => settingsStore.hideAmount)

// 货币符号
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 统计数据
const monthExpense = computed(() => billStore.monthExpense)
const monthIncome = computed(() => billStore.monthIncome)
const monthNetIncome = computed(() => billStore.monthNetIncome)

// 最近账单
const recentBills = computed(() => billStore.loadRecentBills(20))

// 账单按日期分组
const groupedBills = computed(() => {
  const groups: { date: string, dateDisplay: string, bills: IBillRecord[] }[] = []
  const dateMap = new Map<string, IBillRecord[]>()

  recentBills.value.forEach((bill) => {
    const dateStr = dayjs(bill.transactionTime).format('YYYY-MM-DD')
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, [])
    }
    dateMap.get(dateStr)!.push(bill)
  })

  dateMap.forEach((bills, date) => {
    groups.push({
      date,
      dateDisplay: formatFriendlyDate(new Date(date).getTime()),
      bills: bills.sort((a, b) => b.transactionTime - a.transactionTime),
    })
  })

  return groups.sort((a, b) => b.date.localeCompare(a.date))
})

// 切换金额显示
function toggleHideAmount() {
  settingsStore.toggleHideAmount()
}

// 跳转到记账页面
function goToAddBill() {
  uni.navigateTo({ url: '/pages/add-bill/index' })
}

// 跳转到账单详情
function goToBillDetail(bill: IBillRecord) {
  uni.navigateTo({ url: `/pages/bill-detail/index?id=${bill.id}` })
}

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}
</script>

<template>
  <view class="home-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部区域 -->
    <view class="header px-4 pb-6 pt-4">
      <!-- 标题栏 -->
      <view class="flex items-center justify-between">
        <view class="flex items-center gap-2">
          <text class="text-xl text-white font-bold">
            Where is my Money
          </text>
        </view>
        <view
          class="h-10 w-10 flex items-center justify-center rounded-full bg-bg-card"
          @tap="toggleHideAmount"
        >
          <view
            :class="hideAmount ? 'i-carbon-view-off' : 'i-carbon-view'"
            class="text-xl text-text-secondary"
          />
        </view>
      </view>

      <!-- 月份选择 -->
      <view class="mt-4 flex items-center">
        <text class="text-sm text-text-secondary">
          {{ currentMonthDisplay }}
        </text>
        <view class="i-carbon-chevron-down ml-1 text-xs text-text-muted" />
      </view>

      <!-- 收支概览卡片 -->
      <view class="overview-card mt-4 rounded-2xl bg-bg-card p-5">
        <!-- 本月支出 -->
        <view class="mb-4">
          <text class="text-sm text-text-secondary">
            本月支出
          </text>
          <view class="mt-1 flex items-baseline">
            <text class="text-3xl text-expense font-bold">
              {{ formatDisplayAmount(monthExpense) }}
            </text>
          </view>
        </view>

        <!-- 收入和结余 -->
        <view class="flex gap-8">
          <view>
            <text class="text-xs text-text-muted">
              本月收入
            </text>
            <text class="mt-1 block text-lg text-income font-semibold">
              {{ formatDisplayAmount(monthIncome) }}
            </text>
          </view>
          <view>
            <text class="text-xs text-text-muted">
              本月结余
            </text>
            <text
              class="mt-1 block text-lg font-semibold"
              :class="monthNetIncome >= 0 ? 'text-income' : 'text-expense'"
            >
              {{ formatDisplayAmount(Math.abs(monthNetIncome)) }}
            </text>
          </view>
        </view>

        <!-- 隐私提示 -->
        <view class="wimm-privacy-badge mt-4">
          <view class="i-carbon-locked text-xs" />
          <text>数据仅存储在本地</text>
        </view>
      </view>
    </view>

    <!-- 最近账单 -->
    <view class="recent-bills px-4 pb-32">
      <view class="mb-3 flex items-center justify-between">
        <text class="text-base text-white font-semibold">
          最近账单
        </text>
        <text class="text-xs text-text-muted">
          查看全部
        </text>
      </view>

      <!-- 无数据提示 -->
      <view
        v-if="groupedBills.length === 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <view class="i-carbon-wallet mb-4 text-6xl text-text-muted" />
        <text class="mb-2 text-text-secondary">
          还没有记录任何账单
        </text>
        <text class="text-xs text-text-muted">
          点击下方按钮开始记账
        </text>
      </view>

      <!-- 账单列表 -->
      <view v-else>
        <view
          v-for="group in groupedBills"
          :key="group.date"
          class="mb-4"
        >
          <!-- 日期标题 -->
          <view class="mb-2 flex items-center justify-between">
            <text class="text-sm text-text-secondary">
              {{ group.dateDisplay }}
            </text>
          </view>

          <!-- 账单项 -->
          <view class="space-y-2">
            <view
              v-for="bill in group.bills"
              :key="bill.id"
              class="bill-item flex items-center rounded-xl bg-bg-card p-4"
              @tap="goToBillDetail(bill)"
            >
              <!-- 分类图标 -->
              <view
                class="mr-3 h-11 w-11 flex flex-shrink-0 items-center justify-center rounded-xl"
                :style="{ backgroundColor: getCategoryColor(bill.categoryId) }"
              >
                <view :class="bill.categoryIcon" class="text-xl text-white" />
              </view>

              <!-- 账单信息 -->
              <view class="min-w-0 flex-1">
                <view class="flex items-center justify-between">
                  <text class="truncate text-sm text-white font-medium">
                    {{ bill.categoryName }}
                  </text>
                  <text
                    class="ml-2 text-base font-semibold"
                    :class="bill.type === 'income' ? 'text-income' : 'text-expense'"
                  >
                    {{ bill.type === 'income' ? '+' : '-' }}{{ formatDisplayAmount(bill.amount) }}
                  </text>
                </view>
                <view class="mt-1 flex items-center justify-between">
                  <text class="truncate text-xs text-text-muted">
                    {{ bill.remark || bill.merchant || '无备注' }}
                  </text>
                  <text class="ml-2 text-xs text-text-muted">
                    {{ formatFriendlyTime(bill.transactionTime) }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快速记账按钮 (浮动) -->
    <view
      class="fixed bottom-28 right-5 h-14 w-14 flex items-center justify-center rounded-full bg-primary shadow-lg"
      @tap="goToAddBill"
    >
      <view class="i-carbon-add text-2xl text-white" />
    </view>
  </view>
</template>

<script lang="ts">
// 获取分类颜色的辅助函数
function getCategoryColor(categoryId: string): string {
  const colors: Record<string, string> = {
    default: '#6366f1',
  }
  return colors[categoryId] || '#6366f1'
}
</script>

<style lang="scss" scoped>
.home-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 30%);
}

.overview-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.bill-item {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
