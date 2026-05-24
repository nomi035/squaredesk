import { BaseEntity } from 'base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

export enum PermissionName {
  DASHBOARD = 'dashboard',
  CALENDAR = 'calendar',
  ATTENDANCE = 'attendance',
  ATTENDANCE_MY = 'attendance_my',
  ATTENDANCE_SUBORDINATE = 'attendance_subordinate',
  EMPLOYEES = 'employees',
  TASKS = 'tasks',
  OUTREACH = 'outreach',
  PTO = 'pto',
  PTO_APPLIED = 'pto_applied',
  PTO_RECEIVED = 'pto_received',
  PAYROLLS = 'payrolls',
  SHIFT = 'shift',
  SETTINGS = 'settings',
}

@Entity('Permission')
@Unique(['userId', 'permissionName'])
export class Permission extends BaseEntity {
  @Column({ type: 'enum', enum: PermissionName })
  permissionName: PermissionName;

  @Column({ default: false })
  allowed: boolean;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
