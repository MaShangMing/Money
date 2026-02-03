# Where is my Money? 💰

一款注重隐私保护的智能记账应用，支持自动监听收付款通知，帮助您轻松管理个人财务。

## ✨ 核心特性

### 🤖 自动记账
- **Android**: 通过无障碍服务监听支付宝、微信等应用的收付款通知，自动创建账单
- **iOS**: 提供快捷指令集成方案，支持语音快速记账

### 🔒 隐私至上
- **默认本地存储**: 所有数据默认存储在设备本地，不会上传到任何服务器
- **可选云同步**: 用户可自主选择是否开启云端备份（加密传输）
- **应用锁**: 支持密码和生物识别保护
- **隐藏金额**: 一键隐藏首页金额显示

### 📊 智能统计
- 月度/年度收支统计
- 分类占比分析
- 收支趋势图表
- 多维度数据筛选

### 📱 账单导入
- 支持支付宝账单CSV导入
- 支持微信账单CSV导入
- 智能分类匹配
- 自动去重检测

### 💳 订阅管理
- 记录付费软件订阅（Netflix、Spotify等）
- 月供到期提醒
- 月均/年度花费统计

### 🏦 贷款管理
- 房贷、车贷、消费贷等记录
- 还款计划跟踪
- 还款进度可视化
- 还款日提醒

## 🛠 技术架构

### 技术栈
- **框架**: UniApp + Vue 3 + TypeScript
- **构建工具**: Vite 5
- **样式方案**: UnoCSS
- **状态管理**: Pinia (持久化)
- **HTTP请求**: Alova
- **多端支持**: H5 / 微信小程序 / App (Android/iOS)

### 项目结构
```
src/
├── api/              # API接口定义
├── components/       # 公共组件
│   ├── AmountDisplay.vue    # 金额显示组件
│   └── CategoryIcon.vue     # 分类图标组件
├── hooks/            # 组合式函数
├── pages/            # 页面组件
│   ├── index/        # 首页
│   ├── add-bill/     # 记账页
│   ├── statistics/   # 统计页
│   ├── subscription/ # 订阅管理
│   ├── loan/         # 贷款管理
│   ├── import/       # 账单导入
│   ├── settings/     # 设置页面
│   ├── bill-detail/  # 账单详情
│   └── me/           # 我的页面
├── services/         # 业务服务层
│   ├── billService.ts        # 账单服务
│   ├── categoryService.ts    # 分类服务
│   ├── subscriptionService.ts # 订阅服务
│   ├── loanService.ts        # 贷款服务
│   ├── notificationService.ts # 通知监听服务
│   └── importService.ts      # 账单导入服务
├── store/            # Pinia状态管理
│   ├── bill.ts       # 账单状态
│   ├── category.ts   # 分类状态
│   ├── subscription.ts # 订阅状态
│   ├── loan.ts       # 贷款状态
│   └── settings.ts   # 设置状态
├── types/            # TypeScript类型定义
│   ├── bill.ts       # 账单类型
│   ├── category.ts   # 分类类型
│   ├── subscription.ts # 订阅类型
│   ├── loan.ts       # 贷款类型
│   ├── settings.ts   # 设置类型
│   └── notification.ts # 通知类型
├── utils/            # 工具函数
│   ├── storage.ts    # 本地存储
│   ├── format.ts     # 格式化工具
│   └── id.ts         # ID生成
└── style/            # 全局样式
    └── index.scss    # 主题变量和样式
```

## 🎨 设计风格

采用**深色简约**设计风格：
- 主色调：深邃紫色 (#6366f1)
- 背景色：深色渐变 (#0f0f1a → #1a1a2e)
- 收入色：翠绿色 (#10b981)
- 支出色：琥珀色 (#f59e0b)

## 📱 运行项目

```bash
# 安装依赖
pnpm install

# H5开发
pnpm dev

# 微信小程序开发
pnpm dev:mp

# App开发
pnpm dev:app

# 构建
pnpm build:h5      # H5
pnpm build:mp      # 微信小程序
pnpm build:app     # App
```

### Windows 环境注意事项

如果在 Windows 环境遇到启动问题，请运行修复脚本：

```bash
# 运行 Windows 环境修复脚本
pnpm fix-windows

# 清除缓存并重新安装
rm -rf node_modules
pnpm install

# 启动项目
pnpm dev
```

详细的故障排查指南请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 🔐 隐私说明

1. **数据存储**: 所有账单数据默认存储在设备本地，使用 UniApp Storage API
2. **通知监听**: 仅在用户明确授权后启用，所有解析在本地完成
3. **云同步**: 可选功能，数据传输采用端到端加密
4. **无广告**: 应用不包含任何广告和追踪代码

## 🚀 后续规划

- [ ] 预算管理功能
- [ ] 多账本支持
- [ ] 家庭共享账本
- [ ] 智能分析建议
- [ ] 数据可视化报告
- [ ] Widget小组件
- [ ] Apple Watch支持

## 📄 许可证

MIT License

---

**Where is my Money?** - 让每一笔花费都有迹可循 🎯
