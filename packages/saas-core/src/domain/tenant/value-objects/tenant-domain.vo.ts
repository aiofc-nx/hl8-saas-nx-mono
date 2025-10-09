/**
 * 租户域名值对象
 *
 * @description 封装租户域名的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 格式要求
 * - 符合域名规范
 * - 小写字母、数字、连字符、点
 * - 唯一性：全局唯一（由应用层验证）
 *
 * ### 验证规则
 * - 不能为空
 * - 必须符合域名格式
 * - 长度合理（3-253字符）
 *
 * ## 使用场景
 *
 * 租户域名用于：
 * - 租户的独立访问域名
 * - 租户的子域名标识
 * - 租户的品牌展示
 *
 * @example
 * ```typescript
 * // 创建租户域名
 * const domain = TenantDomain.create('acme.example.com');
 *
 * // 验证租户域名
 * if (TenantDomain.isValid('invalid domain')) {
 *   // 不会执行，因为包含空格
 * }
 * ```
 *
 * @class TenantDomain
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { TENANT_DOMAIN_VALIDATION } from '../../../constants/tenant.constants';

/**
 * 租户域名值对象属性
 *
 * @interface ITenantDomainProps
 */
export interface ITenantDomainProps {
  value: string;
}

/**
 * 租户域名值对象
 *
 * @class TenantDomain
 * @extends {BaseValueObject<ITenantDomainProps>}
 */
export class TenantDomain extends BaseValueObject<ITenantDomainProps> {
  /**
   * 获取租户域名原始值
   *
   * @readonly
   * @type {string}
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {ITenantDomainProps} props - 租户域名属性
   */
  private constructor(props: ITenantDomainProps) {
    super(props);
  }

  /**
   * 创建租户域名值对象
   *
   * @description 验证并创建租户域名值对象
   *
   * ## 验证流程
   * 1. 检查域名是否为空
   * 2. 转换为小写
   * 3. 检查长度是否符合要求（3-253字符）
   * 4. 检查格式是否符合域名规范
   *
   * @static
   * @param {string} domain - 租户域名
   * @returns {TenantDomain} 租户域名值对象
   * @throws {Error} 当域名不符合验证规则时抛出错误
   *
   * @example
   * ```typescript
   * const domain = TenantDomain.create('acme.example.com');
   * ```
   */
  public static create(domain: string): TenantDomain {
    // 转换为小写
    const normalizedDomain = domain?.toLowerCase().trim();
    this.validate(normalizedDomain);
    return new TenantDomain({ value: normalizedDomain });
  }

  /**
   * 验证租户域名
   *
   * @private
   * @static
   * @param {string} domain - 待验证的租户域名
   * @throws {Error} 当域名不符合验证规则时抛出错误
   */
  private static validate(domain: string): void {
    // 检查空值
    if (!domain || domain.length === 0) {
      throw new Error('租户域名不能为空');
    }

    // 检查长度
    if (domain.length < 3 || domain.length > 253) {
      throw new Error('租户域名长度必须在3-253字符之间');
    }

    // 检查格式
    if (!TENANT_DOMAIN_VALIDATION.PATTERN.test(domain)) {
      throw new Error(TENANT_DOMAIN_VALIDATION.ERROR_MESSAGE);
    }
  }

  /**
   * 检查租户域名是否有效
   *
   * @description 静态方法，用于验证租户域名而不抛出异常
   *
   * @static
   * @param {string} domain - 待验证的租户域名
   * @returns {boolean} 域名是否有效
   *
   * @example
   * ```typescript
   * if (TenantDomain.isValid('acme.example.com')) {
   *   // 域名有效
   * }
   * ```
   */
  public static isValid(domain: string): boolean {
    try {
      const normalizedDomain = domain?.toLowerCase().trim();
      this.validate(normalizedDomain);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取子域名部分
   *
   * @description 从完整域名中提取子域名部分
   *
   * @returns {string} 子域名
   *
   * @example
   * ```typescript
   * const domain = TenantDomain.create('acme.example.com');
   * const subdomain = domain.getSubdomain(); // 'acme'
   * ```
   */
  public getSubdomain(): string {
    const parts = this.value.split('.');
    return parts[0];
  }

  /**
   * 获取根域名部分
   *
   * @description 从完整域名中提取根域名部分
   *
   * @returns {string} 根域名
   *
   * @example
   * ```typescript
   * const domain = TenantDomain.create('acme.example.com');
   * const rootDomain = domain.getRootDomain(); // 'example.com'
   * ```
   */
  public getRootDomain(): string {
    const parts = this.value.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join('.');
    }
    return this.value;
  }

  /**
   * 转换为字符串
   *
   * @returns {string} 租户域名字符串
   */
  public toString(): string {
    return this.value;
  }

  /**
   * 转换为JSON
   *
   * @returns {string} 租户域名字符串
   */
  public toJSON(): string {
    return this.value;
  }
}

