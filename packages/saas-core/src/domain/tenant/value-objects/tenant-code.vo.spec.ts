/**
 * 租户代码值对象测试
 * 
 * @description 测试租户代码值对象的创建、验证和比较逻辑
 * 验证统一社会信用代码（USCI）格式的18位租户代码功能
 * 
 * @since 1.0.0
 */

import { TenantCode, InvalidTenantCodeException } from './tenant-code.vo';

describe('TenantCode', () => {
  describe('构造函数', () => {
    it('should create TenantCode with valid format', () => {
      // Arrange
      const validCode = '91110000123456789T';

      // Act
      const tenantCode = new TenantCode(validCode);

      // Assert
      expect(tenantCode.value).toBe(validCode);
    });

    it('should throw exception for empty value', () => {
      // Act & Assert
      expect(() => new TenantCode('')).toThrow(InvalidTenantCodeException);
    });

    it('should throw exception for invalid length', () => {
      // Act & Assert
      expect(() => new TenantCode('123')).toThrow(InvalidTenantCodeException);
      expect(() => new TenantCode('123456789012345678901')).toThrow(InvalidTenantCodeException);
    });

    it('should throw exception for invalid characters', () => {
      // Act & Assert
      expect(() => new TenantCode('91110000123456789a')).toThrow(InvalidTenantCodeException); // 小写字母
      expect(() => new TenantCode('91110000123456789@')).toThrow(InvalidTenantCodeException); // 特殊字符
      expect(() => new TenantCode('91110000123456789 ')).toThrow(InvalidTenantCodeException); // 空格
    });

    it('should throw exception for invalid check code', () => {
      // Act & Assert
      expect(() => new TenantCode('91110000123456789X')).toThrow(InvalidTenantCodeException);
    });
  });

  describe('generate', () => {
    it('should generate valid TenantCode', () => {
      // Act
      const tenantCode = TenantCode.generate();

      // Assert
      expect(tenantCode).toBeInstanceOf(TenantCode);
      expect(tenantCode.value).toMatch(/^[0-9A-Z]{18}$/);
    });

    it('should generate unique TenantCodes', () => {
      // Act
      const tenantCode1 = TenantCode.generate();
      const tenantCode2 = TenantCode.generate();

      // Assert
      expect(tenantCode1.value).not.toBe(tenantCode2.value);
    });

    it('should generate valid check code', () => {
      // Act
      const tenantCode = TenantCode.generate();

      // Assert
      expect(TenantCode.isValid(tenantCode.value)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create TenantCode from valid string', () => {
      // Arrange
      const validCode = '91110000123456789T';

      // Act
      const tenantCode = TenantCode.create(validCode);

      // Assert
      expect(tenantCode.value).toBe(validCode);
    });

    it('should throw exception for invalid string', () => {
      // Act & Assert
      expect(() => TenantCode.create('invalid-code')).toThrow(InvalidTenantCodeException);
    });
  });

  describe('getters', () => {
    let tenantCode: TenantCode;

    beforeEach(() => {
      tenantCode = TenantCode.create('91110000123456789T');
    });

    it('should return correct department code', () => {
      expect(tenantCode.departmentCode).toBe('9');
    });

    it('should return correct category code', () => {
      expect(tenantCode.categoryCode).toBe('1');
    });

    it('should return correct region code', () => {
      expect(tenantCode.regionCode).toBe('110000');
    });

    it('should return correct subject code', () => {
      expect(tenantCode.subjectCode).toBe('123456789');
    });

    it('should return correct check code', () => {
      expect(tenantCode.checkCode).toBe('T');
    });
  });

  describe('equals', () => {
    it('should return true for equal TenantCodes', () => {
      // Arrange
      const tenantCode1 = TenantCode.create('91110000123456789T');
      const tenantCode2 = TenantCode.create('91110000123456789T');

      // Act & Assert
      expect(tenantCode1.equals(tenantCode2)).toBe(true);
    });

    it('should return false for different TenantCodes', () => {
      // Arrange
      const tenantCode1 = TenantCode.create('91110000123456789T');
      const tenantCode2 = TenantCode.create('12345678901234567B');

      // Act & Assert
      expect(tenantCode1.equals(tenantCode2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const tenantCode = TenantCode.create('91110000123456789T');

      // Act & Assert
      expect(tenantCode.toString()).toBe('91110000123456789T');
    });
  });

  describe('isValid', () => {
    it('should return true for valid codes', () => {
      const validCodes = [
        '91110000123456789T',
        '12345678901234567B',
        'ABCDEFGHIJKLMNOPQU',
        '123456789ABCDEFGHX'
      ];

      validCodes.forEach(code => {
        expect(TenantCode.isValid(code)).toBe(true);
      });
    });

    it('should return false for invalid codes', () => {
      const invalidCodes = [
        '', // 空字符串
        '123', // 太短
        '123456789012345678901', // 太长
        '91110000123456789a', // 小写字母
        '91110000123456789@', // 特殊字符
        '91110000123456789 ', // 空格
        '91110000123456789X' // 无效校验码
      ];

      invalidCodes.forEach(code => {
        expect(TenantCode.isValid(code)).toBe(false);
      });
    });
  });

  describe('valid format examples', () => {
    const validCodes = [
      '91110000123456789T',
      '12345678901234567B',
      'ABCDEFGHIJKLMNOPQU',
      '123456789ABCDEFGHX',
      '98765432109876543R'
    ];

    validCodes.forEach(code => {
      it(`should accept valid code: ${code}`, () => {
        // Act & Assert
        expect(() => TenantCode.create(code)).not.toThrow();
        const tenantCode = TenantCode.create(code);
        expect(tenantCode.value).toBe(code);
      });
    });
  });

  describe('invalid format examples', () => {
    const invalidCodes = [
      '', // 空字符串
      '123', // 太短
      '123456789012345678901', // 太长
      '91110000123456789a', // 小写字母
      '91110000123456789@', // 特殊字符
      '91110000123456789 ', // 空格
      '91110000123456789.', // 点号
      '91110000123456789/', // 斜杠
      '91110000123456789+', // 加号
      '91110000123456789#', // #符号
      '91110000123456789%', // %符号
    ];

    invalidCodes.forEach(code => {
      it(`should reject invalid code: "${code}"`, () => {
        // Act & Assert
        expect(() => TenantCode.create(code)).toThrow(InvalidTenantCodeException);
      });
    });
  });

  describe('check code validation', () => {
    it('should validate check code correctly', () => {
      // Arrange
      const validCode = '91110000123456789T';
      const invalidCheckCode = '91110000123456789X';

      // Act & Assert
      expect(TenantCode.isValid(validCode)).toBe(true);
      expect(TenantCode.isValid(invalidCheckCode)).toBe(false);
    });

    it('should calculate check code correctly', () => {
      // Arrange
      const first17 = '91110000123456789';
      const expectedCheckCode = 'T';

      // Act
      const tenantCode = TenantCode.create(first17 + expectedCheckCode);

      // Assert
      expect(tenantCode.checkCode).toBe(expectedCheckCode);
    });
  });

  describe('code structure', () => {
    it('should have correct structure', () => {
      // Arrange
      const tenantCode = TenantCode.create('91110000123456789T');

      // Act & Assert
      expect(tenantCode.departmentCode).toBe('9'); // 第1位
      expect(tenantCode.categoryCode).toBe('1'); // 第2位
      expect(tenantCode.regionCode).toBe('110000'); // 第3-8位
      expect(tenantCode.subjectCode).toBe('123456789'); // 第9-17位
      expect(tenantCode.checkCode).toBe('T'); // 第18位
    });
  });

  describe('performance', () => {
    it('should generate codes efficiently', () => {
      // Act
      const startTime = Date.now();
      const codes = [];
      for (let i = 0; i < 1000; i++) {
        codes.push(TenantCode.generate());
      }
      const endTime = Date.now();

      // Assert
      expect(codes).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
      
      // 验证所有代码都是唯一的
      const uniqueCodes = new Set(codes.map(code => code.value));
      expect(uniqueCodes.size).toBe(1000);
    });
  });
});
