import { BaseEntity } from "base.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
@Entity('assignments')
export class Assignment extends BaseEntity
{
    @Column()
    name: string;

    @Column()
    colour: string;

      @Column({ nullable: true })
      organizationId: number;
    
      @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
      @JoinColumn({ name: 'organizationId' })
      organization: Organization;
}
