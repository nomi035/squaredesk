import { BaseEntity } from 'base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { OutreachComment } from './outreach-comment.entity';

import { ProviderFile } from './provider-file.entity';

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
  email: string;

  @Column({ nullable: true })
  disposition: string;

  @Column({ type: 'timestamptz', nullable: true })
  dispositionUpdatedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  csvComments: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  organizationId: number;

  @ManyToOne(() => ProviderFile, (file) => file.outreachRecords, { onDelete: 'CASCADE' })
  providerFile: ProviderFile;

  @Column({ nullable: true })
  providerFileId: number;

  @Column({ type: 'jsonb', nullable: true })
  additionalData: Record<string, any>;

  @OneToMany(() => OutreachComment, (comment) => comment.outreach, {
    cascade: true,
  })
  comments: OutreachComment[];
}
