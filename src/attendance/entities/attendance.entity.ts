import { BaseEntity } from "base.entity";
import { Break } from "src/break/entities/break.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity('attendances')
export class Attendance extends BaseEntity {
    @Column({ nullable: true })
    checkinDate: Date;

    @Column({ nullable: true })
    checkinTime: string;

    @Column({ nullable: true })
    checkoutDate: Date;

    @Column({ nullable: true })
    checkoutTime: string;

    @Column()
    employeeId: number;

    @Column({ nullable: true })
    duration:number

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User;

    @OneToMany(() => Break, (breakEntity) => breakEntity.attendance, { cascade: true })
    breaks: Break[];


}
