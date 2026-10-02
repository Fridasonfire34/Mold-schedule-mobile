import axios from 'axios';
import api from './client';

// See tafco-main src/lib/mobileAccess.ts: ADMIN picks any process on the Home
// screen; REORDERS is Repairs limited to sending panels to reorder.
export type Process = 'ADMIN' | 'CLEANING' | 'ACCEPT' | 'REPAIRS' | 'REORDERS';

export interface Operator {
  id: number;
  name: string;
  dept: string;
  process: Process;
}

export type LoginResult =
  | { ok: true; operator: Operator }
  | { ok: false; message: string };

// POST /login { code } — see tafco-main src/app/api-mobile/molds/login.
// Returns a message ready to show on screen instead of throwing, since every
// failure here ends the same way: tell the operator and clear the code.
export async function loginWithCode(code: string): Promise<LoginResult> {
  try {
    const { data } = await api.post<{ operator: Operator }>('/login', { code });
    return { ok: true, operator: data.operator };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      if (status === 401 || status === 400) {
        return { ok: false, message: 'Wrong code. Try again.' };
      }
      if (status === 409) {
        return { ok: false, message: data?.error ?? 'Ask your supervisor for a new code.' };
      }
      return { ok: false, message: 'Server error. Try again in a moment.' };
    }
    return { ok: false, message: 'No connection to the server. Check the Wi-Fi.' };
  }
}
