/**
 * Jest 测试环境设置
 *
 * @description 在每个测试文件运行前执行（同一进程）
 *
 * @module __tests__/setup
 * @since 1.0.0
 */

import { TestDatabaseHelper } from './test-database.helper';

/**
 * 全局测试环境设置
 * 
 * @description 在所有测试套件开始前初始化数据库连接
 */
beforeAll(async () => {
  console.log('\n🔧 设置测试环境...\n');
  await TestDatabaseHelper.setup();
}, 60000); // 60秒超时

/**
 * 全局测试环境清理
 *
 * @description 在所有测试套件结束后关闭数据库连接
 */
afterAll(async () => {
  console.log('\n🧹 清理测试环境...\n');
  await TestDatabaseHelper.teardown();
}, 30000); // 30秒超时

