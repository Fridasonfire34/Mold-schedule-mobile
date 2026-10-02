import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/Ionicons';

import { colors } from '../theme';

export interface ScannedCode {
  value: string;
  format: string;
}

interface Props {
  hint: string;
  onScan: (code: ScannedCode) => void;
}

const CORNER = 40;
const STROKE = 4;
const ACCENT = '#ff0000';
// Gap between the dark area's edge and the corner guides. The guides stretch
// with the area, so they always outline almost all of it on any phone.
const INSET = 16;
// Keeps the moving line off the corner guides at both ends of its sweep.
const LINE_MARGIN = 12;
// One trip of the line from top to bottom.
const SWEEP_MS = 1800;

type Permission = 'checking' | 'granted' | 'denied' | 'blocked';

async function requestCamera(): Promise<Permission> {
  if (Platform.OS !== 'android') return 'granted';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
}

// The scan area of a process screen: operators just point the phone at a
// label, there is no button to press first. It reports the first code it
// reads; the screen then swaps it out for the result.
const ScanFrame: React.FC<Props> = ({ hint, onScan }) => {
  const [permission, setPermission] = useState<Permission>('checking');
  const [targetHeight, setTargetHeight] = useState(0);
  const reported = useRef(false);
  const sweep = useRef(new Animated.Value(0)).current;

  // The line sweeps up and down while the camera is looking for a code.
  useEffect(() => {
    if (permission !== 'granted' || targetHeight === 0) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: SWEEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: SWEEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [permission, targetHeight, sweep]);

  const lineTranslate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [LINE_MARGIN, Math.max(targetHeight - LINE_MARGIN, LINE_MARGIN)],
  });

  useEffect(() => {
    requestCamera().then(setPermission);

    // Coming back from the phone's Settings after allowing the camera there.
    const sub = AppState.addEventListener('change', async state => {
      if (state !== 'active' || Platform.OS !== 'android') return;
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (granted) setPermission('granted');
    });
    return () => sub.remove();
  }, []);

  // The camera fires several reads per second while a label is in view; only
  // the first one counts until the screen shows this frame again.
  const handleRead = useCallback(
    (value: string, format: string) => {
      if (reported.current) return;
      reported.current = true;
      onScan({ value, format });
    },
    [onScan],
  );

  const askAgain = async () => {
    if (permission === 'blocked') {
      Linking.openSettings();
      return;
    }
    setPermission(await requestCamera());
  };

  return (
    <View style={styles.area}>
      {permission === 'granted' ? (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          scanBarcode
          showFrame={false}
          onReadCode={event =>
            handleRead(event.nativeEvent.codeStringValue, String(event.nativeEvent.codeFormat))
          }
        />
      ) : permission !== 'checking' ? (
        <View style={styles.noCamera}>
          <Icon name="camera-outline" size={40} color={colors.surface} />
          <Text style={styles.noCameraText}>
            The app needs the camera to scan labels.
          </Text>
          <Pressable
            onPress={askAgain}
            accessibilityRole="button"
            style={({ pressed }) => [styles.allowButton, pressed && styles.allowPressed]}
          >
            <Text style={styles.allowText}>
              {permission === 'blocked' ? 'Open settings' : 'Allow camera'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {permission === 'granted' && (
        <>
          <View
            style={styles.target}
            pointerEvents="none"
            onLayout={event => setTargetHeight(event.nativeEvent.layout.height)}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Animated.View
              style={[styles.line, { transform: [{ translateY: lineTranslate }] }]}
            />
          </View>
          <Text style={styles.hint} pointerEvents="none">
            {hint}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    minHeight: 100,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  target: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    right: INSET,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: ACCENT,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: 12,
  },
  line: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  hint: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  noCamera: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  noCameraText: {
    color: colors.surface,
    fontSize: 16,
    textAlign: 'center',
  },
  allowButton: {
    marginTop: 4,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowPressed: {
    opacity: 0.8,
  },
  allowText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
});

export default ScanFrame;
