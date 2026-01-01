import { BaseEntity } from "base.entity";
import { Assignment } from "src/assignments/entities/assignment.entity";
import { Office } from "src/office/entities/office.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
@Entity('shifts')
export class Shift extends BaseEntity {
    @Column()
    startDate: Date;
    @Column()
    startTime:string;
    @Column()
    endTime:string;
    @Column()
    endDate:Date;
    @Column()
    employeeId:number;
    @ManyToOne(() => User, {onDelete:'CASCADE'})
    @JoinColumn({name:'employeeId'})
    employee: User;
     @Column()
    officeId:number;
    @ManyToOne(() => Office, {onDelete:'CASCADE'})
    @JoinColumn({name:'officeId'})
    office: Office;
    @Column()
    assignmentId:number;
     @ManyToOne(() => Assignment, {onDelete:'CASCADE'})
    @JoinColumn({name:'assignmentId'})
    assignment: Assignment;
   @Column({ nullable: true })
   providerId:number
    @ManyToOne(() => User, {onDelete:'CASCADE'})
    @JoinColumn({name:'providerId'})
    provider: User;

}
