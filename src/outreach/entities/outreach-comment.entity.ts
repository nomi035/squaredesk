import { BaseEntity } from 'base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Outreach } from './outreach.entity';

@Entity('OutreachComment')
export class OutreachComment extends BaseEntity {
  @Column({ type: 'text' })
  comment: string;

  @Column()
  outreachId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Outreach, (outreach) => outreach.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outreachId' })
  outreach: Outreach;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  commentedBy: User;
}
