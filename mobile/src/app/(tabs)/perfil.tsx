import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Building2, CircleHelp, LockKeyhole, Mail, Server, ShieldCheck } from 'lucide-react-native'
import { colors } from '@/constants/theme'
import { Avatar, Button, Field, SectionHeading, common } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { errorMessage } from '@/lib/api'

export default function ProfileScreen() {
  const { session, apiUrl, request, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function changePassword() {
    setError('')
    setMessage('')
    if (!currentPassword || !newPassword) return setError('Preencha a senha atual e a nova senha.')
    if (newPassword !== confirmPassword) return setError('A confirmação da nova senha não confere.')
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return setError('Use ao menos 8 caracteres, uma letra maiúscula e um número.')
    setSaving(true)
    try {
      await request('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Senha alterada com sucesso.')
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setSaving(false) }
  }

  function confirmLogout() {
    Alert.alert('Sair da conta?', 'Você precisará entrar novamente para atender seus leads.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void logout() },
    ])
  }

  return <SafeAreaView style={common.screen} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <SectionHeading eyebrow="SUA CONTA" title="Meu perfil." />
    <View style={styles.userCard}><Avatar name={session?.user.name || 'Vendedor'} size={66} /><View style={{ flex: 1 }}><Text style={styles.userName}>{session?.user.name}</Text><Text style={styles.userRole}>Vendedor · {session?.company.name}</Text></View></View>
    <View style={styles.infoCard}>
      <InfoRow icon={<Building2 size={19} color={colors.red} />} label="LOJA" value={session?.company.name || '—'} />
      <View style={styles.divider} />
      <InfoRow icon={<Mail size={19} color={colors.red} />} label="E-MAIL" value={session?.user.email || '—'} />
      <View style={styles.divider} />
      <InfoRow icon={<Server size={19} color={colors.red} />} label="API CONECTADA" value={apiUrl} />
    </View>

    <View style={styles.sectionHeader}><View style={styles.sectionIcon}><LockKeyhole size={19} color={colors.red} /></View><View><Text style={styles.sectionTitle}>Segurança da conta</Text><Text style={styles.sectionSubtitle}>Altere sua senha de acesso.</Text></View></View>
    <View style={styles.passwordCard}>
      <Field label="Senha atual" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} autoComplete="current-password" />
      <Field label="Nova senha" secureTextEntry value={newPassword} onChangeText={setNewPassword} autoComplete="new-password" />
      <Field label="Confirme a nova senha" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} autoComplete="new-password" />
      {error ? <Text style={common.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Button variant="dark" onPress={() => void changePassword()} loading={saving}>Salvar nova senha</Button>
    </View>

    <View style={styles.note}><ShieldCheck size={20} color={colors.green} /><Text style={styles.noteText}>Seus leads só podem ser atendidos por você enquanto estiverem atribuídos à sua conta.</Text></View>
    <Button variant="outline" onPress={confirmLogout} style={{ marginTop: 22 }}>Sair da conta</Button>
    <View style={styles.footer}><CircleHelp size={15} color={colors.faint} /><Text style={styles.footerText}>Sua conta é gerenciada pelo dono no Cartalog Desktop.</Text></View>
  </ScrollView></SafeAreaView>
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}>{icon}</View><View style={{ flex: 1 }}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue} numberOfLines={2}>{value}</Text></View></View>
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 38 },
  userCard: { backgroundColor: colors.dark, borderRadius: 26, padding: 23, flexDirection: 'row', alignItems: 'center', gap: 15 },
  userName: { color: 'white', fontSize: 20, fontWeight: '800' },
  userRole: { color: '#ffffffa6', fontSize: 12, marginTop: 5 },
  infoCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, marginTop: 18, paddingHorizontal: 19 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 18 },
  infoIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: colors.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  infoValue: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 32, marginBottom: 14 },
  sectionIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  passwordCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 23, padding: 19, gap: 17 },
  success: { color: colors.green, fontSize: 13, fontWeight: '700' },
  note: { marginTop: 22, borderRadius: 19, padding: 16, backgroundColor: colors.greenSoft, flexDirection: 'row', gap: 10 },
  noteText: { color: colors.green, fontSize: 12, lineHeight: 19, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 23 },
  footerText: { color: colors.faint, fontSize: 11 },
})
