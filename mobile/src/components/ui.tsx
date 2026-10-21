import type { ReactNode } from 'react'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import { ChevronRight, Inbox } from 'lucide-react-native'
import { colors } from '@/constants/theme'
import { initials } from '@/lib/format'
import type { LeadStatus } from '@/lib/types'

export function BrandMark({ size = 46 }: { size?: number }) {
  return <Image source={require('../../assets/images/cartalog-mark.png')} style={{ width: size, height: size, borderRadius: size * .23 }} />
}

export function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size * .28 }]}>
    <Text style={[styles.avatarText, { fontSize: size * .31 }]}>{initials(name)}</Text>
  </View>
}

export function Button({ children, onPress, variant = 'primary', disabled, loading, style }: {
  children: ReactNode
  onPress: () => void
  variant?: 'primary' | 'outline' | 'dark' | 'ghost'
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const background = variant === 'primary' ? colors.red : variant === 'dark' ? colors.dark : variant === 'outline' ? colors.surface : 'transparent'
  const foreground = variant === 'primary' || variant === 'dark' ? colors.surface : variant === 'ghost' ? colors.red : colors.ink
  return <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, { backgroundColor: background, borderColor: variant === 'outline' ? colors.border : background, opacity: disabled ? .45 : pressed ? .78 : 1 }, style]}>
    {loading ? <ActivityIndicator color={foreground} /> : <Text style={[styles.buttonText, { color: foreground }]}>{children}</Text>}
  </Pressable>
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput {...props} placeholderTextColor={colors.faint} style={[styles.field, props.style, error ? styles.fieldError : null]} />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
}

export function StatusPill({ status }: { status: LeadStatus | null }) {
  const kind = status?.kind ?? 'open'
  const foreground = kind === 'won' ? colors.green : kind === 'lost' ? colors.red : colors.amber
  const background = kind === 'won' ? colors.greenSoft : kind === 'lost' ? colors.redSoft : colors.amberSoft
  return <View style={[styles.statusPill, { backgroundColor: background }]}>
    <View style={[styles.statusDot, { backgroundColor: foreground }]} />
    <Text style={[styles.statusText, { color: foreground }]} numberOfLines={1}>{status?.name || 'Novo'}</Text>
  </View>
}

export function EmptyState({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) {
  return <View style={styles.empty}>
    <View style={styles.emptyIcon}><Inbox size={28} color={colors.red} strokeWidth={1.8} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
    {onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text><ChevronRight size={16} color={colors.red} /></Pressable> : null}
  </View>
}

export function SectionHeading({ eyebrow, title, trailing }: { eyebrow?: string; title: string; trailing?: ReactNode }) {
  return <View style={styles.sectionHeading}>
    <View><Text style={styles.eyebrow}>{eyebrow || 'CARTALOG'}</Text><Text style={styles.sectionTitle}>{title}</Text></View>
    {trailing}
  </View>
}

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingBottom: 36 },
  card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  muted: { color: colors.muted },
  error: { color: colors.red, fontSize: 13, lineHeight: 19 },
})

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.redDark, fontWeight: '800' },
  button: { minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  field: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.ink, fontSize: 15 },
  fieldError: { borderColor: colors.red },
  errorText: { color: colors.red, fontSize: 12 },
  statusPill: { maxWidth: 160, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 64 },
  emptyIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 20 },
  retryText: { color: colors.red, fontSize: 14, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  eyebrow: { color: colors.red, fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 5 },
  sectionTitle: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -1.2 },
})
