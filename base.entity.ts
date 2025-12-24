import {
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    CreateDateColumn,
  } from 'typeorm';

  export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @UpdateDateColumn({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
  }
