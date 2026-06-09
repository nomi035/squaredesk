import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { CompanyPoliciesController } from './company-policies.controller';
import { CompanyPoliciesService } from './company-policies.service';
import { CompanyPolicy } from './entities/company-policy.entity';
import { PolicyAcknowledgement } from './entities/policy-acknowledgement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyPolicy, PolicyAcknowledgement, User]),
  ],
  controllers: [CompanyPoliciesController],
  providers: [CompanyPoliciesService],
})
export class CompanyPoliciesModule {}
