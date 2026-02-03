/**
 * Where is my Money - ID生成工具
 */

/**
 * 生成唯一ID
 * 格式: prefix_timestamp_random
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * 生成短ID (用于不太重要的场景)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * 生成UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
