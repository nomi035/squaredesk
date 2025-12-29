import { BaseEntity } from "base.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('Department')
export class Department extends BaseEntity {
  // @Column()
  // name: string;

  @Column()
  departmentName: string;
  @Column()
  description: string;

  @Column({ nullable: true })
  organizationId: number;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

}
