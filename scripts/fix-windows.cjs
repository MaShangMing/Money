/**
 * Windows 环境修复脚本
 * 解决路径解析和编码问题
 */

const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

console.log('🔧 开始修复 Windows 环境问题...\n')

// 检查 Node.js 版本
const nodeVersion = process.version
const majorVersion = Number.parseInt(nodeVersion.split('.')[0].substring(1))

console.log(`📌 Node.js 版本: ${nodeVersion}`)

if (majorVersion < 20) {
  console.error('❌ Node.js 版本过低，需要 >= 20.x')
  console.log('请访问 https://nodejs.org/ 下载最新版本\n')
  process.exit(1)
}
else {
  console.log('✅ Node.js 版本符合要求\n')
}

// 检查关键文件编码
const filesToCheck = [
  'src/tabbar/config.ts',
  'src/tabbar/store.ts',
  'src/main.ts',
  'vite.config.ts',
]

console.log('📝 检查文件编码...')
let hasIssue = false

filesToCheck.forEach((file) => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath)
    // 检查 BOM
    if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
      console.log(`⚠️  ${file} 包含 BOM，正在移除...`)
      fs.writeFileSync(filePath, content.slice(3))
      hasIssue = true
    }
    else {
      console.log(`✅ ${file}`)
    }
  }
})

if (hasIssue) {
  console.log('\n✨ 已修复文件编码问题')
}
else {
  console.log('\n✅ 所有文件编码正常')
}

// 检查 pnpm 版本
try {
  const { execSync } = require('node:child_process')
  const pnpmVersion = execSync('pnpm -v', { encoding: 'utf-8' }).trim()
  console.log(`\n📦 pnpm 版本: ${pnpmVersion}`)

  const pnpmMajor = Number.parseInt(pnpmVersion.split('.')[0])
  if (pnpmMajor < 9) {
    console.log('⚠️  pnpm 版本较低，建议升级到 >= 9.x')
    console.log('运行: npm install -g pnpm@latest\n')
  }
  else {
    console.log('✅ pnpm 版本符合要求\n')
  }
}
catch (error) {
  console.log('\n⚠️  无法检测 pnpm 版本')
}

console.log('🎉 修复完成！\n')
console.log('建议操作：')
console.log('1. 删除 node_modules: rm -rf node_modules')
console.log('2. 重新安装依赖: pnpm install')
console.log('3. 启动项目: pnpm dev\n')
