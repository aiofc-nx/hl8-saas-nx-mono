/**
 * 性能指标模块
 *
 * 提供应用性能指标收集和监控功能，集成系统资源监控和业务指标统计。
 * 支持 Prometheus 格式的指标输出，便于集成监控系统。
 *
 * @description 此模块提供完整的性能指标收集功能。
 * 集成系统资源监控、业务指标统计、性能指标收集等功能。
 * 支持 Prometheus 格式的指标输出，便于集成 Grafana 等监控系统。
 *
 * ## 业务规则
 *
 * ### 指标收集规则
 * - 收集系统资源使用情况（CPU、内存、磁盘）
 * - 收集应用性能指标（响应时间、吞吐量、错误率）
 * - 收集业务指标（用户数量、请求数量、操作次数）
 * - 支持自定义指标收集和统计
 *
 * ### 数据格式规则
 * - 支持 Prometheus 格式的指标输出
 * - 支持 JSON 格式的指标输出
 * - 指标数据包含时间戳和标签
 * - 支持指标数据的聚合和计算
 *
 * ### 监控集成规则
 * - 支持 Prometheus 监控系统集成
 * - 支持 Grafana 仪表板展示
 * - 支持自定义监控系统集成
 * - 支持指标数据的实时查询和展示
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：初始化指标收集服务和相关组件
 * 2. **指标注册**：注册系统指标和业务指标
 * 3. **数据收集**：定期收集系统资源和业务指标
 * 4. **数据存储**：存储指标数据到内存或外部存储
 * 5. **接口暴露**：暴露指标查询接口
 *
 * @example
 * ```typescript
 * // 在应用模块中导入性能指标模块
 * @Module({
 *   imports: [
 *     MetricsModule,
 *     // 其他模块...
 *   ],
 * })
 * export class AppModule {}
 *
 * // 性能指标接口使用示例
 * // GET /api/metrics - 获取所有性能指标
 * // GET /api/metrics/system - 获取系统资源指标
 * // GET /api/metrics/business - 获取业务指标
 * ```
 */

import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/**
 * 性能指标模块
 *
 * @description 提供应用性能指标收集和监控功能
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
