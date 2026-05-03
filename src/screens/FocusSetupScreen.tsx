import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Timer } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '../data/color-theme';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTimer } from '../context/TimerContext';
import { PRIORITY_CONFIG } from '../components/TaskCard';

const getCategory = (dueDate: string | Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(dueDate);
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return 'Overdue';
  return 'Upcoming';
};

export default function FocusSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { tasks, setTaskStatus } = useTaskManager();
  const { startTimer } = useTimer();

  const [duration, setDuration] = useState('25');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    route.params?.taskId ?? null,
  );
  const [isCustom, setIsCustom] = useState(false);

  const activeTasks = tasks.filter((t: any) => !t.isCompleted);
  const taskColors = [theme.primary[1], theme.primary[3], theme.primary[4]];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route.params?.taskId !== undefined) {
      setSelectedTaskId(route.params.taskId);
    }
  }, [route.params?.taskId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const startFocus = async () => {
    const mins = parseInt(duration, 10) || 25;
    let taskColor = null;
    let taskTitle = null;

    if (selectedTaskId) {
      const taskIndex = activeTasks.findIndex(
        (t: any) => t.id === selectedTaskId,
      );
      if (taskIndex !== -1) {
        taskColor = taskColors[taskIndex % taskColors.length];
        taskTitle = activeTasks[taskIndex].title;
      }
      await setTaskStatus(selectedTaskId, 'in-progress');
    }

    startTimer(selectedTaskId, mins);
    navigation.replace('FocusScreen', {
      duration: mins,
      taskId: selectedTaskId,
      taskColor,
      taskTitle,
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Setup</Text>
        <View style={{ width: 48 }} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.durationDisplay}>
          <View style={{
            backgroundColor: theme.primary[4] + '15',
            padding: 16,
            borderRadius: 24,
            marginBottom: 16,
          }}>
            <Timer
              color={theme.primary[4]}
              size={32}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'center',
            }}
          >
            {isCustom ? (
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                style={styles.customInput}
                autoFocus
                onBlur={() => setIsCustom(false)}
                maxLength={3}
                selectionColor={theme.primary[4]}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsCustom(true)}
              >
                <Text style={styles.durationBigText}>{duration}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.durationUnitText}>min</Text>
          </View>
        </View>

        <View style={styles.quickSelectRow}>
          {[15, 25, 45, 'Custom'].map(val => {
            const isSelected = !isCustom && duration === val.toString();
            const isCustomBtn = val === 'Custom';

            return (
              <TouchableOpacity
                key={val}
                activeOpacity={0.8}
                onPress={() => {
                  if (isCustomBtn) {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setDuration(val.toString());
                  }
                }}
                style={[
                  styles.quickSelectBtn,
                  (isSelected || (isCustom && isCustomBtn)) &&
                  styles.quickSelectBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickSelectText,
                    (isSelected || (isCustom && isCustomBtn)) &&
                    styles.quickSelectTextActive,
                  ]}
                >
                  {val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Task Selection */}
        <View style={styles.taskSection}>
          <View style={styles.taskHeader}>
            <Text style={styles.sectionTitle}>Link a Task</Text>
            <Text style={styles.optionalText}>(Optional)</Text>
          </View>

          {activeTasks.length === 0 ? (
            <View style={styles.emptyTaskState}>
              <Text style={styles.emptyTaskText}>
                No active tasks available to focus on.
              </Text>
            </View>
          ) : (
            ['Today', 'Tomorrow', 'Upcoming', 'Yesterday', 'Overdue'].map(
              category => {
                const categoryTasks = activeTasks.filter(
                  (t: any) => getCategory(t.dueDate) === category,
                );
                if (categoryTasks.length === 0) return null;

                return (
                  <View key={category} style={{ marginBottom: 16 }}>
                    {category !== 'Today' && (
                      <Text style={styles.categoryTitle}>{category}</Text>
                    )}
                    {categoryTasks.map((task: any, index: number) => {
                      const isSelected = selectedTaskId === task.id;
                      const bgColor = taskColors[index % taskColors.length];

                      return (
                        <TouchableOpacity
                          key={task.id}
                          activeOpacity={0.8}
                          onPress={() =>
                            setSelectedTaskId(isSelected ? null : task.id)
                          }
                          style={{
                            backgroundColor: isSelected
                              ? bgColor + '15'
                              : theme.text + '04',
                            borderRadius: 28,
                            padding: 15,
                            flexDirection: 'column',
                            gap: 16,
                            marginBottom: 16,
                            borderWidth: 1.5,
                            borderColor: isSelected ? bgColor + '50' : theme.text + '08',
                            shadowColor: isSelected ? bgColor : '#000',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: isSelected ? 0.15 : 0,
                            shadowRadius: 12,
                            // elevation: isSelected ? 4 : 0,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <View style={{ flex: 1, paddingRight: 16 }}>
                              <Text
                                style={{
                                  fontFamily: theme.fonts[600],
                                  fontSize: 17,
                                  color: theme.text,
                                  lineHeight: 28,
                                  letterSpacing: -0.3,
                                }}
                                numberOfLines={2}
                              >
                                {task.description || task.title}
                              </Text>
                              {task.description ? (
                                <Text
                                  style={{
                                    fontFamily: theme.fonts[400],
                                    fontSize: 15,
                                    color: theme.text + '60',
                                    lineHeight: 22,
                                    marginTop: 6,
                                  }}
                                  numberOfLines={1}
                                >
                                  {task.title.split('-')[1]?.trim() ||
                                    task.title}
                                </Text>
                              ) : null}
                            </View>

                            <View
                              style={[
                                styles.radioOuter,
                                isSelected
                                  ? {
                                    borderColor: bgColor,
                                    backgroundColor: bgColor + '20',
                                  }
                                  : { borderColor: theme.text + '20' },
                              ]}
                            >
                              {isSelected && (
                                <View
                                  style={[
                                    styles.radioInner,
                                    { backgroundColor: bgColor },
                                  ]}
                                />
                              )}
                            </View>
                          </View>

                          <View
                            style={{
                              borderTopWidth: 1,
                              borderColor: isSelected
                                ? bgColor + '30'
                                : theme.text + '08',
                              paddingTop: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                gap: 6,
                                flexWrap: 'wrap',
                                flex: 1,
                                alignItems: 'center',
                              }}
                            >
                              {task.tag
                                ?.slice(0, 2)
                                .map((tagName: string, i: number) => (
                                  <Text
                                    key={i}
                                    style={{
                                      fontFamily: theme.fonts[500],
                                      fontSize: 13,
                                      color: isSelected
                                        ? bgColor
                                        : theme.text + '60',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    #{tagName}
                                  </Text>
                                ))}
                              {(task.tag?.length ?? 0) > 2 && (
                                <View
                                  style={{
                                    backgroundColor: isSelected
                                      ? bgColor + '20'
                                      : theme.text + '10',
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 10,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: theme.fonts[600],
                                      fontSize: 11,
                                      color: isSelected
                                        ? bgColor
                                        : theme.text + '80',
                                    }}
                                  >
                                    +{(task.tag?.length ?? 0) - 2}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {PRIORITY_CONFIG[task.priority] && (
                              <View
                                style={{
                                  backgroundColor: isSelected
                                    ? bgColor + '20'
                                    : theme.text + '08',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  borderWidth: 1,
                                  borderColor: isSelected ? bgColor + '30' : 'transparent',
                                }}
                              >
                                <View
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor:
                                      PRIORITY_CONFIG[task.priority].dot,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontFamily: theme.fonts[600],
                                    fontSize: 12,
                                    color: isSelected
                                      ? bgColor
                                      : theme.text + '90',
                                  }}
                                >
                                  {
                                    PRIORITY_CONFIG[task.priority].label.split(
                                      ' ',
                                    )[0]
                                  }
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              },
            )
          )}
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={startFocus}
          style={styles.startButton}
        >
          <Text style={styles.startButtonText}>Begin Session</Text>
          <View style={styles.startButtonIcon}>
            <Play
              fill={theme.background}
              color={theme.background}
              size={18}
              style={{ marginLeft: 2 }}
            />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.text + '10',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.text + '08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.text,
    fontFamily: theme.fonts[600],
    fontSize: 18,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 140,
  },
  durationDisplay: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 48,
    backgroundColor: theme.text + '03',
    paddingVertical: 32,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  durationBigText: {
    color: theme.primary[13],
    fontFamily: theme.fonts[800],
    fontSize: 96,
    lineHeight: 110,
    letterSpacing: -4,
  },
  customInput: {
    color: theme.primary[13],
    fontFamily: theme.fonts[800],
    fontSize: 96,
    height: 110,
    minWidth: 120,
    textAlign: 'center',
  },
  durationUnitText: {
    color: theme.text + '50',
    fontFamily: theme.fonts[600],
    fontSize: 24,
    marginLeft: 8,
    marginBottom: 24,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 48,
    backgroundColor: theme.text + '05',
    padding: 6,
    borderRadius: 32,
  },
  quickSelectBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectBtnActive: {
    backgroundColor: theme.primary[13],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickSelectText: {
    color: theme.text + '60',
    fontFamily: theme.fonts[600],
    fontSize: 15,
  },
  quickSelectTextActive: {
    color: theme.background,
  },
  taskSection: {
    marginTop: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    color: theme.text,
    fontFamily: theme.fonts[700],
    fontSize: 20,
    letterSpacing: -0.5,
  },
  optionalText: {
    color: theme.text + '40',
    fontFamily: theme.fonts[500],
    fontSize: 14,
  },
  categoryTitle: {
    color: theme.text + '60',
    fontFamily: theme.fonts[700],
    fontSize: 13,
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  emptyTaskState: {
    padding: 24,
    backgroundColor: theme.text + '05',
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyTaskText: {
    color: theme.text + '50',
    fontFamily: theme.fonts[500],
    fontSize: 15,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: theme.text + '05',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  taskTitle: {
    color: theme.text,
    fontFamily: theme.fonts[600],
    fontSize: 17,
    marginBottom: 8,
    lineHeight: 24,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.background,
    borderRadius: 12,
  },
  priorityText: {
    color: theme.text,
    fontSize: 11,
    fontFamily: theme.fonts[600],
    textTransform: 'capitalize',
  },
  tagText: {
    color: theme.text + '70',
    fontSize: 13,
    fontFamily: theme.fonts[500],
    textTransform: 'capitalize',
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.text + '30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.text + '05',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    left: 24,
    right: 24,
  },
  startButton: {
    backgroundColor: theme.text,
    height: 55,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonText: {
    color: theme.background,
    fontFamily: theme.fonts[700],
    fontSize: 16,
    letterSpacing: 0.5,
  },
  startButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
