import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Singleton row (id is always 1) holding the RMB -> MAD conversion rate.
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ default: 1 })
  id: number;

  // How many MAD one RMB is worth. Editable by Admin.
  @Column('float', { default: 1.35 })
  rmbToMadRate: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
