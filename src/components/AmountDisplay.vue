<script lang="ts" setup>
/**
 * Where is my Money - 金额显示组件
 * 支持隐藏金额、金额格式化、颜色主题
 */

defineOptions({
  name: 'AmountDisplay',
})

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  symbol: '¥',
  showSign: false,
  showCents: false,
  hidden: false,
  size: 'md',
})

interface Props {
  /** 金额(分) */
  amount: number
  /** 类型 */
  type?: 'income' | 'expense' | 'default'
  /** 货币符号 */
  symbol?: string
  /** 是否显示正负号 */
  showSign?: boolean
  /** 是否显示分 */
  showCents?: boolean
  /** 是否隐藏金额 */
  hidden?: boolean
  /** 字体大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/** 格式化金额 */
const formattedAmount = computed(() => {
  if (props.hidden) {
    return '****'
  }

  const yuan = props.amount / 100
  const formatted = props.showCents
    ? yuan.toFixed(2)
    : yuan.toFixed(yuan % 1 === 0 ? 0 : 2)

  return formatted
})

/** 金额前缀 */
const prefix = computed(() => {
  if (props.hidden)
    return props.symbol

  let sign = ''
  if (props.showSign) {
    sign = props.type === 'income' ? '+' : props.type === 'expense' ? '-' : ''
  }

  return `${sign}${props.symbol}`
})

/** 金额颜色类名 */
const colorClass = computed(() => {
  if (props.hidden)
    return 'text-text-secondary'

  switch (props.type) {
    case 'income':
      return 'text-income'
    case 'expense':
      return 'text-expense'
    default:
      return 'text-text-primary'
  }
})

/** 字体大小类名 */
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm'
    case 'md':
      return 'text-base'
    case 'lg':
      return 'text-xl'
    case 'xl':
      return 'text-2xl'
    default:
      return 'text-base'
  }
})
</script>

<template>
  <view class="amount-display inline-flex items-baseline font-semibold" :class="[colorClass, sizeClass]">
    <text class="amount-prefix mr-1 text-0.8em">
      {{ prefix }}
    </text>
    <text class="amount-value tabular-nums">
      {{ formattedAmount }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.amount-display {
  font-variant-numeric: tabular-nums;
}
</style>
