import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SectionType } from '../common/enums';
import type { LocalizedText } from '../common/types';
import type { SectionContent, SectionSettings } from '../common/section-content';
import { Page } from './page.entity';

/**
 * A content block on a page. `type` selects the renderer; `content` holds the
 * type-specific (bilingual) payload validated per type at the service layer.
 */
@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Page, (page) => page.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page: Page;

  @Column()
  pageId: string;

  @Column({ type: 'enum', enum: SectionType })
  type: SectionType;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  title: LocalizedText;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  subtitle: LocalizedText;

  /** Anchor id used for in-page nav links (e.g. `#about`). */
  @Column({ type: 'varchar', length: 80, nullable: true })
  anchor: string | null;

  @Column({ type: 'boolean', default: true })
  showInNav: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  /** Type-specific bilingual payload. Shape depends on `type`. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  content: SectionContent;

  /** Presentational options (background, padding, layout variant, ...). */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  settings: SectionSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
