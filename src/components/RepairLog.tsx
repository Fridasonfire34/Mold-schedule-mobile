import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card, Notice } from './ui';
import DatePickerModal, { formatIsoDate } from './DatePickerModal';
import {
  RepairCase,
  RepairCaseStatus,
  fetchRepairLog,
  formatServerTime,
} from '../api/repairs';
import { colors } from '../theme';

const STATUS_STYLE: Record<
  RepairCaseStatus,
  { label: string; fg: string; bg: string }
> = {
  'IN REPAIR': { label: 'In repair', fg: colors.orange, bg: colors.orangeSoft },
  REPAIRED: { label: 'Repaired', fg: '#2E7D32', bg: '#E8F5E9' },
  REORDER: { label: 'Reorder', fg: colors.danger, bg: '#FDECEA' },
  CANCELLED: { label: 'Cancelled', fg: colors.muted, bg: colors.divider },
};

// A reorder whose new piece Cleaning already marked Good.
const REORDER_COMPLETE_STYLE = {
  label: 'Reorder complete',
  fg: '#2E7D32',
  bg: '#E8F5E9',
};

const FILTERS: (RepairCaseStatus | null)[] = [
  null,
  'IN REPAIR',
  'REPAIRED',
  'REORDER',
];

type Counts = Partial<Record<RepairCaseStatus, number>>;

// "Mar 3, 2:15 PM · Frida Gutierrez"
const when = (at: string | null, by: string | null) =>
  [formatServerTime(at), by].filter(Boolean).join(' · ');

// The [Panel Repairs] log: newest first, filtered by status and by job or
// part number, a page at a time (more load when scrolling near the end).
// Pull down to refresh.
const RepairLog: React.FC = () => {
  const [status, setStatus] = useState<RepairCaseStatus | null>(null);
  const [search, setSearch] = useState('');
  // YYYY-MM-DD, or null for every day.
  const [date, setDate] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [cases, setCases] = useState<RepairCase[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The next page failed: the footer offers to try again.
  const [moreError, setMoreError] = useState(false);
  // First page for the current filters (spinner over the list)…
  const [loading, setLoading] = useState(true);
  // …the next page at the bottom…
  const [loadingMore, setLoadingMore] = useState(false);
  // …or pull to refresh.
  const [refreshing, setRefreshing] = useState(false);
  // Answers for filters that already changed are dropped.
  const requestId = useRef(0);

  const query = useMemo(
    () => ({ status: status ?? undefined, search, date: date ?? undefined }),
    [status, search, date],
  );

  const loadFirst = useCallback(async () => {
    const id = ++requestId.current;
    const result = await fetchRepairLog(query);
    if (id !== requestId.current) return;
    if (result.status === 'ok') {
      setCases(result.cases);
      setCounts(result.counts ?? {});
      setHasMore(result.hasMore);
      setError(null);
      setMoreError(false);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [query]);

  // Waits for a pause in typing before searching.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(loadFirst, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadFirst, search]);

  const fetchMore = async () => {
    if (!hasMore || loading || loadingMore || refreshing) return;
    const id = requestId.current;
    setMoreError(false);
    setLoadingMore(true);
    const result = await fetchRepairLog(query, { offset: cases.length });
    setLoadingMore(false);
    if (id !== requestId.current) return;
    if (result.status === 'ok') {
      setCases(prev => [...prev, ...result.cases]);
      setHasMore(result.hasMore);
    } else {
      setMoreError(true);
    }
  };

  // Scrolling near the end; after a failure only the footer's tap retries.
  const loadMore = () => {
    if (!moreError) fetchMore();
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  };

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const header = (
    <View style={styles.header}>
      <View style={styles.filtersRow}>
        <View style={[styles.searchBox, styles.searchGrow]}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Job or part number"
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {search !== '' && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Icon name="close-circle" size={20} color={colors.faint} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          style={[
            styles.searchBox,
            styles.dateBox,
            date !== null && styles.dateBoxActive,
          ]}
        >
          <Icon
            name="calendar-outline"
            size={20}
            color={date ? colors.surface : colors.navy}
          />
          <Text
            style={[styles.dateText, date !== null && styles.dateTextActive]}
          >
            {date ? formatIsoDate(date) : 'Any date'}
          </Text>
          {date !== null && (
            <Pressable
              onPress={() => setDate(null)}
              hitSlop={10}
              accessibilityLabel="Clear date"
            >
              <Icon name="close-circle" size={20} color={colors.surface} />
            </Pressable>
          )}
        </Pressable>
      </View>

      <View style={styles.chips}>
        {FILTERS.map(filter => {
          const active = filter === status;
          const n = filter ? counts[filter] ?? 0 : total;
          return (
            <Pressable
              key={filter ?? 'all'}
              onPress={() => setStatus(filter)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter ? STATUS_STYLE[filter].label : 'All'} ({n})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error !== null && !loading && (
        <Notice icon="cloud-offline-outline" text={error} />
      )}
    </View>
  );

  // The header stays put while loading so the search box keeps its focus.
  const footer = loadingMore ? (
    <View style={styles.more}>
      <ActivityIndicator color={colors.navy} />
      <Text style={styles.note}>Loading more…</Text>
    </View>
  ) : moreError ? (
    <Pressable
      onPress={fetchMore}
      accessibilityRole="button"
      style={styles.more}
    >
      <Text style={styles.note}>Could not load more. Tap to try again.</Text>
    </Pressable>
  ) : !loading && !hasMore && cases.length > 0 ? (
    <Text style={[styles.note, styles.end]}>That's all.</Text>
  ) : null;

  return (
    <>
      <FlatList
        data={loading ? [] : cases}
        keyExtractor={item => item.id}
        renderItem={renderCase}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.navy} />
            </View>
          ) : error === null ? (
            <Text style={styles.empty}>No panels here.</Text>
          ) : null
        }
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        // Keeps long lists light: only what's near the screen is mounted.
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      />
      <DatePickerModal
        visible={picking}
        value={date}
        onPick={picked => {
          setDate(picked);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </>
  );
};

const renderCase = ({ item }: { item: RepairCase }) => <CaseCard item={item} />;

const CaseCard = memo<{ item: RepairCase }>(({ item }) => {
  const look =
    item.status === 'REORDER' && item.reorderCompletedAt
      ? REORDER_COMPLETE_STYLE
      : STATUS_STYLE[item.status] ?? STATUS_STYLE.CANCELLED;
  const changed = item.finalDefect && item.finalDefect !== item.defect;
  return (
    <Card>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>
          {item.partNumber}{' '}
          <Text style={styles.cardJob}>· {item.jobNumber}</Text>
        </Text>
        <View style={[styles.badge, { backgroundColor: look.bg }]}>
          <Text style={[styles.badgeText, { color: look.fg }]}>
            {look.label}
          </Text>
        </View>
      </View>
      {item.moldName !== '' && <Text style={styles.mold}>{item.moldName}</Text>}

      <Line label="Defect" value={item.defect} />
      <Line label="Marked" value={when(item.markedAt, item.markedByName)} />
      {changed && <Line label="Changed to" value={item.finalDefect} />}
      {item.resolvedAt && (
        <Line
          label={
            item.status === 'REORDER'
              ? 'Reorder'
              : item.status === 'CANCELLED'
              ? 'Cancelled'
              : 'Repaired'
          }
          value={when(item.resolvedAt, item.resolvedByName)}
        />
      )}
      {item.status === 'REORDER' && (
        <Line
          label="New piece"
          value={
            item.reorderCompletedAt
              ? when(item.reorderCompletedAt, item.reorderCompletedByName)
              : 'Not completed yet'
          }
        />
      )}
    </Card>
  );
});

const Line: React.FC<{ label: string; value: string | null }> = ({
  label,
  value,
}) =>
  value ? (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  ) : null;

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  end: {
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 12,
  },
  header: {
    gap: 12,
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchGrow: {
    flexGrow: 1,
    flexBasis: 240,
  },
  dateBox: {
    flexGrow: 0,
  },
  dateBoxActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  dateTextActive: {
    color: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.surface,
  },
  note: {
    fontSize: 13,
    color: colors.muted,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.muted,
    paddingVertical: 24,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  cardJob: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  mold: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 6,
  },
  line: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 3,
  },
  lineLabel: {
    width: 90,
    fontSize: 14,
    color: colors.muted,
  },
  lineValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

export default RepairLog;
