import { BaseEntity } from 'base.entity';
import { Column, Entity } from 'typeorm';

@Entity('User')
export class User extends BaseEntity {
  @Column()
  firstName: string;
  @Column()
  lastName: string;
  @Column({ })
  password: string;
  @Column()
  email: string;
  @Column()
  phone: string;
  @Column({ nullable: true })
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
  office:string
  @Column({ nullable: true })
  department:string
  @Column({ nullable: true })
  designation:string
  @Column({ nullable: true })
  employmentType:string
  @Column({ nullable: true })
  ptoDays:number
  @Column({ nullable: true })
  emergencyName:string
  @Column({ nullable: true })
  emergencyPhone:string
  @Column({ nullable: true })
  emergencyRelation:string
  @Column({nullable:true})
  role: Role;
}

export enum Role {
  MANAGER = 'manager',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}
