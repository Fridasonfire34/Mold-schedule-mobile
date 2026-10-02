import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card, Notice } from './ui';
import { Mold, fetchMolds } from '../api/panels';
import { colors } from '../theme';

export interface PickedMold {
  code: string;
  name: string;
}

interface Props {
  value: PickedMold;
  // The mold the unit was assigned to in Mold Schedule.
  assignedCode: string;
  // The unit's [Panel Identifier]: only molds for that kind of panel are offered.
  panelIdentifier: string | null;
  onChange: (mold: PickedMold) => void;
  // Once the operator confirms the mold it's shown locked; Edit (onEdit)
  // goes back to choosing it.
  confirmed?: boolean;
  onEdit?: () => void;
  disabled?: boolean;
}

// "Completed in": the mold the panel actually came out of. Starts on the
// assigned mold; Change opens the molds that make this kind of panel
// (grouped, the assigned mold's group first).
const MoldPicker: React.FC<Props> = ({
  value,
  assignedCode,
  panelIdentifier,
  onChange,
  confirmed = false,
  onEdit,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [molds, setMolds] = useState<Mold[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open || molds) return;
    fetchMolds(panelIdentifier, assignedCode)
      .then(setMolds)
      .catch(() => setLoadError(true));
  }, [open, molds, panelIdentifier, assignedCode]);

  const groups = useMemo(() => {
    if (!molds) return [];
    const assignedGroup = molds.find(m => m.code === assignedCode)?.group;
    const byGroup = new Map<string, Mold[]>();
    for (const mold of molds) {
      byGroup.set(mold.group, [...(byGroup.get(mold.group) ?? []), mold]);
    }
    return [...byGroup.entries()].sort(([a], [b]) =>
      a === assignedGroup ? -1 : b === assignedGroup ? 1 : a.localeCompare(b),
    );
  }, [molds, assignedCode]);

  const isAssigned = value.code === assignedCode;

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.texts}>
          <Text style={styles.label}>Completed in</Text>
          <Text style={styles.value}>{value.name}</Text>
          <Text style={[styles.hint, !isAssigned && styles.hintChanged]}>
            {isAssigned ? 'Assigned mold' : 'Different from the assigned mold'}
          </Text>
        </View>
        {confirmed && <Icon name="checkmark-circle" size={26} color={colors.navy} />}
        <Pressable
          onPress={() => (confirmed ? onEdit?.() : setOpen(prev => !prev))}
          disabled={disabled}
          accessibilityRole="button"
          style={({ pressed }) => [styles.change, pressed && styles.changePressed]}
        >
          <Text style={styles.changeText}>{confirmed ? 'Edit' : open ? 'Close' : 'Change'}</Text>
        </Pressable>
      </View>

      {open &&
        !confirmed &&
        (loadError ? (
          <View style={styles.list}>
            <Notice icon="cloud-offline-outline" text="Could not load the molds." />
          </View>
        ) : !molds ? (
          <ActivityIndicator color={colors.navy} style={styles.loading} />
        ) : (
          <View style={styles.list}>
            {groups.map(([group, items]) => (
              <View key={group} style={styles.group}>
                <Text style={styles.groupTitle}>{group}</Text>
                {items.map(mold => {
                  const active = mold.code === value.code;
                  return (
                    <Pressable
                      key={mold.code}
                      onPress={() => {
                        onChange({ code: mold.code, name: mold.name });
                        setOpen(false);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Icon
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={active ? colors.navy : colors.faint}
                      />
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {mold.name}
                      </Text>
                      {mold.code === assignedCode && <Text style={styles.assignedTag}>assigned</Text>}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  texts: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  value: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  hint: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  hintChanged: {
    color: colors.orange,
    fontWeight: '700',
  },
  change: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePressed: {
    backgroundColor: colors.navySoft,
  },
  changeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  loading: {
    marginTop: 16,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
  },
  optionActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navySoft,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionTextActive: {
    fontWeight: '700',
  },
  assignedTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
  },
});

export default MoldPicker;
