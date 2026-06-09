import { BaseEntity } from 'base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CompanyPolicy } from './company-policy.entity';

@Entity('PolicyAcknowledgement')
@Unique(['policyId', 'userId'])
export class PolicyAcknowledgement extends BaseEntity {
  @Column()
  policyId: number;

  @Column()
  userId: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  acknowledgedAt: Date;

  @ManyToOne(() => CompanyPolicy, (policy) => policy.acknowledgements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policyId' })
  policy: CompanyPolicy;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
