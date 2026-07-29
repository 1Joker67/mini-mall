# Mini Mall — 微型电商

## 项目概述

Mini Mall 是一个微型电商全栈应用，包含前台商城和后台管理系统。
功能覆盖：商品浏览、搜索筛选、用户注册登录、购物车、下单（含心悦会员折扣）、订单管理、后台 CRUD。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2.12 |
| 语言 | TypeScript | 5.x |
| UI | React | 19.2.4 |
| 样式 | TailwindCSS | 4.x |
| ORM | Prisma + @prisma/client | 7.9.0 |
| 数据库 | SQLite (via @prisma/adapter-libsql) | libsql 0.17.4 |
| 密码 | bcryptjs | 3.0.3 |
| JWT | jose | 6.2.4 |
| 校验 | zod | 4.4.3 |
| 工具 | tsx, dotenv | dev |

> ⚠️ **Prisma 7** 强制要求驱动适配器。本项目使用 `@prisma/adapter-libsql` 连接 SQLite。
> 详见: `src/lib/prisma.ts` — PrismaClient 初始化必须传入 `adapter`。

> ⚠️ **Next.js 16** 有 breaking changes，编码前查阅 `node_modules/next/dist/docs/` 中的对应指南。

## 项目结构

```
mini_mall/
├── prisma/
│   ├── schema.prisma          # 数据模型定义（6 个 model）
│   ├── migrations/            # 数据库迁移文件
│   ├── dev.db                 # SQLite 数据库文件（gitignore）
│   └── seed.ts                # 种子数据脚本
├── prisma.config.ts           # Prisma 7 配置（数据源、迁移路径）
├── src/
│   ├── app/                   # Next.js App Router 页面
│   ├── components/            # 可复用组件
│   ├── lib/
│   │   └── prisma.ts          # Prisma 客户端单例（含适配器）
│   └── generated/prisma/      # Prisma Client 生成代码（gitignore）
├── public/                    # 静态资源
├── .env                       # 环境变量（DATABASE_URL）
├── package.json
└── tsconfig.json
```

## 数据模型

### User
| 字段 | 类型 | 说明 |
|------|------|------|
| email | String @unique | 登录邮箱 |
| password | String | bcrypt 哈希 |
| name | String | 用户昵称 |
| role | String | `USER` 或 `ADMIN` |
| totalSpent | Float | 累计消费金额，用于会员升级 |
| membershipLevel | Int | 0=普通, 1=心悦1, 2=心悦2, 3=心悦3 |

### Category
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String @unique | 分类名称 |
| slug | String @unique | URL 友好标识 |
| description | String? | 分类描述 |

### Product
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 商品名称 |
| description | String | 商品描述 |
| price | Float | 单价 |
| image | String | 图片路径，默认 `/placeholder.png` |
| stock | Int | 库存数量 |
| categoryId | Int → Category | 所属分类 |

### CartItem
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | Int → User | 关联用户，级联删除 |
| productId | Int → Product | 关联商品 |
| quantity | Int | 数量，默认 1 |

### Order
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | Int → User | 下单用户 |
| originalAmount | Float | 折扣前原价 |
| discountRate | Float | 折扣率（1.0/0.98/0.95/0.90） |
| totalAmount | Float | 折扣后实付 |
| status | String | PENDING → PAID → SHIPPED → COMPLETED / CANCELLED |

### OrderItem
| 字段 | 类型 | 说明 |
|------|------|------|
| orderId | Int → Order | 关联订单，级联删除 |
| productId | Int → Product | 关联商品 |
| quantity | Int | 购买数量 |
| price | Float | 下单时价格快照 |

## 心悦会员规则

| 等级 | 累计消费 | 折扣率 | 折扣描述 |
|------|---------|--------|---------|
| 普通 | < ¥8,000 | 1.00 | 无折扣 |
| 心悦1 | ≥ ¥8,000 | 0.98 | 9.8 折 |
| 心悦2 | ≥ ¥80,000 | 0.95 | 9.5 折 |
| 心悦3 | ≥ ¥800,000 | 0.90 | 9.0 折 |

- **升级时机**：支付成功后累加 `totalSpent`，根据门槛自动升级
- **折扣生效**：下单时按当前等级计算折扣，升级后下一笔订单生效
- **计算方式**：`totalAmount = originalAmount × discountRate`

## 预设账号（种子数据）

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@minimall.com | admin123 |
| 用户 | user@minimall.com | 123456 |

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run db:seed      # 重新运行种子数据

npx prisma generate  # 重新生成 Prisma Client
npx prisma studio    # 打开 Prisma 数据库管理界面
npx prisma migrate dev --name <name>  # 创建新迁移
```

## 架构约定

### 认证
- JWT 存储在 httpOnly cookie，由 `jose` 库签发和验证
- `src/middleware.ts` 保护 `/cart`、`/checkout`、`/orders`、`/admin/*` 路由
- API 路由中通过 cookie 读取当前用户

### 数据库
- `src/lib/prisma.ts` 导出单例 `prisma`，避免开发环境热重载创建多个连接
- 使用 Prisma 7 驱动适配器模式：`new PrismaClient({ adapter })`
- 所有 API 路由通过 `prisma` 单例访问数据库

### 前端
- Next.js App Router 页面组件默认是 Server Component
- 需要交互的组件添加 `'use client'` 指令
- 管理后台使用独立 layout（AdminSidebar + AdminHeader）
- TailwindCSS 4，优先使用 utility classes

### API
- Route Handler 放在 `src/app/api/` 下
- 公开接口无需校验，需登录接口在 middleware 层拦截
- 管理接口额外校验 `role === 'ADMIN'`
- 请求校验使用 `zod`

## 实施阶段

当前处于 **第二步实施中**（总共八步）：

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 项目初始化 + 数据库 | ✅ 完成 |
| 2 | 认证系统 (JWT + 登录注册) | 🔜 待开始 |
| 3 | 商品 & 分类 | ⬜ |
| 4 | 购物车 | ⬜ |
| 5 | 心悦会员系统 | ⬜ |
| 6 | 订单 | ⬜ |
| 7 | 后台管理 | ⬜ |
| 8 | UI 打磨 | ⬜ |

## 参考

- Next.js 16 文档: `node_modules/next/dist/docs/`
- Prisma 7 文档: https://pris.ly
- TailwindCSS 4 文档: https://tailwindcss.com
- 实现方案详情: `C:\Users\joker\.claude\plans\mini-mall-github-magical-whistle.md`

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
