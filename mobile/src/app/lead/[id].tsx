import { useCallback, useState } from 'react'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Alert, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, ArrowRight, CalendarDays, CarFront, Clock3, Mail, MessageCircleMore, Phone, Send, UserRound } from 'lucide-react-native'
import { colors } from '@/constants/theme'
import { Avatar, Button, EmptyState, StatusPill, common } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { errorMessage } from '@/lib/api'
import { dateTime, vehicleName } from '@/lib/format'
import type { Interaction, LeadDetail, LeadStatus } from '@/lib/types'

type InteractionType = 'note' | 'call' | 'whatsapp' | 'email'
const interactionTypes: Array<{ id: InteractionType; label: string }> = [
  { id: 'note', label: 'Observação' }, { id: 'call', label: 'Ligação' },
  { id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'E-mail' },
]

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { request, session, apiUrl } = useAuth()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [statusId, setStatusId] = useState('')
  const [lossReason, setLossReason] = useState('')
  const [interactionType, setInteractionType] = useState<InteractionType>('note')
  const [note, setNote] = useState('')

  const load = useCallback(async (pull = false) => {
    if (!id) return
    if (pull) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      const [nextLead, nextStatuses] = await Promise.all([
        request<LeadDetail>(`/leads/${id}`), request<LeadStatus[]>('/leads/statuses'),
      ])
      setLead(nextLead)
      setStatuses(nextStatuses)
      setStatusId(nextLead.status?.id || '')
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setLoading(false); setRefreshing(false) }
  }, [id, request])

  useFocusEffect(useCallback(() => { void load() }, [load]))

  const assignedToMe = !!lead && lead.assignedUserId === session?.user.id
  const canClaim = !!lead && !lead.assignedUserId && (!lead.status || lead.status.kind === 'open')
  const chosenStatus = statuses.find((status) => status.id === statusId)

  async function run(job: () => Promise<unknown>, after?: () => void) {
    if (pending) return
    setPending(true)
    setError('')
    try { await job(); after?.(); await load() }
    catch (cause) { await load(); setError(errorMessage(cause)) }
    finally { setPending(false) }
  }

  function saveStatus() {
    if (!statusId) return setError('Selecione um status para continuar.')
    if (chosenStatus?.kind === 'lost' && lossReason.trim().length < 3) return setError('Informe o motivo da perda com pelo menos 3 caracteres.')
    void run(() => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ statusId, ...(chosenStatus?.kind === 'lost' ? { lossReason: lossReason.trim() } : {}) }) }), () => setLossReason(''))
  }

  function addInteraction() {
    if (!note.trim()) return setError('Escreva o que foi conversado antes de salvar.')
    void run(() => request(`/leads/${id}/interactions`, { method: 'POST', body: JSON.stringify({ type: interactionType, note: note.trim() }) }), () => setNote(''))
  }

  function release() {
    Alert.alert('Devolver à fila?', 'Outro vendedor poderá assumir este lead.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Devolver', style: 'destructive', onPress: () => void run(() => request(`/leads/${id}/release`, { method: 'POST' }), () => router.replace('/(tabs)/fila')) },
    ])
  }

  async function openContact(url: string) {
    try { await Linking.openURL(url) }
    catch { setError('Não foi possível abrir o aplicativo de contato neste aparelho.') }
  }

  function goBack() { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/fila') }

  if (loading && !lead) return <SafeAreaView style={styles.center} edges={['top']}><ActivityIndicator size="large" color={colors.red} /><Text style={styles.loadingText}>Carregando oportunidade...</Text></SafeAreaView>
  if (!lead) return <SafeAreaView style={common.screen} edges={['top']}><View style={styles.topbar}><Pressable onPress={goBack} style={styles.back}><ArrowLeft size={21} color={colors.ink} /></Pressable><Text style={styles.topbarTitle}>Oportunidade</Text></View><EmptyState title="Não foi possível abrir o lead" description={error || 'Este contato pode ter sido atribuído a outro vendedor.'} onRetry={() => void load()} /></SafeAreaView>

  const phoneDigits = lead.phone?.replace(/\D/g, '') || ''
  const whatsAppDigits = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : phoneDigits
  const cover = lead.vehicle?.images?.[0]?.imageUrl
  const coverUrl = cover ? (cover.startsWith('http') ? cover : `${apiUrl}${cover}`) : null

  return <SafeAreaView style={common.screen} edges={['top']}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.red} colors={[colors.red]} />} keyboardShouldPersistTaps="handled">
    <View style={styles.topbar}><Pressable onPress={goBack} style={styles.back}><ArrowLeft size={21} color={colors.ink} /></Pressable><Text style={styles.topbarTitle}>Ficha do lead</Text><View style={{ width: 42 }} /></View>
    <Text style={styles.eyebrow}>OPORTUNIDADE</Text>
    <Text style={styles.name}>{lead.name}</Text>
    <View style={styles.metaRow}><StatusPill status={lead.status} /><Text style={styles.created}>Recebido em {dateTime(lead.createdAt)}</Text></View>
    {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

    <View style={styles.vehicleCard}>{coverUrl ? <Image source={{ uri: coverUrl }} style={styles.vehicleImage} /> : <View style={styles.vehicleFallback}><CarFront size={25} color={colors.red} /></View>}<View style={{ flex: 1 }}><Text style={styles.label}>VEÍCULO DE INTERESSE</Text><Text style={styles.vehicleName}>{vehicleName(lead.vehicle)}</Text></View></View>

    <View style={styles.card}><View style={styles.cardHeading}><Text style={styles.cardTitle}>Dados do contato</Text><View style={styles.cardIcon}><UserRound size={17} color={colors.red} /></View></View>
      <InfoRow label="Telefone" value={lead.phone || 'Não informado'} />
      <InfoRow label="E-mail" value={lead.email || 'Não informado'} />
      <InfoRow label="Responsável" value={lead.assignedUser?.name || 'Aguardando vendedor'} />
      <InfoRow label="Origem" value={lead.source || 'Catálogo'} last />
      {lead.message ? <View style={styles.messageBox}><Text style={styles.label}>MENSAGEM RECEBIDA</Text><Text style={styles.messageText}>{lead.message}</Text></View> : null}
    </View>

    {canClaim ? <View style={styles.nextCard}><Text style={styles.nextEyebrow}>PRÓXIMO PASSO</Text><Text style={styles.nextTitle}>Assuma esta oportunidade.</Text><Text style={styles.nextBody}>Depois você poderá entrar em contato, registrar a conversa e atualizar o status.</Text><Button onPress={() => void run(() => request(`/leads/${id}/claim`, { method: 'POST' }))} loading={pending} style={{ marginTop: 18 }}>Assumir lead</Button></View> : null}

    {assignedToMe ? <>
      <View style={styles.contactCard}><Text style={styles.cardTitle}>Fale com o cliente</Text><View style={styles.contactActions}>
        {lead.phone ? <ContactButton icon={<Phone size={19} color={colors.red} />} label="Ligar" onPress={() => void openContact(`tel:${phoneDigits}`)} /> : null}
        {phoneDigits ? <ContactButton icon={<MessageCircleMore size={19} color={colors.red} />} label="WhatsApp" onPress={() => void openContact(`https://wa.me/${whatsAppDigits}`)} /> : null}
        {lead.email ? <ContactButton icon={<Mail size={19} color={colors.red} />} label="E-mail" onPress={() => void openContact(`mailto:${lead.email}`)} /> : null}
      </View></View>

      <View style={styles.card}><View style={styles.cardHeading}><View><Text style={styles.label}>ETAPA DA VENDA</Text><Text style={styles.cardTitle}>Atualizar status</Text></View><CalendarDays size={19} color={colors.red} /></View>
        <Text style={styles.helper}>Escolha em que ponto está esta conversa.</Text>
        <View style={styles.statusOptions}>{statuses.map((status) => <Pressable key={status.id} onPress={() => { setStatusId(status.id); setError('') }} style={[styles.statusOption, statusId === status.id && styles.statusOptionSelected]}><Text style={[styles.statusOptionText, statusId === status.id && styles.statusOptionTextSelected]}>{status.name}</Text></Pressable>)}</View>
        {chosenStatus?.kind === 'lost' ? <View style={{ marginTop: 17 }}><Text style={styles.inputLabel}>Motivo da perda *</Text><TextInput value={lossReason} onChangeText={setLossReason} maxLength={2000} multiline placeholder="Por que a venda não avançou?" placeholderTextColor={colors.faint} style={styles.textArea} /></View> : null}
        <Button onPress={saveStatus} loading={pending} style={{ marginTop: 19 }}>Salvar status</Button>
      </View>

      <View style={styles.card}><View style={styles.cardHeading}><View><Text style={styles.label}>ATENDIMENTO</Text><Text style={styles.cardTitle}>Registrar interação</Text></View><Send size={18} color={colors.red} /></View>
        <Text style={styles.helper}>Deixe um registro para acompanhar a negociação.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interactionTypes}>{interactionTypes.map((type) => <Pressable key={type.id} onPress={() => setInteractionType(type.id)} style={[styles.typeChip, interactionType === type.id && styles.typeChipSelected]}><Text style={[styles.typeText, interactionType === type.id && styles.typeTextSelected]}>{type.label}</Text></Pressable>)}</ScrollView>
        <TextInput value={note} onChangeText={setNote} maxLength={2000} multiline placeholder="O que foi conversado?" placeholderTextColor={colors.faint} style={styles.textArea} />
        <Button variant="dark" onPress={addInteraction} loading={pending} style={{ marginTop: 15 }}>Salvar no histórico</Button>
      </View>
    </> : null}

    <View style={styles.card}><View style={styles.cardHeading}><View><Text style={styles.label}>ATIVIDADE</Text><Text style={styles.cardTitle}>Histórico</Text></View><Clock3 size={19} color={colors.red} /></View>
      {lead.interactions.length ? <View style={styles.timeline}>{lead.interactions.map((item) => <TimelineItem key={item.id} item={item} />)}</View> : <Text style={styles.noHistory}>Ainda não há interações registradas.</Text>}
    </View>

    {assignedToMe ? <Pressable onPress={release} disabled={pending} style={styles.release}><Text style={styles.releaseText}>Devolver à fila</Text><ArrowRight size={15} color={colors.muted} /></Pressable> : null}
  </ScrollView></SafeAreaView>
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>
}

function ContactButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.contactButton}><View style={styles.contactIcon}>{icon}</View><Text style={styles.contactLabel}>{label}</Text></Pressable>
}

function TimelineItem({ item }: { item: Interaction }) {
  const label = item.type === 'loss_reason' ? 'Motivo da perda' : item.type === 'call' ? 'Ligação' : item.type === 'whatsapp' ? 'WhatsApp' : item.type === 'email' ? 'E-mail' : 'Observação'
  return <View style={styles.timelineItem}><View style={styles.timelineDot} /><View style={{ flex: 1 }}><View style={styles.timelineTop}><Text style={styles.timelineType}>{label}</Text><Text style={styles.timelineDate}>{dateTime(item.createdAt)}</Text></View><Text style={styles.timelineNote}>{item.note || 'Sem observação'}</Text></View></View>
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 13, marginTop: 15 },
  content: { paddingHorizontal: 22, paddingBottom: 45 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9, marginBottom: 32 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  eyebrow: { color: colors.red, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  name: { color: colors.ink, fontSize: 37, fontWeight: '900', letterSpacing: -1.8, marginTop: 7 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 22, flexWrap: 'wrap' },
  created: { color: colors.faint, fontSize: 11 },
  errorBox: { backgroundColor: colors.redSoft, borderRadius: 15, padding: 14, marginBottom: 15 },
  errorText: { color: colors.redDark, fontSize: 12, lineHeight: 19 },
  vehicleCard: { backgroundColor: colors.dark, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, marginBottom: 16 },
  vehicleImage: { width: 57, height: 57, borderRadius: 14 },
  vehicleFallback: { width: 57, height: 57, borderRadius: 14, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  vehicleName: { color: 'white', fontSize: 15, fontWeight: '800', marginTop: 4 },
  label: { color: colors.red, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -.4, marginTop: 3 },
  cardIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.ink, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
  messageBox: { backgroundColor: colors.background, padding: 14, borderRadius: 15, marginTop: 16 },
  messageText: { color: colors.ink, fontSize: 13, lineHeight: 20, marginTop: 8 },
  nextCard: { backgroundColor: colors.dark, borderRadius: 23, padding: 22, marginBottom: 16 },
  nextEyebrow: { color: '#ffffffa6', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  nextTitle: { color: 'white', fontSize: 20, fontWeight: '800', marginTop: 9 },
  nextBody: { color: '#ffffffab', fontSize: 12, lineHeight: 19, marginTop: 7 },
  contactCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 },
  contactActions: { flexDirection: 'row', gap: 9, marginTop: 18 },
  contactButton: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 16, backgroundColor: colors.redSoft },
  contactIcon: { height: 24, justifyContent: 'center' },
  contactLabel: { color: colors.redDark, fontSize: 10, fontWeight: '800', marginTop: 7 },
  helper: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 17 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  statusOptionSelected: { backgroundColor: colors.redSoft, borderColor: colors.red },
  statusOptionText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  statusOptionTextSelected: { color: colors.redDark },
  inputLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  textArea: { minHeight: 100, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, padding: 14, color: colors.ink, fontSize: 13, lineHeight: 19, textAlignVertical: 'top' },
  interactionTypes: { gap: 8, paddingVertical: 17 },
  typeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  typeChipSelected: { backgroundColor: colors.red, borderColor: colors.red },
  typeText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  typeTextSelected: { color: 'white' },
  timeline: { paddingTop: 5 },
  timelineItem: { flexDirection: 'row', gap: 12, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 16, marginLeft: 4, paddingBottom: 23 },
  timelineDot: { position: 'absolute', left: -5, top: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red, borderWidth: 2, borderColor: colors.surface },
  timelineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  timelineType: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  timelineDate: { color: colors.faint, fontSize: 10 },
  timelineNote: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  noHistory: { color: colors.muted, fontSize: 12, textAlign: 'center', backgroundColor: colors.background, padding: 22, borderRadius: 15 },
  release: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 17 },
  releaseText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
})
