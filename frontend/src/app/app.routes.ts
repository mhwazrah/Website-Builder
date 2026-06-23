import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './core/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
    title: 'My sites · Website Builder',
  },
  {
    path: 'sites/:id/settings',
    loadComponent: () =>
      import('./features/settings/settings-page').then((m) => m.SettingsPage),
    title: 'Site settings · Website Builder',
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'sites/:id/builder',
    loadComponent: () =>
      import('./features/builder/builder-page').then((m) => m.BuilderPage),
    title: 'Builder · Website Builder',
  },
  {
    path: 'sites/:id/sections/:sectionId/edit',
    loadComponent: () =>
      import('./features/builder/section-editor-page').then(
        (m) => m.SectionEditorPage,
      ),
    title: 'Edit section · Website Builder',
  },
  {
    path: 'sites/:id/preview',
    loadComponent: () =>
      import('./features/builder/section-preview-page').then(
        (m) => m.SectionPreviewPage,
      ),
    title: 'Preview · Website Builder',
  },
  {
    path: 'sites/:id/messages',
    loadComponent: () =>
      import('./features/messages/messages-page').then((m) => m.MessagesPage),
    title: 'Messages · Website Builder',
  },
  {
    path: 'site/:subdomain',
    loadComponent: () =>
      import('./features/public-site/public-site-page').then(
        (m) => m.PublicSitePage,
      ),
  },
  {
    path: 'site/:subdomain/:slug',
    loadComponent: () =>
      import('./features/public-site/public-site-page').then(
        (m) => m.PublicSitePage,
      ),
  },
  { path: '**', redirectTo: '' },
];
