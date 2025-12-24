import { BaseEntity } from "base.entity";
import { Column, Entity } from "typeorm";

@Entity('designations')
export class Designation extends BaseEntity{
@Column({nullable:false})
designation:string;

@Column({nullable:false})
description:string;

}
