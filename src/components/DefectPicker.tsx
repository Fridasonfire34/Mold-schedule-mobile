import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { BigButton, Card, Notice } from './ui';
import {
  DefectType,
  addDefectType,
  fetchDefectTypes,
  sortDefectTypes,
} from '../api/panels';
import { DefectSelection } from '../api/repairs';
import { colors } from '../theme';

interface Props {
  value: DefectSelection;
  onChange: (value: DefectSelection) => void;
  // Once the operator confirms the defect it's shown locked; Edit (onEdit)
  // goes back to changing it.
  confirmed?: boolean;
  onEdit?: () => void;
  // Whether the selection can be confirmed: at least one defect, and the
  // text when "Other" is checked.
  onValidChange?: (valid: boolean) => void;
  disabled?: boolean;
  // Repairs (not Reorders): "Add to the list" under "Other", like Cleaning.
  canAdd?: boolean;
}

// Repairs' "Defect": starts on what Cleaning checked; Change opens the same
// checklist Cleaning uses to fix it before deciding Repair or Reorder
// (and, for Repairs, the same "Add to the list" under "Other").
const DefectPicker: React.FC<Props> = ({
  value,
  onChange,
  confirmed = false,
  onEdit,
  onValidChange,
  disabled,
  canAdd = false,
}) => {
  const [types, setTypes] = useState<DefectType[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Nothing preselected (a unit flagged before inspections were recorded)
  // opens the list right away.
  const [open, setOpen] = useState(value.defectTypeIds.length === 0);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchDefectTypes()
      .then(setTypes)
      .catch(() => setLoadError(true));
  }, []);

  const selected = (types ?? []).filter(t => value.defectTypeIds.includes(t.id));
  const summary = selected
    .map(t => (t.requiresNote ? `${t.name}: ${value.note || '…'}` : t.name))
    .join(', ');

  const toggle = (type: DefectType) => {
    const ids = value.defectTypeIds.includes(type.id)
      ? value.defectTypeIds.filter(id => id !== type.id)
      : [...value.defectTypeIds, type.id];
    onChange({ ...value, defectTypeIds: ids });
  };

  // "Add to the list": the text typed under "Other" becomes a defect of its
  // own, for everyone from now on, and replaces "Other" in this selection.
  const addToList = async () => {
    setAddError('');
    setAdding(true);
    const result = await addDefectType(value.note.trim());
    setAdding(false);
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    const added = result.defectType;
    setTypes(prev => {
      if (!prev || prev.some(t => t.id === added.id)) return prev;
      return sortDefectTypes([...prev, added]);
    });
    const noteIds = (types ?? []).filter(t => t.requiresNote).map(t => t.id);
    onChange({
      defectTypeIds: [
        ...value.defectTypeIds.filter(id => !noteIds.includes(id) && id !== added.id),
        added.id,
      ],
      note: '',
    });
  };

  const needsNote = selected.some(t => t.requiresNote);
  const showList = open && !confirmed;
  const valid = selected.length > 0 && (!needsNote || value.note.trim().length > 0);

  useEffect(() => {
    onValidChange?.(valid);
  }, [valid, onValidChange]);

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.texts}>
          <Text style={styles.label}>Defect</Text>
          {!types && !loadError ? (
            <ActivityIndicator color={colors.navy} style={styles.inlineLoading} />
          ) : (
            <Text style={[styles.value, !summary && styles.valueEmpty]}>
              {summary || 'Pick at least one defect'}
            </Text>
          )}
        </View>
        {confirmed && <Icon name="checkmark-circle" size={26} color={colors.navy} />}
        <Pressable
          onPress={() => (confirmed ? onEdit?.() : setOpen(prev => !prev))}
          disabled={disabled}
          accessibilityRole="button"
          style={({ pressed }) => [styles.change, pressed && styles.changePressed]}
        >
          <Text style={styles.changeText}>{confirmed ? 'Edit' : showList ? 'Close' : 'Change'}</Text>
        </Pressable>
      </View>

      {loadError && (
        <View style={styles.list}>
          <Notice icon="cloud-offline-outline" text="Could not load the defect list." />
        </View>
      )}

      {showList && types && (
        <View style={styles.list}>
          {types.map(type => {
            const active = value.defectTypeIds.includes(type.id);
            return (
              <Pressable
                key={type.id}
                onPress={() => toggle(type)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Icon
                  name={active ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={active ? colors.danger : colors.faint}
                />
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {type.requiresNote ? `${type.name} - specify below` : type.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!confirmed && needsNote && (
        <TextInput
          style={styles.note}
          value={value.note}
          onChangeText={note => onChange({ ...value, note })}
          placeholder="Describe the defect"
          placeholderTextColor={colors.faint}
          maxLength={100}
        />
      )}
      {!confirmed && needsNote && canAdd && (
        <View style={styles.addRow}>
          <BigButton
            label="Add to the list"
            icon="add-circle-outline"
            variant="outline"
            loading={adding}
            disabled={disabled || value.note.trim().length === 0}
            onPress={addToList}
          />
          <Text style={styles.addHint}>
            Saves this defect so it shows up in the list from now on.
          </Text>
          {addError ? <Notice icon="alert-circle-outline" text={addError} /> : null}
        </View>
      )}
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
    color: colors.danger,
  },
  valueEmpty: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  inlineLoading: {
    alignSelf: 'flex-start',
    marginTop: 6,
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
  list: {
    marginTop: 12,
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
  },
  optionActive: {
    borderColor: colors.danger,
    backgroundColor: '#FDECEA',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionTextActive: {
    fontWeight: '700',
  },
  note: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  addRow: {
    marginTop: 10,
    gap: 8,
  },
  addHint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default DefectPicker;
