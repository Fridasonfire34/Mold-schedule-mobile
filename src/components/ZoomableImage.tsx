import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';

interface Props {
  uri: string;
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;
// A touch that moved less than this is a tap, not a drag.
const TAP_SLOP = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distance = (touches: GestureResponderEvent['nativeEvent']['touches']) => {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

// Full-screen photo you can pinch to zoom (up to 5×), drag around while
// zoomed, and double-tap to zoom in / back out. Plain JS (PanResponder), so
// it needs no native module.
const ZoomableImage: React.FC<Props> = ({ uri }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Current values (Animated values can't be read synchronously).
  const current = useRef({ scale: 1, x: 0, y: 0 });
  // Where the gesture in progress started from.
  const gesture = useRef({
    mode: 'none' as 'none' | 'pinch' | 'pan',
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    originDx: 0,
    originDy: 0,
  });
  const lastTap = useRef(0);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const apply = (s: number, x: number, y: number) => {
    // Keep the photo covering the screen: it can't be dragged past its edges.
    const maxX = (sizeRef.current.width * (s - 1)) / 2;
    const maxY = (sizeRef.current.height * (s - 1)) / 2;
    const cx = clamp(x, -maxX, maxX);
    const cy = clamp(y, -maxY, maxY);
    current.current = { scale: s, x: cx, y: cy };
    scale.setValue(s);
    translateX.setValue(cx);
    translateY.setValue(cy);
  };

  const animateTo = (s: number, x: number, y: number) => {
    current.current = { scale: s, x, y };
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: x, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: y, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: () => {
          gesture.current.mode = 'none';
        },

        onPanResponderMove: (evt, g: PanResponderGestureState) => {
          const touches = evt.nativeEvent.touches;
          const state = gesture.current;

          if (touches.length >= 2) {
            if (state.mode !== 'pinch') {
              state.mode = 'pinch';
              state.startDistance = distance(touches) || 1;
              state.startScale = current.current.scale;
            }
            const s = clamp((state.startScale * distance(touches)) / state.startDistance, 1, MAX_SCALE);
            apply(s, current.current.x, current.current.y);
            return;
          }

          if (touches.length === 1 && current.current.scale > 1) {
            if (state.mode !== 'pan') {
              state.mode = 'pan';
              state.startX = current.current.x;
              state.startY = current.current.y;
              state.originDx = g.dx;
              state.originDy = g.dy;
            }
            apply(
              current.current.scale,
              state.startX + (g.dx - state.originDx),
              state.startY + (g.dy - state.originDy),
            );
          }
        },

        onPanResponderRelease: (_evt, g) => {
          const wasTap = gesture.current.mode === 'none' && Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP;
          gesture.current.mode = 'none';

          if (wasTap) {
            const now = Date.now();
            if (now - lastTap.current < DOUBLE_TAP_MS) {
              lastTap.current = 0;
              if (current.current.scale > 1) animateTo(1, 0, 0);
              else animateTo(DOUBLE_TAP_SCALE, 0, 0);
            } else {
              lastTap.current = now;
            }
            return;
          }

          // Barely zoomed: snap back to the whole photo.
          if (current.current.scale < 1.05) animateTo(1, 0, 0);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={styles.wrap} onLayout={onLayout} {...responder.panHandlers}>
      <Animated.View
        style={[
          styles.fill,
          { transform: [{ translateX }, { translateY }, { scale }] },
        ]}
      >
        <Image source={{ uri }} style={styles.fill} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});

export default ZoomableImage;
