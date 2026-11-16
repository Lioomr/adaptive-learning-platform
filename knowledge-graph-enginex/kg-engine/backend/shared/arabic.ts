// Arabic text utilities: language detection per segment and normalization of
// diacritics, alef forms, and tatweel.

const ARABIC_RANGE = /[\u0600-\u06FF]/
const LATIN_RANGE = /[A-Za-z]/

export type Lang = 'ar' | 'en' | 'mixed'

/** Detect language per segment (not per file) by script ratio. */
export function detectLanguage(text: string): Lang {
  const arabic = (text.match(new RegExp(ARABIC_RANGE, 'g')) || []).length
  const latin = (text.match(new RegExp(LATIN_RANGE, 'g')) || []).length
  const total = arabic + latin
  if (total === 0) return 'en'
  const arRatio = arabic / total
  if (arRatio > 0.75) return 'ar'
  if (arRatio > 0.15) return 'mixed'
  return 'en'
}

/** Strip diacritics (tashkeel), tatweel, and normalize alef/yaa forms. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // diacritics
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627') // alef forms -> bare alef
    .replace(/\u0649/g, '\u064A') // alef maksura -> yaa
    .replace(/\u0629/g, '\u0647') // taa marbuta -> haa (for matching)
}

/** Normalize for matching: Arabic-normalized, lowercased, punctuation stripped. */
export function normalizeForMatch(text: string): string {
  const base = normalizeArabic(text).toLowerCase()
  return base.replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim()
}
