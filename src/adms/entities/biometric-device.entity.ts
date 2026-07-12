import { BaseEntity } from 'base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('biometric_devices')
export class BiometricDevice extends BaseEntity {
  @Index({ unique: true })
  @Column()
  serialNumber: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  organizationId: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date;
}
