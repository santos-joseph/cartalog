import slugifyLib from 'slugify'

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'pt',
    trim: true,
  })
}

export function uniqueSlug(base: string, suffix?: string | number): string {
  const baseSlug = slugify(base)
  return suffix ? `${baseSlug}-${suffix}` : baseSlug
}
