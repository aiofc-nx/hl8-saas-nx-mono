/**
 * Jest 全局设置
 *
 * @description 在所有测试开始前执行的全局设置
 *
 * ## 功能
 *
 * - 检查测试数据库连接
 * - 初始化测试数据库
 * - 创建 Schema
 * - 设置环境变量
 *
 * @module __tests__/setup
 * @since 1.0.0
 */

import { TestDatabaseHelper } from './test-database.helper';

/**
 * 全局设置函数
 *
 * @description Jest 会在所有测试套件运行前调用此函数一次
 */
export default async function globalSetup() {
  console.log('\n🚀 开始初始化测试环境...\n');

  try {
    // 设置测试环境变量
    process.env['NODE_ENV'] = 'test';
    process.env['TZ'] = 'UTC';

    // 初始化测试数据库
    await TestDatabaseHelper.setup();

    console.log('\n✅ 测试环境初始化完成\n');
  } catch (error) {
    console.error('\n❌ 测试环境初始化失败:\n', error);
    throw error;
  }
}

