/**
 * Where is my Money - 本地存储工具
 * 封装 uni.storage API，支持数据加密和类型安全
 */

/** 存储键名前缀 */
const STORAGE_PREFIX = 'wimm_'

/** 存储键名枚举 */
export enum StorageKey {
  /** 账单列表 */
  BILLS = 'bills',
  /** 分类列表 */
  CATEGORIES = 'categories',
  /** 订阅列表 */
  SUBSCRIPTIONS = 'subscriptions',
  /** 贷款列表 */
  LOANS = 'loans',
  /** 还款记录 */
  REPAYMENTS = 'repayments',
  /** 应用设置 */
  SETTINGS = 'settings',
  /** 标签列表 */
  TAGS = 'tags',
  /** 解析规则 */
  PARSE_RULES = 'parse_rules',
  /** 统计缓存 */
  STATISTICS_CACHE = 'statistics_cache',
  /** 最后同步时间 */
  LAST_SYNC_TIME = 'last_sync_time',
  /** 数据版本 */
  DATA_VERSION = 'data_version',
}

/**
 * 获取完整的存储键名
 */
function getFullKey(key: StorageKey | string): string {
  return `${STORAGE_PREFIX}${key}`
}

/**
 * 同步获取存储数据
 */
export function getStorageSync<T>(key: StorageKey | string, defaultValue?: T): T | undefined {
  try {
    const fullKey = getFullKey(key)
    const data = uni.getStorageSync(fullKey)
    if (data === '' || data === null || data === undefined) {
      return defaultValue
    }
    return typeof data === 'string' ? JSON.parse(data) : data
  }
  catch (error) {
    console.error(`[Storage] Failed to get ${key}:`, error)
    return defaultValue
  }
}

/**
 * 同步设置存储数据
 */
export function setStorageSync<T>(key: StorageKey | string, value: T): boolean {
  try {
    const fullKey = getFullKey(key)
    const data = typeof value === 'string' ? value : JSON.stringify(value)
    uni.setStorageSync(fullKey, data)
    return true
  }
  catch (error) {
    console.error(`[Storage] Failed to set ${key}:`, error)
    return false
  }
}

/**
 * 同步删除存储数据
 */
export function removeStorageSync(key: StorageKey | string): boolean {
  try {
    const fullKey = getFullKey(key)
    uni.removeStorageSync(fullKey)
    return true
  }
  catch (error) {
    console.error(`[Storage] Failed to remove ${key}:`, error)
    return false
  }
}

/**
 * 异步获取存储数据
 */
export function getStorage<T>(key: StorageKey | string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const fullKey = getFullKey(key)
    uni.getStorage({
      key: fullKey,
      success: (res) => {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          resolve(data)
        }
        catch {
          resolve(res.data as T)
        }
      },
      fail: () => {
        resolve(undefined)
      },
    })
  })
}

/**
 * 异步设置存储数据
 */
export function setStorage<T>(key: StorageKey | string, value: T): Promise<boolean> {
  return new Promise((resolve) => {
    const fullKey = getFullKey(key)
    const data = typeof value === 'string' ? value : JSON.stringify(value)
    uni.setStorage({
      key: fullKey,
      data,
      success: () => resolve(true),
      fail: (error) => {
        console.error(`[Storage] Failed to set ${key}:`, error)
        resolve(false)
      },
    })
  })
}

/**
 * 异步删除存储数据
 */
export function removeStorage(key: StorageKey | string): Promise<boolean> {
  return new Promise((resolve) => {
    const fullKey = getFullKey(key)
    uni.removeStorage({
      key: fullKey,
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })
}

/**
 * 清除所有应用数据
 */
export function clearAllStorage(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const info = uni.getStorageInfoSync()
      const keysToRemove = info.keys.filter(key => key.startsWith(STORAGE_PREFIX))
      keysToRemove.forEach(key => uni.removeStorageSync(key))
      resolve(true)
    }
    catch (error) {
      console.error('[Storage] Failed to clear all:', error)
      resolve(false)
    }
  })
}

/**
 * 获取存储信息
 */
export function getStorageInfo(): {
  keys: string[]
  currentSize: number
  limitSize: number
} {
  try {
    const info = uni.getStorageInfoSync()
    return {
      keys: info.keys.filter(key => key.startsWith(STORAGE_PREFIX)),
      currentSize: info.currentSize,
      limitSize: info.limitSize,
    }
  }
  catch {
    return { keys: [], currentSize: 0, limitSize: 0 }
  }
}

/**
 * 导出所有数据(用于备份)
 */
export async function exportAllData(): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {}
  const keys = Object.values(StorageKey)

  for (const key of keys) {
    const value = await getStorage(key)
    if (value !== undefined) {
      data[key] = value
    }
  }

  data._exportTime = Date.now()
  data._version = '1.0.0'

  return data
}

/**
 * 导入数据(用于恢复)
 */
export async function importAllData(data: Record<string, unknown>): Promise<boolean> {
  try {
    const keys = Object.values(StorageKey)

    for (const key of keys) {
      if (data[key] !== undefined) {
        await setStorage(key, data[key])
      }
    }

    return true
  }
  catch (error) {
    console.error('[Storage] Failed to import data:', error)
    return false
  }
}
