/**
 * Where is my Money - 分类状态管理
 */

import type { TransactionType } from '@/types/bill'
import type { ICategory, ICategoryGroup } from '@/types/category'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getDefaultCategory,
  initDefaultCategories,
  toggleCategoryEnabled,
  updateCategory,
  updateCategorySort,
} from '@/services/categoryService'

export const useCategoryStore = defineStore('category', () => {
  // ==================== State ====================

  /** 分类列表 */
  const categories = ref<ICategory[]>([])

  /** 是否已初始化 */
  const initialized = ref(false)

  // ==================== Getters ====================

  /** 支出分类 */
  const expenseCategories = computed(() => {
    return categories.value
      .filter(c => c.type === 'expense' && c.enabled)
      .sort((a, b) => a.sort - b.sort)
  })

  /** 收入分类 */
  const incomeCategories = computed(() => {
    return categories.value
      .filter(c => c.type === 'income' && c.enabled)
      .sort((a, b) => a.sort - b.sort)
  })

  /** 分组分类 */
  const groupedCategories = computed<ICategoryGroup[]>(() => {
    return [
      {
        type: 'expense',
        typeName: '支出',
        categories: expenseCategories.value,
      },
      {
        type: 'income',
        typeName: '收入',
        categories: incomeCategories.value,
      },
    ]
  })

  // ==================== Actions ====================

  /**
   * 初始化分类
   */
  function init() {
    if (initialized.value)
      return

    // 初始化默认分类
    initDefaultCategories()

    // 加载分类
    categories.value = getAllCategories()
    initialized.value = true
  }

  /**
   * 刷新分类列表
   */
  function refresh() {
    categories.value = getAllCategories()
  }

  /**
   * 获取分类详情
   */
  function getCategory(id: string): ICategory | null {
    // 先从缓存查找
    const cached = categories.value.find(c => c.id === id)
    if (cached)
      return cached

    // 从存储查找
    return getCategoryById(id)
  }

  /**
   * 按类型获取分类
   */
  function getCategoriesForType(type: TransactionType): ICategory[] {
    return categories.value
      .filter(c => c.type === type && c.enabled)
      .sort((a, b) => a.sort - b.sort)
  }

  /**
   * 添加分类
   */
  function addCategory(params: Omit<ICategory, 'id' | 'createdAt' | 'updatedAt'>): ICategory {
    const category = createCategory(params)
    categories.value.push(category)
    return category
  }

  /**
   * 修改分类
   */
  function editCategory(id: string, updates: Partial<ICategory>): ICategory | null {
    const category = updateCategory(id, updates)
    if (category) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = category
      }
    }
    return category
  }

  /**
   * 删除分类
   */
  function removeCategory(id: string): boolean {
    const success = deleteCategory(id)
    if (success) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }
    }
    return success
  }

  /**
   * 切换分类启用状态
   */
  function toggleEnabled(id: string): ICategory | null {
    const category = toggleCategoryEnabled(id)
    if (category) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = category
      }
    }
    return category
  }

  /**
   * 更新排序
   */
  function updateSort(sortList: { id: string, sort: number }[]): boolean {
    const success = updateCategorySort(sortList)
    if (success) {
      sortList.forEach(({ id, sort }) => {
        const category = categories.value.find(c => c.id === id)
        if (category) {
          category.sort = sort
        }
      })
    }
    return success
  }

  /**
   * 获取默认分类
   */
  function getDefault(type: TransactionType): ICategory | null {
    return getDefaultCategory(type)
  }

  return {
    // State
    categories,
    initialized,

    // Getters
    expenseCategories,
    incomeCategories,
    groupedCategories,

    // Actions
    init,
    refresh,
    getCategory,
    getCategoriesForType,
    addCategory,
    editCategory,
    removeCategory,
    toggleEnabled,
    updateSort,
    getDefault,
  }
})
