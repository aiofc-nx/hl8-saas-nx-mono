/**
 * 组织聚合根
 *
 * @class OrganizationAggregate
 * @since 1.0.0
 */

import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationType } from '../value-objects/organization-type.vo';

export class OrganizationAggregate extends TenantAwareAggregateRoot {
  private _members: OrganizationMember[] = [];

  constructor(
    id: EntityId,
    private _organization: Organization,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static create(
    id: EntityId,
    code: string,
    name: string,
    type: OrganizationType,
    auditInfo: IPartialAuditInfo,
  ): OrganizationAggregate {
    const organization = Organization.create(id, code, name, type, auditInfo);
    return new OrganizationAggregate(id, organization, auditInfo);
  }

  public getOrganization(): Organization {
    return this._organization;
  }

  public getMembers(): OrganizationMember[] {
    return [...this._members];
  }

  public addMember(userId: EntityId, updatedBy: string): void {
    this.ensureTenantContext();

    const member = OrganizationMember.create(
      EntityId.generate(),
      this.id,
      userId,
      { createdBy: updatedBy },
    );

    this._members.push(member);
    this.logTenantOperation('组织成员已添加', { userId: userId.toString() });
  }

  public removeMember(userId: EntityId, updatedBy: string): void {
    const member = this._members.find(m => m.getUserId().equals(userId));
    if (member) {
      member.leave(updatedBy);
    }
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      organization: this._organization.toObject(),
      membersCount: this._members.length,
    };
  }
}

