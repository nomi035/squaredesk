import { BaseEntity } from 'base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('UserDocument')
export class UserDocument extends BaseEntity {
  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
