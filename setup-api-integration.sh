#!/bin/bash

# API 集成设置脚本
# 用于应用数据库迁移并生成 TypeScript 类型

echo "🚀 开始 API 集成设置..."

# 1. 应用数据库迁移
echo ""
echo "📊 步骤 1: 应用数据库迁移"
echo "----------------------------------------"
supabase db push

if [ $? -ne 0 ]; then
  echo "❌ 数据库迁移失败"
  echo ""
  echo "如果遇到问题，请检查："
  echo "  1. Supabase CLI 是否已安装: supabase --version"
  echo "  2. 是否已登录: supabase login"
  echo "  3. 是否已链接项目: supabase link"
  echo ""
  echo "或者手动在 Supabase Dashboard 执行 SQL："
  echo "  https://app.supabase.com -> SQL Editor"
  echo "  复制并执行: supabase/migrations/20250101000000_add_new_features.sql"
  exit 1
fi

# 2. 生成 TypeScript 类型
echo ""
echo "📝 步骤 2: 生成 TypeScript 类型"
echo "----------------------------------------"
supabase gen types typescript --local > src/types/supabase.ts

if [ $? -ne 0 ]; then
  echo "⚠️  类型生成失败，尝试从远程生成..."
  supabase gen types typescript > src/types/supabase.ts
fi

# 3. 完成
echo ""
echo "✅ API 集成设置完成！"
echo ""
echo "📋 接下来的步骤："
echo "  1. 重启开发服务器: npm run dev"
echo "  2. 以 admin 账号登录"
echo "  3. 访问新页面："
echo "     - 数据字典: /data-dictionary"
echo "     - 定时任务: /scheduled-tasks"
echo "     - API 令牌: /api-tokens"
echo "     - Swagger 文档: /swagger-docs"
echo ""
echo "💡 提示："
echo "  - 确保你的账号有 admin 或 moderator 角色"
echo "  - 如果遇到权限问题，检查 RLS 策略"
echo "  - 查看 API_INTEGRATION_GUIDE.md 了解更多信息"
echo ""
