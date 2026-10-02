import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface Props {
  jobNumber: string;
  panel: string;
  // From Mold Schedule, once the lookup found the panel.
  hgt?: string | null;
  width?: string | null;
  moldName?: string | null;
}

// The scanned panel as a small table, labels on the left:
//   Job Number  124-0361-TB
//   Panel       C11    HGT: 126.5   WIDTH: 35G
//   Mold        35's Ceiling
const PanelInfo: React.FC<Props> = ({ jobNumber, panel, hgt, width, moldName }) => (
  <View style={styles.table}>
    <View style={styles.row}>
      <Text style={styles.label}>Job Number</Text>
      <Text style={styles.big}>{jobNumber}</Text>
    </View>

    <View style={styles.row}>
      <Text style={styles.label}>Panel</Text>
      <View style={styles.panelValues}>
        <Text style={styles.big}>{panel}</Text>
        {hgt ? (
          <Text style={styles.measure}>
            <Text style={styles.measureLabel}>HGT: </Text>
            {hgt}
          </Text>
        ) : null}
        {width ? (
          <Text style={styles.measure}>
            <Text style={styles.measureLabel}>WIDTH: </Text>
            {width}
          </Text>
        ) : null}
      </View>
    </View>

    {moldName ? (
      <View style={styles.row}>
        <Text style={styles.label}>Mold</Text>
        <Text style={styles.value}>{moldName}</Text>
      </View>
    ) : null}
  </View>
);

const LABEL_WIDTH = 104;

const styles = StyleSheet.create({
  table: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: LABEL_WIDTH,
    fontSize: 15,
    color: colors.muted,
  },
  big: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  value: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  panelValues: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 60,
    rowGap: 2,
  },
  measure: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  measureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
});

export default PanelInfo;
