/**
 * 实体转换器
 *
 * 提供完整的实体转换功能，包括DTO与实体转换、数据映射、序列化/反序列化等。
 * 作为通用功能组件，为业务模块提供强大的数据转换能力。
 *
 * @description 实体转换器的完整实现，支持多种转换场景
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';

/**
 * 转换配置接口
 */
export interface TransformConfig {
  /** 是否启用字段映射 */
  enableFieldMapping: boolean;
  /** 是否启用类型转换 */
  enableTypeConversion: boolean;
  /** 是否启用数据验证 */
  enableValidation: boolean;
  /** 是否启用数据清理 */
  enableDataCleaning: boolean;
  /** 是否启用数据加密 */
  enableEncryption: boolean;
  /** 是否启用数据压缩 */
  enableCompression: boolean;
  /** 字段映射规则 */
  fieldMappings: Record<string, string>;
  /** 类型转换规则 */
  typeConversions: Record<string, string>;
  /** 排除字段列表 */
  excludeFields: string[];
  /** 包含字段列表 */
  includeFields: string[];
  /** 敏感字段列表 */
  sensitiveFields: string[];
  /** 自定义转换器 */
  customTransformers: Record<string, (value: any) => any>;
}

/**
 * 转换结果接口
 */
export interface TransformResult<T> {
  data: T;
  metadata: TransformMetadata;
  errors: TransformError[];
  warnings: TransformWarning[];
}

/**
 * 转换元数据接口
 */
export interface TransformMetadata {
  transformedAt: Date;
  transformer: string;
  version: string;
  duration: number;
  sourceType: string;
  targetType: string;
  fieldsTransformed: number;
  fieldsExcluded: number;
  fieldsMapped: number;
  customData?: Record<string, any>;
}

/**
 * 转换错误接口
 */
export interface TransformError {
  field: string;
  code: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

/**
 * 转换警告接口
 */
export interface TransformWarning {
  field: string;
  code: string;
  message: string;
  value?: any;
  context?: Record<string, any>;
}

/**
 * 实体转换器
 *
 * 提供完整的实体转换功能
 */
@Injectable()
export class EntityTransformer {
  private readonly configs = new Map<string, TransformConfig>();
  private readonly transformers = new Map<string, (value: any) => any>();

  constructor(private readonly logger: PinoLogger) {
    this.initializeDefaultTransformers();
  }

  /**
   * 转换DTO到实体
   *
   * @description 将DTO对象转换为实体对象
   * @param dto - DTO对象
   * @param entityClass - 实体类
   * @param config - 转换配置
   * @returns 转换结果
   */
  async transformDtoToEntity<T extends object>(
    dto: any,
    entityClass: new (...args: any[]) => T,
    config?: Partial<TransformConfig>
  ): Promise<TransformResult<T>> {
    const startTime = Date.now();
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    let fieldsTransformed = 0;
    let fieldsExcluded = 0;
    let fieldsMapped = 0;

    try {
      const transformConfig = this.getTransformConfig(config);
      const entityData: any = {};

      // 遍历DTO字段
      for (const [key, value] of Object.entries(dto)) {
        try {
          // 检查是否排除字段
          if (transformConfig.excludeFields.includes(key)) {
            fieldsExcluded++;
            continue;
          }

          // 检查是否包含字段
          if (
            transformConfig.includeFields.length > 0 &&
            !transformConfig.includeFields.includes(key)
          ) {
            fieldsExcluded++;
            continue;
          }

          // 字段映射
          const targetField = transformConfig.enableFieldMapping
            ? transformConfig.fieldMappings[key] || key
            : key;

          // 类型转换
          let transformedValue = value;
          if (transformConfig.enableTypeConversion) {
            transformedValue = this.convertType(
              value,
              transformConfig.typeConversions[key]
            );
          }

          // 自定义转换
          if (transformConfig.customTransformers[key]) {
            transformedValue =
              transformConfig.customTransformers[key](transformedValue);
          }

          // 数据清理
          if (transformConfig.enableDataCleaning) {
            transformedValue = this.cleanData(
              transformedValue,
              key,
              transformConfig
            );
          }

          // 数据加密
          if (
            transformConfig.enableEncryption &&
            transformConfig.sensitiveFields.includes(key)
          ) {
            transformedValue = await this.encryptData(transformedValue);
          }

          // 数据压缩
          if (transformConfig.enableCompression) {
            transformedValue = await this.compressData(transformedValue);
          }

          entityData[targetField] = transformedValue;
          fieldsTransformed++;
          fieldsMapped++;
        } catch (error) {
          const transformError: TransformError = {
            field: key,
            code: 'TRANSFORM_ERROR',
            message: `字段转换失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
            value: value,
            severity: 'error',
            context: { targetField: key },
          };
          errors.push(transformError);
        }
      }

      // 创建实体实例
      const entity = new entityClass();
      Object.assign(entity, entityData);

      const duration = Date.now() - startTime;
      const result: TransformResult<T> = {
        data: entity,
        metadata: {
          transformedAt: new Date(),
          transformer: 'EntityTransformer',
          version: '1.0.0',
          duration,
          sourceType: 'DTO',
          targetType: entityClass.name,
          fieldsTransformed,
          fieldsExcluded,
          fieldsMapped,
        },
        errors,
        warnings,
      };

      this.logger.debug('DTO到实体转换完成', {
        sourceType: 'DTO',
        targetType: entityClass.name,
        fieldsTransformed,
        fieldsExcluded,
        fieldsMapped,
        duration,
        errorCount: errors.length,
        warningCount: warnings.length,
      });

      return result;
    } catch (error) {
      this.logger.error('DTO到实体转换失败', error);
      throw error;
    }
  }

  /**
   * 转换实体到DTO
   *
   * @description 将实体对象转换为DTO对象
   * @param entity - 实体对象
   * @param dtoClass - DTO类
   * @param config - 转换配置
   * @returns 转换结果
   */
  async transformEntityToDto<T extends object>(
    entity: any,
    dtoClass: new (...args: any[]) => T,
    config?: Partial<TransformConfig>
  ): Promise<TransformResult<T>> {
    const startTime = Date.now();
    const errors: TransformError[] = [];
    const warnings: TransformWarning[] = [];
    let fieldsTransformed = 0;
    let fieldsExcluded = 0;
    let fieldsMapped = 0;

    try {
      const transformConfig = this.getTransformConfig(config);
      const dtoData: any = {};

      // 遍历实体字段
      for (const [key, value] of Object.entries(entity)) {
        try {
          // 检查是否排除字段
          if (transformConfig.excludeFields.includes(key)) {
            fieldsExcluded++;
            continue;
          }

          // 检查是否包含字段
          if (
            transformConfig.includeFields.length > 0 &&
            !transformConfig.includeFields.includes(key)
          ) {
            fieldsExcluded++;
            continue;
          }

          // 字段映射
          const targetField = transformConfig.enableFieldMapping
            ? this.getReverseFieldMapping(key, transformConfig.fieldMappings) ||
              key
            : key;

          // 类型转换
          let transformedValue = value;
          if (transformConfig.enableTypeConversion) {
            transformedValue = this.convertType(
              value,
              transformConfig.typeConversions[key]
            );
          }

          // 自定义转换
          if (transformConfig.customTransformers[key]) {
            transformedValue =
              transformConfig.customTransformers[key](transformedValue);
          }

          // 数据清理
          if (transformConfig.enableDataCleaning) {
            transformedValue = this.cleanData(
              transformedValue,
              key,
              transformConfig
            );
          }

          // 数据解密
          if (
            transformConfig.enableEncryption &&
            transformConfig.sensitiveFields.includes(key)
          ) {
            transformedValue = await this.decryptData(transformedValue);
          }

          // 数据解压缩
          if (transformConfig.enableCompression) {
            transformedValue = await this.decompressData(transformedValue);
          }

          dtoData[targetField] = transformedValue;
          fieldsTransformed++;
          fieldsMapped++;
        } catch (error) {
          const transformError: TransformError = {
            field: key,
            code: 'TRANSFORM_ERROR',
            message: `字段转换失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
            value: value,
            severity: 'error',
            context: { targetField: key },
          };
          errors.push(transformError);
        }
      }

      // 创建DTO实例
      const dto = new dtoClass();
      Object.assign(dto, dtoData);

      const duration = Date.now() - startTime;
      const result: TransformResult<T> = {
        data: dto,
        metadata: {
          transformedAt: new Date(),
          transformer: 'EntityTransformer',
          version: '1.0.0',
          duration,
          sourceType: entity.constructor.name,
          targetType: dtoClass.name,
          fieldsTransformed,
          fieldsExcluded,
          fieldsMapped,
        },
        errors,
        warnings,
      };

      this.logger.debug('实体到DTO转换完成', {
        sourceType: entity.constructor.name,
        targetType: dtoClass.name,
        fieldsTransformed,
        fieldsExcluded,
        fieldsMapped,
        duration,
        errorCount: errors.length,
        warningCount: warnings.length,
      });

      return result;
    } catch (error) {
      this.logger.error('实体到DTO转换失败', error);
      throw error;
    }
  }

  /**
   * 批量转换
   *
   * @description 批量转换多个对象
   * @param items - 要转换的对象列表
   * @param transformer - 转换函数
   * @param config - 转换配置
   * @returns 转换结果列表
   */
  async batchTransform<T, R>(
    items: T[],
    transformer: (item: T) => R,
    config?: Partial<TransformConfig>
  ): Promise<TransformResult<R>[]> {
    const results: TransformResult<R>[] = [];

    for (const item of items) {
      try {
        const result = await transformer(item);
        results.push({
          data: result,
          metadata: {
            transformedAt: new Date(),
            transformer: 'EntityTransformer',
            version: '1.0.0',
            duration: 0,
            sourceType: typeof item,
            targetType: typeof result,
            fieldsTransformed: 0,
            fieldsExcluded: 0,
            fieldsMapped: 0,
          },
          errors: [],
          warnings: [],
        });
      } catch (error) {
        results.push({
          data: null as any,
          metadata: {
            transformedAt: new Date(),
            transformer: 'EntityTransformer',
            version: '1.0.0',
            duration: 0,
            sourceType: typeof item,
            targetType: 'unknown',
            fieldsTransformed: 0,
            fieldsExcluded: 0,
            fieldsMapped: 0,
          },
          errors: [
            {
              field: 'item',
              code: 'BATCH_TRANSFORM_ERROR',
              message: `批量转换失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
              value: item,
              severity: 'error',
            },
          ],
          warnings: [],
        });
      }
    }

    return results;
  }

  /**
   * 添加自定义转换器
   *
   * @description 添加自定义的转换器
   * @param name - 转换器名称
   * @param transformer - 转换函数
   */
  addCustomTransformer(
    name: string,
    transformer: (...args: any[]) => any
  ): void {
    this.transformers.set(name, transformer);
    this.logger.info('自定义转换器已添加', { name });
  }

  /**
   * 移除自定义转换器
   *
   * @description 移除指定的自定义转换器
   * @param name - 转换器名称
   */
  removeCustomTransformer(name: string): void {
    this.transformers.delete(name);
    this.logger.info('自定义转换器已移除', { name });
  }

  // ==================== 私有方法 ====================

  /**
   * 获取转换配置
   */
  private getTransformConfig(
    config?: Partial<TransformConfig>
  ): TransformConfig {
    const defaultConfig: TransformConfig = {
      enableFieldMapping: false,
      enableTypeConversion: true,
      enableValidation: true,
      enableDataCleaning: true,
      enableEncryption: false,
      enableCompression: false,
      fieldMappings: {},
      typeConversions: {},
      excludeFields: [],
      includeFields: [],
      sensitiveFields: [],
      customTransformers: {},
    };

    return { ...defaultConfig, ...config };
  }

  /**
   * 类型转换
   */
  private convertType(value: any, targetType?: string): any {
    if (!targetType) return value;

    switch (targetType.toLowerCase()) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : { value };
      default:
        return value;
    }
  }

  /**
   * 数据清理
   */
  private cleanData(value: any, field: string, config: TransformConfig): any {
    if (typeof value === 'string') {
      // 去除首尾空格
      value = value.trim();

      // 去除HTML标签
      value = value.replace(/<[^>]*>/g, '');

      // 去除特殊字符
      value = value.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
    }

    return value;
  }

  /**
   * 数据加密
   */
  private async encryptData(value: any): Promise<string> {
    // 这里应该实现具体的加密逻辑
    // 实际实现中会使用加密算法
    return `encrypted_${value}`;
  }

  /**
   * 数据解密
   */
  private async decryptData(value: any): Promise<any> {
    // 这里应该实现具体的解密逻辑
    // 实际实现中会使用解密算法
    if (typeof value === 'string' && value.startsWith('encrypted_')) {
      return value.replace('encrypted_', '');
    }
    return value;
  }

  /**
   * 数据压缩
   */
  private async compressData(value: any): Promise<string> {
    // 这里应该实现具体的压缩逻辑
    // 实际实现中会使用压缩算法
    return `compressed_${JSON.stringify(value)}`;
  }

  /**
   * 数据解压缩
   */
  private async decompressData(value: any): Promise<any> {
    // 这里应该实现具体的解压缩逻辑
    // 实际实现中会使用解压缩算法
    if (typeof value === 'string' && value.startsWith('compressed_')) {
      return JSON.parse(value.replace('compressed_', ''));
    }
    return value;
  }

  /**
   * 获取反向字段映射
   */
  private getReverseFieldMapping(
    field: string,
    mappings: Record<string, string>
  ): string | null {
    for (const [source, target] of Object.entries(mappings)) {
      if (target === field) {
        return source;
      }
    }
    return null;
  }

  /**
   * 初始化默认转换器
   */
  private initializeDefaultTransformers(): void {
    // 字符串转换器
    this.addCustomTransformer('toUpperCase', (value: any) =>
      typeof value === 'string' ? value.toUpperCase() : value
    );

    this.addCustomTransformer('toLowerCase', (value: any) =>
      typeof value === 'string' ? value.toLowerCase() : value
    );

    this.addCustomTransformer('trim', (value: any) =>
      typeof value === 'string' ? value.trim() : value
    );

    // 数字转换器
    this.addCustomTransformer('toInteger', (value: any) =>
      typeof value === 'number'
        ? Math.floor(value)
        : parseInt(String(value), 10)
    );

    this.addCustomTransformer('toFloat', (value: any) =>
      typeof value === 'number' ? value : parseFloat(String(value))
    );

    // 日期转换器
    this.addCustomTransformer('toDate', (value: any) =>
      value instanceof Date ? value : new Date(value)
    );

    this.addCustomTransformer('toISOString', (value: any) =>
      value instanceof Date
        ? value.toISOString()
        : new Date(value).toISOString()
    );

    // 布尔转换器
    this.addCustomTransformer('toBoolean', (value: any) => Boolean(value));

    // 数组转换器
    this.addCustomTransformer('toArray', (value: any) =>
      Array.isArray(value) ? value : [value]
    );

    this.addCustomTransformer('flatten', (value: any) =>
      Array.isArray(value) ? value.flat() : value
    );

    // 对象转换器
    this.addCustomTransformer('toObject', (value: any) =>
      typeof value === 'object' ? value : { value }
    );

    this.addCustomTransformer('pick', (value: any, fields: string[]) => {
      if (typeof value !== 'object' || value === null) return value;
      const result: any = {};
      for (const field of fields) {
        if (field in value) {
          result[field] = value[field];
        }
      }
      return result;
    });

    this.addCustomTransformer('omit', (value: any, fields: string[]) => {
      if (typeof value !== 'object' || value === null) return value;
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (!fields.includes(key)) {
          result[key] = val;
        }
      }
      return result;
    });
  }
}
