<script lang="ts" setup>
/**
 * Where is my Money - 统计分析页面
 * 展示收支趋势和分类占比
 */

import type { ICategoryStatistics, IDailyStatistics } from '@/types/bill'
import dayjs from 'dayjs'
import { useBillStore, useSettingsStore } from '@/store'
import { formatAmount, formatPercent, getMonthRange } from '@/utils/format'

defineOptions({
  name: 'Statistics',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const billStore = useBillStore()
const settingsStore = useSettingsStore()

// 当前查看的年月
const currentYear = ref(dayjs().year())
const currentMonth = ref(dayjs().month() + 1)

// 统计类型: expense 或 income
const statsType = ref<'expense' | 'income'>('expense')

// 是否隐藏金额
const hideAmount = computed(() => settingsStore.hideAmount)
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 月份显示
const monthDisplay = computed(() => {
  const now = dayjs()
  if (currentYear.value === now.year() && currentMonth.value === now.month() + 1) {
    return '本月'
  }
  return `${currentYear.value}年${currentMonth.value}月`
})

// 时间范围
const timeRange = computed(() => getMonthRange(currentYear.value, currentMonth.value))

// 分类统计数据
const categoryStats = ref<ICategoryStatistics[]>([])

// 日统计数据
const dailyStats = ref<IDailyStatistics[]>([])

// 总金额
const totalAmount = computed(() => {
  return categoryStats.value.reduce((sum, item) => sum + item.amount, 0)
})

// 加载统计数据
function loadStats() {
  const { start, end } = timeRange.value
  categoryStats.value = billStore.loadCategoryStats(start, end, statsType.value)
  dailyStats.value = billStore.loadDailyStats(start, end)
}

// 切换月份
function changeMonth(delta: number) {
  const date = dayjs().year(currentYear.value).month(currentMonth.value - 1).add(delta, 'month')
  currentYear.value = date.year()
  currentMonth.value = date.month() + 1
  loadStats()
}

// 切换统计类型
function changeStatsType(type: 'expense' | 'income') {
  statsType.value = type
  loadStats()
}

// 初始化
onMounted(() => {
  loadStats()
})

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}

// 计算柱状图高度
function getBarHeight(item: IDailyStatistics): string {
  const maxValue = Math.max(...dailyStats.value.map(d =>
    statsType.value === 'expense' ? d.expense : d.income,
  ))
  if (maxValue === 0)
    return '0%'
  const value = statsType.value === 'expense' ? item.expense : item.income
  return `${Math.max((value / maxValue) * 100, 2)}%`
}

// 获取日期显示
function getDayDisplay(dateStr: string): string {
  return dayjs(dateStr).date().toString()
}
</script>

<template>
  <view class="statistics-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部 -->
    <view class="header px-4 py-4">
      <view class="flex items-center justify-between">
        <text class="text-xl text-white font-bold">
          统计
        </text>
      </view>

      <!-- 月份选择 -->
      <view class="mt-4 flex items-center justify-center">
        <view
          class="h-8 w-8 flex items-center justify-center"
          @tap="changeMonth(-1)"
        >
          <view class="i-carbon-chevron-left text-lg text-text-secondary" />
        </view>
        <text class="mx-4 text-base text-white">
          {{ monthDisplay }}
        </text>
        <view
          class="h-8 w-8 flex items-center justify-center"
          @tap="changeMonth(1)"
        >
          <view class="i-carbon-chevron-right text-lg text-text-secondary" />
        </view>
      </view>
    </view>

    <!-- 类型切换 -->
    <view class="type-switch mx-4 flex rounded-xl bg-bg-card p-1">
      <view
        class="flex-1 rounded-lg py-2 text-center transition-all"
        :class="statsType === 'expense' ? 'bg-expense text-white' : 'text-text-secondary'"
        @tap="changeStatsType('expense')"
      >
        <text class="text-sm font-medium">支出</text>
      </view>
      <view
        class="flex-1 rounded-lg py-2 text-center transition-all"
        :class="statsType === 'income' ? 'bg-income text-white' : 'text-text-secondary'"
        @tap="changeStatsType('income')"
      >
        <text class="text-sm font-medium">收入</text>
      </view>
    </view>

    <!-- 总金额 -->
    <view class="total-amount mx-4 mt-6 text-center">
      <text class="text-sm text-text-secondary">
        {{ statsType === 'expense' ? '总支出' : '总收入' }}
      </text>
      <view class="mt-1">
        <text
          class="text-3xl font-bold"
          :class="statsType === 'expense' ? 'text-expense' : 'text-income'"
        >
          {{ formatDisplayAmount(totalAmount) }}
        </text>
      </view>
    </view>

    <!-- 趋势图 -->
    <view class="trend-chart mx-4 mt-6 rounded-2xl bg-bg-card p-4">
      <text class="mb-3 block text-sm text-text-secondary">
        日趋势
      </text>

      <view v-if="dailyStats.length > 0" class="chart-container">
        <scroll-view scroll-x class="chart-scroll">
          <view class="h-32 flex items-end gap-1">
            <view
              v-for="item in dailyStats"
              :key="item.date"
              class="bar-item flex flex-col items-center"
            >
              <view
                class="bar w-5 rounded-t transition-all"
                :class="statsType === 'expense' ? 'bg-expense' : 'bg-income'"
                :style="{ height: getBarHeight(item) }"
              />
              <text class="mt-1 text-2xs text-text-muted">
                {{ getDayDisplay(item.date) }}
              </text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view v-else class="h-32 flex items-center justify-center text-text-muted">
        暂无数据
      </view>
    </view>

    <!-- 分类排行 -->
    <view class="category-rank mx-4 mt-6 pb-32">
      <text class="mb-3 block text-sm text-text-secondary">
        分类排行
      </text>

      <view v-if="categoryStats.length > 0" class="space-y-3">
        <view
          v-for="(item, index) in categoryStats"
          :key="item.categoryId"
          class="rank-item flex items-center rounded-xl bg-bg-card p-4"
        >
          <!-- 排名 -->
          <view
            class="mr-3 h-6 w-6 flex flex-shrink-0 items-center justify-center rounded-full"
            :class="index < 3 ? 'bg-primary' : 'bg-bg-card-hover'"
          >
            <text class="text-xs text-white font-medium">
              {{ index + 1 }}
            </text>
          </view>

          <!-- 分类图标 -->
          <view
            class="mr-3 h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-xl"
            :style="{ backgroundColor: getCategoryColor(index) }"
          >
            <view :class="item.categoryIcon" class="text-lg text-white" />
          </view>

          <!-- 分类信息 -->
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between">
              <text class="text-sm text-white">
                {{ item.categoryName }}
              </text>
              <text
                class="text-sm font-semibold"
                :class="statsType === 'expense' ? 'text-expense' : 'text-income'"
              >
                {{ formatDisplayAmount(item.amount) }}
              </text>
            </view>

            <!-- 进度条 -->
            <view class="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-card-hover">
              <view
                class="h-full rounded-full transition-all"
                :class="statsType === 'expense' ? 'bg-expense' : 'bg-income'"
                :style="{ width: `${item.percentage}%` }"
              />
            </view>

            <view class="mt-1 flex items-center justify-between">
              <text class="text-2xs text-text-muted">
                {{ item.count }}笔
              </text>
              <text class="text-2xs text-text-muted">
                {{ formatPercent(item.percentage) }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <view
        v-else
        class="flex flex-col items-center justify-center py-16"
      >
        <view class="i-carbon-chart-pie mb-4 text-6xl text-text-muted" />
        <text class="text-text-secondary">
          暂无{{ statsType === 'expense' ? '支出' : '收入' }}记录
        </text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
// 获取分类颜色
function getCategoryColor(index: number): string {
  const colors = [
    '#f59e0b',
    '#3b82f6',
    '#ec4899',
    '#8b5cf6',
    '#10b981',
    '#06b6d4',
    '#ef4444',
    '#6366f1',
    '#f43f5e',
    '#d946ef',
  ]
  return colors[index % colors.length]
}
</script>

<style lang="scss" scoped>
.statistics-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.chart-scroll {
  ::-webkit-scrollbar {
    display: none;
  }
}

.bar-item {
  flex-shrink: 0;
}

.bar {
  min-height: 4rpx;
}

.rank-item {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
