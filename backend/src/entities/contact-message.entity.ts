import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Site } from './site.entity';

/** A message submitted through a site's Contact section. */
@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Site, (site) => site.contactMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column()
  siteId: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
