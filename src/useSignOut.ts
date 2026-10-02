import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from './navigation/types';

// Back to the code screen. After a Cleaning inspection the session itself is
// already cleared (see clearSession); this only leaves the screen, when the
// cleaner taps Done — nothing times out on its own, so the label stays up
// for as long as they need it.
export function useSignOut() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return useCallback(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), [navigation]);
}
