/**
 * HL8 SAAS平台配置管理模块
 *
 * @description 完全类型安全的配置管理模块
 * 提供配置文件解析、环境变量管理、配置验证、变量扩展等功能
 *
 * ## 主要功能
 *
 * ### 完全类型安全
 * - 无需类型转换，直接注入配置类即可获得完整的 TypeScript 支持
 * - 支持嵌套配置的自动类型推断
 * - 编译时类型检查
 *
 * ### 多格式支持
 * - 支持 .env、.json、.yml/.yaml 配置文件
 * - 支持环境变量覆盖
 * - 支持配置文件合并
 * - 支持远程配置加载
 *
 * ### 配置验证
 * - 集成 class-validator 进行配置验证
 * - 支持自定义验证规则
 * - 提供详细的验证错误信息
 *
 * ### 变量扩展
 * - 支持 ${VAR} 语法进行变量替换
 * - 支持 ${VAR:-DEFAULT} 默认值语法
 * - 支持嵌套配置引用
 *
 * @fileoverview 配置模块入口文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
 * import { Type } from 'class-transformer';
 * import { IsString, IsNumber, ValidateNested } from 'class-validator';
 *
 * // 定义配置类
 * export class DatabaseConfig {
 *   @IsString()
 *   public readonly host!: string;
 *
 *   @IsNumber()
 *   @Type(() => Number)
 *   public readonly port!: number;
 * }
 *
 * export class RootConfig {
 *   @ValidateNested()
 *   @Type(() => DatabaseConfig)
 *   public readonly database!: DatabaseConfig;
 * }
 *
 * // 配置模块
 * @Module({
 *   imports: [
 *     TypedConfigModule.forRoot({
 *       schema: RootConfig,
 *       load: [
 *         fileLoader({ path: './config/app.yml' }),
 *         dotenvLoader({ separator: '__' })
 *       ]
 *     })
 *   ],
 * })
 * export class AppModule {}
 *
 * // 使用配置 - 完全类型安全
 * @Injectable()
 * export class DatabaseService {
 *   constructor(
 *     private readonly config: RootConfig,
 *     private readonly databaseConfig: DatabaseConfig
 *   ) {}
 *
 *   connect() {
 *     // 完全的类型推断和自动补全
 *     console.log(`${this.databaseConfig.host}:${this.databaseConfig.port}`);
 *   }
 * }
 * ```
 */

// 核心模块导出
export { TypedConfigModule } from './lib/typed-config.module';

// 接口导出
export * from './lib/interfaces/typed-config-module-options.interface';

// 加载器导出
export * from './lib/loader';

// 重新导出类型以避免冲突
export type {
  FileLoaderOptions,
  DotenvLoaderOptions,
  RemoteLoaderOptions,
  DirectoryLoaderOptions,
} from './lib/types/loader.types';

// 工具函数导出
export * from './lib/utils/imports.util';
export * from './lib/utils/identity.util';
export * from './lib/utils/debug.util';
export * from './lib/utils/for-each-deep.util';

// 错误处理导出
export * from './lib/errors';

// 类型定义导出
export type * from './lib/types';

// 缓存功能导出
export * from './lib/cache';
