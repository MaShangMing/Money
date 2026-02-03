/**
 * Where is my Money - 设置状态管理
 */

import type {
  Currency,
  IAppSettings,
  IBackupSettings,
  IDisplaySettings,
  INotificationSettings,
  IPrivacySettings,
  StorageMode,
  ThemeMode,
} from '@/types/settings'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { CURRENCY_INFO, DEFAULT_SETTINGS } from '@/types/settings'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'

export const useSettingsStore = defineStore('settings', () => {
  // ==================== State ====================

  /** 应用设置 */
  const settings = ref<IAppSettings>(DEFAULT_SETTINGS)

  /** 是否已初始化 */
  const initialized = ref(false)

  // ==================== Getters ====================

  /** 隐私设置 */
  const privacy = computed(() => settings.value.privacy)

  /** 通知设置 */
  const notification = computed(() => settings.value.notification)

  /** 显示设置 */
  const display = computed(() => settings.value.display)

  /** 备份设置 */
  const backup = computed(() => settings.value.backup)

  /** 是否首次启动 */
  const isFirstLaunch = computed(() => settings.value.isFirstLaunch)

  /** 存储模式 */
  const storageMode = computed(() => settings.value.privacy.storageMode)

  /** 是否本地存储 */
  const isLocalStorage = computed(() => settings.value.privacy.storageMode === 'local')

  /** 主题模式 */
  const themeMode = computed(() => settings.value.display.themeMode)

  /** 货币类型 */
  const currency = computed(() => settings.value.display.currency)

  /** 货币符号 */
  const currencySymbol = computed(() => settings.value.display.currencySymbol)

  /** 是否隐藏金额 */
  const hideAmount = computed(() => settings.value.privacy.hideAmount)

  /** 是否开启通知监听 */
  const notificationListenerEnabled = computed(() => settings.value.notification.notificationListenerEnabled)

  // ==================== Actions ====================

  /**
   * 初始化设置
   */
  function init() {
    if (initialized.value)
      return

    // 从存储加载设置
    const stored = getStorageSync<IAppSettings>(StorageKey.SETTINGS)
    if (stored) {
      // 合并默认设置和存储的设置，确保新字段有默认值
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...stored,
        privacy: { ...DEFAULT_SETTINGS.privacy, ...stored.privacy },
        notification: { ...DEFAULT_SETTINGS.notification, ...stored.notification },
        display: { ...DEFAULT_SETTINGS.display, ...stored.display },
        backup: { ...DEFAULT_SETTINGS.backup, ...stored.backup },
      }
    }

    initialized.value = true
  }

  /**
   * 保存设置到存储
   */
  function save() {
    settings.value.updatedAt = Date.now()
    setStorageSync(StorageKey.SETTINGS, settings.value)
  }

  /**
   * 更新隐私设置
   */
  function updatePrivacy(updates: Partial<IPrivacySettings>) {
    settings.value.privacy = { ...settings.value.privacy, ...updates }
    save()
  }

  /**
   * 更新通知设置
   */
  function updateNotification(updates: Partial<INotificationSettings>) {
    settings.value.notification = { ...settings.value.notification, ...updates }
    save()
  }

  /**
   * 更新显示设置
   */
  function updateDisplay(updates: Partial<IDisplaySettings>) {
    // 如果更新了货币，同步更新货币符号
    if (updates.currency && !updates.currencySymbol) {
      updates.currencySymbol = CURRENCY_INFO[updates.currency].symbol
    }
    settings.value.display = { ...settings.value.display, ...updates }
    save()
  }

  /**
   * 更新备份设置
   */
  function updateBackup(updates: Partial<IBackupSettings>) {
    settings.value.backup = { ...settings.value.backup, ...updates }
    save()
  }

  /**
   * 设置存储模式
   */
  function setStorageMode(mode: StorageMode) {
    updatePrivacy({ storageMode: mode })
  }

  /**
   * 设置主题模式
   */
  function setThemeMode(mode: ThemeMode) {
    updateDisplay({ themeMode: mode })
  }

  /**
   * 设置货币
   */
  function setCurrency(currency: Currency) {
    updateDisplay({
      currency,
      currencySymbol: CURRENCY_INFO[currency].symbol,
    })
  }

  /**
   * 切换金额显示
   */
  function toggleHideAmount() {
    updatePrivacy({ hideAmount: !settings.value.privacy.hideAmount })
  }

  /**
   * 切换通知监听
   */
  function toggleNotificationListener() {
    updateNotification({
      notificationListenerEnabled: !settings.value.notification.notificationListenerEnabled,
    })
  }

  /**
   * 添加监控App
   */
  function addMonitoredApp(packageName: string) {
    if (!settings.value.notification.monitoredApps.includes(packageName)) {
      updateNotification({
        monitoredApps: [...settings.value.notification.monitoredApps, packageName],
      })
    }
  }

  /**
   * 移除监控App
   */
  function removeMonitoredApp(packageName: string) {
    updateNotification({
      monitoredApps: settings.value.notification.monitoredApps.filter(p => p !== packageName),
    })
  }

  /**
   * 标记已完成首次启动
   */
  function completeFirstLaunch() {
    settings.value.isFirstLaunch = false
    save()
  }

  /**
   * 更新版本号
   */
  function updateVersion(version: string) {
    settings.value.lastVersion = version
    save()
  }

  /**
   * 重置设置
   */
  function reset() {
    settings.value = { ...DEFAULT_SETTINGS, isFirstLaunch: false }
    save()
  }

  return {
    // State
    settings,
    initialized,

    // Getters
    privacy,
    notification,
    display,
    backup,
    isFirstLaunch,
    storageMode,
    isLocalStorage,
    themeMode,
    currency,
    currencySymbol,
    hideAmount,
    notificationListenerEnabled,

    // Actions
    init,
    save,
    updatePrivacy,
    updateNotification,
    updateDisplay,
    updateBackup,
    setStorageMode,
    setThemeMode,
    setCurrency,
    toggleHideAmount,
    toggleNotificationListener,
    addMonitoredApp,
    removeMonitoredApp,
    completeFirstLaunch,
    updateVersion,
    reset,
  }
})
