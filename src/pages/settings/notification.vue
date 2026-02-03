<script lang="ts" setup>
/**
 * Where is my Money - 通知监听设置页面
 */

import type { INotificationServiceStatus } from '@/types/notification'
import {
  getServiceStatus,
  processTransaction,
  requestAccessibilityPermission,
  requestNotificationPermission,
  simulateNotification,
} from '@/services/notificationService'
import { useSettingsStore } from '@/store'
import { SUPPORTED_MONITOR_APPS } from '@/types/settings'

defineOptions({
  name: 'NotificationSettings',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const settingsStore = useSettingsStore()

// 服务状态
const serviceStatus = ref<INotificationServiceStatus | null>(null)

// 监控的App列表
const monitoredApps = computed(() => settingsStore.notification.monitoredApps)

// 是否启用通知监听
const notificationEnabled = computed({
  get: () => settingsStore.notificationListenerEnabled,
  set: (val) => {
    settingsStore.updateNotification({ notificationListenerEnabled: val })
  },
})

// 刷新状态
function refreshStatus() {
  serviceStatus.value = getServiceStatus()
}

// 初始化
onMounted(() => {
  refreshStatus()
})

// 切换监控App
function toggleMonitorApp(packageName: string) {
  if (monitoredApps.value.includes(packageName)) {
    settingsStore.removeMonitoredApp(packageName)
  }
  else {
    settingsStore.addMonitoredApp(packageName)
  }
}

// 开启无障碍权限
function openAccessibilitySettings() {
  requestAccessibilityPermission()
}

// 开启通知监听权限
function openNotificationSettings() {
  requestNotificationPermission()
}

// 测试通知解析
function testNotification() {
  const result = simulateNotification('alipay', 25.5, '星巴克')
  console.log('Test result:', result)

  if (result.success) {
    uni.showModal({
      title: '测试解析成功',
      content: `类型: ${result.type === 'income' ? '收入' : '支出'}\n金额: ¥${(result.amount || 0) / 100}\n商家: ${result.merchant || '未知'}\n置信度: ${result.confidence}%`,
      confirmText: '记录到账单',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const success = processTransaction(result)
          if (success) {
            uni.showToast({ title: '已记录', icon: 'success' })
          }
        }
      },
    })
  }
  else {
    uni.showToast({ title: result.errorMessage || '解析失败', icon: 'none' })
  }
}

// 返回
function goBack() {
  uni.navigateBack()
}

// 是否Android平台
const isAndroid = computed(() => {
  // #ifdef APP-PLUS
  return uni.getSystemInfoSync().platform === 'android'
  // #endif
  return false
})

// 是否iOS平台
const isIOS = computed(() => {
  // #ifdef APP-PLUS
  return uni.getSystemInfoSync().platform === 'ios'
  // #endif
  return false
})
</script>

<template>
  <view class="notification-settings-page min-h-screen bg-bg-dark">
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
        通知监听
      </text>
      <view class="w-10" />
    </view>

    <!-- 功能说明 -->
    <view class="mx-4 mt-4 rounded-2xl bg-bg-card p-4">
      <view class="flex items-start">
        <view class="i-carbon-information mr-3 flex-shrink-0 text-xl text-primary" />
        <view>
          <text class="text-sm text-white">
            自动记账功能
          </text>
          <text class="mt-1 block text-xs text-text-muted">
            开启后，应用将监听支付宝、微信等应用的收付款通知，自动创建账单记录。所有数据仅在本地处理，不会上传到任何服务器。
          </text>
        </view>
      </view>
    </view>

    <!-- Android设置 -->
    <view v-if="isAndroid" class="mx-4 mt-4">
      <!-- 开关 -->
      <view class="mb-4 flex items-center justify-between rounded-2xl bg-bg-card p-4">
        <view>
          <text class="text-base text-white">
            启用通知监听
          </text>
          <text class="mt-1 block text-xs text-text-muted">
            自动捕获收付款通知
          </text>
        </view>
        <switch
          :checked="notificationEnabled"
          color="#6366f1"
          @change="notificationEnabled = $event.detail.value"
        />
      </view>

      <!-- 权限状态 -->
      <view class="mb-4 overflow-hidden rounded-2xl bg-bg-card">
        <text class="block px-4 pt-4 text-sm text-text-secondary">
          权限状态
        </text>

        <!-- 无障碍服务 -->
        <view class="flex items-center justify-between p-4">
          <view class="flex items-center">
            <view
              class="mr-2 h-2 w-2 rounded-full"
              :class="serviceStatus?.hasAccessibilityPermission ? 'bg-income' : 'bg-expense'"
            />
            <text class="text-sm text-white">
              无障碍服务
            </text>
          </view>
          <view
            v-if="!serviceStatus?.hasAccessibilityPermission"
            class="rounded-lg bg-primary px-3 py-1"
            @tap="openAccessibilitySettings"
          >
            <text class="text-xs text-white">
              去开启
            </text>
          </view>
          <text v-else class="text-xs text-income">
            已开启
          </text>
        </view>

        <!-- 通知监听权限 -->
        <view class="border-border-color flex items-center justify-between border-t p-4">
          <view class="flex items-center">
            <view
              class="mr-2 h-2 w-2 rounded-full"
              :class="serviceStatus?.hasNotificationPermission ? 'bg-income' : 'bg-expense'"
            />
            <text class="text-sm text-white">
              通知监听权限
            </text>
          </view>
          <view
            v-if="!serviceStatus?.hasNotificationPermission"
            class="rounded-lg bg-primary px-3 py-1"
            @tap="openNotificationSettings"
          >
            <text class="text-xs text-white">
              去开启
            </text>
          </view>
          <text v-else class="text-xs text-income">
            已开启
          </text>
        </view>
      </view>

      <!-- 监控的应用 -->
      <view class="overflow-hidden rounded-2xl bg-bg-card">
        <text class="block px-4 pt-4 text-sm text-text-secondary">
          监控的应用
        </text>

        <view
          v-for="app in SUPPORTED_MONITOR_APPS"
          :key="app.packageName"
          class="border-border-color flex items-center justify-between border-t p-4 first:border-t-0"
          @tap="toggleMonitorApp(app.packageName)"
        >
          <text class="text-sm text-white">
            {{ app.name }}
          </text>
          <view
            class="h-5 w-5 flex items-center justify-center border rounded"
            :class="monitoredApps.includes(app.packageName) ? 'border-primary bg-primary' : 'border-border-color'"
          >
            <view
              v-if="monitoredApps.includes(app.packageName)"
              class="i-carbon-checkmark text-xs text-white"
            />
          </view>
        </view>
      </view>

      <!-- 测试按钮 -->
      <view class="mt-4">
        <view
          class="flex items-center justify-center rounded-xl bg-bg-card py-3"
          @tap="testNotification"
        >
          <view class="i-carbon-flash mr-2 text-lg text-primary" />
          <text class="text-sm text-white">
            测试通知解析
          </text>
        </view>
      </view>
    </view>

    <!-- iOS说明 -->
    <view v-if="isIOS" class="mx-4 mt-4">
      <view class="rounded-2xl bg-bg-card p-4">
        <view class="flex items-start">
          <view class="i-carbon-warning mr-3 flex-shrink-0 text-xl text-expense" />
          <view>
            <text class="text-sm text-white">
              iOS限制
            </text>
            <text class="mt-2 block text-xs text-text-muted">
              由于iOS系统限制，无法直接监听其他应用的通知。您可以使用以下替代方案：
            </text>

            <view class="mt-3 space-y-2">
              <view class="flex items-start">
                <text class="mr-2 text-xs text-primary">
                  1.
                </text>
                <text class="text-xs text-text-secondary">
                  使用快捷指令：创建快捷指令，在收付款后手动触发记账
                </text>
              </view>
              <view class="flex items-start">
                <text class="mr-2 text-xs text-primary">
                  2.
                </text>
                <text class="text-xs text-text-secondary">
                  导入账单：定期从支付宝/微信导出账单文件，批量导入
                </text>
              </view>
              <view class="flex items-start">
                <text class="mr-2 text-xs text-primary">
                  3.
                </text>
                <text class="text-xs text-text-secondary">
                  手动记账：使用便捷的记账功能快速记录
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 快捷指令入口 -->
      <view class="mt-4">
        <view class="rounded-2xl bg-bg-card p-4">
          <text class="mb-3 block text-base text-white font-medium">
            快捷指令集成
          </text>
          <text class="text-xs text-text-muted">
            即将推出：通过Siri快捷指令快速记账，支持语音输入金额和分类。
          </text>
        </view>
      </view>
    </view>

    <!-- 非App环境提示 -->
    <view v-if="!isAndroid && !isIOS" class="mx-4 mt-4">
      <view class="rounded-2xl bg-bg-card p-4 text-center">
        <view class="i-carbon-phone mx-auto mb-3 text-4xl text-text-muted" />
        <text class="block text-sm text-text-secondary">
          请在App端使用此功能
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.notification-settings-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}
</style>
