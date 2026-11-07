/** Keys stored in `site_settings` for the public contact/social/announcement block. */
export const CONTACT_SETTING_KEYS = {
  announcement: 'announcement',
  email: 'contact_email',
  phone: 'contact_phone',
  address: 'contact_address',
  facebook: 'social_facebook',
  instagram: 'social_instagram',
  twitter: 'social_twitter',
} as const;

export const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/ywcacamp.eg?srtk=anRxZXdsMmJ4azIy';

/** What the Super Admin can edit; empty string = not set (hidden on the public site). */
export type PublicSiteSettings = {
  announcement: string;
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
  twitter: string;
};

export const EMPTY_SITE_SETTINGS: PublicSiteSettings = {
  announcement: '', email: '', phone: '', address: '', facebook: '', instagram: '', twitter: '',
};
