import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card, Notice } from './ui';
import ZoomableImage from './ZoomableImage';
import { colors } from '../theme';

interface Props {
  uri: string;
}

// The photo Cleaning took of the defect, for Repairs. Tap to see it full
// screen, where it can be zoomed (ZoomableImage).
const DefectPhotoCard: React.FC<Props> = ({ uri }) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);

  return (
    <Card>
      <Text style={styles.title}>Photo from Cleaning</Text>
      <Text style={styles.subtitle}>Tap to enlarge</Text>

      {failed ? (
        <Notice icon="image-outline" text="Could not load the photo." />
      ) : (
        <Pressable onPress={() => setFull(true)} accessibilityRole="imagebutton">
          <Image
            source={{ uri }}
            style={styles.photo}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
            onError={() => setFailed(true)}
          />
          {loading && <ActivityIndicator color={colors.navy} style={styles.loading} />}
        </Pressable>
      )}

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)}>
        <View style={styles.fullWrap}>
          <ZoomableImage uri={uri} />
          <Text style={styles.zoomHint} pointerEvents="none">
            Pinch to zoom · Double-tap to zoom in or out
          </Text>
          <Pressable
            onPress={() => setFull(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            style={styles.close}
          >
            <Icon name="close" size={30} color={colors.surface} />
          </Pressable>
        </View>
      </Modal>
    </Card>
  );
};

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
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: colors.field,
  },
  loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fullWrap: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: colors.surface,
    fontSize: 14,
  },
  close: {
    position: 'absolute',
    top: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DefectPhotoCard;
