import { BaseEntity } from "base.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { Entity, JoinColumn, ManyToOne } from "typeorm";
import { Column } from "typeorm/decorator/columns/Column";

@Entity('offices')
export class Office extends BaseEntity {
    @Column()
    name: string;

    @Column()
    address1: string;

    @Column({ nullable: true })
    address2: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    zip: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    extension: string;

    @Column({ nullable: true })
    organizationId: number;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;



}
