#!/bin/bash
set -e

echo "检查TypeScript类型..."
npx tsc --noEmit --skipLibCheck

echo "类型检查完成！"
