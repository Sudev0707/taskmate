import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
  Activity,
  Target,
} from 'lucide-react-native';
import theme from '../data/color-theme';
import { useStreak, toDateKey, StreakLog } from '../hooks/useStreak';
import { useTaskManager } from '../hooks/useTaskManager';

const { width } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getDaysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();
const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

// ─── Day cell ─────────────────────────────────────────────────────────────────

type DayCellProps = {
  day: number;
  dateKey: string;
  log: StreakLog;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  onPress: () => void;
};

function DayCell({
  day,
  dateKey,
  log,
  isToday,
  isFuture,
  isSelected,
  onPress,
}: DayCellProps) {
  const record = log[dateKey];
  const hasTasks = record && record.total > 0;
  const allDone = hasTasks && record.completed >= record.total;
  const partial = hasTasks && record.completed > 0 && !allDone;
  const missed = hasTasks && !isFuture && record.completed === 0;

  let circleBg = 'transparent';
  let numColor = theme.text + '50';
  let borderColor = 'transparent';
  let dotColor: string | null = null;

  if (!isFuture) {
    if (isToday && !allDone) {
      borderColor = theme.text + '30';
      numColor = theme.text;
    }
    if (allDone) {
      circleBg = theme.primary[2] + '1A'; // softer green bg
      numColor = theme.primary[2];
      dotColor = theme.primary[2];
    } else if (partial) {
      circleBg = theme.primary[1] + '15'; // softer yellow
      numColor = theme.primary[1];
      dotColor = theme.primary[1];
    } else if (missed) {
      circleBg = theme.error + '15';
      numColor = theme.error;
      dotColor = theme.error + '70';
    }
  } else {
    numColor = theme.text + '20';
  }

  if (isSelected) {
    circleBg = theme.primary[3] + '25';
    borderColor = theme.primary[3];
    numColor = theme.primary[3];
  }

  return (
    <Pressable onPress={onPress} style={styles.dayCellPressable}>
      <View
        style={[
          styles.dayCellCircle,
          {
            backgroundColor: circleBg,
            borderWidth: isToday || isSelected ? 1 : 0,
            borderColor,
          },
        ]}
      >
        <Text
          style={[
            styles.dayCellText,
            {
              fontFamily:
                allDone || isToday || isSelected
                  ? theme.fonts[700]
                  : theme.fonts[500],
              color: numColor,
            },
          ]}
        >
          {day}
        </Text>
      </View>
      <View style={styles.dayCellDotContainer}>
        {dotColor && (
          <View style={[styles.dayCellDot, { backgroundColor: dotColor }]} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { tasks } = useTaskManager();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const { currentStreak, log } = useStreak(tasks);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = toDateKey(today);

  const prevMonth = () => {
    setSelectedDateKey(null);
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDateKey(null);
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else setViewMonth(m => m + 1);
  };
  const isAtCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Global stats
  const allKeys = Object.keys(log);
  const totalDays = allKeys.filter(k => log[k].total > 0).length;
  const perfectDays = allKeys.filter(
    k => log[k].total > 0 && log[k].completed >= log[k].total,
  ).length;
  const totalDone = allKeys.reduce((s, k) => s + log[k].completed, 0);

  // Monthly bar graph
  const maxCompletedInMonth = Math.max(
    1,
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const dk = `${viewYear}-${String(viewMonth + 1).padStart(
        2,
        '0',
      )}-${String(i + 1).padStart(2, '0')}`;
      return log[dk]?.completed || 0;
    }),
  );

  // Grid cells
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Selected day detail
  const selectedRecord = selectedDateKey ? log[selectedDateKey] : null;

  const STAT_CARDS = [
    {
      label: 'Active Days',
      value: String(totalDays).padStart(2, '0'),
      color: theme.primary[3],
      icon: CalendarDays,
    },
    {
      label: 'Perfect Days',
      value: String(perfectDays).padStart(2, '0'),
      color: theme.primary[2],
      icon: Target,
    },
    {
      label: 'Tasks Done',
      value: String(totalDone).padStart(2, '0'),
      color: theme.primary[10],
      icon: CheckCircle2,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed ? theme.text + '18' : theme.text + '08',
            },
          ]}
        >
          <ArrowLeft size={20} color={theme.text} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* Spacer */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="never"
        contentContainerStyle={styles.scrollContent}
      >
        {/* <View style={styles.streakBannerContainer}>
                    <View style={styles.streakBannerGlow} />
                    <View style={styles.streakBanner}>
                        <View style={styles.streakIconContainer}>
                            <Flame size={24} color={theme.primary[4]} strokeWidth={2.5} />
                        </View>
                        <View style={styles.streakContent}>
                            <Text style={styles.streakTitle}>
                                {currentStreak > 0 ? `${currentStreak} Day Streak 🔥` : "Daily Streak"}
                            </Text>
                            <Text style={styles.streakSubtitle}>
                                {currentStreak > 0
                                    ? `You're on fire! Keep going today.`
                                    : "Complete tasks today to start a streak."}
                            </Text>
                        </View>
                        <View style={styles.heroDateBadge}>
                            <Text style={styles.heroDateText}>
                                {MONTH_NAMES[today.getMonth()].slice(0, 3)} {today.getFullYear()}
                            </Text>
                        </View>
                    </View>
                </View> */}

        <View style={styles.statsGrid}>
          {STAT_CARDS.map(({ label, value, color, icon: Icon }) => (
            <View
              key={label}
              style={[
                styles.statCard,
                {
                  borderColor: color + '15',
                  backgroundColor: theme.text + '04',
                },
              ]}
            >
              <View style={styles.statCardHeader}>
                <View
                  style={[
                    styles.statCardIconWrapper,
                    { backgroundColor: color + '15' },
                  ]}
                >
                  <Icon size={16} color={color} strokeWidth={2.5} />
                </View>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
              </View>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={prevMonth}
              style={({ pressed }) => [
                styles.navButton,
                {
                  backgroundColor: pressed
                    ? theme.text + '15'
                    : theme.text + '08',
                },
              ]}
            >
              <ChevronLeft
                size={20}
                color={theme.text + '90'}
                strokeWidth={2}
              />
            </Pressable>

            <Text style={styles.monthTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <Pressable
              onPress={nextMonth}
              disabled={isAtCurrentMonth}
              style={({ pressed }) => [
                styles.navButton,
                {
                  backgroundColor: pressed
                    ? theme.text + '15'
                    : theme.text + '08',
                  opacity: isAtCurrentMonth ? 0.25 : 1,
                },
              ]}
            >
              <ChevronRight
                size={20}
                color={theme.text + '90'}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          <View style={styles.weekdayHeader}>
            {DAY_LABELS.map((d, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={styles.weekdayLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {Array.from({ length: cells.length / 7 }, (_, row) => (
            <View key={row} style={styles.calendarRow}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={styles.emptyCell} />;
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(
                  2,
                  '0',
                )}-${String(day).padStart(2, '0')}`;
                return (
                  <DayCell
                    key={col}
                    day={day}
                    dateKey={dateKey}
                    log={log}
                    isToday={dateKey === todayKey}
                    isFuture={dateKey > todayKey}
                    isSelected={selectedDateKey === dateKey}
                    onPress={() =>
                      setSelectedDateKey(
                        selectedDateKey === dateKey ? null : dateKey,
                      )
                    }
                  />
                );
              })}
            </View>
          ))}

          <View style={styles.legendContainer}>
            {[
              { dot: theme.primary[2], label: 'All done' },
              { dot: theme.primary[1], label: 'Partial' },
              { dot: theme.error, label: 'Missed' },
            ].map(({ dot, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: dot }]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {selectedDateKey && (
          <View style={styles.selectedDayPanel}>
            <View style={styles.selectedDayIconContainer}>
              <CheckCircle2
                size={22}
                color={theme.primary[3]}
                strokeWidth={2.5}
              />
            </View>
            <View style={styles.selectedDayContent}>
              <Text style={styles.selectedDayDate}>
                {MONTH_NAMES[parseInt(selectedDateKey.split('-')[1], 10) - 1]}{' '}
                {parseInt(selectedDateKey.split('-')[2], 10)},{' '}
                {selectedDateKey.split('-')[0]}
              </Text>
              <Text style={styles.selectedDayInfo}>
                {selectedRecord
                  ? `${selectedRecord.completed} of ${
                      selectedRecord.total
                    } task${selectedRecord.total !== 1 ? 's' : ''} completed`
                  : 'No tasks recorded this day'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.activityGraphContainer}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleContainer}>
              <Activity size={18} color={theme.primary[4]} strokeWidth={2.5} />
              <Text style={styles.graphTitle}>Activity Graph</Text>
            </View>
            <View style={styles.graphMonthBadge}>
              <Text style={styles.graphMonthLabel}>
                {MONTH_NAMES[viewMonth].slice(0, 3)}
              </Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(
                2,
                '0',
              )}-${String(day).padStart(2, '0')}`;
              const completed = log[dateKey]?.completed || 0;
              const isToday = dateKey === todayKey;
              const isSelected = selectedDateKey === dateKey;
              const hPercent =
                completed > 0
                  ? Math.max(15, (completed / maxCompletedInMonth) * 100)
                  : 0;
              const barColor = isToday
                ? theme.primary[3]
                : completed > 0
                ? theme.primary[4]
                : 'transparent';

              return (
                <Pressable
                  key={day}
                  onPress={() =>
                    setSelectedDateKey(
                      selectedDateKey === dateKey ? null : dateKey,
                    )
                  }
                  style={styles.barPressable}
                >
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: theme.text + '06' },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${hPercent}%` as any,
                          backgroundColor: isSelected ? theme.text : barColor,
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.barLabels}>
            <Text style={styles.barLabelText}>1</Text>
            <Text style={styles.barLabelText}>
              {Math.floor(daysInMonth / 2)}
            </Text>
            <Text style={styles.barLabelText}>{daysInMonth}</Text>
          </View>
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingHorizontal: theme.padding.paddingMainX,
    paddingTop: 16,
    paddingBottom: 60,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.padding.paddingMainX,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.text,
    fontFamily: theme.fonts[700],
  },
  headerSpacer: {
    width: 44,
  },
  // Streak Banner
  streakBannerContainer: {
    position: 'relative',
    marginTop: 8,
  },
  streakBannerGlow: {
    // position: 'absolute',
    // top: 10,
    // left: 10,
    // right: 10,
    // bottom: 0,
    backgroundColor: theme.primary[4],
    opacity: 0.15,
    borderRadius: theme.border.radius.main,
    transform: [{ translateY: 6 }],
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.primary[4] + '10',
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.primary[4] + '30',
    padding: 20,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary[4] + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 17,
    color: theme.text,
  },
  streakSubtitle: {
    fontFamily: theme.fonts[400],
    fontSize: 12,
    color: theme.text + '80',
    marginTop: 4,
    lineHeight: 16,
  },
  heroDateBadge: {
    backgroundColor: theme.text + '08',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  heroDateText: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
    color: theme.text + '90',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    width: (width - theme.padding.paddingMainX * 2 - 16) / 3,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: theme.fonts[800],
    fontSize: 18,
  },
  statLabel: {
    fontFamily: theme.fonts[500],
    fontSize: 11,
    color: theme.text + '80',
  },
  // Calendar Card
  calendarCard: {
    marginTop: 24,
    backgroundColor: theme.text + '04',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.text + '0A',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  monthTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.3,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 12,
    color: theme.text + '50',
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  emptyCell: {
    flex: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.text + '0D',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: theme.fonts[500],
    fontSize: 12,
    color: theme.text + '60',
  },
  // Day Cell
  dayCellPressable: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayCellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellText: {
    fontSize: 14,
  },
  dayCellDotContainer: {
    height: 6,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Selected Day Panel
  selectedDayPanel: {
    marginTop: 16,
    backgroundColor: theme.primary[3] + '0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary[3] + '25',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectedDayIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary[3] + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayContent: {
    flex: 1,
  },
  selectedDayDate: {
    fontFamily: theme.fonts[700],
    fontSize: 15,
    color: theme.text,
  },
  selectedDayInfo: {
    fontFamily: theme.fonts[400],
    fontSize: 13,
    color: theme.text + '70',
    marginTop: 2,
  },
  // Activity Graph
  activityGraphContainer: {
    marginTop: 24,
    backgroundColor: theme.text + '04',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.text + '0A',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  graphTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  graphTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 16,
    color: theme.text,
    letterSpacing: 0.2,
  },
  graphMonthBadge: {
    backgroundColor: theme.text + '08',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  graphMonthLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
    color: theme.text + '80',
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barPressable: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    maxWidth: 6,
    height: '100%',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  barLabelText: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
    color: theme.text + '50',
  },
  spacer: {
    height: 20,
  },
});
