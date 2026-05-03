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
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  ListTodo,
} from 'lucide-react-native';
import theme from '../data/color-theme';
import { useTaskManager } from '../hooks/useTaskManager';
import { useStreak, toDateKey } from '../hooks/useStreak';

const { width } = Dimensions.get('window');

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { borderColor: color + '15', backgroundColor: theme.text + '04' },
      ]}
    >
      <View style={styles.statCardHeader}>
        <View
          style={[
            styles.statCardIconWrapper,
            { backgroundColor: color + '15' },
          ]}
        >
          <Icon size={18} color={color} strokeWidth={2.5} />
        </View>
        <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { tasks } = useTaskManager();
  const { currentStreak, log } = useStreak(tasks);

  const completedCount = tasks.filter(
    t => t.status === 'completed' || t.isCompleted,
  ).length;
  const todoCount = tasks.filter(t => t.status === 'to-do').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const totalTasks = tasks.length;

  const last7Keys = getLast7Days();
  const maxCompleted = Math.max(
    1,
    ...last7Keys.map(k => log[k]?.completed ?? 0),
  );

  const BREAKDOWN = [
    { label: 'Completed', count: completedCount, color: theme.primary[2] },
    { label: 'In Progress', count: inProgressCount, color: theme.primary[3] },
    { label: 'To Do', count: todoCount, color: theme.primary[1] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <Text style={styles.headerTitle}>Insights</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="never"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.streakBannerContainer}>
          <View style={styles.streakBannerGlow} />
          <View style={styles.streakBanner}>
            <View style={styles.streakIconContainer}>
              <Flame size={24} color={theme.primary[4]} strokeWidth={2.5} />
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>
                {currentStreak > 0
                  ? `${currentStreak} Day Streak 🔥`
                  : 'Start Your Streak'}
              </Text>
              <Text style={styles.streakSubtitle}>
                {currentStreak > 0
                  ? "You're on fire! Keep it up today."
                  : 'Complete tasks today to begin.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle2}
            color={theme.primary[2]}
          />
          <StatCard
            label="In Progress"
            value={inProgressCount}
            icon={TrendingUp}
            color={theme.primary[3]}
          />
          <StatCard
            label="To Do"
            value={todoCount}
            icon={ListTodo}
            color={theme.primary[1]}
          />
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={Target}
            color={theme.primary[10]}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity This Week</Text>
        </View>

        <View style={styles.weeklyChartCard}>
          <View style={styles.barsContainer}>
            {last7Keys.map((dateKey, i) => {
              const record = log[dateKey];
              const completed = record?.completed ?? 0;
              const total = record?.total ?? 0;
              const fillHeight = Math.max(
                8,
                Math.round((completed / maxCompleted) * 100),
              );
              const isToday = i === 6;
              const isFullDay = total > 0 && completed >= total;
              const dayName =
                DAYS_SHORT[new Date(dateKey + 'T12:00:00').getDay()];

              const barColor = isToday
                ? theme.primary[3]
                : isFullDay
                ? theme.primary[2]
                : theme.text + '30';

              return (
                <View key={dateKey} style={styles.barItem}>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: theme.text + '08' },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${fillHeight}%`,
                          backgroundColor: barColor,
                          shadowColor: barColor,
                          shadowOpacity: isToday ? 0.5 : 0,
                          shadowRadius: 6,
                          elevation: isToday ? 4 : 0,
                        },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.dayLabelContainer,
                      isToday && styles.todayLabelContainer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.barLabel,
                        {
                          fontFamily: isToday
                            ? theme.fonts[700]
                            : theme.fonts[500],
                          color: isToday ? theme.background : theme.text + '60',
                        },
                      ]}
                    >
                      {dayName[0]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Task Breakdown</Text>
        </View>

        <View style={styles.breakdownCard}>
          {BREAKDOWN.map(({ label, count, color }, idx) => {
            const pct =
              totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <View key={label} style={styles.breakdownItemWrapper}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelContainer}>
                    <View
                      style={[styles.breakdownDot, { backgroundColor: color }]}
                    />
                    <Text style={styles.breakdownLabel}>{label}</Text>
                  </View>
                  <View style={styles.breakdownStats}>
                    <Text style={styles.breakdownCount}>{count}</Text>
                    <Text style={styles.breakdownPercentage}>({pct}%)</Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${pct}%`, backgroundColor: color },
                    ]}
                  />
                </View>

                {idx < BREAKDOWN.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.text,
    fontFamily: theme.fonts[700],
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 18,
    color: theme.text,
    letterSpacing: 0.3,
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
    gap: 16,
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
    // gap: 4,
  },
  streakTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 18,
    color: theme.text,
  },
  streakSubtitle: {
    fontFamily: theme.fonts[400],
    fontSize: 13,
    color: theme.text + '80',
    lineHeight: 18,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - theme.padding.paddingMainX * 2 - 12) / 2,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontFamily: theme.fonts[800],
    fontSize: 24,
  },
  statCardLabel: {
    fontFamily: theme.fonts[500],
    fontSize: 13,
    color: theme.text + '80',
  },
  // Weekly Chart
  weeklyChartCard: {
    backgroundColor: theme.text + '04',
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.text + '0A',
    padding: 24,
    paddingTop: 32,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barItem: {
    alignItems: 'center',
    gap: 12,
  },
  barTrack: {
    width: 12,
    height: 110,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabelContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabelContainer: {
    backgroundColor: theme.primary[3],
  },
  barLabel: {
    fontSize: 11,
  },
  // Task Breakdown
  breakdownCard: {
    backgroundColor: theme.text + '04',
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.text + '0A',
    padding: 20,
  },
  breakdownItemWrapper: {
    paddingVertical: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 15,
    color: theme.text + 'E0',
  },
  breakdownStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownCount: {
    fontFamily: theme.fonts[700],
    fontSize: 16,
    color: theme.text,
  },
  breakdownPercentage: {
    fontFamily: theme.fonts[500],
    fontSize: 14,
    color: theme.text + '60',
    width: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.text + '08',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: theme.text + '0A',
    marginVertical: 14,
  },
  spacer: {
    height: 20,
  },
});
