#!/usr/bin/env bash

###############################################################################
# 创建测试数据库脚本
#
# 功能：
# - 连接到 PostgreSQL
# - 创建独立的测试数据库
# - 设置权限
#
# 使用方法：
#   chmod +x create-test-database.sh
#   ./create-test-database.sh
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置（从 docker-compose.yml）
DB_HOST=${TEST_DB_HOST:-localhost}
DB_PORT=${TEST_DB_PORT:-5432}
DB_USER=${TEST_DB_USER:-aiofix_user}
DB_PASSWORD=${TEST_DB_PASSWORD:-aiofix_password}
DB_NAME=${TEST_DB_NAME:-saas_core_test}

echo -e "${YELLOW}🚀 开始创建测试数据库...${NC}\n"

# 检查 PostgreSQL 是否运行
echo -e "${YELLOW}📡 检查 PostgreSQL 连接...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到 PostgreSQL${NC}"
    echo -e "${YELLOW}请确保 PostgreSQL 正在运行:${NC}"
    echo -e "   docker-compose up -d postgres"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL 连接成功${NC}\n"

# 删除旧的测试数据库（如果存在）
echo -e "${YELLOW}🗑️  删除旧的测试数据库（如果存在）...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
EOF
echo -e "${GREEN}✅ 旧数据库已删除${NC}\n"

# 创建新的测试数据库
echo -e "${YELLOW}📦 创建新的测试数据库...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<EOF
CREATE DATABASE $DB_NAME
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TEMPLATE = template0;
EOF
echo -e "${GREEN}✅ 测试数据库创建成功${NC}\n"

# 授予权限
echo -e "${YELLOW}🔐 设置数据库权限...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
echo -e "${GREEN}✅ 权限设置完成${NC}\n"

# 连接到测试数据库并启用扩展
echo -e "${YELLOW}🔧 启用 PostgreSQL 扩展...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- UUID 扩展（用于生成 UUID）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto 扩展（用于加密）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
echo -e "${GREEN}✅ 扩展启用成功${NC}\n"

# 验证数据库创建
echo -e "${YELLOW}🔍 验证数据库...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库验证成功${NC}\n"
else
    echo -e "${RED}❌ 数据库验证失败${NC}\n"
    exit 1
fi

# 显示数据库信息
echo -e "${GREEN}🎉 测试数据库创建完成！${NC}\n"
echo -e "${YELLOW}数据库信息:${NC}"
echo -e "  主机: $DB_HOST"
echo -e "  端口: $DB_PORT"
echo -e "  用户: $DB_USER"
echo -e "  数据库: $DB_NAME"
echo -e "\n${YELLOW}下一步:${NC}"
echo -e "  cd packages/saas-core"
echo -e "  pnpm test\n"

