# HaloLight Vue

企业级 RBAC 权限管理系统 - React + Vite + Supabase 实现

[![Live](https://img.shields.io/badge/Live-halolight--edge.h7ml.cn-blue)](https://halolight-edge.h7ml.cn)
[![Deno](https://img.shields.io/badge/Deno-Playground-black)](https://dash.deno.com/playground/halolight-edge-api)
[![GitHub](https://img.shields.io/github/stars/dext7r/halolight-edge?style=social)](https://github.com/dext7r/halolight-edge)

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 + SWC |
| 路由 | React Router DOM 6 |
| 状态 | TanStack Query |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| 表单 | React Hook Form + Zod |
| 图表 | Recharts |
| 编辑器 | CodeMirror 6 |
| 动画 | Framer Motion |
| 后端 | Supabase (PostgreSQL + Auth + Edge Functions) |
| API 文档 | Swagger UI |

## 功能模块

### 核心功能
- **用户认证** - 登录/注册/JWT Token
- **用户管理** - CRUD、状态管理、批量操作
- **角色权限** - RBAC 模型、权限分配
- **审计日志** - 操作记录、行为追踪

### 开发工具
- **API 文档** - Swagger UI 交互式文档
- **API 测试器** - 在线接口调试
- **SQL 编辑器** - 数据库查询工具
- **数据字典** - 表结构与字段管理

### 系统管理
- **定时任务** - Cron 任务调度
- **API 令牌** - 访问令牌管理
- **系统设置** - 主题、语言、偏好配置
- **仪表盘** - 数据统计与可视化

### 基础设施
- **全局错误边界** - 异常捕获与降级
- **离线检测** - 网络状态监控
- **深色模式** - 主题切换
- **响应式布局** - 移动端适配

## 快速开始

```bash
# 克隆项目
git clone https://github.com/halolight/halolight-vue.git
cd halolight-vue

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 环境变量

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

## 项目结构

```
src/
├── api/            # API 客户端封装
├── components/     # 通用组件
│   └── ui/         # shadcn/ui 组件库
├── contexts/       # React Context (Auth, Theme)
├── hooks/          # 自定义 Hooks
├── integrations/   # 第三方集成 (Supabase)
├── lib/            # 工具函数
├── pages/          # 页面组件
├── types/          # TypeScript 类型定义
├── utils/          # 业务工具函数
├── App.tsx         # 应用入口 & 路由配置
└── main.tsx        # 渲染入口
```

## 脚本命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run lint       # ESLint 检查
npm run type-check # TypeScript 类型检查
```

## 相关链接

| 链接 | 说明 |
|------|------|
| [halolight-edge.h7ml.cn](https://halolight-edge.h7ml.cn) | 生产环境 |
| [Deno Playground](https://dash.deno.com/playground/halolight-edge-api) | API 在线调试 |
| [GitHub](https://github.com/dext7r/halolight-edge) | 源码仓库 |
| [API 文档](https://halolight-edge.h7ml.cn/api) | Swagger UI |

## License

MIT
