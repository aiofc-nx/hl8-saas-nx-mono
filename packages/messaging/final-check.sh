#!/bin/bash
set -e

echo "最终TypeScript编译检查..."
npx tsc --noEmit --skipLibCheck

echo "✅ 所有类型错误已修复！"
echo "✅ messaging模块编译成功！"
