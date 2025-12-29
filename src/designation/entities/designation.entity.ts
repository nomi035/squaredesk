import { BaseEntity } from "base.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('designations')
export class Designation extends BaseEntity {
    @Column({ nullable: false })
    designation: string;

    @Column({ nullable: false })
    description: string;

    @Column({ nullable: true })
    organizationId: number;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

}
