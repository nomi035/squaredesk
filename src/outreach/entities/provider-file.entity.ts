import { BaseEntity } from 'base.entity';
import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Outreach } from './outreach.entity';

@Entity('ProviderFile')
export class ProviderFile extends BaseEntity {
  @Column()
  fileName: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ nullable: true })
  uploadedById: number;

  @Column({ nullable: true })
  organizationId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: number;

  @OneToMany(() => Outreach, (outreach) => outreach.providerFile, { cascade: true })
  outreachRecords: Outreach[];
}
