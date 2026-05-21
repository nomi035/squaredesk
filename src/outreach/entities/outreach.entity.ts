import { BaseEntity } from 'base.entity';
import { Column, Entity } from 'typeorm';

@Entity('Outreach')
export class Outreach extends BaseEntity {
  @Column()
  npi: string;

  @Column()
  name: string;

  @Column({ type: 'date', nullable: true })
  enumerationDate: Date | null;

  @Column({ nullable: true })
  taxonomy: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  practicePhone: string;

  @Column({ nullable: true })
  authFirst: string;

  @Column({ nullable: true })
  authLast: string;

  @Column({ nullable: true })
  authPhone: string;

  @Column({ nullable: true })
  disposition: string;

  @Column({ type: 'text', nullable: true })
  csvComments: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: 'pending' })
  status: string;
}
