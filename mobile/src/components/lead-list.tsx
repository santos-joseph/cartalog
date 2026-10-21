import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowRight, ArrowUpRight, ChevronRight, Clock3, Search, UserRound, X } from 'lucide-react-native'
import { useAuth } from '@/context/auth'
import { colors } from '@/constants/theme'
import { Avatar, BrandMark, EmptyState, StatusPill, common } from '@/components/ui'
import { errorMessage } from '@/lib/api'
import { relativeDate, vehicleName } from '@/lib/format'
import type { Lead, LeadStatus, Page } from '@/lib/types'

type Scope = 'queue' | 'mine'

export function LeadList({ scope }: { scope: Scope }) {
  const router = useRouter()
  const { session, request, apiUrl } = useAuth()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [meta, setMeta] = useState<Page<Lead>['meta']>({ total: 0, page: 1, perPage: 20, lastPage: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const sequence = useRef(0)

  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 350); return () => clearTimeout(timer) }, [query])

  const load = useCallback(async (page = 1, mode: 'replace' | 'append' | 'refresh' = 'replace') => {
    const current = ++sequence.current
    if (mode === 'refresh') setRefreshing(true)
    else if (mode === 'append') setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ scope, page: String(page), perPage: '20' })
      if (search) params.set('search', search)
      if (scope === 'mine' && selectedStatus) params.set('statusId', selectedStatus)
      const result = await request<Page<Lead>>(`/leads?${params}`)
      if (current !== sequence.current) return
      setLeads((previous) => mode === 'append' ? [...previous, ...result.data] : result.data)
      setMeta(result.meta)
    } catch (cause) {
      if (current === sequence.current) setError(errorMessage(cause))
    } finally {
      if (current === sequence.current) { setLoading(false); setRefreshing(false); setLoadingMore(false) }
    }
  }, [request, scope, search, selectedStatus])

  useFocusEffect(useCallback(() => {
    void load()
    if (scope === 'mine') request<LeadStatus[]>('/leads/statuses').then(setStatuses).catch(() => {})
  }, [load, request, scope]))

  async function claim(lead: Lead) {
    setClaimingId(lead.id)
    setError('')
    try {
      await request(`/leads/${lead.id}/claim`, { method: 'POST' })
      await load()
      router.push({ pathname: '/lead/[id]', params: { id: lead.id } })
    } catch (cause) { void load().then(() => setError(errorMessage(cause))) }
    finally { setClaimingId(null) }
  }

  const mine = scope === 'mine'

  return <SafeAreaView style={common.screen} edges={['top']}>
    <FlatList
      data={leads}
      keyExtractor={(lead) => lead.id}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(1, 'refresh')} tintColor={colors.red} colors={[colors.red]} />}
      ListHeaderComponent={<>
        <View style={styles.topbar}><View style={styles.store}><BrandMark size={38} /><View><Text style={styles.storeLabel}>CARTALOG VENDEDOR</Text><Text style={styles.storeName} numberOfLines={1}>{session?.company.name}</Text></View></View><Avatar name={session?.user.name || 'Vendedor'} size={37} /></View>
        <View style={styles.titleBlock}><Text style={styles.eyebrow}>{mine ? 'SUA CARTEIRA' : 'NOVAS OPORTUNIDADES'}</Text><Text style={styles.title}>{mine ? 'Meus leads.' : 'Fila de leads.'}</Text><Text style={styles.subtitle}>{mine ? 'Acompanhe cada conversa e mantenha os status em dia.' : 'Encontre um contato e comece o atendimento.'}</Text></View>
        <View style={[styles.hero, mine && styles.heroMine]}>
          <View style={{ flex: 1 }}><Text style={styles.heroLabel}>{mine ? 'EM SUA CARTEIRA' : 'AGUARDANDO VENDEDOR'}</Text><Text style={styles.heroCount}>{meta.total}</Text><Text style={styles.heroDescription}>{mine ? 'contatos para acompanhar' : 'oportunidades disponíveis'}</Text></View>
          <View style={styles.heroIcon}>{mine ? <UserRound size={27} color="white" strokeWidth={1.6} /> : <ArrowUpRight size={29} color="white" strokeWidth={1.6} />}</View>
        </View>
        <View style={styles.searchBox}><Search size={18} color={colors.faint} /><TextInput placeholder="Buscar nome, telefone ou e-mail" placeholderTextColor={colors.faint} value={query} onChangeText={setQuery} autoCorrect={false} style={styles.searchInput} />{query ? <Pressable onPress={() => setQuery('')}><X size={17} color={colors.faint} /></Pressable> : null}</View>
        {mine && statuses.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChip label="Todos" selected={!selectedStatus} onPress={() => setSelectedStatus(null)} />
          {statuses.map((status) => <FilterChip key={status.id} label={status.name} selected={selectedStatus === status.id} onPress={() => setSelectedStatus(status.id)} />)}
        </ScrollView> : null}
        <View style={styles.listTitle}><Text style={styles.listHeading}>{mine ? 'Em atendimento' : 'Disponíveis agora'}</Text><Text style={styles.listCount}>{meta.total} {meta.total === 1 ? 'lead' : 'leads'}</Text></View>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Recarregar</Text></Pressable></View> : null}
      </>}
      renderItem={({ item }) => <LeadCard lead={item} apiUrl={apiUrl} mine={mine} claiming={claimingId === item.id} onOpen={() => router.push({ pathname: '/lead/[id]', params: { id: item.id } })} onClaim={() => void claim(item)} />}
      ListEmptyComponent={loading ? <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} /> : <EmptyState title={error ? 'Não foi possível carregar' : mine ? 'Sua carteira está vazia' : 'Fila zerada por enquanto'} description={error ? 'Puxe a lista para atualizar.' : mine ? 'Assuma um lead na fila para começar o atendimento.' : 'Quando alguém entrar em contato pelo catálogo, aparecerá aqui.'} onRetry={error ? () => void load() : undefined} />}
      ListFooterComponent={meta.page < meta.lastPage ? <Pressable disabled={loadingMore} style={styles.more} onPress={() => void load(meta.page + 1, 'append')}>{loadingMore ? <ActivityIndicator color={colors.red} /> : <><Text style={styles.moreText}>Carregar mais</Text><ChevronRight size={17} color={colors.red} /></>}</Pressable> : <View style={{ height: 22 }} />}
    />
  </SafeAreaView>
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>
}

function LeadCard({ lead, apiUrl, mine, claiming, onOpen, onClaim }: { lead: Lead; apiUrl: string; mine: boolean; claiming: boolean; onOpen: () => void; onClaim: () => void }) {
  const cover = lead.vehicle?.images?.[0]?.imageUrl
  const coverUrl = cover ? (cover.startsWith('http') ? cover : `${apiUrl}${cover}`) : null
  return <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: .78 }]}>
    <View style={styles.cardTop}><Avatar name={lead.name} size={48} /><View style={styles.cardIdentity}><Text style={styles.cardName} numberOfLines={1}>{lead.name}</Text><View style={styles.timeRow}><Clock3 size={12} color={colors.faint} /><Text style={styles.time}>{relativeDate(lead.createdAt)}</Text></View></View><ChevronRight size={20} color={colors.faint} /></View>
    <View style={styles.vehicleRow}>{coverUrl ? <Image source={{ uri: coverUrl }} style={styles.vehicleImage} /> : <View style={styles.vehicleFallback}><Text style={styles.vehicleFallbackText}>AUTO</Text></View>}<View style={{ flex: 1 }}><Text style={styles.vehicleLabel}>VEÍCULO DE INTERESSE</Text><Text style={styles.vehicleName} numberOfLines={1}>{vehicleName(lead.vehicle)}</Text></View></View>
    <View style={styles.cardBottom}><StatusPill status={lead.status} />{mine ? <View style={styles.detailLink}><Text style={styles.detailText}>Ver detalhes</Text><ArrowRight size={14} color={colors.red} /></View> : <Pressable onPress={(event) => { event.stopPropagation(); onClaim() }} disabled={claiming} style={[styles.claimButton, claiming && { opacity: .5 }]}>{claiming ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.claimText}>Assumir lead</Text>}</Pressable>}</View>
  </Pressable>
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 22, paddingBottom: 28 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  store: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  storeLabel: { color: colors.red, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  storeName: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 2, maxWidth: 190 },
  titleBlock: { marginTop: 36, marginBottom: 23 },
  eyebrow: { color: colors.red, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.ink, fontSize: 37, fontWeight: '900', letterSpacing: -1.8, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, maxWidth: 320 },
  hero: { borderRadius: 26, backgroundColor: colors.dark, minHeight: 155, padding: 22, flexDirection: 'row', overflow: 'hidden' },
  heroMine: { backgroundColor: colors.redDark },
  heroLabel: { color: '#ffffffa8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroCount: { color: 'white', fontSize: 51, fontWeight: '900', lineHeight: 58, letterSpacing: -2.5, marginTop: 8 },
  heroDescription: { color: '#ffffffb0', fontSize: 12 },
  heroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#ffffff21', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  searchBox: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 24 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, height: '100%' },
  chips: { gap: 8, paddingVertical: 17 },
  chip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: 'white' },
  listTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  listHeading: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  listCount: { color: colors.muted, fontSize: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  cardIdentity: { flex: 1 },
  cardName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  time: { color: colors.faint, fontSize: 11 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.background, padding: 9, borderRadius: 15, marginTop: 17 },
  vehicleImage: { width: 43, height: 43, borderRadius: 9 },
  vehicleFallback: { width: 43, height: 43, borderRadius: 9, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  vehicleFallbackText: { color: colors.red, fontSize: 9, fontWeight: '900' },
  vehicleLabel: { color: colors.faint, fontSize: 9, fontWeight: '800', letterSpacing: .9 },
  vehicleName: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 3 },
  cardBottom: { marginTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: colors.red, fontSize: 11, fontWeight: '800' },
  claimButton: { backgroundColor: colors.red, minHeight: 36, minWidth: 112, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  claimText: { color: 'white', fontSize: 11, fontWeight: '800' },
  errorBox: { borderRadius: 14, backgroundColor: colors.redSoft, padding: 13, marginBottom: 14 },
  errorText: { color: colors.redDark, fontSize: 12, lineHeight: 18 },
  retry: { color: colors.red, fontSize: 12, fontWeight: '800', marginTop: 7 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 19 },
  moreText: { color: colors.red, fontSize: 13, fontWeight: '800' },
})
