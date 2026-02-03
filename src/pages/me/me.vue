<script lang="ts" setup>
/**
 * Where is my Money - 我的页面
 * 用户设置、隐私控制、数据管理
 */

import { useBillStore, useLoanStore, useSettingsStore, useSubscriptionStore } from '@/store'
import { formatAmount } from '@/utils/format'
import { exportAllData } from '@/utils/storage'

defineOptions({
  name: 'Me',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '',
  },
})

const settingsStore = useSettingsStore()
const billStore = useBillStore()
const subscriptionStore = useSubscriptionStore()
const loanStore = useLoanStore()

// 隐私设置
const hideAmount = computed(() => settingsStore.hideAmount)
const currencySymbol = computed(() => settingsStore.currencySymbol)
const storageMode = computed(() => settingsStore.storageMode)
const notificationEnabled = computed(() => settingsStore.notificationListenerEnabled)

// 统计数据
const totalBills = computed(() => billStore.total)
const monthExpense = computed(() => billStore.monthExpense)
const activeSubscriptions = computed(() => subscriptionStore.activeCount)
const activeLoans = computed(() => loanStore.activeCount)

// 初始化
onMounted(() => {
  settingsStore.init()
  billStore.init()
  subscriptionStore.init()
  loanStore.init()
})

// 格式化金额显示
function formatDisplayAmount(amount: number) {
  if (hideAmount.value) {
    return `${currencySymbol.value}****`
  }
  return formatAmount(amount, currencySymbol.value)
}

// 菜单配置
const menuGroups = [
  {
    title: '数据管理',
    items: [
      { icon: 'i-carbon-document-import', text: '导入账单', desc: '支持支付宝、微信账单', action: 'import' },
      { icon: 'i-carbon-document-export', text: '导出数据', desc: '备份所有数据', action: 'export' },
      { icon: 'i-carbon-cloud-upload', text: '云端同步', desc: storageMode.value === 'local' ? '当前: 本地存储' : '已开启', action: 'sync' },
    ],
  },
  {
    title: '功能设置',
    items: [
      { icon: 'i-carbon-notification', text: '通知监听', desc: notificationEnabled.value ? '已开启' : '未开启', action: 'notification' },
      { icon: 'i-carbon-money', text: '贷款管理', desc: `${activeLoans.value}笔进行中`, action: 'loans' },
      { icon: 'i-carbon-calendar', text: '预算设置', desc: '设置月度预算', action: 'budget' },
    ],
  },
  {
    title: '隐私与安全',
    items: [
      { icon: 'i-carbon-locked', text: '应用锁', desc: '保护你的隐私', action: 'appLock' },
      { icon: 'i-carbon-view-off', text: '隐藏金额', desc: hideAmount.value ? '已开启' : '未开启', action: 'hideAmount' },
      { icon: 'i-carbon-information', text: '隐私政策', desc: '', action: 'privacy' },
    ],
  },
  {
    title: '其他',
    items: [
      { icon: 'i-carbon-help', text: '使用帮助', desc: '', action: 'help' },
      { icon: 'i-carbon-star', text: '给个好评', desc: '', action: 'rate' },
      { icon: 'i-carbon-information', text: '关于', desc: 'v1.0.0', action: 'about' },
    ],
  },
]

// 菜单点击处理
function handleMenuClick(action: string) {
  switch (action) {
    case 'import':
      uni.navigateTo({ url: '/pages/import/index' })
      break
    case 'export':
      handleExport()
      break
    case 'sync':
      uni.navigateTo({ url: '/pages/settings/sync' })
      break
    case 'notification':
      uni.navigateTo({ url: '/pages/settings/notification' })
      break
    case 'loans':
      uni.navigateTo({ url: '/pages/loan/index' })
      break
    case 'budget':
      uni.navigateTo({ url: '/pages/settings/budget' })
      break
    case 'appLock':
      uni.navigateTo({ url: '/pages/settings/app-lock' })
      break
    case 'hideAmount':
      settingsStore.toggleHideAmount()
      break
    case 'privacy':
      uni.navigateTo({ url: '/pages/settings/privacy' })
      break
    case 'help':
      uni.navigateTo({ url: '/pages/help/index' })
      break
    case 'about':
      uni.navigateTo({ url: '/pages/about/index' })
      break
    default:
      uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

// 导出数据
async function handleExport() {
  try {
    uni.showLoading({ title: '导出中...' })
    const data = await exportAllData()
    const jsonStr = JSON.stringify(data, null, 2)

    // 在实际App中，这里应该使用文件系统API保存文件
    // 这里简单展示数据
    uni.hideLoading()
    uni.showModal({
      title: '导出成功',
      content: `数据已准备就绪，包含 ${totalBills.value} 条账单记录`,
      showCancel: false,
    })

    console.log('Exported data:', data)
  }
  catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '导出失败', icon: 'error' })
  }
}
</script>

<template>
  <view class="me-page min-h-screen bg-bg-dark">
    <!-- 顶部安全区域 -->
    <view class="pt-safe" />

    <!-- 头部 -->
    <view class="header px-4 py-4">
      <text class="text-xl text-white font-bold">
        我的
      </text>
    </view>

    <!-- 用户统计卡片 -->
    <view class="user-card mx-4 rounded-2xl bg-bg-card p-5">
      <view class="mb-4 flex items-center">
        <view class="mr-4 h-16 w-16 flex items-center justify-center rounded-full bg-primary">
          <view class="i-carbon-user text-3xl text-white" />
        </view>
        <view>
          <text class="text-lg text-white font-semibold">
            Where is my Money
          </text>
          <view class="wimm-privacy-badge mt-2">
            <view class="i-carbon-locked text-xs" />
            <text>{{ storageMode === 'local' ? '数据仅本地存储' : '已开启云同步' }}</text>
          </view>
        </view>
      </view>

      <!-- 统计数据 -->
      <view class="border-border-color grid grid-cols-3 gap-4 border-t pt-4">
        <view class="text-center">
          <text class="text-xl text-white font-bold">
            {{ totalBills }}
          </text>
          <text class="mt-1 block text-xs text-text-muted">
            总账单
          </text>
        </view>
        <view class="text-center">
          <text class="text-xl text-expense font-bold">
            {{ formatDisplayAmount(monthExpense) }}
          </text>
          <text class="mt-1 block text-xs text-text-muted">
            本月支出
          </text>
        </view>
        <view class="text-center">
          <text class="text-xl text-primary font-bold">
            {{ activeSubscriptions }}
          </text>
          <text class="mt-1 block text-xs text-text-muted">
            订阅中
          </text>
        </view>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list mt-6 px-4 pb-32">
      <view
        v-for="(group, groupIndex) in menuGroups"
        :key="groupIndex"
        class="menu-group mb-4"
      >
        <text class="mb-2 block px-1 text-xs text-text-muted">
          {{ group.title }}
        </text>
        <view class="overflow-hidden rounded-xl bg-bg-card">
          <view
            v-for="(item, itemIndex) in group.items"
            :key="itemIndex"
            class="menu-item flex items-center px-4 py-3"
            :class="{ 'border-t border-border-color': itemIndex > 0 }"
            @tap="handleMenuClick(item.action)"
          >
            <view
              :class="item.icon"
              class="mr-3 text-xl text-primary"
            />
            <view class="flex-1">
              <text class="text-sm text-white">
                {{ item.text }}
              </text>
              <text v-if="item.desc" class="mt-0.5 block text-xs text-text-muted">
                {{ item.desc }}
              </text>
            </view>
            <view class="i-carbon-chevron-right text-lg text-text-muted" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.me-page {
  background: linear-gradient(180deg, var(--wimm-bg-card) 0%, var(--wimm-bg-dark) 20%);
}

.user-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(26, 26, 46, 0.9) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.menu-item {
  transition: background-color 0.2s;

  &:active {
    background-color: var(--wimm-bg-card-hover);
  }
}
</style>
