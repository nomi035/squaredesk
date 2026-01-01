import { BaseEntity } from 'base.entity';
import { Department } from 'src/department/entities/department.entity';
import { Designation } from 'src/designation/entities/designation.entity';
import { Office } from 'src/office/entities/office.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

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
  @Column({  nullable: true })
  officeId:number
  @Column({  })
  departmentId:number
  @Column({  })
  designationId:number
  @Column({ nullable: true })
  organizationId: number;
  @ManyToOne(() => Office,{onDelete:'CASCADE'})
  @JoinColumn({ name: 'officeId' })
  office: Office;
  @ManyToOne(() => Department,{onDelete:'CASCADE'})
  @JoinColumn({ name: 'departmentId' })
  department: Department;
  @ManyToOne(() => Designation,{onDelete:'CASCADE'})
  @JoinColumn({ name: 'designationId' })
  designation: Designation;
  @ManyToOne(() => Organization,{onDelete:'CASCADE'})
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;


}

export enum Role {
  MANAGER = 'manager',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}
