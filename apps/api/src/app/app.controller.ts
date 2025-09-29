/**
 * API应用控制器
 *
 * 提供API应用的主要HTTP端点，包括应用信息、健康检查、配置查询等功能。
 * 集成配置管理和日志记录，提供完整的API服务能力。
 *
 * @description 此控制器是API应用的HTTP接口层。
 * 提供应用信息查询、健康检查、配置展示等HTTP端点。
 * 集成配置管理和日志记录，确保API的可观测性和可维护性。
 *
 * ## 业务规则
 *
 * ### API端点规则
 * - 提供RESTful风格的API端点
 * - 使用标准的HTTP状态码和响应格式
 * - 支持JSON格式的请求和响应
 * - 提供详细的API文档和错误信息
 *
 * ### 安全规则
 * - 敏感配置信息不在API响应中暴露
 * - 支持CORS跨域请求配置
 * - 提供健康检查端点用于监控
 * - 记录所有API请求和响应日志
 *
 * ### 响应格式规则
 * - 统一的JSON响应格式
 * - 包含时间戳和请求ID
 * - 提供详细的错误信息
 * - 支持分页和排序参数
 *
 * ## 业务逻辑流程
 *
 * 1. **请求接收**：接收HTTP请求
 * 2. **参数验证**：验证请求参数和格式
 * 3. **业务处理**：调用相应的服务方法
 * 4. **日志记录**：记录请求和响应日志
 * 5. **响应返回**：返回JSON格式的响应
 *
 * @example
 * ```typescript
 * // API端点示例
 * GET / - 获取问候消息
 * GET /info - 获取应用信息
 * GET /config - 获取应用配置
 * GET /health - 健康检查
 * ```
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * API应用控制器
 *
 * @description 提供API应用的主要HTTP端点和服务
 */
@Controller()
export class AppController {
  /**
   * 构造函数
   *
   * @description 注入应用服务，初始化控制器
   * @param appService - 应用服务实例
   */
  constructor(private readonly appService: AppService) {}

  /**
   * 根路径端点
   *
   * @description 返回应用的问候消息，用于测试API连接
   * @returns 包含问候消息的响应对象
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /
   *
   * // 响应示例
   * {
   *   "message": "Hello from HL8 SAAS API v1.0.0"
   * }
   * ```
   */
  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * 应用信息端点
   *
   * @description 返回应用的基本信息，包括名称、版本、环境等
   * @returns 包含应用基本信息的响应对象
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /info
   *
   * // 响应示例
   * {
   *   "name": "HL8 SAAS API",
   *   "version": "1.0.0",
   *   "environment": "development",
   *   "description": "HL8 SAAS平台API服务"
   * }
   * ```
   */
  @Get('info')
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  /**
   * 应用配置端点
   *
   * @description 返回应用的关键配置信息（不包含敏感信息）
   * @returns 包含应用配置信息的响应对象
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /config
   *
   * // 响应示例
   * {
   *   "server": {
   *     "port": 3000,
   *     "host": "localhost",
   *     "enableCors": true
   *   },
   *   "database": {
   *     "type": "postgresql",
   *     "host": "localhost",
   *     "port": 5432,
   *     "database": "hl8_saas"
   *   }
   * }
   * ```
   */
  @Get('config')
  getConfigInfo() {
    return this.appService.getConfigInfo();
  }

  /**
   * 服务器配置端点
   *
   * @description 返回服务器相关的配置信息
   * @returns 包含服务器配置的响应对象
   */
  @Get('config/server')
  getServerConfig() {
    return this.appService.getServerConfig();
  }

  /**
   * 数据库配置端点
   *
   * @description 返回数据库连接配置信息（不包含密码等敏感信息）
   * @returns 包含数据库配置的响应对象
   */
  @Get('config/database')
  getDatabaseConfig() {
    return this.appService.getDatabaseConfig();
  }

  /**
   * 认证配置端点
   *
   * @description 返回认证相关的配置信息（不包含密钥等敏感信息）
   * @returns 包含认证配置的响应对象
   */
  @Get('config/auth')
  getAuthConfig() {
    return this.appService.getAuthConfig();
  }
}
