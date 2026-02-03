/**
 * Where is my Money - 通知监听服务
 * Android: 使用无障碍服务监听收付款通知
 * iOS: 提供快捷指令集成方案
 */

import type { PaymentMethod, TransactionType } from '@/types/bill'
import type {
  INotificationParseRule,
  INotificationServiceStatus,
  IParsedTransaction,
  IRawNotification,
} from '@/types/notification'
import { DEFAULT_PARSE_RULES } from '@/types/notification'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'
import { checkDuplicateBill, createBill } from './billService'
import { findCategoryByName, getDefaultCategory } from './categoryService'

/** 获取解析规则 */
export function getParseRules(): INotificationParseRule[] {
  const customRules = getStorageSync<INotificationParseRule[]>(StorageKey.PARSE_RULES, [])
  return [...DEFAULT_PARSE_RULES, ...(customRules || [])]
}

/** 保存自定义解析规则 */
export function saveCustomParseRule(rule: INotificationParseRule): boolean {
  const rules = getStorageSync<INotificationParseRule[]>(StorageKey.PARSE_RULES, []) || []
  const index = rules.findIndex(r => r.id === rule.id)
  if (index !== -1) {
    rules[index] = rule
  }
  else {
    rules.push(rule)
  }
  return setStorageSync(StorageKey.PARSE_RULES, rules)
}

/**
 * 解析通知内容
 * 从通知文本中提取交易信息
 */
export function parseNotification(notification: IRawNotification): IParsedTransaction {
  const rules = getParseRules()

  // 查找匹配的规则
  const matchingRule = rules.find(
    rule => rule.enabled && rule.packageName === notification.packageName,
  )

  if (!matchingRule) {
    return {
      success: false,
      rawNotification: notification,
      confidence: 0,
      errorMessage: '未找到匹配的解析规则',
    }
  }

  try {
    // 解析金额
    const amountMatch = notification.content.match(new RegExp(matchingRule.amountPattern))
    if (!amountMatch) {
      return {
        success: false,
        rawNotification: notification,
        confidence: 0,
        errorMessage: '无法解析金额',
      }
    }

    const amountStr = amountMatch[1].replace(/,/g, '')
    const amount = Math.round(Number.parseFloat(amountStr) * 100) // 转换为分

    if (Number.isNaN(amount) || amount <= 0) {
      return {
        success: false,
        rawNotification: notification,
        confidence: 0,
        errorMessage: '金额解析失败',
      }
    }

    // 判断交易类型
    const content = notification.content + notification.title
    let type: TransactionType = 'expense'
    let typeConfidence = 50

    // 检查收入关键词
    for (const keyword of matchingRule.typeKeywords.income) {
      if (content.includes(keyword)) {
        type = 'income'
        typeConfidence = 90
        break
      }
    }

    // 检查支出关键词（如果没匹配到收入）
    if (type !== 'income') {
      for (const keyword of matchingRule.typeKeywords.expense) {
        if (content.includes(keyword)) {
          type = 'expense'
          typeConfidence = 90
          break
        }
      }
    }

    // 解析商家名称
    let merchant: string | undefined
    if (matchingRule.merchantPattern) {
      const merchantMatch = content.match(new RegExp(matchingRule.merchantPattern))
      if (merchantMatch) {
        merchant = merchantMatch[1].trim()
      }
    }

    // 确定支付方式
    let paymentMethod: PaymentMethod = 'other'
    if (notification.packageName.includes('alipay') || notification.appName.includes('支付宝')) {
      paymentMethod = 'alipay'
    }
    else if (notification.packageName.includes('tencent') || notification.appName.includes('微信')) {
      paymentMethod = 'wechat'
    }
    else if (notification.appName.includes('银行')) {
      paymentMethod = 'bank_card'
    }

    // 计算综合置信度
    const confidence = Math.min(100, Math.round((typeConfidence + 80) / 2))

    return {
      success: true,
      type,
      amount,
      merchant,
      paymentMethod,
      transactionTime: notification.timestamp,
      rawNotification: notification,
      confidence,
    }
  }
  catch (error) {
    return {
      success: false,
      rawNotification: notification,
      confidence: 0,
      errorMessage: `解析异常: ${error}`,
    }
  }
}

/**
 * 处理解析后的交易
 * 自动创建账单记录
 */
export function processTransaction(transaction: IParsedTransaction): boolean {
  if (!transaction.success || !transaction.amount)
    return false

  // 检查是否重复
  const duplicate = checkDuplicateBill(
    transaction.amount,
    transaction.merchant,
    transaction.transactionTime || Date.now(),
  )

  if (duplicate) {
    console.log('[NotificationService] Duplicate transaction detected, skipping')
    return false
  }

  // 智能匹配分类
  let categoryId: string | undefined

  // 1. 根据商家名称匹配
  if (transaction.merchant) {
    const category = findCategoryByName(transaction.merchant, transaction.type)
    if (category) {
      categoryId = category.id
    }
  }

  // 2. 使用默认分类
  if (!categoryId) {
    const defaultCategory = getDefaultCategory(transaction.type || 'expense')
    categoryId = defaultCategory?.id
  }

  if (!categoryId) {
    console.error('[NotificationService] No category found')
    return false
  }

  // 创建账单
  const bill = createBill({
    type: transaction.type || 'expense',
    amount: transaction.amount,
    categoryId,
    remark: transaction.merchant || '',
    paymentMethod: transaction.paymentMethod,
    transactionTime: transaction.transactionTime,
    source: 'notification',
    rawNotification: JSON.stringify(transaction.rawNotification),
    merchant: transaction.merchant,
  })

  if (bill) {
    console.log('[NotificationService] Bill created:', bill.id)

    // 显示通知
    // #ifdef APP-PLUS
    uni.showToast({
      title: `已记录 ${transaction.type === 'income' ? '收入' : '支出'} ${(transaction.amount / 100).toFixed(2)}`,
      icon: 'success',
      duration: 2000,
    })
    // #endif

    return true
  }

  return false
}

/**
 * 获取服务状态 (Android)
 */
export function getServiceStatus(): INotificationServiceStatus {
  // 默认状态
  const status: INotificationServiceStatus = {
    isRunning: false,
    hasAccessibilityPermission: false,
    hasNotificationPermission: false,
    todayCapturedCount: 0,
    todayParsedCount: 0,
  }

  // #ifdef APP-PLUS
  // Android平台检查权限
  if (uni.getSystemInfoSync().platform === 'android') {
    try {
      // 检查无障碍服务权限
      const main = plus.android.runtimeMainActivity()
      const Settings = plus.android.importClass('android.provider.Settings')
      const TextUtils = plus.android.importClass('android.text.TextUtils')
      const context = main.getApplicationContext()

      const enabledServices = Settings.Secure.getString(
        context.getContentResolver(),
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      )

      const packageName = context.getPackageName()
      status.hasAccessibilityPermission = enabledServices && enabledServices.includes(packageName)

      // TODO: 检查通知监听权限
    }
    catch (e) {
      console.error('[NotificationService] Failed to check permissions:', e)
    }
  }
  // #endif

  return status
}

/**
 * 请求无障碍服务权限 (Android)
 */
export function requestAccessibilityPermission(): void {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform === 'android') {
    try {
      const main = plus.android.runtimeMainActivity()
      const Intent = plus.android.importClass('android.content.Intent')
      const Settings = plus.android.importClass('android.provider.Settings')

      const intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      main.startActivity(intent)

      uni.showModal({
        title: '开启无障碍服务',
        content: '请在设置中找到"Where is my Money"并开启无障碍服务，以便自动记录收付款',
        showCancel: false,
      })
    }
    catch (e) {
      console.error('[NotificationService] Failed to open settings:', e)
      uni.showToast({ title: '打开设置失败', icon: 'none' })
    }
  }
  // #endif
}

/**
 * 请求通知监听权限 (Android)
 */
export function requestNotificationPermission(): void {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform === 'android') {
    try {
      const main = plus.android.runtimeMainActivity()
      const Intent = plus.android.importClass('android.content.Intent')
      const Settings = plus.android.importClass('android.provider.Settings')

      // Android 5.0+
      const intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      main.startActivity(intent)

      uni.showModal({
        title: '开启通知监听',
        content: '请在设置中找到"Where is my Money"并允许通知访问权限',
        showCancel: false,
      })
    }
    catch (e) {
      console.error('[NotificationService] Failed to open notification settings:', e)
    }
  }
  // #endif
}

/**
 * 模拟接收通知 (用于测试)
 */
export function simulateNotification(type: 'alipay' | 'wechat', amount: number, merchant: string): IParsedTransaction {
  const notification: IRawNotification = {
    id: `test_${Date.now()}`,
    packageName: type === 'alipay' ? 'com.eg.android.AlipayGphone' : 'com.tencent.mm',
    appName: type === 'alipay' ? '支付宝' : '微信',
    title: type === 'alipay' ? '付款成功' : '微信支付',
    content: `向${merchant}付款${amount.toFixed(2)}元`,
    timestamp: Date.now(),
  }

  return parseNotification(notification)
}

/**
 * iOS快捷指令集成
 * 提供URL Scheme供快捷指令调用
 */
export function handleShortcutAction(params: {
  action: string
  amount?: number
  type?: TransactionType
  merchant?: string
  category?: string
}): boolean {
  if (params.action === 'add_bill' && params.amount) {
    // 从快捷指令添加账单
    let categoryId: string | undefined

    if (params.category) {
      const category = findCategoryByName(params.category, params.type)
      if (category) {
        categoryId = category.id
      }
    }

    if (!categoryId) {
      const defaultCategory = getDefaultCategory(params.type || 'expense')
      categoryId = defaultCategory?.id
    }

    if (!categoryId)
      return false

    const bill = createBill({
      type: params.type || 'expense',
      amount: Math.round(params.amount * 100),
      categoryId,
      remark: params.merchant || '',
      source: 'manual',
      merchant: params.merchant,
    })

    return !!bill
  }

  return false
}
