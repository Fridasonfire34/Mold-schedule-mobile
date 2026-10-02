import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import ProcessLayout from '../components/ProcessLayout';
import { RootStackParamList } from '../navigation/types';
import { cardShadow, colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const OPTIONS: {
  screen: 'Cleaning' | 'Repairs';
  icon: string;
  title: string;
  hint: string;
  tint: string;
  soft: string;
}[] = [
  {
    screen: 'Cleaning',
    icon: 'sparkles',
    title: 'Cleaning',
    hint: 'Scan a panel after cleaning: QC Pass, or needs Repair.',
    tint: colors.navy,
    soft: colors.navySoft,
  },
  {
    screen: 'Repairs',
    icon: 'construct',
    title: 'Repairs',
    hint: 'Repaired or reorder panels. Repair & reorder log.',
    tint: colors.orange,
    soft: colors.orangeSoft,
  },
];

// Administrators can do everything: they pick the process here. Back (or
// Menu) from a process returns here.
const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { operator } = route.params;
  const firstName = operator.name.split(/\s+/)[0];

  return (
    <ProcessLayout title="Panel Tracking" operator={operator}>
      <View style={styles.menu}>
        <View>
          <Text style={styles.hello}>Hi, {firstName}</Text>
          <Text style={styles.sub}>Choose a process</Text>
        </View>

        {OPTIONS.map(option => (
          <Pressable
            key={option.screen}
            onPress={() => navigation.navigate(option.screen, { operator })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <View style={[styles.accent, { backgroundColor: option.tint }]} />
            <View style={[styles.iconRing, { backgroundColor: option.soft }]}>
              <Icon name={option.icon} size={40} color={option.tint} />
            </View>
            <View style={styles.texts}>
              <Text style={[styles.title, { color: option.tint }]}>{option.title}</Text>
              <Text style={styles.hint}>{option.hint}</Text>
            </View>
            <View style={[styles.arrow, { backgroundColor: option.tint }]}>
              <Icon name="arrow-forward" size={22} color={colors.surface} />
            </View>
          </Pressable>
        ))}
      </View>
    </ProcessLayout>
  );
};

const styles = StyleSheet.create({
  menu: {
    flex: 1,
    gap: 18,
    paddingTop: 6,
  },
  hello: {
    fontFamily: fonts.title,
    fontSize: 28,
    color: colors.navy,
  },
  sub: {
    marginTop: 6,
    fontSize: 16,
    color: colors.muted,
  },
  tile: {
    flex: 1,
    maxHeight: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    paddingLeft: 30,
    overflow: 'hidden',
    ...cardShadow,
    elevation: 6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  hint: {
    fontSize: 15,
    color: colors.muted,
  },
  arrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
