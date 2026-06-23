import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import {
  Asset,
  AssetListResult,
  ContactMessage,
  ContactSubmissionDto,
  CreatePageDto,
  CreateSectionDto,
  CreateSiteDto,
  ImageUploadResult,
  LogoUploadResult,
  MessageListResult,
  Page,
  Section,
  Site,
  SubdomainCheck,
  Template,
  UpdatePageDto,
  UpdateSectionDto,
  UpdateSiteDto,
} from './models';

/**
 * Single source of truth for talking to the NestJS API. All builder/admin
 * calls live here; the public renderer uses the `public*` methods.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE;

  // --- Sites ---
  listSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.base}/sites`);
  }
  getSite(id: string): Observable<Site> {
    return this.http.get<Site>(`${this.base}/sites/${id}`);
  }
  createSite(dto: CreateSiteDto): Observable<Site> {
    return this.http.post<Site>(`${this.base}/sites`, dto);
  }
  updateSite(id: string, dto: UpdateSiteDto): Observable<Site> {
    return this.http.patch<Site>(`${this.base}/sites/${id}`, dto);
  }
  deleteSite(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sites/${id}`);
  }
  /** Promote the draft tree to the published snapshot. */
  publishSite(id: string): Observable<Site> {
    return this.http.post<Site>(`${this.base}/sites/${id}/publish`, {});
  }

  // --- Templates ---
  listTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.base}/templates`);
  }

  // --- Messages (contact inbox) ---
  listMessages(
    siteId: string,
    opts: { page?: number; unread?: boolean } = {},
  ): Observable<MessageListResult> {
    const params: Record<string, string> = {};
    if (opts.page) params['page'] = String(opts.page);
    if (opts.unread) params['unread'] = 'true';
    return this.http.get<MessageListResult>(
      `${this.base}/sites/${siteId}/messages`,
      { params },
    );
  }
  unreadCount(siteId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.base}/sites/${siteId}/messages/unread-count`,
    );
  }
  setMessageRead(id: string, read: boolean): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.base}/messages/${id}`, {
      read,
    });
  }
  deleteMessage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/messages/${id}`);
  }

  // --- Assets (media library) ---
  listAssets(page = 1): Observable<AssetListResult> {
    return this.http.get<AssetListResult>(`${this.base}/assets`, {
      params: { page: String(page) },
    });
  }
  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/assets/${id}`);
  }
  checkSubdomain(value: string, excludeId?: string): Observable<SubdomainCheck> {
    const params: Record<string, string> = { value };
    if (excludeId) params['excludeId'] = excludeId;
    return this.http.get<SubdomainCheck>(`${this.base}/sites/check-subdomain`, {
      params,
    });
  }
  uploadLogo(
    siteId: string,
    mode: 'light' | 'dark',
    file: File,
  ): Observable<LogoUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<LogoUploadResult>(
      `${this.base}/sites/${siteId}/logo?mode=${mode}`,
      form,
    );
  }

  /** Upload a generic image (card/gallery/hero/etc.) and get its public URL. */
  uploadImage(file: File): Observable<ImageUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ImageUploadResult>(`${this.base}/uploads/image`, form);
  }

  // --- Pages ---
  createPage(siteId: string, dto: CreatePageDto): Observable<Page> {
    return this.http.post<Page>(`${this.base}/sites/${siteId}/pages`, dto);
  }
  updatePage(id: string, dto: UpdatePageDto): Observable<Page> {
    return this.http.patch<Page>(`${this.base}/pages/${id}`, dto);
  }
  deletePage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/pages/${id}`);
  }
  duplicatePage(id: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${id}/duplicate`, {});
  }
  reorderPages(siteId: string, ids: string[]): Observable<Page[]> {
    return this.http.patch<Page[]>(
      `${this.base}/sites/${siteId}/pages/reorder`,
      { ids },
    );
  }

  // --- Sections ---
  createSection(pageId: string, dto: CreateSectionDto): Observable<Section> {
    return this.http.post<Section>(
      `${this.base}/pages/${pageId}/sections`,
      dto,
    );
  }
  updateSection(id: string, dto: UpdateSectionDto): Observable<Section> {
    return this.http.patch<Section>(`${this.base}/sections/${id}`, dto);
  }
  deleteSection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sections/${id}`);
  }
  duplicateSection(id: string): Observable<Section> {
    return this.http.post<Section>(
      `${this.base}/sections/${id}/duplicate`,
      {},
    );
  }
  reorderSections(pageId: string, ids: string[]): Observable<Section[]> {
    return this.http.patch<Section[]>(
      `${this.base}/pages/${pageId}/sections/reorder`,
      { ids },
    );
  }

  // --- Public (renderer) ---
  publicGetSite(subdomain: string): Observable<Site> {
    return this.http.get<Site>(`${this.base}/public/sites/${subdomain}`);
  }
  publicSubmitContact(
    subdomain: string,
    dto: ContactSubmissionDto,
  ): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.base}/public/sites/${subdomain}/contact`,
      dto,
    );
  }
}
