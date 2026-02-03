/**
 * Where is my Money - 分类服务
 * 分类数据的CRUD操作
 */

import type { TransactionType } from '@/types/bill'
import type { ICategory, ICategoryGroup } from '@/types/category'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/types/category'
import { generateId } from '@/utils/id'
import { getStorageSync, setStorageSync, StorageKey } from '@/utils/storage'

/**
 * 获取所有分类
 */
export function getAllCategories(): ICategory[] {
  return getStorageSync<ICategory[]>(StorageKey.CATEGORIES, []) || []
}

/**
 * 保存所有分类
 */
function saveCategories(categories: ICategory[]): boolean {
  return setStorageSync(StorageKey.CATEGORIES, categories)
}

/**
 * 初始化默认分类
 */
export function initDefaultCategories(): void {
  const existing = getAllCategories()
  if (existing.length > 0)
    return

  const now = Date.now()
  const categories: ICategory[] = []

  // 添加支出分类
  DEFAULT_EXPENSE_CATEGORIES.forEach((cat) => {
    categories.push({
      ...cat,
      id: generateId('cat'),
      createdAt: now,
      updatedAt: now,
    })
  })

  // 添加收入分类
  DEFAULT_INCOME_CATEGORIES.forEach((cat) => {
    categories.push({
      ...cat,
      id: generateId('cat'),
      createdAt: now,
      updatedAt: now,
    })
  })

  saveCategories(categories)
}

/**
 * 获取分类详情
 */
export function getCategoryById(id: string): ICategory | null {
  const categories = getAllCategories()
  return categories.find(c => c.id === id) || null
}

/**
 * 按类型获取分类
 */
export function getCategoriesByType(type: TransactionType): ICategory[] {
  return getAllCategories()
    .filter(c => c.type === type && c.enabled)
    .sort((a, b) => a.sort - b.sort)
}

/**
 * 获取分组后的分类
 */
export function getGroupedCategories(): ICategoryGroup[] {
  const categories = getAllCategories().filter(c => c.enabled)

  const groups: ICategoryGroup[] = [
    {
      type: 'expense',
      typeName: '支出',
      categories: categories
        .filter(c => c.type === 'expense')
        .sort((a, b) => a.sort - b.sort),
    },
    {
      type: 'income',
      typeName: '收入',
      categories: categories
        .filter(c => c.type === 'income')
        .sort((a, b) => a.sort - b.sort),
    },
  ]

  return groups
}

/**
 * 创建分类
 */
export function createCategory(params: Omit<ICategory, 'id' | 'createdAt' | 'updatedAt'>): ICategory {
  const now = Date.now()
  const category: ICategory = {
    ...params,
    id: generateId('cat'),
    createdAt: now,
    updatedAt: now,
  }

  const categories = getAllCategories()
  categories.push(category)
  saveCategories(categories)

  return category
}

/**
 * 更新分类
 */
export function updateCategory(id: string, updates: Partial<ICategory>): ICategory | null {
  const categories = getAllCategories()
  const index = categories.findIndex(c => c.id === id)
  if (index === -1)
    return null

  // 系统预设分类只能修改部分属性
  if (categories[index].isSystem) {
    const allowedUpdates: Partial<ICategory> = {}
    if ('enabled' in updates)
      allowedUpdates.enabled = updates.enabled
    if ('sort' in updates)
      allowedUpdates.sort = updates.sort
    updates = allowedUpdates
  }

  categories[index] = {
    ...categories[index],
    ...updates,
    updatedAt: Date.now(),
  }

  saveCategories(categories)
  return categories[index]
}

/**
 * 删除分类(仅支持用户自定义分类)
 */
export function deleteCategory(id: string): boolean {
  const categories = getAllCategories()
  const category = categories.find(c => c.id === id)

  if (!category || category.isSystem)
    return false

  const filtered = categories.filter(c => c.id !== id)
  saveCategories(filtered)
  return true
}

/**
 * 更新分类排序
 */
export function updateCategorySort(sortList: { id: string, sort: number }[]): boolean {
  const categories = getAllCategories()
  const now = Date.now()

  sortList.forEach(({ id, sort }) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      category.sort = sort
      category.updatedAt = now
    }
  })

  return saveCategories(categories)
}

/**
 * 切换分类启用状态
 */
export function toggleCategoryEnabled(id: string): ICategory | null {
  const categories = getAllCategories()
  const category = categories.find(c => c.id === id)
  if (!category)
    return null

  category.enabled = !category.enabled
  category.updatedAt = Date.now()

  saveCategories(categories)
  return category
}

/**
 * 根据名称查找分类(用于智能匹配)
 */
export function findCategoryByName(name: string, type?: TransactionType): ICategory | null {
  const categories = getAllCategories().filter(c => c.enabled)

  // 精确匹配
  let found = categories.find(
    c => c.name === name && (!type || c.type === type),
  )
  if (found)
    return found

  // 包含匹配
  found = categories.find(
    c => c.name.includes(name) || name.includes(c.name),
  )
  if (found)
    return found

  return null
}

/**
 * 获取默认分类(用于无法匹配时)
 */
export function getDefaultCategory(type: TransactionType): ICategory | null {
  return getAllCategories().find(c => c.type === type && c.name === '其他') || null
}
