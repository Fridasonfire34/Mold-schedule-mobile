import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface Props {
  jobNumber: string;
  partNumber: string;
  // Cleaner's initials, e.g. F.G.
  initials: string;
  good: boolean;
  // NO GOOD only: the defects as saved, e.g. "Shallow groove, Soft foam".
  defect?: string | null;
}

// Label size in inches (width × height), and the margin kept clear on every
// side so nothing gets cut when it's printed.
const LABEL_W_IN = 6;
const LABEL_H_IN = 2;
const SAFE_MARGIN_IN = 0.2;

const STATUS = {
  // The printed label is in Spanish (the app's screens stay in English).
  good: { border: '#2E9E44', text: '#0B5E1C', label: 'QC PASS' },
  noGood: { border: '#D32F2F', text: '#C00000', label: 'REPAIR' },
};

// "Frida Gutierrez" -> "F.G" (first letter of each word, up to 3).
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('.');

// On-screen preview of the 6" × 2" label to print after a Cleaning
// inspection, in three columns: Job Number / Part Number / Cleaner, the
// GOOD (green) or NO GOOD (red) box, and — NO GOOD only — the defects as a
// list. Drawn to scale: every size is in label inches (`inch` = the
// preview's width / 6), everything inside a 0.2" safe margin. Same layout as
// the reference PDF (Etiqueta-Panel-6x2).
const LabelPreview: React.FC<Props> = ({ jobNumber, partNumber, initials, good, defect }) => {
  const [inch, setInch] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setInch(e.nativeEvent.layout.width / LABEL_W_IN);

  const status = good ? STATUS.good : STATUS.noGood;
  const defects = good ? [] : (defect ?? '').split(', ').map(d => d.trim()).filter(Boolean);
  const px = (inches: number) => inches * inch;

  const caption = [styles.caption, { fontSize: px(0.11) }];
  const value = [styles.value, { fontSize: px(0.23), marginBottom: px(0.03) }];

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Label preview</Text>
        <Text style={styles.size}>
          {LABEL_W_IN}" × {LABEL_H_IN}"
        </Text>
      </View>

      <View style={styles.label} onLayout={onLayout}>
        {inch > 0 && (
          <View style={[styles.content, { margin: px(SAFE_MARGIN_IN), gap: px(0.18) }]}>
            <View style={{ width: px(1.75), paddingLeft: px(0.1) }}>
              <Text style={caption}>JOB NUMBER:</Text>
              <Text style={value} numberOfLines={1} adjustsFontSizeToFit>
                {jobNumber}
              </Text>
              <Text style={caption}>PART NUMBER:</Text>
              <Text style={value} numberOfLines={1}>
                {partNumber}
              </Text>
              <View style={[styles.cleaner, { gap: px(0.05) }]}>
                <Text style={caption}>CLEANER:</Text>
                <Text style={[styles.value, { fontSize: px(0.23) }]}>{initials}</Text>
              </View>
            </View>

            <View
              style={[
                styles.status,
                {
                  width: px(1.9),
                  height: px(0.9),
                  borderRadius: px(0.12),
                  // No fill: just the coloured border and text.
                  borderWidth: Math.max(1.5, px(0.03)),
                  borderColor: status.border,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: status.text, fontSize: px(0.27) }]} numberOfLines={1}>
                {status.label}
              </Text>
            </View>

            <View style={styles.defects}>
              {defects.length > 0 && (
                <>
                  <Text style={[styles.defectsTitle, { fontSize: px(0.12), marginBottom: px(0.06) }]}>
                    DEFECTS:
                  </Text>
                  {defects.map(item => (
                    <View key={item} style={[styles.bullet, { marginBottom: px(0.02) }]}>
                      <Text style={[styles.defectText, { fontSize: px(0.125), width: px(0.17) }]}>•</Text>
                      <Text style={[styles.defectText, styles.defectItem, { fontSize: px(0.125) }]}>{item}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  size: {
    fontSize: 13,
    color: colors.muted,
  },
  label: {
    width: '100%',
    aspectRatio: LABEL_W_IN / LABEL_H_IN,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9AA3AE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  caption: {
    fontWeight: '700',
    color: '#7A7A7A',
  },
  value: {
    fontWeight: '700',
    color: '#000',
  },
  cleaner: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  status: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontWeight: '700',
  },
  defects: {
    flex: 1,
  },
  defectsTitle: {
    fontWeight: '700',
    color: '#000',
  },
  bullet: {
    flexDirection: 'row',
  },
  defectText: {
    color: '#000',
  },
  defectItem: {
    flex: 1,
  },
});

export default LabelPreview;
