import { BaseEntity } from "base.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity('shifts')
export class Shift extends BaseEntity {
    @Column({ nullable: true })
    name: string;

    @Column()
    endTime: string;

    @Column()
    startTime: string;

    @OneToMany(() => User, (user) => user.shift)
    users: User[];

    @Column({ nullable: true })
    organizationId: number;

    @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;
}
