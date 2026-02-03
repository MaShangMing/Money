# 故障排查指南

## Windows 环境启动报错

### 问题：ParseError: D:\: Unexpected token

**错误信息：**
```
error when starting dev server:
Error: ParseError: D:\: Unexpected token
 D:/Project/Money/src/tabbar/config.ts:61:0
```

### 原因分析

这个错误通常是由于 Windows 路径解析问题导致的，可能的原因：

1. **Node.js 版本问题**：确保使用 Node.js >= 20
2. **依赖缓存问题**：node_modules 可能需要重新安装
3. **路径解析问题**：Windows 路径分隔符导致的解析错误

### 解决方案

#### 方案 1: 清除缓存并重新安装依赖

```bash
# 删除依赖和缓存
rm -rf node_modules
rm -rf .nuxt
rm -rf dist
rm pnpm-lock.yaml

# 重新安装
pnpm install

# 启动项目
pnpm dev
```

#### 方案 2: 检查 Node.js 版本

```bash
# 检查版本
node -v

# 应该 >= v20.x.x
# 如果版本过低，请升级 Node.js
```

#### 方案 3: 使用 WSL 或 Git Bash

如果在 PowerShell 中遇到问题，尝试使用：
- Git Bash
- WSL (Windows Subsystem for Linux)
- CMD

#### 方案 4: 检查文件编码

确保所有 `.ts` 和 `.vue` 文件使用 UTF-8 编码（无 BOM）。

在 VS Code 中：
1. 打开文件
2. 右下角点击编码
3. 选择 "通过编码保存"
4. 选择 "UTF-8"

### 验证修复

启动成功后应该看到：

```
vite v5.2.8 dev server running at:
  ➜  Local:   http://localhost:9000/
  ➜  Network: http://172.30.0.2:9000/
  ready in xxxx ms.
```

---

## 其他常见问题

### 图标不显示

**问题：** UnoCSS 图标无法加载

**解决：** 确保图标名称正确，参考 [Iconify Carbon 图标集](https://icon-sets.iconify.design/carbon/)

### 页面空白

**问题：** H5 页面打开后空白

**解决：**
1. 检查浏览器控制台错误
2. 确认 `src/main.ts` 正确导入
3. 清除浏览器缓存

### 小程序编译失败

**问题：** 微信小程序编译报错

**解决：**
1. 确保已安装微信开发者工具
2. 运行 `pnpm dev:mp`
3. 在微信开发者工具中导入 `dist/dev/mp-weixin` 目录

### App 打包失败

**问题：** App 端打包报错

**解决：**
1. 确保已安装 HBuilderX
2. 使用 HBuilderX 打开项目
3. 在 HBuilderX 中进行云打包或本地打包

---

## 开发环境要求

- **Node.js**: >= 20.x
- **pnpm**: >= 9.x
- **操作系统**: Windows 10+, macOS, Linux

## 联系支持

如果以上方案都无法解决问题，请：

1. 查看完整的错误堆栈
2. 检查 `package.json` 中的依赖版本
3. 提交 Issue 到项目仓库
