<script lang="ts" setup>
/**
 * Where is my Money - 分类图标组件
 */

defineOptions({
  name: 'CategoryIcon',
})

const props = withDefaults(defineProps<Props>(), {
  bgColor: '#6366f1',
  size: 'md',
})

interface Props {
  /** 图标类名 */
  icon: string
  /** 背景色 */
  bgColor?: string
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
}

/** 容器大小 */
const containerSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return '64rpx'
    case 'md':
      return '80rpx'
    case 'lg':
      return '96rpx'
    default:
      return '80rpx'
  }
})

/** 图标大小 */
const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return '32rpx'
    case 'md':
      return '40rpx'
    case 'lg':
      return '48rpx'
    default:
      return '40rpx'
  }
})
</script>

<template>
  <view
    class="category-icon flex items-center justify-center rounded-xl"
    :style="{
      width: containerSize,
      height: containerSize,
      backgroundColor: bgColor,
    }"
  >
    <view
      :class="icon"
      class="text-white"
      :style="{ fontSize: iconSize }"
    />
  </view>
</template>

<style lang="scss" scoped>
.category-icon {
  flex-shrink: 0;
}
</style>
