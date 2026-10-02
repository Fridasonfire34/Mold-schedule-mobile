import AsyncStorage from '@react-native-async-storage/async-storage';
import { Operator } from './api/auth';

const SESSION_KEY = 'moldschedule.session';

// Operators sign in once per shift; after this long the app asks for the
// code again, so a phone left behind doesn't keep marking panels under the
// previous shift's name.
const SHIFT_MS = 12 * 60 * 60 * 1000;

interface StoredSession {
  operator: Operator;
  signedInAt: number;
}

export async function saveSession(operator: Operator): Promise<void> {
  const session: StoredSession = { operator, signedInAt: Date.now() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// The signed-in operator, or null when there's no session or the shift ran out.
export async function loadSession(): Promise<Operator | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session: StoredSession = JSON.parse(raw);
    if (Date.now() - session.signedInAt > SHIFT_MS) {
      await clearSession();
      return null;
    }
    return session.operator;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
