import { Tabs } from 'expo-router'
import { BriefcaseBusiness, Inbox, UserRound } from 'lucide-react-native'
import { colors } from '@/constants/theme'

export default function TabsLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.red,
    tabBarInactiveTintColor: colors.faint,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 4 },
    tabBarStyle: { height: 66, paddingTop: 8, paddingBottom: 7, borderTopColor: colors.border, backgroundColor: colors.surface },
  }}>
    <Tabs.Screen name="fila" options={{ title: 'Fila', tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} strokeWidth={2} /> }} />
    <Tabs.Screen name="meus" options={{ title: 'Meus leads', tabBarIcon: ({ color, size }) => <BriefcaseBusiness size={size} color={color} strokeWidth={2} /> }} />
    <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} strokeWidth={2} /> }} />
  </Tabs>
}
