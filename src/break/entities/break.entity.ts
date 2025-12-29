import { BaseEntity } from "base.entity";
import { Attendance } from "src/attendance/entities/attendance.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('breaks')
export class Break extends BaseEntity {
    @Column()
    startTime: string;

    @Column()
    endTime: string;
    
    @Column({
        nullable: true
    })
    duration:string

   

    @ManyToOne(() => Attendance, attendance => attendance.breaks,)
    @JoinColumn({ name: 'attendanceId' })
    attendance: Attendance;
}
