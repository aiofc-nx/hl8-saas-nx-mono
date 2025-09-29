/**
 * API应用配置类
 *
 * 定义API应用的完整配置结构，包含服务器、数据库、认证、日志等配置项。
 * 提供类型安全的配置管理，支持环境变量覆盖和默认值设置。
 * 遵循 Clean Architecture 的配置管理原则，确保配置的类型安全和验证。
 *
 * @description 此配置类定义了API应用的所有配置选项。
 * 包含服务器配置、数据库配置、认证配置、日志配置等功能模块配置。
 * 支持配置验证、环境变量替换、类型安全等功能。
 *
 * ## 业务规则
 *
 * ### 配置验证规则
 * - 所有配置项都使用 class-validator 进行验证
 * - 支持必填字段和可选字段的验证
 * - 提供配置值的类型检查和格式验证
 * - 验证失败时阻止应用启动
 *
 * ### 环境变量规则
 * - 支持环境变量覆盖配置值
 * - 使用 ${VAR} 语法进行变量替换
 * - 支持 ${VAR:-DEFAULT} 默认值语法
 * - 环境变量优先级高于配置文件
 *
 * ### 类型安全规则
 * - 所有配置项都有明确的类型定义
 * - 支持 TypeScript 的严格类型检查
 * - 提供完整的类型推断和智能提示
 * - 编译时类型检查确保配置正确性
 *
 * ## 业务逻辑流程
 *
 * 1. **配置加载**：从配置文件和环境变量加载配置
 * 2. **环境变量替换**：替换配置中的环境变量引用
 * 3. **配置验证**：使用 class-validator 验证配置完整性
 * 4. **类型转换**：将字符串配置转换为相应类型
 * 5. **默认值设置**：为缺失的配置项设置默认值
 * 6. **配置返回**：返回验证后的配置对象
 *
 * @example
 * ```typescript
 * import { AppConfig } from './app.config';
 * import { TypedConfigModule } from '@hl8/config';
 *
 * // 在模块中使用配置
 * @Module({
 *   imports: [
 *     TypedConfigModule.forRoot({
 *       schema: AppConfig,
 *       load: [
 *         fileLoader({ path: './config/app.yml' }),
 *         dotenvLoader({ separator: '__' })
 *       ]
 *     })
 *   ],
 * })
 * export class AppModule {}
 *
 * // 在服务中注入配置
 * @Injectable()
 * export class AppService {
 *   constructor(private readonly config: AppConfig) {}
 *
 *   getAppInfo() {
 *     return {
 *       name: this.config.app.name,
 *       version: this.config.app.version,
 *       environment: this.config.app.environment
 *     };
 *   }
 * }
 * ```
 */

import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';

/**
 * 应用基本信息配置
 *
 * @description 定义应用的基本信息，包括名称、版本、环境等
 */
export class AppInfoConfig {
  /** 应用名称 */
  @IsString()
  public readonly name!: string;

  /** 应用版本 */
  @IsString()
  public readonly version!: string;

  /** 应用环境 */
  @IsEnum(['development', 'production', 'test'])
  public readonly environment!: 'development' | 'production' | 'test';

  /** 应用描述 */
  @IsOptional()
  @IsString()
  public readonly description?: string;
}

/**
 * 服务器配置
 *
 * @description 定义API服务器的配置选项
 */
export class ServerConfig {
  /** 服务器端口 */
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  public readonly port!: number;

  /** 服务器主机地址 */
  @IsOptional()
  @IsString()
  public readonly host?: string;

  /** 全局API前缀 */
  @IsOptional()
  @IsString()
  public readonly globalPrefix?: string;

  /** 是否启用CORS */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableCors?: boolean;

  /** CORS允许的源 */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public readonly corsOrigins?: string[];
}

/**
 * 数据库配置
 *
 * @description 定义数据库连接和配置选项
 */
export class DatabaseConfig {
  /** 数据库类型 */
  @IsEnum(['postgresql', 'mysql', 'sqlite', 'mongodb'])
  public readonly type!: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';

  /** 数据库主机 */
  @IsString()
  public readonly host!: string;

  /** 数据库端口 */
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  public readonly port!: number;

  /** 数据库名称 */
  @IsString()
  public readonly database!: string;

  /** 数据库用户名 */
  @IsString()
  public readonly username!: string;

  /** 数据库密码 */
  @IsString()
  public readonly password!: string;

  /** 是否启用SSL */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly ssl?: boolean;

  /** 连接池大小 */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  public readonly poolSize?: number;
}

/**
 * 认证配置
 *
 * @description 定义JWT认证相关的配置选项
 */
export class AuthConfig {
  /** JWT密钥 */
  @IsString()
  public readonly jwtSecret!: string;

  /** JWT过期时间（秒） */
  @IsNumber()
  @Min(300)
  @Max(86400)
  @Type(() => Number)
  public readonly jwtExpirationTime!: number;

  /** JWT刷新密钥 */
  @IsOptional()
  @IsString()
  public readonly jwtRefreshSecret?: string;

  /** JWT刷新过期时间（秒） */
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(86400)
  @Type(() => Number)
  public readonly jwtRefreshExpirationTime?: number;

  /** 密码盐轮数 */
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(20)
  @Type(() => Number)
  public readonly passwordSaltRounds?: number;
}

/**
 * 日志格式化配置
 *
 * @description 定义日志格式化相关的配置选项
 */
export class LoggingFormatConfig {
  /** 是否显示时间戳 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly timestamp?: boolean;

  /** 是否启用彩色输出 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly colorize?: boolean;

  /** 是否启用美化打印 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly prettyPrint?: boolean;

  /** 时间格式 */
  @IsOptional()
  @IsString()
  public readonly translateTime?: string;

  /** 忽略的字段 */
  @IsOptional()
  @IsString()
  public readonly ignore?: string;
}

/**
 * 控制台日志配置
 *
 * @description 定义控制台日志输出相关的配置选项
 */
export class LoggingConsoleConfig {
  /** 是否启用控制台输出 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enabled?: boolean;

  /** 是否启用彩色输出 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly colorize?: boolean;

  /** 是否启用美化打印 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly prettyPrint?: boolean;
}

/**
 * 文件日志配置
 *
 * @description 定义文件日志输出相关的配置选项
 */
export class LoggingFileConfig {
  /** 是否启用文件输出 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enabled?: boolean;

  /** 是否启用美化打印 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly prettyPrint?: boolean;

  /** 时间格式 */
  @IsOptional()
  @IsString()
  public readonly translateTime?: string;
}

/**
 * 日志配置
 *
 * @description 定义日志记录相关的配置选项
 */
export class LoggingConfig {
  /** 日志级别 */
  @IsEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
  public readonly level!:
    | 'trace'
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'fatal';

  /** 日志文件路径 */
  @IsOptional()
  @IsString()
  public readonly filePath?: string;

  /** 是否启用请求日志 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableRequestLogging?: boolean;

  /** 是否启用响应日志 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableResponseLogging?: boolean;

  /** 是否启用控制台日志 */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public readonly enableConsoleLogging?: boolean;

  /** 日志格式化配置 */
  @IsOptional()
  @ValidateNested()
  @Type(() => LoggingFormatConfig)
  public readonly format?: LoggingFormatConfig;

  /** 控制台输出配置 */
  @IsOptional()
  @ValidateNested()
  @Type(() => LoggingConsoleConfig)
  public readonly console?: LoggingConsoleConfig;

  /** 文件输出配置 */
  @IsOptional()
  @ValidateNested()
  @Type(() => LoggingFileConfig)
  public readonly file?: LoggingFileConfig;
}

/**
 * 缓存配置
 *
 * @description 定义缓存相关的配置选项
 */
export class CacheConfig {
  /** 缓存类型 */
  @IsEnum(['memory', 'redis'])
  public readonly type!: 'memory' | 'redis';

  /** Redis主机（当type为redis时） */
  @IsOptional()
  @IsString()
  public readonly redisHost?: string;

  /** Redis端口（当type为redis时） */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  public readonly redisPort?: number;

  /** Redis密码（当type为redis时） */
  @IsOptional()
  @IsString()
  public readonly redisPassword?: string;

  /** 缓存默认TTL（秒） */
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  @Type(() => Number)
  public readonly defaultTtl?: number;
}

/**
 * API应用完整配置
 *
 * @description 定义API应用的完整配置结构，包含所有功能模块的配置
 */
export class AppConfig {
  /** 应用基本信息配置 */
  @ValidateNested()
  @Type(() => AppInfoConfig)
  public readonly app!: AppInfoConfig;

  /** 服务器配置 */
  @ValidateNested()
  @Type(() => ServerConfig)
  public readonly server!: ServerConfig;

  /** 数据库配置 */
  @ValidateNested()
  @Type(() => DatabaseConfig)
  public readonly database!: DatabaseConfig;

  /** 认证配置 */
  @ValidateNested()
  @Type(() => AuthConfig)
  public readonly auth!: AuthConfig;

  /** 日志配置 */
  @ValidateNested()
  @Type(() => LoggingConfig)
  public readonly logging!: LoggingConfig;

  /** 缓存配置 */
  @ValidateNested()
  @Type(() => CacheConfig)
  public readonly cache!: CacheConfig;
}
