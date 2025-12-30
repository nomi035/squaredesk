import { BaseEntity } from "base.entity";
import { User } from "src/user/entities/user.entity";
import {  Column, Entity, JoinColumn, ManyToOne } from "typeorm";


export enum PtoStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('ptos')
export class Pto extends  BaseEntity{
    @Column({ nullable: true })
    employeeId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: User

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true, default: PtoStatus.PENDING })
    status: PtoStatus;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ nullable: true })
    reason: string;

    @Column({ nullable: true })
    startTime: string;
    
    @Column({ nullable: true })
    endTime: string;

    @Column({ nullable: true })
    ptoType: string;
}

