<script lang="ts" setup>
/**
 * Where is my Money - 贷款管理页面
 */

import type { ILoan } from '@/types/loan'
import dayjs from 'dayjs'
import { useLoanStore, useSettingsStore } from '@/store'
import { getLoanTypeName } from '@/types/loan'
import { formatAmount } from '@/utils/format'

defineOptions({
  name: 'LoanManagement',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const loanStore = useLoanStore()
const settingsStore = useSettingsStore()

// 是否隐藏金额
const hideAmount = computed(() => settingsStore.hideAmount)
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 贷款列表
const activeLoans = computed(() => loanStore.activeLoans)
const completedLoans = computed(() => loanStore.completedLoans)

// 统计数据
const totalDebt = computed(() => loanStore.totalDebt)
const monthlyRepayment = computed(() => loanStore.monthlyRepayment)

// 初始化
onMounted(() => {
  loanStore.init()
})

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}

// 计算还款进度
function getRepaymentProgress(loan: ILoan): number {
  if (loan.totalPeriods === 0)
    return 0
  return Math.round((loan.paidPeriods / loan.totalPeriods) * 100)
}

// 计算距离下次还款天数
function getDaysUntilRepayment(loan: ILoan): string {
  const days = Math.ceil((loan.nextRepaymentDate - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0)
    return '今天'
  if (days === 1)
    return '明天'
  if (days <= 7)
    return `${days}天后`
  return dayjs(loan.nextRepaymentDate).format('M月D日')
}

// 跳转到添加贷款
function goToAddLoan() {
  uni.navigateTo({ url: '/pages/loan/add' })
}

// 跳转到贷款详情
function goToLoanDetail(loan: ILoan) {
  uni.navigateTo({ url: `/pages/loan/detail?id=${loan.id}` })
}

// 返回
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="loan-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部 -->
    <view class="header flex items-center justify-between px-4 py-3">
      <view
        class="h-10 w-10 flex items-center justify-center"
        @tap="goBack"
      >
        <view class="i-carbon-chevron-left text-xl text-text-secondary" />
      </view>
      <text class="text-lg text-white font-semibold">
        贷款管理
      </text>
      <view
        class="h-10 w-10 flex items-center justify-center rounded-full bg-bg-card"
        @tap="goToAddLoan"
      >
        <view class="i-carbon-add text-xl text-primary" />
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card mx-4 mt-4 rounded-2xl bg-bg-card p-5">
      <view class="flex justify-between">
        <view>
          <text class="text-sm text-text-secondary">
            剩余负债
          </text>
          <view class="mt-1">
            <text class="text-2xl text-expense font-bold">
              {{ formatDisplayAmount(totalDebt) }}
            </text>
          </view>
        </view>

        <view class="text-right">
          <text class="text-sm text-text-secondary">
            月还款额
          </text>
          <view class="mt-1">
            <text class="text-2xl text-text-primary font-bold">
              {{ formatDisplayAmount(monthlyRepayment) }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 活跃贷款 -->
    <view class="mx-4 mt-6 pb-32">
      <text class="mb-3 block text-sm text-text-secondary">
        进行中的贷款
      </text>

      <!-- 无数据提示 -->
      <view
        v-if="activeLoans.length === 0"
        class="flex flex-col items-center justify-center py-16"
      >
        <view class="i-carbon-money mb-4 text-6xl text-text-muted" />
        <text class="mb-2 text-text-secondary">
          还没有添加任何贷款
        </text>
        <text class="mb-4 text-xs text-text-muted">
          记录你的房贷、车贷等负债信息
        </text>
        <view
          class="rounded-full bg-primary px-6 py-2"
          @tap="goToAddLoan"
        >
          <text class="text-sm text-white">
            添加贷款
          </text>
        </view>
      </view>

      <!-- 贷款列表 -->
      <view v-else class="space-y-3">
        <view
          v-for="loan in activeLoans"
          :key="loan.id"
          class="loan-item rounded-xl bg-bg-card p-4"
          @tap="goToLoanDetail(loan)"
        >
          <!-- 头部 -->
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <view class="i-carbon-money mr-2 text-xl text-primary" />
              <view>
                <text class="text-base text-white font-medium">
                  {{ loan.name }}
                </text>
                <text class="ml-2 text-xs text-text-muted">
                  {{ getLoanTypeName(loan.type) }}
                </text>
              </view>
            </view>
            <view class="i-carbon-chevron-right text-lg text-text-muted" />
          </view>

          <!-- 金额信息 -->
          <view class="mt-3 flex justify-between">
            <view>
              <text class="text-xs text-text-muted">
                剩余本金
              </text>
              <text class="mt-1 block text-base text-expense font-semibold">
                {{ formatDisplayAmount(loan.remainingPrincipal) }}
              </text>
            </view>
            <view class="text-right">
              <text class="text-xs text-text-muted">
                月还款
              </text>
              <text class="mt-1 block text-base text-white font-semibold">
                {{ formatDisplayAmount(loan.monthlyPayment) }}
              </text>
            </view>
          </view>

          <!-- 进度条 -->
          <view class="mt-3">
            <view class="flex items-center justify-between">
              <text class="text-xs text-text-muted">
                还款进度
              </text>
              <text class="text-xs text-text-secondary">
                {{ loan.paidPeriods }}/{{ loan.totalPeriods }}期
              </text>
            </view>
            <view class="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-card-hover">
              <view
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${getRepaymentProgress(loan)}%` }"
              />
            </view>
          </view>

          <!-- 下次还款 -->
          <view class="border-border-color mt-3 flex items-center justify-between border-t pt-3">
            <text class="text-xs text-text-muted">
              下次还款
            </text>
            <text class="text-xs text-primary">
              {{ getDaysUntilRepayment(loan) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 已结清贷款 -->
      <view v-if="completedLoans.length > 0" class="mt-6">
        <text class="mb-3 block text-sm text-text-secondary">
          已结清
        </text>
        <view class="space-y-3">
          <view
            v-for="loan in completedLoans"
            :key="loan.id"
            class="loan-item rounded-xl bg-bg-card p-4 opacity-60"
            @tap="goToLoanDetail(loan)"
          >
            <view class="flex items-center justify-between">
              <view class="flex items-center">
                <view class="i-carbon-checkmark-outline mr-2 text-xl text-income" />
                <text class="text-base text-white">
                  {{ loan.name }}
                </text>
              </view>
              <text class="text-xs text-income">
                已结清
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.loan-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.stats-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.loan-item {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
