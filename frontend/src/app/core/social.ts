/**
 * Single source of truth for social platforms — their picker labels and the
 * PrimeIcon used to render them. Shared by the footer, the social section, and
 * the reusable social-links editor so every place stays consistent.
 */
export interface SocialPlatform {
  value: string;
  label: string;
  icon: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { value: 'facebook', label: 'Facebook', icon: 'pi pi-facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'pi pi-instagram' },
  { value: 'x', label: 'X (Twitter)', icon: 'pi pi-twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'pi pi-linkedin' },
  { value: 'youtube', label: 'YouTube', icon: 'pi pi-youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'pi pi-tiktok' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'pi pi-whatsapp' },
  { value: 'telegram', label: 'Telegram', icon: 'pi pi-telegram' },
  { value: 'github', label: 'GitHub', icon: 'pi pi-github' },
  { value: 'snapchat', label: 'Snapchat', icon: 'pi pi-link' },
  { value: 'pinterest', label: 'Pinterest', icon: 'pi pi-link' },
];

/** PrimeIcon class for a platform key (accepts legacy 'twitter'); falls back to a link icon. */
export function socialIcon(platform: string | null | undefined): string {
  const key = (platform ?? '').toLowerCase();
  if (key === 'twitter') return 'pi pi-twitter';
  return SOCIAL_PLATFORMS.find((p) => p.value === key)?.icon ?? 'pi pi-link';
}
