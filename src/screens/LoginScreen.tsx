import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { loginWithCode } from '../api/auth';
import { saveSession } from '../session';
import { PROCESS_SCREEN, RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// The code is the operator's [Users] ID, which can be any length.
const MAX_LENGTH = 10;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete', '0', 'enter'];

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (fullCode: string) => {
    setLoading(true);
    const result = await loginWithCode(fullCode);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setCode('');
      return;
    }

    await saveSession(result.operator);
    setCode('');
    navigation.reset({
      index: 0,
      routes: [
        {
          name: PROCESS_SCREEN[result.operator.process],
          params: { operator: result.operator },
        },
      ],
    });
  };

  const press = (key: string) => {
    if (loading || !key) return;
    setError('');

    if (key === 'delete') {
      setCode(prev => prev.slice(0, -1));
      return;
    }
    if (key === 'enter') {
      if (code) submit(code);
      return;
    }

    setCode((code + key).slice(0, MAX_LENGTH));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.top}>
        <Image
          style={styles.logo}
          source={require('../assets/images/Tafco-logo.png')}
          resizeMode="contain"
        />
        <Text style={styles.title}>Panel Tracking</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.prompt}>Enter your ID</Text>

        <View style={[styles.codeBox, code !== '' && styles.codeBoxFilled]}>
          <Text style={[styles.codeText, !code && styles.codePlaceholder]}>
            {code || 'ID'}
          </Text>
        </View>

        <View style={styles.status}>
          {loading ? (
            <ActivityIndicator color={colors.navy} size="large" />
          ) : error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            onPress={() => press(key)}
            disabled={!key || loading}
            accessibilityRole="button"
            accessibilityLabel={
              key === 'delete' ? 'Delete' : key === 'enter' ? 'Enter' : key
            }
            style={({ pressed }) => [
              styles.key,
              key === 'enter' && styles.keyEnter,
              key === 'enter' && !code && styles.keyDisabled,
              pressed && styles.keyPressed,
            ]}
          >
            {key === 'delete' ? (
              <Icon name="backspace-outline" size={28} color={colors.navy} />
            ) : key === 'enter' ? (
              <Icon name="arrow-forward" size={30} color={colors.surface} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Icon name="help-circle-outline" size={14} color={colors.faint} />
        <Text style={styles.footerText}>Forgot your code? Ask your supervisor.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  top: {
    alignItems: 'center',
    paddingTop: 28,
  },
  logo: {
    width: 200,
    height: 84,
  },
  title: {
    marginTop: 14,
    fontSize: 24,
    color: colors.navy,
    fontFamily: fonts.title,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  codeBox: {
    minWidth: 220,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderBottomColor: colors.navy,
  },
  codeText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.navy,
  },
  codePlaceholder: {
    color: colors.border,
  },
  status: {
    minHeight: 56,
    justifyContent: 'center',
    marginTop: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 28,
  },
  key: {
    width: '31%',
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEnter: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyPressed: {
    backgroundColor: colors.navySoft,
    borderColor: colors.navy,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.navy,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 22,
  },
  footerText: {
    fontSize: 12,
    color: colors.faint,
  },
});

export default LoginScreen;
