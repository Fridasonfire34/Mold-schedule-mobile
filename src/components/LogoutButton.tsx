import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { clearSession } from '../session';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

// Sits in the navy header. Asks first: on a shared phone, an accidental tap
// would make the next person wait for whoever was signed in to come back
// and type their code.
const LogoutButton: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const confirm = () => {
    Alert.alert('Log out?', 'The next person will enter their own code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={confirm}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="log-out-outline" size={18} color={colors.surface} />
      <Text style={styles.text}>Log out</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: colors.navy,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
});

export default LogoutButton;
