/**
 * Jest 全局清理
 *
 * @description 在所有测试结束后执行的全局清理
 *
 * ## 功能
 *
 * - 关闭数据库连接
 * - 清理资源
 * - 重置环境变量
 *
 * @module __tests__/setup
 * @since 1.0.0
 */

import { TestDatabaseHelper } from './test-database.helper';

/**
 * 全局清理函数
 *
 * @description Jest 会在所有测试套件运行后调用此函数一次
 */
export default async function globalTeardown() {
  console.log('\n🧹 开始清理测试环境...\n');

  try {
    // 清理测试数据库
    await TestDatabaseHelper.teardown();

    console.log('\n✅ 测试环境清理完成\n');
  } catch (error) {
    console.error('\n❌ 测试环境清理失败:\n', error);
    // 不抛出错误，避免影响测试结果报告
  }
}

