import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { Operator } from '../api/auth';
import LogoutButton from './LogoutButton';
import { colors } from '../theme';

interface Props {
  title: string;
  operator: Operator;
  children: React.ReactNode;
}

const today = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// Shared frame for every process screen: a slim navy bar with the process
// and Log out, a white strip with who's signed in and today's date, then the
// screen's own content and the logo at the bottom.
const ProcessLayout: React.FC<Props> = ({ title, operator, children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <LogoutButton />
      </View>

      <View style={styles.strip}>
        <Icon name="person-circle-outline" size={20} color={colors.navy} />
        <Text style={styles.stripText} numberOfLines={1}>
          <Text style={styles.stripName}>{operator.name}</Text>
          {`  ·  ${operator.dept}  ·  ${today()}`}
        </Text>
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Image
          style={styles.footerLogo}
          source={require('../assets/images/Tafco-logo.png')}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    flexShrink: 1,
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stripText: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.muted,
  },
  stripName: {
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 4,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  footerLogo: {
    width: 110,
    height: 40,
    opacity: 0.8,
  },
});

export default ProcessLayout;
