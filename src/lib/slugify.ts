/** Turns a typed stage label into a stable storage key, e.g. "Client Review" -> "client-review". */
export function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'stage'
}
