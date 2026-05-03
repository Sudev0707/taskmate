import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../data/color-theme';
import { useTaskManager } from '../../hooks/useTaskManager';
import { BarChart2 } from 'lucide-react-native';

export default function ProductivityStatsWidget() {
  const { todoCount, inProgressCount, completedCount } = useTaskManager();
  const totalTasks = todoCount + inProgressCount + completedCount;

  // Calculate percentages for progress visualization
  const completedPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const inProgressPercent =
    totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
  const todoPercent =
    totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0;

  // Stats data for the progress bars
  const stats = [
    {
      label: 'To Do',
      count: todoCount,
      percent: todoPercent,
      color: theme.text + '60',
    },
    {
      label: 'In Progress',
      count: inProgressCount,
      percent: inProgressPercent,
      color: theme.primary[3],
    },
    {
      label: 'Done',
      count: completedCount,
      percent: completedPercent,
      color: '#10B981',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BarChart2 size={20} color={theme.primary[3]} />
          <Text style={styles.title}>Productivity</Text>
        </View>

        <Text style={styles.subtitle}>
          {completedCount}/{totalTasks} tasks
        </Text>
      </View>

      {/* Progress Ring Visualization */}
      <View style={styles.progressSection}>
        {/* Circular Progress Indicator */}
        <View style={styles.progressRingContainer}>
          <View style={styles.progressRingBackground} />
          <View
            style={[
              styles.progressRing,
              {
                borderTopColor:
                  completedPercent > 25 ? '#10B981' : 'transparent',
                borderRightColor:
                  completedPercent > 50 ? '#10B981' : 'transparent',
                borderBottomColor:
                  completedPercent > 75 ? '#10B981' : 'transparent',
                borderLeftColor:
                  completedPercent > 0 ? '#10B981' : 'transparent',
              },
            ]}
          />
          <Text style={styles.percentText}>{completedPercent}%</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: stat.color }]}
              />
              <Text style={styles.legendLabel}>{stat.label}</Text>
              <Text style={styles.legendCount}>{stat.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          {todoCount > 0 && (
            <View
              style={[
                styles.progressBarSegment,
                {
                  width: `${todoPercent}%`,
                  backgroundColor: theme.text + '60',
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                },
              ]}
            />
          )}
          {inProgressCount > 0 && (
            <View
              style={[
                styles.progressBarSegment,
                {
                  width: `${inProgressPercent}%`,
                  backgroundColor: theme.primary[3],
                },
              ]}
            />
          )}
          {completedCount > 0 && (
            <View
              style={[
                styles.progressBarSegment,
                {
                  width: `${completedPercent}%`,
                  backgroundColor: '#10B981',
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.padding.paddingMainX,
    backgroundColor: theme.text + '08',
    // backgroundColor: theme.primary[4],
    borderRadius: theme.border.radius.main,
    borderWidth: 1,
    borderColor: theme.text + '15',
    padding: 20,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  subtitle: {
    fontFamily: theme.fonts[500],
    fontSize: 14,
    color: theme.text + '60',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  progressRingContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: theme.text + '15',
  },
  progressRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#10B981',
    transform: [{ rotate: '-90deg' }],
  },
  percentText: {
    fontFamily: theme.fonts[700],
    fontSize: 20,
    color: theme.text,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: theme.fonts[500],
    fontSize: 13,
    color: theme.text + '80',
    flex: 1,
  },
  legendCount: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
    color: theme.text,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.text + '15',
    overflow: 'hidden',
  },
  progressBar: {
    flexDirection: 'row',
    height: '100%',
  },
  progressBarSegment: {
    height: '100%',
  },
});
