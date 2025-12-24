import { BaseEntity } from "base.entity";
import { Column, Entity } from "typeorm";

@Entity('Department')
export class Department extends BaseEntity {
  // @Column()
  // name: string;
    
    @Column()
    departmentName: string;
    @Column()
    description: string;
}
