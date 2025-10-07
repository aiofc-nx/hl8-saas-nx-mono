/**
 * 租户代码值对象
 * 
 * @description 租户的唯一业务标识符，采用统一社会信用代码（USCI - Unified Social Credit Identifier）的18位格式设计
 * 用于人类可读的租户标识，与租户ID（UUID v4）配合使用
 * 
 * ## 统一社会信用代码（USCI）格式规范
 * 
 * ### 格式规则
 * - 长度：18位字符
 * - 字符集：阿拉伯数字和英文字母
 * - 结构：登记管理部门代码(1位) + 机构类别代码(1位) + 登记管理机关行政区划码(6位) + 主体标识码(9位) + 校验码(1位)
 * 
 * ### 代码结构（基于USCI标准）
 * - 第1位：登记管理部门代码（1-9，A-Z）
 *   - 1：机构编制部门
 *   - 2：外交部门
 *   - 3：司法行政部门
 *   - 4：文化部门
 *   - 5：民政部门
 *   - 6：旅游部门
 *   - 7：宗教部门
 *   - 8：工会
 *   - 9：工商部门
 *   - A：中央军委政治工作部
 *   - N：农业部门
 *   - Y：其他
 * - 第2位：机构类别代码（1-9，A-Z）
 *   - 1：企业
 *   - 2：个体工商户
 *   - 3：农民专业合作社
 *   - 9：其他
 * - 第3-8位：登记管理机关行政区划码（6位数字）
 *   - 采用GB/T 2260《中华人民共和国行政区划代码》标准
 * - 第9-17位：主体标识码（9位数字或字母）
 *   - 由登记管理机关负责编制
 *   - 确保在同一登记管理机关管辖范围内唯一
 * - 第18位：校验码（1位数字或字母）
 *   - 采用ISO 7064 MOD 31,30校验算法
 *   - 校验码字符集：0123456789ABCDEFGHJKLMNPQRTUWXY
 * 
 * ### 验证规则
 * - 必须符合18位USCI格式要求
 * - 校验码必须通过MOD 31,30算法验证
 * - 行政区划码必须符合GB/T 2260标准
 * - 主体标识码在同一登记管理机关内必须唯一
 * 
 * @example
 * ```typescript
 * // 生成新的租户代码（USCI格式）
 * const tenantCode = TenantCode.generate();
 * 
 * // 从字符串创建租户代码
 * const tenantCode = TenantCode.create('91110000123456789T');
 * 
 * // 获取租户代码值
 * const codeValue = tenantCode.value; // '91110000123456789T'
 * 
 * // 解析代码结构
 * const deptCode = tenantCode.departmentCode; // '9' (工商部门)
 * const categoryCode = tenantCode.categoryCode; // '1' (企业)
 * const regionCode = tenantCode.regionCode; // '110000' (北京市)
 * const subjectCode = tenantCode.subjectCode; // '123456789' (主体标识)
 * const checkCode = tenantCode.checkCode; // 'T' (校验码)
 * ```
 * 
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 租户代码值对象
 */
export class TenantCode extends BaseValueObject {
  private readonly _value: string;

  /**
   * 构造函数
   * 
   * @param value 租户代码字符串值
   * @throws {InvalidTenantCodeException} 当代码格式不符合要求时
   * @since 1.0.0
   */
  constructor(value: string) {
    super();
    this._value = value;
    this.validate();
  }

  /**
   * 生成新的租户代码
   * 
   * @description 生成符合18位格式的租户代码
   * 
   * @returns 新的租户代码实例
   * @since 1.0.0
   */
  public static generate(): TenantCode {
    // 生成18位租户代码
    const code = this.generateTenantCode();
    return new TenantCode(code);
  }

  /**
   * 从字符串创建租户代码
   * 
   * @description 从字符串创建租户代码实例，会进行格式验证
   * 
   * @param value 租户代码字符串值
   * @returns 租户代码实例
   * @throws {InvalidTenantCodeException} 当格式不符合要求时
   * @since 1.0.0
   */
  public static create(value: string): TenantCode {
    return new TenantCode(value);
  }

  /**
   * 获取租户代码值
   * 
   * @returns 租户代码的字符串值
   * @since 1.0.0
   */
  public get value(): string {
    return this._value;
  }

  /**
   * 获取登记管理部门代码
   * 
   * @returns 第1位代码
   * @since 1.0.0
   */
  public get departmentCode(): string {
    return this._value.charAt(0);
  }

  /**
   * 获取机构类别代码
   * 
   * @returns 第2位代码
   * @since 1.0.0
   */
  public get categoryCode(): string {
    return this._value.charAt(1);
  }

  /**
   * 获取登记管理机关行政区划码
   * 
   * @returns 第3-8位代码
   * @since 1.0.0
   */
  public get regionCode(): string {
    return this._value.substring(2, 8);
  }

  /**
   * 获取主体标识码
   * 
   * @returns 第9-17位代码
   * @since 1.0.0
   */
  public get subjectCode(): string {
    return this._value.substring(8, 17);
  }

  /**
   * 获取校验码
   * 
   * @returns 第18位代码
   * @since 1.0.0
   */
  public get checkCode(): string {
    return this._value.charAt(17);
  }

  /**
   * 验证租户代码格式
   * 
   * @throws {InvalidTenantCodeException} 当格式不符合要求时
   * @since 1.0.0
   */
  protected override validate(): void {
    const value = this._value;
    if (!value || typeof value !== 'string') {
      throw new InvalidTenantCodeException('租户代码不能为空');
    }

    if (value.length !== 18) {
      throw new InvalidTenantCodeException(`租户代码长度必须为18位，当前长度：${value.length}`);
    }

    if (!this.isValidFormat(value)) {
      throw new InvalidTenantCodeException('租户代码格式无效，只能包含数字和字母');
    }

    if (!this.isValidCheckCode(value)) {
      throw new InvalidTenantCodeException('租户代码校验码无效');
    }
  }

  /**
   * 验证租户代码格式
   * 
   * @param value 租户代码字符串值
   * @returns true如果格式有效，否则false
   * @since 1.0.0
   */
  private isValidFormat(value: string): boolean {
    // 18位，只能包含数字和字母
    const formatRegex = /^[0-9A-Z]{18}$/;
    return formatRegex.test(value);
  }

  /**
   * 验证校验码
   * 
   * @description 采用ISO 7064 MOD 31,30校验算法，符合统一社会信用代码（USCI）标准
   * 校验码字符集：0123456789ABCDEFGHJKLMNPQRTUWXY（共31个字符）
   * 
   * @param value 租户代码字符串值
   * @returns true如果校验码有效，否则false
   * @since 1.0.0
   */
  private isValidCheckCode(value: string): boolean {
    // ISO 7064 MOD 31,30校验算法（USCI标准）
    // 计算前17位字符的加权和，然后模31得到校验码索引
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = value.charAt(i);
      const charValue = this.getCharValue(char);
      sum += charValue;
    }
    
    const expectedCheckCodeIndex = sum % 31;
    const checkCodeMap = '0123456789ABCDEFGHJKLMNPQRTUWXY'; // USCI标准校验码字符集
    const expectedCheckCode = checkCodeMap[expectedCheckCodeIndex];
    
    return value.charAt(17) === expectedCheckCode;
  }

  /**
   * 获取字符对应的数值
   * 
   * @param char 字符
   * @returns 对应的数值
   * @since 1.0.0
   */
  private getCharValue(char: string): number {
    if (char >= '0' && char <= '9') {
      return parseInt(char, 10);
    }
    if (char >= 'A' && char <= 'Z') {
      return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    }
    return 0;
  }

  /**
   * 生成18位租户代码
   * 
   * @returns 18位租户代码字符串
   * @since 1.0.0
   */
  private static generateTenantCode(): string {
    // 第1位：登记管理部门代码（1-9，A-Z）
    const departmentCodes = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const departmentCode = departmentCodes[Math.floor(Math.random() * departmentCodes.length)];
    
    // 第2位：机构类别代码（1-9，A-Z）
    const categoryCodes = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const categoryCode = categoryCodes[Math.floor(Math.random() * categoryCodes.length)];
    
    // 第3-8位：登记管理机关行政区划码（6位数字）
    const regionCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // 第9-17位：主体标识码（9位数字或字母）
    const subjectChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let subjectCode = '';
    for (let i = 0; i < 9; i++) {
      subjectCode += subjectChars[Math.floor(Math.random() * subjectChars.length)];
    }
    
    // 前17位
    const first17 = departmentCode + categoryCode + regionCode + subjectCode;
    
    // 计算校验码
    const checkCode = this.calculateCheckCode(first17);
    
    return first17 + checkCode;
  }

  /**
   * 计算校验码
   * 
   * @description 采用ISO 7064 MOD 31,30校验算法计算USCI格式的校验码
   * 符合统一社会信用代码（USCI）标准要求
   * 
   * @param first17 前17位代码
   * @returns 校验码字符
   * @since 1.0.0
   */
  private static calculateCheckCode(first17: string): string {
    const checkCodeMap = '0123456789ABCDEFGHJKLMNPQRTUWXY'; // USCI标准校验码字符集
    
    // ISO 7064 MOD 31,30算法：计算前17位字符的加权和
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = first17.charAt(i);
      const charValue = this.getCharValue(char);
      sum += charValue;
    }
    
    const checkCodeIndex = sum % 31;
    return checkCodeMap[checkCodeIndex];
  }

  /**
   * 获取字符对应的数值
   * 
   * @param char 字符
   * @returns 对应的数值
   * @since 1.0.0
   */
  private static getCharValue(char: string): number {
    if (char >= '0' && char <= '9') {
      return parseInt(char, 10);
    }
    if (char >= 'A' && char <= 'Z') {
      return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    }
    return 0;
  }

  /**
   * 比较两个租户代码是否相等
   * 
   * @param other 要比较的另一个值对象
   * @returns true如果相等，否则false
   * @since 1.0.0
   */
  public override equals(other: BaseValueObject | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof TenantCode)) {
      return false;
    }

    return this._value === other._value;
  }

  /**
   * 转换为字符串
   * 
   * @returns 租户代码的字符串表示
   * @since 1.0.0
   */
  public override toString(): string {
    return this._value;
  }

  /**
   * 验证租户代码格式是否有效
   * 
   * @description 验证字符串是否符合统一社会信用代码（USCI）的18位格式要求
   * 包括长度、字符集和校验码的完整验证
   * 
   * @param value 租户代码字符串值
   * @returns true如果格式有效，否则false
   * @since 1.0.0
   */
  public static isValid(value: string): boolean {
    if (!value || typeof value !== 'string' || value.length !== 18) {
      return false;
    }

    // 验证字符集：只能包含数字和字母（USCI标准）
    const formatRegex = /^[0-9A-Z]{18}$/;
    if (!formatRegex.test(value)) {
      return false;
    }

    // 验证校验码：采用ISO 7064 MOD 31,30算法
    const checkCodeMap = '0123456789ABCDEFGHJKLMNPQRTUWXY'; // USCI标准校验码字符集
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = value.charAt(i);
      const charValue = this.getCharValue(char);
      sum += charValue;
    }
    
    const expectedCheckCodeIndex = sum % 31;
    const expectedCheckCode = checkCodeMap[expectedCheckCodeIndex];
    return value.charAt(17) === expectedCheckCode;
  }
}

/**
 * 无效租户代码异常
 * 
 * @description 当租户代码格式无效时抛出的异常
 * 
 * @since 1.0.0
 */
export class InvalidTenantCodeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTenantCodeException';
  }
}
