import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import ProcessLayout from '../components/ProcessLayout';
import RepairLog from '../components/RepairLog';
import RepairMenu, { RepairMode } from '../components/RepairMenu';
import RepairScanner from '../components/RepairScanner';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Repairs'>;

const TITLE: Record<RepairMode, string> = {
  scan: 'Repairs · Scan',
  log: 'Repairs · Log',
};

// Repairs / Reorders: a menu first — scan a panel Cleaning marked defective
// once it's been repaired (completes it) or found it can't be (reorder), or
// look through the log of everything that went to Repairs.
// Mold users (REORDERS) get the same menu, but their scan can only send a
// panel to reorder.
const RepairsScreen: React.FC<Props> = ({ route }) => {
  const { operator } = route.params;
  const reorderOnly = operator.process === 'REORDERS';
  const [mode, setMode] = useState<RepairMode | null>(null);

  return (
    <ProcessLayout title={mode ? TITLE[mode] : 'Repairs'} operator={operator}>
      {mode && (
        <Pressable
          onPress={() => setMode(null)}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="chevron-back" size={22} color={colors.navy} />
          <Text style={styles.backText}>Menu</Text>
        </Pressable>
      )}
      {mode === null && (
        <RepairMenu
          operatorName={operator.name}
          reorderOnly={reorderOnly}
          onPick={setMode}
        />
      )}
      {mode === 'scan' && (
        <RepairScanner operator={operator} reorderOnly={reorderOnly} />
      )}
      {mode === 'log' && <RepairLog />}
    </ProcessLayout>
  );
};

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: -6,
  },
  pressed: {
    opacity: 0.6,
  },
  backText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
  },
});

export default RepairsScreen;
