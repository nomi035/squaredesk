import { BaseEntity } from 'base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PolicyAcknowledgement } from './policy-acknowledgement.entity';

@Entity('CompanyPolicy')
export class CompanyPolicy extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  organizationId: number;

  @OneToMany(
    () => PolicyAcknowledgement,
    (acknowledgement) => acknowledgement.policy,
    { cascade: true },
  )
  acknowledgements: PolicyAcknowledgement[];
}
