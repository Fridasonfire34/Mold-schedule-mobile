import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card, Divider, GOOD_COLOR, Row } from './ui';
import { colors } from '../theme';

interface Props {
  result: 'GOOD' | 'DEFECT';
  defect: string | null;
  photoSaved: boolean;
  jobNumber: string;
  panel: string;
  moldName: string;
  assignedUnits: number;
  completeUnits: number;
}

// Confirmation after the inspection was saved.
const InspectionDoneCard: React.FC<Props> = ({
  result,
  defect,
  photoSaved,
  jobNumber,
  panel,
  moldName,
  assignedUnits,
  completeUnits,
}) => {
  const good = result === 'GOOD';
  const tint = good ? GOOD_COLOR : colors.danger;

  return (
    <Card>
      <View style={styles.top}>
        <View style={[styles.iconCircle, good ? styles.iconGood : styles.iconDefect]}>
          <Icon name={good ? 'checkmark-circle' : 'alert-circle'} size={34} color={tint} />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, { color: tint }]}>
            {good ? 'Panel complete' : 'Complete · sent to Repairs'}
          </Text>
          <Text style={styles.subtitle}>
            {good ? 'Saved in Mold Schedule.' : defect ?? 'Defect saved.'}
          </Text>
        </View>
      </View>

      <Divider />

      <Row label="Job Number" value={jobNumber} />
      <Row label="Panel" value={panel} />
      <Row label="Mold" value={moldName} />
      <Row label="Complete" value={`${completeUnits} of ${assignedUnits}`} />
      {!good && <Row label="Photo" value={photoSaved ? 'Saved' : 'None'} />}
      {!good && (
        <Text style={styles.hint}>
          It counts as complete. Repairs will fix it, or send it to reorder if it can't be fixed.
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGood: {
    backgroundColor: '#E8F5E9',
  },
  iconDefect: {
    backgroundColor: '#FDECEA',
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    color: colors.muted,
  },
  hint: {
    marginTop: 10,
    fontSize: 14,
    color: colors.muted,
  },
});

export default InspectionDoneCard;
