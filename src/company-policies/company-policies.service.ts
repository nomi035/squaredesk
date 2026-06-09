import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateCompanyPolicyDto } from './dto/create-company-policy.dto';
import { UpdateCompanyPolicyDto } from './dto/update-company-policy.dto';
import { CompanyPolicy } from './entities/company-policy.entity';
import { PolicyAcknowledgement } from './entities/policy-acknowledgement.entity';

@Injectable()
export class CompanyPoliciesService {
  constructor(
    @InjectRepository(CompanyPolicy)
    private readonly policyRepository: Repository<CompanyPolicy>,
    @InjectRepository(PolicyAcknowledgement)
    private readonly acknowledgementRepository: Repository<PolicyAcknowledgement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(createDto: CreateCompanyPolicyDto) {
    return this.policyRepository.save(createDto);
  }

  private async findPolicyOrFail(id: number, organizationId: number) {
    const policy = await this.policyRepository.findOne({
      where: { id, organizationId },
    });
    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }
    return policy;
  }

  private mapPolicyForUser(
    policy: CompanyPolicy,
    acknowledgement?: PolicyAcknowledgement,
  ) {
    return {
      ...policy,
      acknowledged: !!acknowledgement,
      acknowledgedAt: acknowledgement?.acknowledgedAt ?? null,
    };
  }

  async findAll(organizationId: number, userId: number) {
    const policies = await this.policyRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });

    const acknowledgements = policies.length
      ? await this.acknowledgementRepository.find({
          where: {
            userId,
            policyId: In(policies.map((policy) => policy.id)),
          },
        })
      : [];

    const acknowledgementMap = new Map(
      acknowledgements.map((item) => [item.policyId, item]),
    );

    return policies.map((policy) =>
      this.mapPolicyForUser(policy, acknowledgementMap.get(policy.id)),
    );
  }

  async findOne(id: number, organizationId: number, userId: number) {
    const policy = await this.findPolicyOrFail(id, organizationId);
    const acknowledgement = await this.acknowledgementRepository.findOne({
      where: { policyId: id, userId },
    });
    return this.mapPolicyForUser(policy, acknowledgement);
  }

  async update(
    id: number,
    organizationId: number,
    updateDto: UpdateCompanyPolicyDto,
  ) {
    await this.findPolicyOrFail(id, organizationId);
    await this.policyRepository.update(id, updateDto);
    return this.policyRepository.findOne({ where: { id } });
  }

  async remove(id: number, organizationId: number) {
    await this.findPolicyOrFail(id, organizationId);
    await this.policyRepository.delete(id);
    return { deleted: true };
  }

  async acknowledge(policyId: number, userId: number, organizationId: number) {
    await this.findPolicyOrFail(policyId, organizationId);

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new BadRequestException('User does not belong to this organization');
    }

    const existing = await this.acknowledgementRepository.findOne({
      where: { policyId, userId },
      relations: ['user', 'policy'],
    });
    if (existing) {
      return {
        alreadyAcknowledged: true,
        acknowledgement: existing,
      };
    }

    const acknowledgement = await this.acknowledgementRepository.save({
      policyId,
      userId,
      acknowledgedAt: new Date(),
    });

    return {
      alreadyAcknowledged: false,
      acknowledgement: await this.acknowledgementRepository.findOne({
        where: { id: acknowledgement.id },
        relations: ['user', 'policy'],
      }),
    };
  }

  async getAcknowledgementStatus(policyId: number, organizationId: number) {
    const policy = await this.findPolicyOrFail(policyId, organizationId);

    const users = await this.userRepository.find({
      where: { organizationId, isActive: true },
      order: { firstName: 'ASC' },
    });

    const acknowledgements = await this.acknowledgementRepository.find({
      where: { policyId },
      relations: ['user'],
    });

    const acknowledgedUserIds = new Set(
      acknowledgements.map((item) => item.userId),
    );

    const acknowledged = acknowledgements.map((item) => ({
      userId: item.userId,
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      acknowledgedAt: item.acknowledgedAt,
    }));

    const notAcknowledged = users
      .filter((user) => !acknowledgedUserIds.has(user.id))
      .map((user) => ({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }));

    return {
      policyId: policy.id,
      title: policy.title,
      totalUsers: users.length,
      acknowledgedCount: acknowledged.length,
      notAcknowledgedCount: notAcknowledged.length,
      acknowledged,
      notAcknowledged,
    };
  }
}
