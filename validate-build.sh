#!/bin/bash
# HL8 SAAS 平台构建验证脚本
# 按依赖关系顺序验证所有项目的构建

set -e  # 遇到错误立即退出

echo "🚀 开始构建验证..."
echo "=================================================="

# 阶段 1: 基础库构建（无依赖，可并行）
echo ""
echo "📦 阶段 1/5: 构建基础库..."
echo "--------------------------------------------------"
echo "✓ 构建: config, logger, utils, core, database"
nx run-many -t build -p config logger utils core database
echo "✅ 阶段 1 完成！"

# 阶段 2: 通用服务构建
echo ""
echo "📦 阶段 2/5: 构建通用服务..."
echo "--------------------------------------------------"
echo "✓ 构建: common"
nx build common
echo "✓ 构建: multi-tenancy"
nx build multi-tenancy
echo "✅ 阶段 2 完成！"

# 阶段 3: 高级服务构建
echo ""
echo "📦 阶段 3/5: 构建高级服务..."
echo "--------------------------------------------------"
echo "✓ 构建: fastify-pro, cache"
nx run-many -t build -p fastify-pro cache
echo "✅ 阶段 3 完成！"

# 阶段 4: 复杂服务构建
echo ""
echo "📦 阶段 4/5: 构建复杂服务..."
echo "--------------------------------------------------"
echo "✓ 构建: messaging"
nx build messaging
echo "✅ 阶段 4 完成！"

# 阶段 5: 应用层构建
echo ""
echo "📦 阶段 5/5: 构建应用层..."
echo "--------------------------------------------------"
echo "✓ 构建: api"
nx build api
echo "✅ 阶段 5 完成！"

echo ""
echo "=================================================="
echo "🎉 所有项目构建验证成功！"
echo "=================================================="
echo ""
echo "📊 构建统计："
echo "  - 基础库: 5 个项目 ✓"
echo "  - 通用服务: 2 个项目 ✓"
echo "  - 高级服务: 2 个项目 ✓"
echo "  - 复杂服务: 1 个项目 ✓"
echo "  - 应用层: 1 个项目 ✓"
echo "  - 总计: 11 个项目 ✓"
echo ""

