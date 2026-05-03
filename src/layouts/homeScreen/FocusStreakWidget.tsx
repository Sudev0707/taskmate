import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../../data/color-theme';
import { useNavigation } from '@react-navigation/native';
import { useTimer } from '../../context/TimerContext';
import { useStreak } from '../../hooks/useStreak';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Flame, Zap, Clock, CheckCircle } from 'lucide-react-native';
import StartTimerList from './StartTimerList';

export default function FocusStreakWidget() {
  const navigation = useNavigation<any>();
  const { isActive, activeTaskId, durationMins } = useTimer();
  const { tasks } = useTaskManager();
  const { currentStreak } = useStreak(tasks);

  // Calculate focus stats from completed tasks that were in-progress
  const completedTasks = tasks.filter(
    t => t.status === 'completed' || t.isCompleted,
  );
  const totalFocusedTasks = completedTasks.length;

  // Calculate a simple productivity score based on streak and completed tasks
  const productivityScore = Math.min(
    100,
    currentStreak * 10 + totalFocusedTasks * 5,
  );

  const statsData = [
    {
      icon: <Flame size={18} />,
      label: 'Streak',
      value: currentStreak,
      unit: 'days',
      color: '#FF8C00',
      bgColor: '#FF8C0018',
    },
    {
      icon: <CheckCircle size={18} />,
      label: 'Completed',
      value: totalFocusedTasks,
      unit: 'tasks',
      color: '#10B981',
      bgColor: '#0eb47d18',
    },
    {
      icon: <Zap size={18} />,
      label: 'Score',
      value: productivityScore,
      unit: 'pts',
      color: theme.primary[3],
      bgColor: theme.primary[3] + '18',
    },
  ];

  // Check if there's an active focus session
  const hasActiveSession = isActive || activeTaskId !== null;

  return (
    // <View style={hasActiveSession ? styles.containerActive : styles.container}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Clock size={20} color={theme.primary[3]} />
          <Text style={styles.title}>Focus Stats</Text>
        </View>

        {hasActiveSession && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <View
            key={index}
            style={[
              styles.statCard,
              {
                backgroundColor: stat.bgColor,
              },
            ]}
          >
            <View style={styles.statIcon}>
              {React.cloneElement(stat.icon, {
                color: stat.color,
              })}
            </View>
            <Text
              style={styles.statValue}
            >
              {stat.value}
            </Text>
            <Text
              style={styles.statUnit}
            >
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>
      <StartTimerList />

      {/* <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: hasActiveSession 
                            ? theme.background 
                            : theme.primary[2],
                    },
                ]}
                onPress={() => hasActiveSession 
                    ? navigation.navigate("FocusScreen", { duration: durationMins, taskId: activeTaskId })
                    : navigation.navigate("FocusSetupScreen")
                }
            >
                <Text style={[
                    styles.buttonText,
                    {
                        color: hasActiveSession 
                            ? theme.text 
                            : theme.background,
                    },
                ]}>
                    {hasActiveSession ? "Resume Focus" : "Start Focus Session"}
                </Text>
            </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.padding.paddingMainX,
    backgroundColor: theme.text + '08',
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.text + '15',
    padding: 20,
    marginTop: 12,
  },
  containerActive: {
    marginHorizontal: theme.padding.paddingMainX,
    backgroundColor: theme.primary[2],
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.primary[3] + '30',
    padding: 20,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.text,
  },
  titleActive: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.background,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.text + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: theme.text,
  },
  activeText: {
    fontFamily: theme.fonts[500],
    fontSize: 12,
    color: theme.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: theme.fonts[700],
    fontSize: 18,
    color: theme.text,
  },
  statValueActive: {
    fontFamily: theme.fonts[700],
    fontSize: 18,
    color: theme.background,
  },
  statUnit: {
    fontFamily: theme.fonts[500],
    fontSize: 11,
    color: theme.text + '60',
    marginTop: 2,
  },
  statUnitActive: {
    fontFamily: theme.fonts[500],
    fontSize: 11,
    color: theme.background + '70',
    marginTop: 2,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
  },
});
