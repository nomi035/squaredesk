import { BaseEntity } from 'base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('device_punch_logs')
@Index(['deviceSn', 'devicePin', 'punchTime'], { unique: true })
export class DevicePunchLog extends BaseEntity {
  @Column()
  deviceSn: string;

  @Column()
  devicePin: string;

  @Column()
  punchTime: string;

  @Column({ type: 'smallint', nullable: true })
  status: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  attendanceId: number;

  @Column({ default: 'processed' })
  result: string;
}
