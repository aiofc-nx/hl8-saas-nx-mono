/**
 * 暂停执行指定时间
 *
 * 创建一个异步延迟函数，暂停执行指定的毫秒数。
 * 使用 Promise 和 setTimeout 实现异步等待。
 *
 * @description 此函数提供了一种简单而有效的方式来创建异步延迟。
 * 使用 Promise 包装 setTimeout，支持 async/await 语法。
 * 适用于异步流程控制、测试延迟、重试机制等场景。
 *
 * ## 业务规则
 *
 * ### 时间控制规则
 * - 支持任意毫秒数延迟
 * - 最小延迟为 0 毫秒
 * - 最大延迟无限制
 * - 支持小数毫秒数
 *
 * ### 异步处理规则
 * - 返回 Promise 对象
 * - 支持 async/await 语法
 * - 不阻塞主线程
 * - 支持链式调用
 *
 * ### 性能规则
 * - 使用原生 setTimeout
 * - 内存使用最小化
 * - 支持高并发场景
 * - 避免内存泄漏
 *
 * @param ms - 要暂停的毫秒数
 * @returns 在指定时间后解析的 Promise
 *
 * @example
 * ```typescript
 * // 基本用法：延迟 1 秒
 * async function example() {
 *   console.log('开始');
 *   await sleep(1000);
 *   console.log('1 秒后');
 * }
 *
 * // 延迟 500 毫秒
 * async function quickDelay() {
 *   console.log('快速开始');
 *   await sleep(500);
 *   console.log('500 毫秒后');
 * }
 *
 * // 在循环中使用
 * async function delayedLoop() {
 *   for (let i = 0; i < 3; i++) {
 *     console.log(`第 ${i + 1} 次`);
 *     await sleep(1000);
 *   }
 * }
 *
 * // 在重试机制中使用
 * async function retryWithDelay() {
 *   let attempts = 0;
 *   while (attempts < 3) {
 *     try {
 *       // 执行可能失败的操作
 *       await someOperation();
 *       break;
 *     } catch (error) {
 *       attempts++;
 *       if (attempts < 3) {
 *         console.log(`重试 ${attempts}，等待 2 秒...`);
 *         await sleep(2000);
 *       }
 *     }
 *   }
 * }
 *
 * // 在测试中使用
 * async function testWithDelay() {
 *   console.log('测试开始');
 *   await sleep(100);
 *   console.log('测试完成');
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
