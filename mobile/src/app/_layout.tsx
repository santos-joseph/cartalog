import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/context/auth'
import { colors } from '@/constants/theme'
import { BrandMark, Button } from '@/components/ui'

function Navigation() {
  const { status, bootError, session, retryRestore, logout } = useAuth()

  if (status === 'loading') return <SafeAreaView style={styles.center}>
    <BrandMark size={62} />
    <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 25 }} />
    <Text style={styles.loading}>Preparando seu atendimento...</Text>
  </SafeAreaView>

  if (status === 'error') return <SafeAreaView style={styles.center}>
    <BrandMark size={62} />
    <Text style={styles.title}>Sem conexão com a loja</Text>
    <Text style={styles.loading}>{bootError}</Text>
    <View style={styles.actions}>
      <Button onPress={() => void retryRestore()}>Tentar novamente</Button>
      <Button variant="outline" onPress={() => void logout().then(retryRestore)}>Trocar conta</Button>
    </View>
  </SafeAreaView>

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!session} redirectTo="/login">
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="lead/[id]" />
    </Stack.Protected>
  </Stack>
}

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Navigation /></AuthProvider></SafeAreaProvider>
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28 },
  loading: { marginTop: 18, color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  title: { marginTop: 22, color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  actions: { width: '100%', maxWidth: 300, gap: 10, marginTop: 28 },
})
