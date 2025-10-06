/**
 * ID生成端口适配器
 *
 * 实现应用层ID生成端口接口，提供统一的ID生成能力。
 * 作为通用功能组件，支持多种ID生成策略。
 *
 * @description ID生成端口适配器实现应用层ID生成需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '../../../domain/value-objects/entity-id';
import { IIdGeneratorPort } from '../../../application/ports/shared/shared-ports.interface';

/**
 * ID生成策略枚举
 */
export enum IdGenerationStrategy {
  /** UUID策略 */
  UUID = 'uuid',
  /** 雪花算法策略 */
  SNOWFLAKE = 'snowflake',
  /** 自增ID策略 */
  AUTO_INCREMENT = 'auto_increment',
  /** 自定义策略 */
  CUSTOM = 'custom',
}

/**
 * ID生成配置接口
 */
export interface IIdGeneratorConfig {
  /** ID生成策略 */
  strategy: IdGenerationStrategy;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 自定义配置 */
  customConfig?: Record<string, unknown>;
}

/**
 * ID生成端口适配器
 *
 * 实现应用层ID生成端口接口
 */
@Injectable()
export class IdGeneratorPortAdapter implements IIdGeneratorPort {
  private readonly config: IIdGeneratorConfig;

  constructor(
    config: IIdGeneratorConfig = { strategy: IdGenerationStrategy.UUID }
  ) {
    this.config = config;
  }

  /**
   * 生成唯一ID
   *
   * @returns 生成的唯一ID
   */
  generate(): EntityId {
    switch (this.config.strategy) {
      case IdGenerationStrategy.UUID:
        return this.generateUUID();
      case IdGenerationStrategy.SNOWFLAKE:
        return this.generateSnowflake();
      case IdGenerationStrategy.AUTO_INCREMENT:
        return this.generateAutoIncrement();
      case IdGenerationStrategy.CUSTOM:
        return this.generateCustom();
      default:
        return this.generateUUID();
    }
  }

  /**
   * 生成实体ID
   *
   * @returns 实体ID实例
   */
  generateEntityId(): EntityId {
    return EntityId.generate();
  }

  /**
   * 生成批量ID
   *
   * @param count - 生成数量
   * @returns ID数组
   */
  generateBatch(count: number): EntityId[] {
    const ids: EntityId[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate());
    }
    return ids;
  }

  /**
   * 生成UUID
   *
   * @returns UUID字符串
   */
  generateUuid(): string {
    return this.generateUUID().toString();
  }

  /**
   * 生成数字ID
   *
   * @returns 数字ID
   */
  generateNumericId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * 生成短ID
   *
   * @returns 短ID字符串
   */
  generateShortId(): string {
    return this.generateAutoIncrement().toString();
  }

  /**
   * 验证ID是否有效
   *
   * @param id - 要验证的ID
   * @returns 是否有效
   */
  isValidId(id: string): boolean {
    return Boolean(id && id.length > 0);
  }

  /**
   * 验证ID格式
   *
   * @param id - 要验证的ID
   * @returns 是否有效
   */
  validate(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    switch (this.config.strategy) {
      case IdGenerationStrategy.UUID:
        return this.validateUUID(id);
      case IdGenerationStrategy.SNOWFLAKE:
        return this.validateSnowflake(id);
      case IdGenerationStrategy.AUTO_INCREMENT:
        return this.validateAutoIncrement(id);
      case IdGenerationStrategy.CUSTOM:
        return this.validateCustom(id);
      default:
        return this.validateUUID(id);
    }
  }

  /**
   * 获取ID生成策略
   *
   * @returns 当前策略
   */
  getStrategy(): IdGenerationStrategy {
    return this.config.strategy;
  }

  /**
   * 设置ID生成策略
   *
   * @param strategy - 新策略
   */
  setStrategy(strategy: IdGenerationStrategy): void {
    (this.config as { strategy?: IdGenerationStrategy }).strategy = strategy;
  }

  // ==================== 私有方法 ====================

  /**
   * 生成UUID
   */
  private generateUUID(): EntityId {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );

    return EntityId.fromString(this.formatId(uuid));
  }

  /**
   * 生成雪花算法ID
   */
  private generateSnowflake(): EntityId {
    // 简化的雪花算法实现
    const timestamp = Date.now();
    const machineId = Math.floor(Math.random() * 1024);
    const sequence = Math.floor(Math.random() * 4096);

    const snowflakeId = (timestamp << 22) | (machineId << 12) | sequence;
    return EntityId.fromString(this.formatId(snowflakeId.toString()));
  }

  /**
   * 生成自增ID
   */
  private generateAutoIncrement(): EntityId {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return EntityId.fromString(this.formatId(`${timestamp}${random}`));
  }

  /**
   * 生成自定义ID
   */
  private generateCustom(): EntityId {
    // 使用自定义配置生成ID
    const customConfig = this.config.customConfig || {};
    const prefix = (customConfig as { prefix?: string }).prefix || '';
    const suffix = (customConfig as { suffix?: string }).suffix || '';
    const baseId = this.generateUUID();

    return EntityId.fromString(`${prefix}${baseId}${suffix}`);
  }

  /**
   * 格式化ID
   */
  private formatId(id: string): string {
    let formattedId = id;

    if (this.config.prefix) {
      formattedId = `${this.config.prefix}${formattedId}`;
    }

    if (this.config.suffix) {
      formattedId = `${formattedId}${this.config.suffix}`;
    }

    return formattedId;
  }

  /**
   * 验证UUID格式
   */
  private validateUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * 验证雪花算法ID格式
   */
  private validateSnowflake(id: string): boolean {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
  }

  /**
   * 验证自增ID格式
   */
  private validateAutoIncrement(id: string): boolean {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
  }

  /**
   * 验证自定义ID格式
   */
  private validateCustom(id: string): boolean {
    // 自定义验证逻辑
    return Boolean(id && id.length > 0);
  }
}
