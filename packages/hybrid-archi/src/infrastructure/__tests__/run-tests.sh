#!/bin/bash

# 基础设施层测试脚本
# 运行单元测试、集成测试和端到端测试

echo "🚀 开始运行基础设施层测试..."

# 设置环境变量
export NODE_ENV=test
export LOG_LEVEL=error

# 运行单元测试
echo "📋 运行单元测试..."
npm run test:unit -- --config=src/infrastructure/__tests__/jest.config.js

# 检查单元测试结果
if [ $? -ne 0 ]; then
  echo "❌ 单元测试失败"
  exit 1
fi

echo "✅ 单元测试通过"

# 运行集成测试
echo "📋 运行集成测试..."
npm run test:integration -- --config=src/infrastructure/__tests__/jest.config.js

# 检查集成测试结果
if [ $? -ne 0 ]; then
  echo "❌ 集成测试失败"
  exit 1
fi

echo "✅ 集成测试通过"

# 运行端到端测试
echo "📋 运行端到端测试..."
npm run test:e2e -- --config=src/infrastructure/__tests__/jest.config.js

# 检查端到端测试结果
if [ $? -ne 0 ]; then
  echo "❌ 端到端测试失败"
  exit 1
fi

echo "✅ 端到端测试通过"

# 生成测试覆盖率报告
echo "📊 生成测试覆盖率报告..."
npm run test:coverage -- --config=src/infrastructure/__tests__/jest.config.js

echo "🎉 所有测试完成！"
