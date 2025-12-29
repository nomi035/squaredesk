import { BaseEntity } from "base.entity";
import { Column, Entity } from "typeorm";

@Entity('Organization')
export class Organization extends BaseEntity{
    @Column()
    name: string;

    @Column()
    description: string;
}
