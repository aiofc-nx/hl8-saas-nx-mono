import { ApiProperty } from '@nestjs/swagger';

/**
 * 标准错误响应DTO
 *
 * @description 遵循RFC7807标准的错误响应格式
 * 提供统一的错误响应结构，支持Swagger文档生成
 *
 * ## 业务规则
 *
 * ### 响应格式规则
 * - 必须包含type、title、status、detail、instance字段
 * - type字段指向错误文档链接
 * - title字段提供简短错误描述
 * - detail字段提供详细错误信息
 * - status字段包含HTTP状态码
 * - instance字段包含请求实例标识符
 *
 * ### 可选字段规则
 * - errorCode字段用于客户端错误识别
 * - data字段用于传递附加错误信息
 * - 支持泛型类型约束确保类型安全
 *
 * ### Swagger文档规则
 * - 所有字段都有完整的API文档注释
 * - 支持Swagger UI中的错误响应展示
 * - 提供示例和描述信息
 *
 * @template ADDITIONAL_DATA 附加数据类型
 *
 * @example
 * ```typescript
 * // 基本错误响应
 * const errorResponse: ErrorResponse = {
 *   type: 'https://docs.example.com/errors#user-not-found',
 *   title: 'User Not Found',
 *   detail: 'The user with ID "user-123" does not exist',
 *   status: 404,
 *   instance: 'req-456',
 *   errorCode: 'USER_NOT_FOUND'
 * };
 *
 * // 带附加数据的错误响应
 * const errorResponseWithData: ErrorResponse<{ userId: string }> = {
 *   type: 'https://docs.example.com/errors#user-not-found',
 *   title: 'User Not Found',
 *   detail: 'The user with ID "user-123" does not exist',
 *   status: 404,
 *   instance: 'req-456',
 *   errorCode: 'USER_NOT_FOUND',
 *   data: { userId: 'user-123' }
 * };
 * ```
 *
 * @since 1.0.0
 */
export class ErrorResponse<ADDITIONAL_DATA extends object = object> {
  /**
   * 错误类型URI
   *
   * @description 指向错误文档的链接，用于客户端了解错误详情
   * 遵循RFC7807标准，通常指向API文档中的错误说明页面
   */
  @ApiProperty({
    description: '错误类型URI，指向错误文档链接',
    example: 'https://docs.example.com/errors#user-not-found',
    required: true,
  })
  type!: string;

  /**
   * 错误标题
   *
   * @description 简短的错误描述，用于快速识别错误类型
   * 通常是对用户友好的简短说明
   */
  @ApiProperty({
    description: '错误标题，简短描述错误类型',
    example: 'User Not Found',
    required: true,
  })
  title!: string;

  /**
   * HTTP状态码
   *
   * @description HTTP响应状态码，表示错误的类型和严重程度
   * 遵循标准HTTP状态码规范
   */
  @ApiProperty({
    description: 'HTTP状态码',
    example: 404,
    required: true,
  })
  status!: number;

  /**
   * 错误详情
   *
   * @description 详细的错误信息，提供更多上下文
   * 通常包含具体的错误原因和可能的解决方案
   */
  @ApiProperty({
    description: '错误详情，提供详细的错误信息和上下文',
    example: 'The user with ID "user-123" does not exist',
    required: true,
  })
  detail!: string;

  /**
   * 请求实例标识符
   *
   * @description 唯一标识此次请求的标识符
   * 用于错误追踪和问题定位
   */
  @ApiProperty({
    description: '请求实例标识符，用于错误追踪',
    example: 'req-456',
    required: true,
  })
  instance!: string;

  /**
   * 错误码
   *
   * @description 应用程序特定的错误码
   * 用于客户端程序化处理错误
   */
  @ApiProperty({
    description: '应用程序特定的错误码，用于客户端错误处理',
    example: 'USER_NOT_FOUND',
    required: false,
  })
  errorCode?: string;

  /**
   * 附加数据
   *
   * @description 与错误相关的附加数据
   * 用于客户端获取更多错误上下文信息
   */
  @ApiProperty({
    description: '与错误相关的附加数据，用于客户端错误处理',
    example: { userId: 'user-123', timestamp: '2024-01-01T00:00:00Z' },
    required: false,
  })
  data?: ADDITIONAL_DATA | ADDITIONAL_DATA[];
}
