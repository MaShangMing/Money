/**
 * Where is my Money - 格式化工具
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化金额
 * @param amount 金额(分)
 * @param symbol 货币符号
 * @param showCents 是否显示分
 */
export function formatAmount(
  amount: number,
  symbol: string = '¥',
  showCents: boolean = false,
): string {
  const yuan = amount / 100
  const formatted = showCents
    ? yuan.toFixed(2)
    : yuan.toFixed(yuan % 1 === 0 ? 0 : 2)

  return `${symbol}${formatted}`
}

/**
 * 格式化金额(带正负号)
 */
export function formatAmountWithSign(
  amount: number,
  type: 'income' | 'expense',
  symbol: string = '¥',
): string {
  const prefix = type === 'income' ? '+' : '-'
  return `${prefix}${formatAmount(amount, symbol)}`
}

/**
 * 隐藏金额显示
 */
export function hideAmountDisplay(amount: number, symbol: string = '¥'): string {
  return `${symbol}****`
}

/**
 * 格式化日期
 */
export function formatDate(
  timestamp: number | Date,
  format: string = 'YYYY-MM-DD',
): string {
  return dayjs(timestamp).format(format)
}

/**
 * 格式化日期时间
 */
export function formatDateTime(
  timestamp: number | Date,
  format: string = 'YYYY-MM-DD HH:mm',
): string {
  return dayjs(timestamp).format(format)
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number | Date): string {
  return dayjs(timestamp).fromNow()
}

/**
 * 格式化日期为友好显示
 * 今天 / 昨天 / 本周X / MM月DD日
 */
export function formatFriendlyDate(timestamp: number | Date): string {
  const date = dayjs(timestamp)
  const now = dayjs()

  if (date.isSame(now, 'day')) {
    return '今天'
  }

  if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  }

  if (date.isSame(now, 'week')) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekDays[date.day()]
  }

  if (date.isSame(now, 'year')) {
    return date.format('M月D日')
  }

  return date.format('YYYY年M月D日')
}

/**
 * 格式化时间为友好显示
 */
export function formatFriendlyTime(timestamp: number | Date): string {
  return dayjs(timestamp).format('HH:mm')
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * 格式化数量
 * 超过10000显示为x.x万
 */
export function formatNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toString()
}

/**
 * 获取月份显示
 */
export function getMonthDisplay(year: number, month: number): string {
  const now = dayjs()
  const target = dayjs().year(year).month(month - 1)

  if (target.isSame(now, 'month')) {
    return '本月'
  }

  if (target.isSame(now.subtract(1, 'month'), 'month')) {
    return '上月'
  }

  if (target.isSame(now, 'year')) {
    return `${month}月`
  }

  return `${year}年${month}月`
}

/**
 * 获取当前月份范围
 */
export function getCurrentMonthRange(): { start: number, end: number } {
  return {
    start: dayjs().startOf('month').valueOf(),
    end: dayjs().endOf('month').valueOf(),
  }
}

/**
 * 获取指定月份范围
 */
export function getMonthRange(year: number, month: number): { start: number, end: number } {
  const target = dayjs().year(year).month(month - 1)
  return {
    start: target.startOf('month').valueOf(),
    end: target.endOf('month').valueOf(),
  }
}

/**
 * 解析金额字符串为分
 * @param amountStr 金额字符串，如 "12.50" 或 "12"
 */
export function parseAmountToCents(amountStr: string): number {
  const amount = Number.parseFloat(amountStr)
  if (Number.isNaN(amount))
    return 0
  return Math.round(amount * 100)
}
