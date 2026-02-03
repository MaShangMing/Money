<script lang="ts" setup>
/**
 * Where is my Money - 记账页面
 * 支持手动记账，分类选择，金额输入
 */

import type { PaymentMethod, TransactionType } from '@/types/bill'
import type { ICategory } from '@/types/category'
import { useBillStore, useCategoryStore, useSettingsStore } from '@/store'
import { parseAmountToCents } from '@/utils/format'

defineOptions({
  name: 'AddBill',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

// 交易类型
const transactionType = ref<TransactionType>('expense')

// 金额输入
const amountInput = ref('')

// 选中的分类
const selectedCategory = ref<ICategory | null>(null)

// 备注
const remark = ref('')

// 交易时间
const transactionTime = ref(Date.now())

// 支付方式
const paymentMethod = ref<PaymentMethod>('alipay')

// 分类列表
const categories = computed(() => {
  return categoryStore.getCategoriesForType(transactionType.value)
})

// 货币符号
const currencySymbol = computed(() => settingsStore.currencySymbol)

// 切换类型时重置分类
watch(transactionType, () => {
  selectedCategory.value = null
})

// 初始化
onMounted(() => {
  categoryStore.init()
  // 默认选中第一个分类
  if (categories.value.length > 0) {
    selectedCategory.value = categories.value[0]
  }
})

// 数字键盘输入
function onKeyPress(key: string) {
  if (key === 'delete') {
    amountInput.value = amountInput.value.slice(0, -1)
    return
  }

  if (key === '.') {
    if (amountInput.value.includes('.'))
      return
    if (amountInput.value === '')
      amountInput.value = '0'
  }

  // 限制小数点后两位
  if (amountInput.value.includes('.')) {
    const [, decimal] = amountInput.value.split('.')
    if (decimal && decimal.length >= 2)
      return
  }

  // 限制整数部分长度
  if (!amountInput.value.includes('.') && amountInput.value.length >= 9)
    return

  amountInput.value += key
}

// 选择分类
function selectCategory(category: ICategory) {
  selectedCategory.value = category
}

// 保存账单
function saveBill() {
  if (!amountInput.value || Number.parseFloat(amountInput.value) <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }

  if (!selectedCategory.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }

  const amount = parseAmountToCents(amountInput.value)

  const bill = billStore.addBill({
    type: transactionType.value,
    amount,
    categoryId: selectedCategory.value.id,
    remark: remark.value,
    paymentMethod: paymentMethod.value,
    transactionTime: transactionTime.value,
    source: 'manual',
  })

  if (bill) {
    uni.showToast({ title: '记账成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  }
  else {
    uni.showToast({ title: '记账失败', icon: 'error' })
  }
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 键盘按键
const keyboardKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'delete'],
]
</script>

<template>
  <view class="add-bill-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部 -->
    <view class="header flex items-center justify-between px-4 py-3">
      <view
        class="h-10 w-10 flex items-center justify-center"
        @tap="goBack"
      >
        <view class="i-carbon-close text-xl text-text-secondary" />
      </view>
      <text class="text-lg text-white font-semibold">
        记一笔
      </text>
      <view class="w-10" />
    </view>

    <!-- 类型切换 -->
    <view class="type-switch mx-4 flex rounded-xl bg-bg-card p-1">
      <view
        class="flex-1 rounded-lg py-2 text-center transition-all"
        :class="transactionType === 'expense' ? 'bg-expense text-white' : 'text-text-secondary'"
        @tap="transactionType = 'expense'"
      >
        <text class="text-sm font-medium">支出</text>
      </view>
      <view
        class="flex-1 rounded-lg py-2 text-center transition-all"
        :class="transactionType === 'income' ? 'bg-income text-white' : 'text-text-secondary'"
        @tap="transactionType = 'income'"
      >
        <text class="text-sm font-medium">收入</text>
      </view>
    </view>

    <!-- 金额显示 -->
    <view class="amount-display mx-4 mt-6 text-center">
      <view class="flex items-baseline justify-center">
        <text class="mr-1 text-2xl text-text-secondary">
          {{ currencySymbol }}
        </text>
        <text
          class="text-5xl font-bold"
          :class="transactionType === 'income' ? 'text-income' : 'text-expense'"
        >
          {{ amountInput || '0' }}
        </text>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="category-section mx-4 mt-6">
      <text class="mb-3 block text-sm text-text-secondary">
        选择分类
      </text>
      <scroll-view scroll-x class="category-scroll">
        <view class="flex gap-3 pb-2">
          <view
            v-for="category in categories"
            :key="category.id"
            class="category-item flex flex-col items-center"
            :class="{ active: selectedCategory?.id === category.id }"
            @tap="selectCategory(category)"
          >
            <view
              class="mb-1 h-12 w-12 flex items-center justify-center rounded-xl"
              :style="{
                backgroundColor: selectedCategory?.id === category.id
                  ? category.iconBgColor
                  : 'var(--wimm-bg-card)',
              }"
            >
              <view
                :class="category.icon"
                class="text-xl"
                :style="{
                  color: selectedCategory?.id === category.id
                    ? '#fff'
                    : category.iconBgColor,
                }"
              />
            </view>
            <text
              class="text-xs"
              :class="selectedCategory?.id === category.id ? 'text-white' : 'text-text-secondary'"
            >
              {{ category.name }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 备注输入 -->
    <view class="remark-section mx-4 mt-6">
      <view class="flex items-center rounded-xl bg-bg-card px-4 py-3">
        <view class="i-carbon-edit mr-3 text-lg text-text-muted" />
        <input
          v-model="remark"
          type="text"
          placeholder="添加备注..."
          placeholder-class="text-text-muted"
          class="flex-1 bg-transparent text-sm text-white"
        >
      </view>
    </view>

    <!-- 数字键盘 -->
    <view class="keyboard mt-auto px-4 pb-safe">
      <view class="keyboard-grid">
        <view
          v-for="(row, rowIndex) in keyboardKeys"
          :key="rowIndex"
          class="mb-2 flex gap-2"
        >
          <view
            v-for="key in row"
            :key="key"
            class="keyboard-key h-14 flex flex-1 items-center justify-center rounded-xl bg-bg-card"
            :class="{ 'bg-bg-card-hover': key === 'delete' }"
            @tap="onKeyPress(key)"
          >
            <view v-if="key === 'delete'" class="i-carbon-close text-xl text-text-secondary" />
            <text v-else class="text-xl text-white font-medium">
              {{ key }}
            </text>
          </view>
        </view>

        <!-- 保存按钮 -->
        <view
          class="save-btn h-14 flex items-center justify-center rounded-xl"
          :class="transactionType === 'income' ? 'bg-income' : 'bg-expense'"
          @tap="saveBill"
        >
          <text class="text-lg text-white font-semibold">
            保存
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.add-bill-page {
  display: flex;
  flex-direction: column;
}

.category-scroll {
  white-space: nowrap;

  ::-webkit-scrollbar {
    display: none;
  }
}

.category-item {
  flex-shrink: 0;
  width: 64px;
  transition: transform 0.2s;

  &.active {
    transform: scale(1.05);
  }
}

.keyboard {
  padding-top: 24rpx;
}

.keyboard-key {
  transition: background-color 0.1s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}

.save-btn {
  transition: opacity 0.2s;

  &:active {
    opacity: 0.8;
  }
}
</style>
