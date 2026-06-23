import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A reusable uploaded image in the media library. Created whenever an image is
 * uploaded (generic image or logo) so users can browse and reuse past uploads.
 */
@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Public path served statically, e.g. /uploads/<file>. */
  @Column({ type: 'varchar', length: 512 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimetype: string | null;

  @Column({ type: 'int', default: 0 })
  size: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
