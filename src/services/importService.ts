/**
 * Where is my Money - 账单导入服务
 * 支持支付宝、微信账单CSV文件导入
 */

import type { ICreateBillParams, PaymentMethod, TransactionType } from '@/types/bill'
import dayjs from 'dayjs'
import { checkDuplicateBill, createBill } from './billService'
import { findCategoryByName, getDefaultCategory } from './categoryService'

/** 导入结果 */
export interface IImportResult {
  /** 总记录数 */
  total: number
  /** 成功导入数 */
  success: number
  /** 跳过(重复)数 */
  skipped: number
  /** 失败数 */
  failed: number
  /** 错误信息 */
  errors: string[]
}

/** 解析后的账单记录 */
interface IParsedBillRecord {
  transactionTime: number
  type: TransactionType
  amount: number
  merchant: string
  category: string
  remark: string
  paymentMethod: PaymentMethod
  orderNo?: string
}

/**
 * 解析支付宝账单CSV
 * 支付宝账单格式:
 * 交易时间,交易分类,交易对方,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注
 */
export function parseAlipayCSV(csvContent: string): IParsedBillRecord[] {
  const records: IParsedBillRecord[] = []
  const lines = csvContent.split('\n')

  // 跳过标题行和空行
  let dataStartIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') && lines[i].includes('金额')) {
      dataStartIndex = i + 1
      break
    }
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line)
      continue

    try {
      // 处理CSV中的逗号(考虑引号内的逗号)
      const columns = parseCSVLine(line)
      if (columns.length < 8)
        continue

      const [
        timeStr,
        category,
        merchant,
        description,
        typeStr,
        amountStr,
        paymentMethodStr,
        status,
        orderNo,
      ] = columns

      // 跳过交易关闭/退款的记录
      if (status && (status.includes('关闭') || status.includes('退款'))) {
        continue
      }

      // 解析交易时间
      const transactionTime = dayjs(timeStr.trim()).valueOf()
      if (!transactionTime || Number.isNaN(transactionTime))
        continue

      // 解析交易类型
      const type: TransactionType = typeStr.trim() === '收入' ? 'income' : 'expense'

      // 解析金额(去除货币符号)
      const amount = Math.round(Number.parseFloat(amountStr.replace(/[¥,\s]/g, '')) * 100)
      if (Number.isNaN(amount) || amount <= 0)
        continue

      // 解析支付方式
      let paymentMethod: PaymentMethod = 'alipay'
      if (paymentMethodStr) {
        if (paymentMethodStr.includes('银行') || paymentMethodStr.includes('储蓄卡')) {
          paymentMethod = 'bank_card'
        }
        else if (paymentMethodStr.includes('信用卡') || paymentMethodStr.includes('花呗')) {
          paymentMethod = 'credit_card'
        }
      }

      records.push({
        transactionTime,
        type,
        amount,
        merchant: merchant?.trim() || '',
        category: category?.trim() || '',
        remark: description?.trim() || '',
        paymentMethod,
        orderNo: orderNo?.trim(),
      })
    }
    catch (error) {
      console.error(`[ImportService] Failed to parse line ${i}:`, error)
    }
  }

  return records
}

/**
 * 解析微信账单CSV
 * 微信账单格式:
 * 交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注
 */
export function parseWechatCSV(csvContent: string): IParsedBillRecord[] {
  const records: IParsedBillRecord[] = []
  const lines = csvContent.split('\n')

  // 跳过标题行和空行
  let dataStartIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') && lines[i].includes('交易类型')) {
      dataStartIndex = i + 1
      break
    }
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line)
      continue

    try {
      const columns = parseCSVLine(line)
      if (columns.length < 8)
        continue

      const [
        timeStr,
        txType,
        merchant,
        description,
        typeStr,
        amountStr,
        paymentMethodStr,
        status,
        orderNo,
      ] = columns

      // 跳过退款/已退款的记录
      if (status && (status.includes('退款') || status.includes('已全额退款'))) {
        continue
      }

      // 解析交易时间
      const transactionTime = dayjs(timeStr.trim()).valueOf()
      if (!transactionTime || Number.isNaN(transactionTime))
        continue

      // 解析交易类型
      const type: TransactionType = typeStr.trim() === '收入' ? 'income' : 'expense'

      // 解析金额
      const amount = Math.round(Number.parseFloat(amountStr.replace(/[¥,\s]/g, '')) * 100)
      if (Number.isNaN(amount) || amount <= 0)
        continue

      // 解析支付方式
      let paymentMethod: PaymentMethod = 'wechat'
      if (paymentMethodStr) {
        if (paymentMethodStr.includes('银行') || paymentMethodStr.includes('储蓄卡')) {
          paymentMethod = 'bank_card'
        }
        else if (paymentMethodStr.includes('信用卡')) {
          paymentMethod = 'credit_card'
        }
        else if (paymentMethodStr.includes('零钱')) {
          paymentMethod = 'wechat'
        }
      }

      records.push({
        transactionTime,
        type,
        amount,
        merchant: merchant?.trim() || '',
        category: txType?.trim() || '',
        remark: description?.trim() || '',
        paymentMethod,
        orderNo: orderNo?.trim(),
      })
    }
    catch (error) {
      console.error(`[ImportService] Failed to parse line ${i}:`, error)
    }
  }

  return records
}

/**
 * 解析CSV行(处理引号内的逗号)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    }
    else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    }
    else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * 自动检测账单类型
 */
export function detectBillType(csvContent: string): 'alipay' | 'wechat' | 'unknown' {
  const firstLines = csvContent.substring(0, 500).toLowerCase()

  if (firstLines.includes('支付宝') || firstLines.includes('alipay')) {
    return 'alipay'
  }

  if (firstLines.includes('微信') || firstLines.includes('wechat')) {
    return 'wechat'
  }

  return 'unknown'
}

/**
 * 导入账单记录
 */
export function importBills(records: IParsedBillRecord[]): IImportResult {
  const result: IImportResult = {
    total: records.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  for (const record of records) {
    try {
      // 检查是否重复
      const duplicate = checkDuplicateBill(
        record.amount,
        record.merchant,
        record.transactionTime,
        5 * 60 * 1000, // 5分钟内的相同金额和商家视为重复
      )

      if (duplicate) {
        result.skipped++
        continue
      }

      // 智能匹配分类
      let categoryId: string | undefined

      // 1. 根据商家名称匹配
      if (record.merchant) {
        const category = findCategoryByName(record.merchant, record.type)
        if (category) {
          categoryId = category.id
        }
      }

      // 2. 根据分类名称匹配
      if (!categoryId && record.category) {
        const category = findCategoryByName(record.category, record.type)
        if (category) {
          categoryId = category.id
        }
      }

      // 3. 根据备注匹配
      if (!categoryId && record.remark) {
        const category = findCategoryByName(record.remark, record.type)
        if (category) {
          categoryId = category.id
        }
      }

      // 4. 使用默认分类
      if (!categoryId) {
        const defaultCategory = getDefaultCategory(record.type)
        categoryId = defaultCategory?.id
      }

      if (!categoryId) {
        result.failed++
        result.errors.push(`无法匹配分类: ${record.merchant || record.remark}`)
        continue
      }

      // 创建账单
      const billParams: ICreateBillParams = {
        type: record.type,
        amount: record.amount,
        categoryId,
        remark: record.remark || record.merchant || '',
        paymentMethod: record.paymentMethod,
        transactionTime: record.transactionTime,
        source: 'import',
        merchant: record.merchant,
        orderNo: record.orderNo,
      }

      const bill = createBill(billParams)

      if (bill) {
        result.success++
      }
      else {
        result.failed++
        result.errors.push(`创建失败: ${record.merchant || record.remark}`)
      }
    }
    catch (error) {
      result.failed++
      result.errors.push(`处理异常: ${error}`)
    }
  }

  return result
}

/**
 * 导入CSV文件
 */
export function importCSVFile(csvContent: string): IImportResult {
  // 检测账单类型
  const billType = detectBillType(csvContent)

  if (billType === 'unknown') {
    return {
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: ['无法识别账单格式，请确保是支付宝或微信导出的账单文件'],
    }
  }

  // 解析账单
  let records: IParsedBillRecord[]
  if (billType === 'alipay') {
    records = parseAlipayCSV(csvContent)
  }
  else {
    records = parseWechatCSV(csvContent)
  }

  if (records.length === 0) {
    return {
      total: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: ['账单文件中没有找到有效的交易记录'],
    }
  }

  // 导入账单
  return importBills(records)
}

/**
 * 读取文件内容
 */
export function readFileContent(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(
      filePath,
      (entry: any) => {
        entry.file((file: any) => {
          const reader = new plus.io.FileReader()
          reader.onloadend = function (e: any) {
            resolve(e.target.result)
          }
          reader.onerror = function (e: any) {
            reject(new Error('读取文件失败'))
          }
          reader.readAsText(file, 'UTF-8')
        })
      },
      (e: any) => {
        reject(new Error('打开文件失败'))
      },
    )
    // #endif

    // #ifdef H5
    // H5环境使用FileReader
    reject(new Error('请使用App端导入功能'))
    // #endif
  })
}

/**
 * 选择文件并导入
 */
export async function selectAndImportFile(): Promise<IImportResult | null> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    plus.io.pickFile(
      {
        multiple: false,
        filter: 'text/csv',
        extFilter: ['csv', 'txt'],
      } as any,
      async (e: any) => {
        try {
          const content = await readFileContent(e.path)
          const result = importCSVFile(content)
          resolve(result)
        }
        catch (error) {
          console.error('[ImportService] Import failed:', error)
          resolve({
            total: 0,
            success: 0,
            skipped: 0,
            failed: 0,
            errors: [`导入失败: ${error}`],
          })
        }
      },
      (e: any) => {
        console.log('[ImportService] User cancelled')
        resolve(null)
      },
    )
    // #endif

    // #ifndef APP-PLUS
    uni.showToast({ title: '请在App端使用导入功能', icon: 'none' })
    resolve(null)
    // #endif
  })
}
