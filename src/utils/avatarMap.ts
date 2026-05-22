import male1 from '../assets/avatar/male1.png'
import male2 from '../assets/avatar/male2.png'
import male3 from '../assets/avatar/male3.png'
import female1 from '../assets/avatar/female1.png'
import female2 from '../assets/avatar/female2.png'
import female3 from '../assets/avatar/female3.png'

/**
 * Maps avatar keys (stored in DB) to their Vite-resolved image URLs.
 * All clients bundle the same 6 images so this resolves identically everywhere.
 */
export const AVATAR_MAP: Record<string, string> = {
  male1,
  male2,
  male3,
  female1,
  female2,
  female3,
}

/** Given a Vite-resolved avatar URL, return its key (e.g. "male1"). */
export function avatarUrlToKey(url: string): string | null {
  for (const [key, resolvedUrl] of Object.entries(AVATAR_MAP)) {
    if (resolvedUrl === url) return key
  }
  return null
}

/** Given a key like "male1", return the Vite-resolved image URL. */
export function avatarKeyToUrl(key: string | null | undefined): string | null {
  if (!key) return null
  return AVATAR_MAP[key] ?? null
}
