import type { CSSProperties } from 'react'

const DEFAULT_PRIMARY = '#d20a1e'
const DEFAULT_SECONDARY = '#a60818'

function color(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function rgb(hex: string) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
}

function mix(hex: string, target: number, amount: number) {
  const channels = rgb(hex).map((channel) => Math.round(channel * (1 - amount) + target * amount))
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function luminance(hex: string) {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function readableOnWhite(hex: string) {
  for (let amount = 0; amount <= 1; amount += 0.05) {
    const candidate = mix(hex, 0, amount)
    if (luminance(candidate) <= 0.18) return candidate
  }
  return '#1d1d1f'
}

export function catalogTheme(primaryColor?: string | null, secondaryColor?: string | null, appearance?: { backgroundColor?: string | null; fontFamily?: string | null }): CSSProperties {
  const primary = color(primaryColor, DEFAULT_PRIMARY)
  const secondary = color(secondaryColor, DEFAULT_SECONDARY)
  const fonts: Record<string, string> = { sans: 'var(--font-geist), system-ui, sans-serif', serif: 'Georgia, Cambria, serif', rounded: '"Trebuchet MS", Arial, sans-serif' }

  return {
    '--background': color(appearance?.backgroundColor, '#fbfbfd'),
    '--catalog-font': fonts[appearance?.fontFamily || 'sans'] || fonts.sans,
    '--primary': primary,
    '--primary-dark': mix(primary, 0, 0.18),
    '--primary-foreground': luminance(primary) > 0.18 ? '#1d1d1f' : '#ffffff',
    '--primary-ink': readableOnWhite(primary),
    '--secondary': secondary,
    '--secondary-brand': secondary,
    '--secondary-accent': mix(secondary, 255, 0.92),
    '--secondary-ink': readableOnWhite(secondary),
    '--secondary-foreground': luminance(secondary) > 0.18 ? '#1d1d1f' : '#ffffff',
    '--accent': mix(primary, 255, 0.92),
    '--accent-foreground': readableOnWhite(primary),
    '--ring': primary,
  } as CSSProperties
}
