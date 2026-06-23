import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LocalizedText } from '../common/types';
import { Site } from './site.entity';
import { Section } from './section.entity';

/**
 * A navigable page. One page per site is flagged `isHome`. Sections live on a
 * page and are ordered; a page's nav order is controlled by `order`.
 */
@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Site, (site) => site.pages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @Column()
  siteId: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  title: LocalizedText;

  @Column({ length: 120 })
  slug: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  showInNav: boolean;

  @Column({ type: 'boolean', default: false })
  isHome: boolean;

  @OneToMany(() => Section, (section) => section.page, { cascade: true })
  sections: Section[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
