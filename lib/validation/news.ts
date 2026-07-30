export type NewsInput = {
  title: string;
  slug: string;
  content: string;
  cover_image_url?: string | null;
  published_at?: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateNewsInput(input: NewsInput): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push('Title is required.');
  if (!input.slug.trim()) {
    errors.push('Slug is required.');
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.push('Slug must be lowercase letters, numbers, and hyphens only.');
  }
  if (!input.content.trim()) errors.push('Content is required.');
  return errors;
}
