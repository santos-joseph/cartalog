import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Expo Web is used only for local previews. Credentials persist on native devices only.
export const storage = {
  get: (key: string) => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value),
  remove: (key: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key),
}
