<script lang="ts" setup>
/**
 * Where is my Money - 账单导入页面
 */

import type { IImportResult } from '@/services/importService'
import { selectAndImportFile } from '@/services/importService'

defineOptions({
  name: 'ImportBill',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

// 导入状态
const importing = ref(false)
const importResult = ref<IImportResult | null>(null)

// 支持的账单类型
const supportedTypes = [
  {
    name: '支付宝账单',
    icon: 'i-carbon-wallet',
    color: '#1677ff',
    desc: '支持支付宝导出的CSV账单',
    steps: [
      '打开支付宝App',
      '进入"账单" → 右上角"..."',
      '选择"账单下载"',
      '选择时间范围并下载CSV文件',
    ],
  },
  {
    name: '微信账单',
    icon: 'i-carbon-chat',
    color: '#07c160',
    desc: '支持微信导出的CSV账单',
    steps: [
      '打开微信App',
      '进入"我" → "服务" → "钱包"',
      '点击"账单" → 右上角"..."',
      '选择"账单下载"并发送到邮箱',
    ],
  },
]

// 当前选中的类型
const selectedType = ref<number | null>(null)

// 选择文件并导入
async function handleImport() {
  importing.value = true
  importResult.value = null

  try {
    const result = await selectAndImportFile()
    if (result) {
      importResult.value = result

      if (result.success > 0) {
        uni.showToast({
          title: `成功导入 ${result.success} 条`,
          icon: 'success',
        })
      }
      else if (result.errors.length > 0) {
        uni.showToast({
          title: result.errors[0],
          icon: 'none',
        })
      }
    }
  }
  catch (error) {
    uni.showToast({
      title: '导入失败',
      icon: 'error',
    })
  }
  finally {
    importing.value = false
  }
}

// 返回
function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="import-page min-h-screen bg-bg-dark">
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
        导入账单
      </text>
      <view class="w-10" />
    </view>

    <!-- 说明 -->
    <view class="mx-4 mt-4">
      <text class="text-sm text-text-secondary">
        选择账单类型，按照指引导出账单文件后导入
      </text>
    </view>

    <!-- 账单类型选择 -->
    <view class="mx-4 mt-4 space-y-3">
      <view
        v-for="(type, index) in supportedTypes"
        :key="index"
        class="type-card rounded-2xl bg-bg-card p-4"
        :class="{ 'border-primary border-2': selectedType === index }"
        @tap="selectedType = index"
      >
        <view class="flex items-center">
          <view
            class="mr-3 h-12 w-12 flex items-center justify-center rounded-xl"
            :style="{ backgroundColor: type.color }"
          >
            <view :class="type.icon" class="text-2xl text-white" />
          </view>
          <view class="flex-1">
            <text class="text-base text-white font-medium">
              {{ type.name }}
            </text>
            <text class="mt-1 block text-xs text-text-muted">
              {{ type.desc }}
            </text>
          </view>
          <view
            v-if="selectedType === index"
            class="i-carbon-checkmark text-xl text-primary"
          />
        </view>

        <!-- 导出步骤 -->
        <view v-if="selectedType === index" class="mt-4 rounded-xl bg-bg-dark p-3">
          <text class="mb-2 block text-xs text-text-secondary">
            导出步骤:
          </text>
          <view
            v-for="(step, stepIndex) in type.steps"
            :key="stepIndex"
            class="mt-1 flex items-start"
          >
            <view
              class="mr-2 mt-0.5 h-4 w-4 flex flex-shrink-0 items-center justify-center rounded-full bg-bg-card-hover"
            >
              <text class="text-2xs text-text-secondary">
                {{ stepIndex + 1 }}
              </text>
            </view>
            <text class="text-xs text-text-secondary">
              {{ step }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导入结果 -->
    <view v-if="importResult" class="mx-4 mt-4 rounded-2xl bg-bg-card p-4">
      <text class="mb-3 block text-base text-white font-medium">
        导入结果
      </text>

      <view class="grid grid-cols-3 gap-4">
        <view class="text-center">
          <text class="text-2xl text-income font-bold">
            {{ importResult.success }}
          </text>
          <text class="block text-xs text-text-muted">
            成功
          </text>
        </view>
        <view class="text-center">
          <text class="text-2xl text-text-secondary font-bold">
            {{ importResult.skipped }}
          </text>
          <text class="block text-xs text-text-muted">
            跳过(重复)
          </text>
        </view>
        <view class="text-center">
          <text class="text-2xl text-expense font-bold">
            {{ importResult.failed }}
          </text>
          <text class="block text-xs text-text-muted">
            失败
          </text>
        </view>
      </view>

      <!-- 错误信息 -->
      <view v-if="importResult.errors.length > 0" class="mt-3 rounded-xl bg-bg-dark p-3">
        <text class="text-xs text-text-muted">
          {{ importResult.errors.slice(0, 3).join('\n') }}
          {{ importResult.errors.length > 3 ? `\n...还有${importResult.errors.length - 3}条错误` : '' }}
        </text>
      </view>
    </view>

    <!-- 导入按钮 -->
    <view class="mx-4 mt-6 pb-safe">
      <view
        class="flex items-center justify-center rounded-xl py-3"
        :class="importing ? 'bg-bg-card-hover' : 'bg-primary'"
        @tap="!importing && handleImport()"
      >
        <view v-if="importing" class="i-carbon-circle-dash mr-2 animate-spin text-lg text-white" />
        <text class="text-white font-medium">
          {{ importing ? '导入中...' : '选择文件并导入' }}
        </text>
      </view>

      <text class="mt-3 block text-center text-xs text-text-muted">
        支持 CSV 格式的账单文件
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.import-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.type-card {
  transition: all 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
