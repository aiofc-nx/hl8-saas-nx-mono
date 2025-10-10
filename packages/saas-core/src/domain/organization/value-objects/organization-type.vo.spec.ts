/**
 * 组织类型值对象单元测试
 *
 * @description 测试组织类型的验证逻辑和业务规则
 *
 * @since 1.0.0
 */

import { OrganizationType } from './organization-type.vo';

describe('OrganizationType', () => {
  describe('创建', () => {
    it('应该创建预定义的组织类型', () => {
      const committee = OrganizationType.professionalCommittee();
      expect(committee.value).toBe('PROFESSIONAL_COMMITTEE');

      const project = OrganizationType.projectTeam();
      expect(project.value).toBe('PROJECT_TEAM');

      const quality = OrganizationType.qualityControl();
      expect(quality.value).toBe('QUALITY_CONTROL');

      const performance = OrganizationType.performanceTeam();
      expect(performance.value).toBe('PERFORMANCE_TEAM');

      const custom = OrganizationType.custom();
      expect(custom.value).toBe('CUSTOM');
    });
  });

  describe('创建有效类型', () => {
    it('应该成功创建专业委员会类型', () => {
      const type = OrganizationType.create('PROFESSIONAL_COMMITTEE');
      expect(type).toBeDefined();
      expect(type.value).toBe('PROFESSIONAL_COMMITTEE');
    });
  });

  describe('类型信息', () => {
    it('应该获取组织类型名称', () => {
      const committee = OrganizationType.professionalCommittee();
      const name = committee.getName();

      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    it('应该获取组织类型描述', () => {
      const project = OrganizationType.projectTeam();
      const description = project.getDescription();

      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
    });

    it('应该获取默认成员限制', () => {
      const committee = OrganizationType.professionalCommittee();
      const limit = committee.getDefaultMemberLimit();

      expect(limit).toBeGreaterThan(0);
    });

    it('应该判断是否为自定义类型', () => {
      const custom = OrganizationType.custom();
      const committee = OrganizationType.professionalCommittee();

      expect(custom.isCustom()).toBe(true);
      expect(committee.isCustom()).toBe(false);
    });
  });

  describe('转换', () => {
    it('应该转换为字符串', () => {
      const type = OrganizationType.professionalCommittee();
      const str = type.toString();
      
      expect(str).toBeDefined();
      expect(typeof str).toBe('string');
    });

    it('应该转换为JSON', () => {
      const type = OrganizationType.professionalCommittee();
      const json = type.toJSON();

      expect(json).toHaveProperty('value');
      expect(json['value']).toBe('PROFESSIONAL_COMMITTEE');
    });
  });

  describe('相等性', () => {
    it('应该正确比较两个组织类型', () => {
      const type1a = OrganizationType.professionalCommittee();
      const type1b = OrganizationType.professionalCommittee();
      const type2 = OrganizationType.projectTeam();

      expect(type1a.equals(type1b)).toBe(true);
      expect(type1a.equals(type2)).toBe(false);
    });
  });
});

