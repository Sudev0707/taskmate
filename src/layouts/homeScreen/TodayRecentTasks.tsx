import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  View,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  PanResponder,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import theme from '../../data/color-theme';
import {
  Calendar1,
  CircleArrowOutUpRight,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react-native';
import TaskDetailsInfo from '../../components/TaskDetailsInfo';
import AddTaskBottomSheet, {
  NewTaskData,
} from '../../components/AddTaskBottomSheet';
import AnimatedIconButton from '../../components/AnimatedIconButton';
import { routeNames } from '../../navigation/TabNavigator';
import { useTaskManager } from '../../hooks/useTaskManager';

function TodayRecentTasks() {
  const navigation = useNavigation<any>();
  const { tasks, saveNewTask, deleteTask, advanceTaskStatus } =
    useTaskManager();

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isAddSheetVisible, setAddSheetVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const handleSaveTask = async (data: NewTaskData) => {
    await saveNewTask(data);
    setAddSheetVisible(false);
  };

  const handleToggleComplete = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'in-progress') {
      setShowConfetti(true);
    }
    await advanceTaskStatus(taskId);
    if (selectedTask?.id === taskId) {
      closeTaskSheet();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    await deleteTask(taskId);
    if (selectedTask?.id === taskId) {
      closeTaskSheet();
    }
  };

  const closeTaskSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setTimeout(() => setSelectedTask(null), 300);
    });
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - gestureState.dy / 600);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          closeTaskSheet();
        } else {
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    }),
  ).current;

  // 1. Filter today's tasks
  const activeTasks = tasks.filter(t => !t.isCompleted);
  const today = new Date();
  const todayTasks = activeTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return (
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear()
    );
  });

  const displayMonth = today.toLocaleDateString('en-US', { month: 'short' });
  const displayDate = today.getDate();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });

  const highPrioCount = todayTasks.filter(t => t.priority === 'high').length;
  const mediumPrioCount = todayTasks.filter(
    t => t.priority === 'medium',
  ).length;

  let dominantPriorityText = 'Low';
  if (highPrioCount > 0) dominantPriorityText = 'High';
  else if (mediumPrioCount > 0) dominantPriorityText = 'Medium';

  // Top 3 tags by frequency across today's tasks
  const tagCounts: Record<string, number> = {};
  for (const task of todayTasks) {
    for (const tag of task.tag ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // Calculate tasks added today (new feature)
  const tasksAddedToday = tasks.filter(task => {
    if (!task.createdAt) return false;
    const createdDate = new Date(task.createdAt);
    return (
      createdDate.getDate() === today.getDate() &&
      createdDate.getMonth() === today.getMonth() &&
      createdDate.getFullYear() === today.getFullYear()
    );
  }).length;

  // Stats data for premium stat cards
  const statsData = [
    {
      icon: <Zap size={18} />,
      label: 'Added Today',
      value: tasksAddedToday,
      unit: 'new',
      color: theme.warning,
      bgColor: theme.warning + '20',
    },
    {
      icon: <Clock size={18} />,
      label: 'Due Today',
      value: todayTasks.length,
      unit: 'tasks',
      color: theme.success,
      bgColor: theme.success + '20',
    },
    {
      icon: <CheckCircle size={18} />,
      label: 'High Priority',
      value: highPrioCount,
      unit: 'urgent',
      color: '#FF5757',
      bgColor: '#FF575720',
    },
  ];

  // Format the main display text
  const taskCountText = String(todayTasks.length).padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        {/* <View style={styles.heroOrb} /> */}

        <View style={styles.heroHeader}>
          <View style={styles.dateBlock}>
            <View style={styles.iconContainer}>
              <Calendar1 stroke={theme.primary[3]} size={18} />
            </View>
            <View style={styles.dateTextColumn}>
              <Text style={styles.weekdayText}>{weekday}</Text>
              <Text style={styles.dateText}>
                {displayMonth} {displayDate}
              </Text>
              <View style={styles.priorityChip}>
                <Text style={styles.priorityChipText}>
                  Load · {dominantPriorityText}
                </Text>
              </View>
            </View>
          </View>
          <AnimatedIconButton
            onPress={() => navigation.navigate(routeNames.tasks)}
            style={styles.navButton}
          >
            <CircleArrowOutUpRight stroke={theme.text} size={22} />
          </AnimatedIconButton>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.focusRow}>
            <View style={styles.focusCopy}>
              <Text style={styles.focusEyebrow}>Due today</Text>
              <Text style={styles.taskCountText}>{taskCountText}</Text>
              <Text style={styles.taskSubtitle}>
                {todayTasks.length === 1
                  ? 'One task needs attention'
                  : `${todayTasks.length} tasks scheduled for today`}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            {statsData.map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: stat.bgColor },
                  ]}
                >
                  {React.cloneElement(stat.icon, {
                    color: stat.color,
                    size: 16,
                  })}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statUnit}>{stat.unit}</Text>
              </View>
            ))}
          </View>

          {topTags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {topTags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.tagItem}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeTaskSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeTaskSheet}
            />
          </Animated.View>

          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sheet,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.handleBar} />

            {selectedTask && (
              <TaskDetailsInfo
                task={selectedTask}
                onClose={closeTaskSheet}
                onAdvanceStatus={() => handleToggleComplete(selectedTask.id)}
                onDelete={() => handleDeleteTask(selectedTask.id)}
              />
            )}

            <View style={styles.sheetBottomSpacer} />
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <AddTaskBottomSheet
        visible={isAddSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSave={handleSaveTask}
      />

      {showConfetti && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            count={200}
            origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
            fallSpeed={2500}
            fadeOut={true}
            autoStart={true}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </View>
  );
}

const R = theme.border.radius.main;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.padding.paddingMainX,
    marginTop: 12,
  },
  heroCard: {
    backgroundColor: theme.text + "06",
    padding: 22,
    borderRadius: R + 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.primary[3] + "25",
  },
  heroOrb: {
    position: 'absolute',
    bottom: -48,
    right: -32,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.primary[3] + "10",
    pointerEvents: 'none',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  dateBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginRight: 12,
  },
  dateTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  weekdayText: {
    fontFamily: theme.fonts[500],
    fontSize: 12,
    color: theme.text + '8C',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  iconContainer: {
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: theme.primary[3] + '15',
  },
  dateText: {
    fontFamily: theme.fonts[700],
    fontSize: 20,
    color: theme.text,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  priorityChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.text + '08',
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  priorityChipText: {
    fontFamily: theme.fonts[600],
    fontSize: 10,
    color: theme.text + 'CC',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  navButton: {
    backgroundColor: theme.text + '08',
    borderRadius: 999,
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.text + '15',
  },
  mainContent: {
    marginTop: 22,
    position: 'relative',
    zIndex: 1,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  focusCopy: {
    flex: 1,
  },
  focusEyebrow: {
    fontFamily: theme.fonts[600],
    fontSize: 12,
    color: theme.text + '90',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  taskCountText: {
    fontFamily: theme.fonts[900],
    fontSize: 56,
    lineHeight: 58,
    color: theme.text,
    letterSpacing: -2,
  },
  taskSubtitle: {
    fontFamily: theme.fonts[400],
    fontSize: 14,
    color: theme.text + '92',
    marginTop: 8,
    maxWidth: '88%',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  tagItem: {
    backgroundColor: theme.text + '06',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  tagText: {
    fontFamily: theme.fonts[600],
    fontSize: 12,
    color: theme.text,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.text + '04',
    borderRadius: R,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.text + '0A',
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: theme.fonts[800],
    fontSize: 22,
    color: theme.text,
  },
  statLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 10,
    marginTop: 4,
    color: theme.text + '88',
    textAlign: 'center',
  },
  statUnit: {
    fontFamily: theme.fonts[400],
    fontSize: 9,
    marginTop: 2,
    color: theme.text + '70',
    textTransform: 'lowercase',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: theme.white,
    borderRadius: R + 12,
    margin: 16,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.background + '0D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.background + '18',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  sheetBottomSpacer: {
    height: Platform.OS === 'ios' ? 40 : 20,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 9999,
  },
});

export default React.memo(TodayRecentTasks);
