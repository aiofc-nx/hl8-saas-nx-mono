#!/bin/bash
set -e

echo "检查TypeScript编译..."
npx tsc --noEmit

echo "编译检查完成！"
