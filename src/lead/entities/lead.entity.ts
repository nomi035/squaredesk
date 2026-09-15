import { BaseEntity } from 'base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity('Lead')
export class Lead extends BaseEntity {
  @Column({ nullable: true })
  outreachId: number; // Storing reference just in case

  @Column({ nullable: true })
  npi: string;

  @Column({ nullable: true })
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
  email: string;

  @Column({ nullable: true })
  disposition: string;

  @Column({ type: 'text', nullable: true })
  csvComments: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  organizationId: number;

  @Column({ type: 'jsonb', nullable: true })
  additionalData: Record<string, any>;

  // User who claimed the lead
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
