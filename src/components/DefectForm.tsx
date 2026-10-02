import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';

import { BigButton, Card, Notice } from './ui';
import {
  DefectType,
  addDefectType,
  fetchDefectTypes,
  sortDefectTypes,
} from '../api/panels';
import { colors } from '../theme';

interface Props {
  saving: boolean;
  onSubmit: (defectTypeIds: number[], note: string, photoBase64: string | null) => void;
  onCancel: () => void;
}

interface Photo {
  uri: string;
  base64: string;
}

// "What's wrong with it?" — check every defect the panel has from
// [Defect Types]; checking one that needs it ("Other") asks for a short
// description. Once a defect is checked the operator can also take a photo
// of it (optional).
const DefectForm: React.FC<Props> = ({ saving, onSubmit, onCancel }) => {
  const [types, setTypes] = useState<DefectType[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<DefectType[]>([]);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchDefectTypes()
      .then(setTypes)
      .catch(() => setLoadError(true));
  }, []);

  const takePhoto = async () => {
    setPhotoError('');
    // Shrunk on the phone so upload and storage stay small (~200 KB); still
    // plenty to see the defect.
    const response = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      saveToPhotos: false,
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.6,
    });
    if (response.didCancel) return;
    const asset = response.assets?.[0];
    if (response.errorCode || !asset?.base64 || !asset.uri) {
      setPhotoError(
        response.errorCode === 'camera_unavailable'
          ? 'The camera is not available.'
          : 'Could not take the photo. Try again.',
      );
      return;
    }
    setPhoto({ uri: asset.uri, base64: asset.base64 });
  };

  const toggle = (type: DefectType) =>
    setSelected(prev =>
      prev.some(t => t.id === type.id) ? prev.filter(t => t.id !== type.id) : [...prev, type],
    );

  // "Add to the list": the text typed under "Other" becomes a defect of its
  // own, for everyone from now on, and replaces "Other" in this selection.
  const addToList = async () => {
    setAddError('');
    setAdding(true);
    const result = await addDefectType(note.trim());
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
    setSelected(prev => [...prev.filter(t => !t.requiresNote && t.id !== added.id), added]);
    setNote('');
  };

  const needsNote = selected.some(t => t.requiresNote);
  const canSubmit = selected.length > 0 && (!needsNote || note.trim().length > 0);

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>What's wrong with it?</Text>
        <Text style={styles.subtitle}>Check every defect it has</Text>

        {loadError ? (
          <Notice icon="cloud-offline-outline" text="Could not load the defect list." />
        ) : !types ? (
          <ActivityIndicator color={colors.navy} style={styles.loading} />
        ) : (
          <View style={styles.options}>
            {types.map(type => {
              const active = selected.some(t => t.id === type.id);
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

        {needsNote && (
          <TextInput
            style={styles.note}
            value={note}
            onChangeText={setNote}
            placeholder="Describe the defect"
            placeholderTextColor={colors.faint}
            maxLength={100}
            autoFocus
          />
        )}
        {needsNote && (
          <View style={styles.addRow}>
            <BigButton
              label="Add to the list"
              icon="add-circle-outline"
              variant="outline"
              loading={adding}
              disabled={saving || note.trim().length === 0}
              onPress={addToList}
            />
            <Text style={styles.addHint}>
              Saves this defect so it shows up in the list from now on.
            </Text>
            {addError ? <Notice icon="alert-circle-outline" text={addError} /> : null}
          </View>
        )}
      </Card>

      {selected.length > 0 && (
        <Card>
          <Text style={styles.title}>Photo of the defect</Text>
          <Text style={styles.subtitle}>Optional</Text>

          {photo ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
              <View style={styles.photoActions}>
                <View style={styles.photoAction}>
                  <BigButton label="Retake" icon="camera-reverse-outline" variant="outline" onPress={takePhoto} disabled={saving} />
                </View>
                <View style={styles.photoAction}>
                  <BigButton label="Remove" icon="trash-outline" variant="outline" onPress={() => setPhoto(null)} disabled={saving} />
                </View>
              </View>
            </View>
          ) : (
            <BigButton label="Take a photo" icon="camera-outline" variant="outline" onPress={takePhoto} disabled={saving} />
          )}

          {photoError ? (
            <View style={styles.photoError}>
              <Notice icon="alert-circle-outline" text={photoError} />
            </View>
          ) : null}
        </Card>
      )}

      <BigButton
        label={selected.length > 1 ? `Save ${selected.length} defects` : "Save defect"}
        icon="alert-circle"
        variant="defect"
        disabled={!canSubmit}
        loading={saving}
        onPress={() => onSubmit(selected.map(t => t.id), note.trim(), photo?.base64 ?? null)}
      />
      <BigButton label="Back" icon="arrow-back" variant="outline" onPress={onCancel} disabled={saving} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
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
  loading: {
    marginVertical: 20,
  },
  options: {
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
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
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
  photoWrap: {
    gap: 10,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: colors.field,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoAction: {
    flex: 1,
  },
  photoError: {
    marginTop: 10,
  },
});

export default DefectForm;
