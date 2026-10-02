import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { cardShadow, colors } from '../theme';

interface Props {
  visible: boolean;
  // YYYY-MM-DD, or null for none picked.
  value: string | null;
  onPick: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIsoDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "Sep 29, 2026"
export const formatIsoDate = (value: string) =>
  fromIsoDate(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// A month calendar in a popup, all in JS (no native date picker to build
// into the app). Days after today can't be picked.
const DatePickerModal: React.FC<Props> = ({
  visible,
  value,
  onPick,
  onClose,
}) => {
  const today = toIsoDate(new Date());
  const [month, setMonth] = useState(() => fromIsoDate(value ?? today));

  // Opens on the picked date's month (or this month).
  useEffect(() => {
    if (visible) setMonth(fromIsoDate(value ?? today));
  }, [visible, value, today]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const isCurrentMonth =
    year === new Date().getFullYear() && monthIndex === new Date().getMonth();
  const shift = (by: number) => setMonth(new Date(year, monthIndex + by, 1));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Taps inside the card don't close it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Pressable
              onPress={() => shift(-1)}
              hitSlop={10}
              style={styles.navButton}
            >
              <Icon name="chevron-back" size={24} color={colors.navy} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {month.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Pressable
              onPress={() => shift(1)}
              hitSlop={10}
              disabled={isCurrentMonth}
              style={[styles.navButton, isCurrentMonth && styles.disabled]}
            >
              <Icon name="chevron-forward" size={24} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((day, i) => (
              <Text key={i} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={i} style={styles.cell} />;
              const iso = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
              const selected = iso === value;
              const isToday = iso === today;
              const future = iso > today;
              return (
                <Pressable
                  key={i}
                  disabled={future}
                  onPress={() => onPick(iso)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.day,
                      isToday && styles.today,
                      selected && styles.selected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        selected && styles.selectedText,
                        future && styles.futureText,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => onPick(today)} hitSlop={8}>
              <Text style={styles.footerLink}>Today</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.footerMuted}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    ...cardShadow,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.navy,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  selected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  todayText: {
    color: colors.orange,
    fontWeight: '800',
  },
  selectedText: {
    color: colors.surface,
  },
  futureText: {
    color: colors.faint,
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  footerMuted: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
});

export default DatePickerModal;
