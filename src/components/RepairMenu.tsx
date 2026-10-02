import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { RepairCaseStatus, fetchRepairLog } from '../api/repairs';
import { cardShadow, colors, fonts } from '../theme';

export type RepairMode = 'scan' | 'log';

interface Props {
  operatorName: string;
  // Mold users: their scan can only send a panel to reorder.
  reorderOnly?: boolean;
  onPick: (mode: RepairMode) => void;
}

type Counts = Partial<Record<RepairCaseStatus, number>>;

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? 'Good morning'
    : hour < 19
    ? 'Good afternoon'
    : 'Good evening';
};

// What the Repairs operator sees after entering their code: a greeting, how
// many panels are waiting on Repairs, and two big tiles — scan a panel, or
// the log.
const RepairMenu: React.FC<Props> = ({
  operatorName,
  reorderOnly = false,
  onPick,
}) => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    // Only the counts are needed, so ask for the smallest page.
    fetchRepairLog({}, { limit: 1 }).then(result => {
      if (result.status === 'ok') setCounts(result.counts ?? {});
      setLoadingCounts(false);
    });
  }, []);

  const inRepair = counts?.['IN REPAIR'] ?? 0;
  const firstName = operatorName.split(/\s+/)[0];

  return (
    <View style={styles.menu}>
      <View>
        <Text style={styles.hello}>
          {greeting()}, {firstName}
        </Text>
        <Text style={styles.sub}>
          {counts === null
            ? 'What are we doing today?'
            : inRepair === 0
            ? 'No panels waiting on Repairs. 🎉'
            : `${inRepair} ${
                inRepair === 1 ? 'panel is' : 'panels are'
              } waiting on Repairs.`}
        </Text>
      </View>

      <View style={styles.tiles}>
        {/* Main action: solid navy. */}
        <Pressable
          onPress={() => onPick('scan')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.tile,
            styles.tileScan,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.blob, styles.blobBig]} />
          <View style={[styles.blob, styles.blobSmall]} />

          <View style={[styles.iconRing, styles.iconRingScan]}>
            <Icon name="scan" size={40} color={colors.navy} />
          </View>
          <View style={styles.tileTexts}>
            <Text style={[styles.tileTitle, styles.onNavy]}>Scan a panel</Text>
            <Text style={[styles.tileHint, styles.onNavySoft]}>
              {reorderOnly
                ? 'Send a defective panel to reorder'
                : 'Repaired, or send it to reorder'}
            </Text>
          </View>
          <View style={styles.tileFooter}>
            <View style={styles.pills}>
              {!reorderOnly && (
                <View style={[styles.pill, styles.pillGood]}>
                  <Icon name="checkmark-done" size={14} color="#1B5E20" />
                  <Text style={[styles.pillText, styles.pillGoodText]}>
                    Repaired
                  </Text>
                </View>
              )}
              <View style={[styles.pill, styles.pillReorder]}>
                <Icon name="refresh" size={14} color={colors.danger} />
                <Text style={[styles.pillText, styles.pillReorderText]}>
                  Reorder
                </Text>
              </View>
            </View>
            <View style={styles.arrowScan}>
              <Icon name="arrow-forward" size={22} color={colors.surface} />
            </View>
          </View>
        </Pressable>

        {/* Secondary: white with an orange accent. */}
        <Pressable
          onPress={() => onPick('log')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.tile,
            styles.tileLog,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.accent} />

          <View style={[styles.iconRing, styles.iconRingLog]}>
            <Icon name="time" size={38} color={colors.orange} />
          </View>
          <View style={styles.tileTexts}>
            <Text style={[styles.tileTitle, { color: colors.navy }]}>
              Repair & reorder log
            </Text>
            <Text style={styles.tileHint}>
              Every panel that went to Repairs
            </Text>
          </View>
          <View style={styles.tileFooter}>
            <View style={styles.stats}>
              <Stat
                n={counts?.['IN REPAIR']}
                loading={loadingCounts}
                label="In repair"
                color={colors.orange}
              />
              <Stat
                n={counts?.REPAIRED}
                loading={loadingCounts}
                label="Repaired"
                color="#2E7D32"
              />
              <Stat
                n={counts?.REORDER}
                loading={loadingCounts}
                label="Reorder"
                color={colors.danger}
              />
            </View>
            <View style={styles.arrowLog}>
              <Icon name="arrow-forward" size={22} color={colors.surface} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const Stat: React.FC<{
  n: number | undefined;
  loading: boolean;
  label: string;
  color: string;
}> = ({ n, loading, label, color }) => (
  <View style={styles.stat}>
    {loading ? (
      <ActivityIndicator color={color} style={styles.statSpinner} />
    ) : (
      <Text style={[styles.statNumber, { color }]}>{n ?? '–'}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  menu: {
    flex: 1,
    gap: 22,
    paddingTop: 6,
  },
  hello: {
    fontFamily: fonts.title,
    fontSize: 28,
    color: colors.navy,
  },
  sub: {
    marginTop: 6,
    fontSize: 16,
    color: colors.muted,
  },
  tiles: {
    flex: 1,
    gap: 18,
  },
  tile: {
    flex: 1,
    minHeight: 220,
    borderRadius: 24,
    padding: 24,
    gap: 18,
    overflow: 'hidden',
    ...cardShadow,
    elevation: 6,
  },
  tileScan: {
    backgroundColor: colors.navy,
  },
  tileLog: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  // Decorative circles on the navy tile.
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobBig: {
    width: 220,
    height: 220,
    top: -70,
    right: -60,
  },
  blobSmall: {
    width: 120,
    height: 120,
    bottom: -40,
    right: 90,
    backgroundColor: 'rgba(192,122,30,0.18)',
  },
  // Orange strip down the log tile's left edge.
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.orange,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingScan: {
    backgroundColor: colors.surface,
  },
  iconRingLog: {
    backgroundColor: colors.orangeSoft,
  },
  tileTexts: {
    flex: 1,
    gap: 6,
  },
  tileTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tileHint: {
    fontSize: 15,
    color: colors.muted,
  },
  onNavy: {
    color: colors.surface,
  },
  onNavySoft: {
    color: 'rgba(255,255,255,0.75)',
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pillGood: {
    backgroundColor: '#E8F5E9',
  },
  pillReorder: {
    backgroundColor: '#FDECEA',
  },
  pillGoodText: {
    color: '#1B5E20',
  },
  pillReorderText: {
    color: colors.danger,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  arrowScan: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLog: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    flexShrink: 1,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  // Same height as the number so the tile doesn't jump when it loads.
  statSpinner: {
    height: 34,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
});

export default RepairMenu;
