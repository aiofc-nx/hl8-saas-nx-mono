#!/bin/bash
set -e

echo "验证TypeScript编译..."
npx tsc --noEmit

echo "验证完成！所有类型错误已修复。"
