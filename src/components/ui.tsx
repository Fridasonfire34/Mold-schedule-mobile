import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { cardShadow, colors } from '../theme';

// Small building blocks shared by the scan result screens.

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

export const Divider: React.FC = () => <View style={styles.divider} />;

export const Row: React.FC<{ label: string; value: string; big?: boolean }> = ({
  label,
  value,
  big,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, big && styles.rowValueBig]}>{value}</Text>
  </View>
);

export const Notice: React.FC<{ icon: string; text: string; tone?: 'danger' | 'warn' }> = ({
  icon,
  text,
  tone = 'danger',
}) => {
  const color = tone === 'danger' ? colors.danger : colors.orange;
  return (
    <View style={[styles.notice, tone === 'warn' && styles.noticeWarn]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.noticeText, { color }]}>{text}</Text>
    </View>
  );
};

interface ButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'good' | 'defect' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

export const BigButton: React.FC<ButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}) => {
  const outline = variant === 'outline';
  const fg = outline ? colors.navy : colors.surface;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variant === 'good' && styles.buttonGood,
        variant === 'defect' && styles.buttonDefect,
        outline && styles.buttonOutline,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Icon name={icon} size={24} color={fg} />
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

export const GOOD_COLOR = '#2E7D32';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...cardShadow,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.muted,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowValueBig: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
  },
  noticeWarn: {
    backgroundColor: colors.orangeSoft,
  },
  noticeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    height: 60,
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGood: {
    backgroundColor: GOOD_COLOR,
  },
  buttonDefect: {
    backgroundColor: colors.danger,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
