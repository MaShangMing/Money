<script lang="ts" setup>
/**
 * Where is my Money - 账单详情页面
 */

import type { IBillRecord } from '@/types/bill'
import { useBillStore, useSettingsStore } from '@/store'
import { formatAmount, formatDateTime } from '@/utils/format'

defineOptions({
  name: 'BillDetail',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const billStore = useBillStore()
const settingsStore = useSettingsStore()

// 路由参数
const billId = ref('')
const bill = ref<IBillRecord | null>(null)

// 是否隐藏金额
const hideAmount = computed(() => settingsStore.hideAmount)
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 初始化
onLoad((options) => {
  if (options?.id) {
    billId.value = options.id as string
    bill.value = billStore.getBill(billId.value)
  }
})

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}

// 获取来源名称
function getSourceName(source: string): string {
  const sourceMap: Record<string, string> = {
    manual: '手动记录',
    notification: '通知监听',
    import: '账单导入',
    ocr: 'OCR识别',
    subscription: '订阅自动',
    loan: '贷款还款',
  }
  return sourceMap[source] || '未知'
}

// 获取支付方式名称
function getPaymentMethodName(method: string): string {
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank_card: '银行卡',
    cash: '现金',
    credit_card: '信用卡',
    other: '其他',
  }
  return methodMap[method] || '其他'
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 编辑
function handleEdit() {
  uni.navigateTo({ url: `/pages/edit-bill/index?id=${billId.value}` })
}

// 删除
function handleDelete() {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条账单吗？',
    confirmColor: '#ef4444',
    success: (res) => {
      if (res.confirm) {
        const success = billStore.removeBill(billId.value)
        if (success) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        }
        else {
          uni.showToast({ title: '删除失败', icon: 'error' })
        }
      }
    },
  })
}

// 获取分类颜色
function getCategoryColor(): string {
  return '#6366f1'
}
</script>

<template>
  <view class="bill-detail-page min-h-screen bg-bg-dark">
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
        账单详情
      </text>
      <view class="w-10" />
    </view>

    <view v-if="bill">
      <!-- 金额卡片 -->
      <view class="amount-card mx-4 mt-4 rounded-2xl bg-bg-card p-6 text-center">
        <!-- 分类图标 -->
        <view
          class="mb-4 h-16 w-16 inline-flex items-center justify-center rounded-2xl"
          :style="{ backgroundColor: getCategoryColor() }"
        >
          <view :class="bill.categoryIcon" class="text-3xl text-white" />
        </view>

        <!-- 分类名称 -->
        <text class="mb-2 block text-base text-text-secondary">
          {{ bill.categoryName }}
        </text>

        <!-- 金额 -->
        <view class="flex items-baseline justify-center">
          <text
            class="text-4xl font-bold"
            :class="bill.type === 'income' ? 'text-income' : 'text-expense'"
          >
            {{ bill.type === 'income' ? '+' : '-' }}{{ formatDisplayAmount(bill.amount) }}
          </text>
        </view>

        <!-- 时间 -->
        <text class="mt-3 block text-sm text-text-muted">
          {{ formatDateTime(bill.transactionTime, 'YYYY年M月D日 HH:mm') }}
        </text>
      </view>

      <!-- 详细信息 -->
      <view class="detail-info mx-4 mt-4 overflow-hidden rounded-2xl bg-bg-card">
        <!-- 备注 -->
        <view class="detail-item flex items-center justify-between px-4 py-3">
          <text class="text-sm text-text-secondary">
            备注
          </text>
          <text class="text-sm text-white">
            {{ bill.remark || '无' }}
          </text>
        </view>

        <!-- 商家 -->
        <view v-if="bill.merchant" class="detail-item border-border-color flex items-center justify-between border-t px-4 py-3">
          <text class="text-sm text-text-secondary">
            商家
          </text>
          <text class="text-sm text-white">
            {{ bill.merchant }}
          </text>
        </view>

        <!-- 支付方式 -->
        <view class="detail-item border-border-color flex items-center justify-between border-t px-4 py-3">
          <text class="text-sm text-text-secondary">
            支付方式
          </text>
          <text class="text-sm text-white">
            {{ getPaymentMethodName(bill.paymentMethod) }}
          </text>
        </view>

        <!-- 来源 -->
        <view class="detail-item border-border-color flex items-center justify-between border-t px-4 py-3">
          <text class="text-sm text-text-secondary">
            记录来源
          </text>
          <view class="flex items-center">
            <view
              class="mr-2 h-2 w-2 rounded-full"
              :class="bill.source === 'notification' ? 'bg-income' : 'bg-primary'"
            />
            <text class="text-sm text-white">
              {{ getSourceName(bill.source) }}
            </text>
          </view>
        </view>

        <!-- 创建时间 -->
        <view class="detail-item border-border-color flex items-center justify-between border-t px-4 py-3">
          <text class="text-sm text-text-secondary">
            创建时间
          </text>
          <text class="text-sm text-text-muted">
            {{ formatDateTime(bill.createdAt) }}
          </text>
        </view>

        <!-- 标签 -->
        <view v-if="bill.tags && bill.tags.length > 0" class="detail-item border-border-color border-t px-4 py-3">
          <text class="mb-2 block text-sm text-text-secondary">
            标签
          </text>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="tag in bill.tags"
              :key="tag"
              class="rounded-full bg-bg-card-hover px-3 py-1"
            >
              <text class="text-xs text-text-secondary">
                {{ tag }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions mx-4 mt-6 flex gap-3 pb-safe">
        <view
          class="flex flex-1 items-center justify-center rounded-xl bg-bg-card py-3"
          @tap="handleEdit"
        >
          <view class="i-carbon-edit mr-2 text-lg text-primary" />
          <text class="text-sm text-white">
            编辑
          </text>
        </view>
        <view
          class="flex flex-1 items-center justify-center rounded-xl bg-bg-card py-3"
          @tap="handleDelete"
        >
          <view class="i-carbon-trash-can mr-2 text-lg text-danger" />
          <text class="text-sm text-white">
            删除
          </text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-else class="flex items-center justify-center py-32">
      <text class="text-text-muted">
        加载中...
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bill-detail-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.amount-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.actions view {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
