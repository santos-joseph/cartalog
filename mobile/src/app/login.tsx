import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowRight, ChevronDown, ChevronUp, LockKeyhole, ShieldCheck } from 'lucide-react-native'
import { useAuth } from '@/context/auth'
import { colors } from '@/constants/theme'
import { BrandMark, Button, Field, common } from '@/components/ui'
import { errorMessage } from '@/lib/api'

export default function LoginScreen() {
  const { login, apiUrl: savedApiUrl } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiUrl, setApiUrl] = useState(savedApiUrl)
  const [showServer, setShowServer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!email.trim() || !password) return setError('Preencha e-mail e senha.')
    setLoading(true)
    setError('')
    try { await login({ email, password, apiUrl }) }
    catch (cause) {
      const message = errorMessage(cause)
      setError(message)
      if (message.includes('Não foi possível conectar à API')) setShowServer(true)
    }
    finally { setLoading(false) }
  }

  return <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><BrandMark size={56} /><Text style={styles.brandName}>Cartalog</Text></View>
        <Text style={styles.eyebrow}>APP DO VENDEDOR</Text>
        <Text style={styles.title}>O próximo negócio começa aqui.</Text>
        <Text style={styles.subtitle}>Entre para acompanhar oportunidades e registrar cada conversa com seus clientes.</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}><View style={styles.lockIcon}><LockKeyhole size={18} color={colors.red} /></View><View><Text style={styles.cardTitle}>Acesse sua carteira</Text><Text style={styles.cardSubtitle}>Use a conta criada pelo dono da loja.</Text></View></View>
          <View style={styles.fields}>
            <Field label="E-mail" placeholder="voce@loja.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" />
            <Field label="Senha" placeholder="Sua senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" returnKeyType="done" onSubmitEditing={() => void submit()} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button onPress={() => void submit()} loading={loading} style={{ marginTop: 22 }}>Entrar no Cartalog</Button>
          <View style={styles.security}><ShieldCheck size={15} color={colors.green} /><Text style={styles.securityText}>Acesso exclusivo para vendedores cadastrados.</Text></View>
        </View>

        <Pressable style={styles.serverToggle} onPress={() => setShowServer(!showServer)}>
          <Text style={styles.serverToggleText}>Configurar endereço da API</Text>
          {showServer ? <ChevronUp size={16} color={colors.muted} /> : <ChevronDown size={16} color={colors.muted} />}
        </Pressable>
        {showServer ? <View style={styles.serverBox}>
          <Field label="Endereço do servidor" placeholder="http://192.168.1.10:3333" value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          <Text style={styles.serverHint}>O endereço da rede local é detectado automaticamente pelo Expo. Se a conexão falhar, use o IP do computador na mesma rede Wi-Fi. No emulador Android, o padrão é 10.0.2.2:3333.</Text>
        </View> : null}

        <View style={styles.bottom}><ArrowRight size={16} color={colors.red} /><Text style={styles.bottomText}>Sua loja atende na web e no mobile, com os mesmos leads.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 54 },
  brandName: { color: colors.ink, fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  eyebrow: { color: colors.red, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 42, fontWeight: '900', letterSpacing: -2.2, lineHeight: 45, marginTop: 12, maxWidth: 340 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 15, maxWidth: 350 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 22, marginTop: 35 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  fields: { gap: 18, marginTop: 27 },
  error: { color: colors.red, fontSize: 13, marginTop: 15, lineHeight: 19 },
  security: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 17 },
  securityText: { color: colors.muted, fontSize: 11 },
  serverToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, marginTop: 12 },
  serverToggleText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  serverBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 17 },
  serverHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 'auto', paddingTop: 30 },
  bottomText: { color: colors.muted, fontSize: 12, flex: 1 },
})
