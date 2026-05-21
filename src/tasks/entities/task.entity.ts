import { BaseEntity } from 'base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('Task')
export class Task extends BaseEntity {
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  assignToId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignToId' })
  assignTo: User;

  @Column({ type: 'text', nullable: true })
  assignToDescription: string;

  @Column({ type: 'text', nullable: true })
  assigneeComments: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ nullable: true })
  organizationId: number;
}
