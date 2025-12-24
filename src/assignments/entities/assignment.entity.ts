import { BaseEntity } from "base.entity";
import { Column, Entity } from "typeorm";
@Entity('assignments')
export class Assignment extends BaseEntity
{
    @Column()
    name: string;

    @Column()
    colour: string;
}
