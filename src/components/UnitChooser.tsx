import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card } from './ui';
import { RepairUnit, defectPhotoUrl, formatServerTime } from '../api/repairs';
import { colors } from '../theme';

interface Props {
  jobNumber: string;
  // Part Number from the label, e.g. C04.
  panel: string;
  units: RepairUnit[];
  onPick: (unit: RepairUnit) => void;
}

// More than one unit of the scanned panel is DEFECTIVE and the label can't
// tell them apart: the operator selects the piece in front of them by its
// defect (plus when it was marked and the photo, when there is one).
const UnitChooser: React.FC<Props> = ({ jobNumber, panel, units, onPick }) => (
  <Card>
    <Text style={styles.title}>
      Multiple Defective Panels {panel} from {jobNumber}
    </Text>
    <Text style={styles.subtitle}>
      {units.length} are in repair. Select the one in front of you.
    </Text>

    <View style={styles.list}>
      {units.map(unit => {
        const markedAt = formatServerTime(unit.markedAt);
        const marked = [markedAt, unit.markedByName && `by ${unit.markedByName}`].filter(Boolean).join(' ');
        return (
          <Pressable
            key={unit.idOk}
            onPress={() => onPick(unit)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            {unit.hasPhoto ? (
              <Image source={{ uri: defectPhotoUrl(unit.idOk) }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.noPhoto]}>
                <Icon name="image-outline" size={22} color={colors.faint} />
                <Text style={styles.noPhotoText}>No photo</Text>
              </View>
            )}
            <View style={styles.texts}>
              <Text style={styles.defect}>
                <Text style={styles.piece}>{panel} - </Text>
                {unit.defect || 'Defect not specified'}
              </Text>
              {marked ? <Text style={styles.meta}>Marked {marked}</Text> : null}
              <Text style={styles.meta}>{unit.moldName}</Text>
            </View>
            <Icon name="chevron-forward" size={22} color={colors.navy} />
          </Pressable>
        );
      })}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 14,
    color: colors.muted,
  },
  list: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
  },
  optionPressed: {
    borderColor: colors.navy,
    backgroundColor: colors.navySoft,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noPhotoText: {
    marginTop: 2,
    fontSize: 11,
    color: colors.faint,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  piece: {
    color: colors.navy,
  },
  defect: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.danger,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
  },
});

export default UnitChooser;
