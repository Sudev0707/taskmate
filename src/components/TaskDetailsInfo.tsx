import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  CalendarClock,
  Calendar1,
  CheckCircle,
  ChevronsRight,
  Trash2,
  Play,
  Tag,
  Youtube,
} from 'lucide-react-native';
import theme from '../data/color-theme';
import AnimatedIconButton from './AnimatedIconButton';
import { Task, PRIORITY_CONFIG, Subtask } from './TaskCard';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTimer } from '../context/TimerContext';
import { useNavigation } from '@react-navigation/native';
import { extractYouTubeId, hideYouTubeUrl } from '../utils/youtube';
import YouTubePreview from './YouTubePreview';
import SubtaskList from './SubtaskList';

type AdvanceCfg = { label: string; color: string; Icon: React.ReactNode };

const getAdvanceCfg = (status: string): AdvanceCfg => {
  if (status === 'to-do')
    return {
      label: 'Move to In Progress',
      color: theme.success,
      Icon: <ChevronsRight color={theme.white} size={18} />,
    };
  if (status === 'in-progress')
    return {
      label: 'Mark as Done',
      color: theme.success,
      Icon: <CheckCircle color={theme.white} size={18} />,
    };
  return {
    label: 'Reschedule for Tomorrow',
    color: '#4A7FD6',
    Icon: <CalendarClock color={theme.white} size={18} />,
  };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  'to-do': { label: 'To Do', color: '#888888', bg: '#88888818' },
  'in-progress': { label: 'In Progress', color: '#4A7FD6', bg: '#4A7FD618' },
  completed: { label: 'Completed', color: '#34D399', bg: '#34D39918' },
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const getDateLabel = (dueDate: Date | string): string => {
  const d = new Date(dueDate);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

type TaskProps = {
  task: Task;
  onClose: () => void;
  onAdvanceStatus?: () => void;
  onDelete?: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
  showActionButtons?: boolean;
};

export default function TaskDetailsInfo({
  task,
  onClose,
  onAdvanceStatus,
  onDelete,
  onUpdateTask,
  showActionButtons = true,
}: TaskProps) {
const { advanceTaskStatus, deleteTask, setTaskStatus, updateTask, tasks } = useTaskManager();
  const handleAdvance = () => {
    const currentTask = tasks.find(t => t.id === task.id);
    if (currentTask && currentTask.status === 'in-progress') {
      // Force to completed
      setTaskStatus(task.id, 'completed');
    } else {
      advanceTaskStatus(task.id);
    }
    onClose();
  };
  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const effectiveOnAdvance = onAdvanceStatus || handleAdvance;
  const effectiveOnDelete = onDelete || handleDelete;

  const tDate = new Date(task.dueDate);
  const timeStr = tDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateLabel = getDateLabel(task.dueDate);
  const { timeLeft, isActive, activeTaskId } = useTimer();
  const navigation = useNavigation<any>();

  const advanceCfg = getAdvanceCfg(task.status);
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? null;
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG['to-do'];
  const youtubeId = extractYouTubeId(task.description);
  const descriptionText = hideYouTubeUrl(task.description);
  const isTimerActiveForTask = isActive && activeTaskId === task.id;

  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const nextSubtaskId = Math.max(0, ...subtasks.map(s => s.id)) + 1;

  // Handlers for subtask operations
  const handleToggleSubtask = (id: number) => {
    const updated = subtasks.map(s =>
      s.id === id ? { ...s, isCompleted: !s.isCompleted } : s,
    );
    setSubtasks(updated);
    updateTask(task.id, { subtasks: updated });
    onUpdateTask?.({ ...task, subtasks: updated });
  };

  const handleDeleteSubtask = (id: number) => {
    const updated = subtasks.filter(s => s.id !== id);
    setSubtasks(updated);
    updateTask(task.id, { subtasks: updated });
    onUpdateTask?.({ ...task, subtasks: updated });
  };

  const handleAddSubtask = (title: string) => {
    const newSubtask: Subtask = {
      id: nextSubtaskId,
      title,
      isCompleted: false,
      createdAt: new Date(),
    };
    const updated = [...subtasks, newSubtask];
    setSubtasks(updated);
    updateTask(task.id, { subtasks: updated });
    onUpdateTask?.({ ...task, subtasks: updated });
  };

  const [ytMeta, setYtMeta] = useState<{
    title: string;
    author: string;
  } | null>(null);
  useEffect(() => {
    if (!youtubeId) return;
    setYtMeta(null);
    let alive = true;
    fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`,
    )
      .then(r => r.json())
      .then(data => {
        if (alive && data?.title) {
          setYtMeta({ title: data.title, author: data.author_name });
        }
      })
      .catch(() => { });
    return () => {
      alive = false;
    };
  }, [youtubeId]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{task.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.datePill}>
            <Calendar1 size={13} color={theme.text + '70'} />
            <Text style={styles.dateText}>
              {dateLabel}, {timeStr}
            </Text>
          </View>

          {priorityCfg && (
            <View
              style={[styles.priorityPill, { backgroundColor: priorityCfg.bg }]}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityCfg.color },
                ]}
              />
              <Text style={[styles.priorityText, { color: priorityCfg.color }]}>
                {priorityCfg.label.split(' ')[0]}
              </Text>
            </View>
          )}

          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusCfg.color }]}
            />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>

          {task.status !== 'completed' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  if (isTimerActiveForTask) {
                    navigation.navigate('FocusScreen', {
                      taskId: task.id,
                      duration: Math.floor(timeLeft / 60),
                      taskTitle: task.title,
                    });
                  } else {
                    navigation.navigate('FocusSetupScreen', { taskId: task.id });
                  }
                }, 300);
              }}
              style={[
                styles.focusPill,
                {
                  backgroundColor: isTimerActiveForTask
                    ? theme.text
                    : theme.text + '10',
                },
              ]}
            >
              <Play
                fill={isTimerActiveForTask ? theme.background : theme.text + '70'}
                color={isTimerActiveForTask ? theme.background : theme.text + '70'}
                size={10}
              />
              <Text
                style={[
                  styles.focusText,
                  {
                    color: isTimerActiveForTask ? theme.background : theme.text + '80',
                  },
                ]}
              >
                {isTimerActiveForTask
                  ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                    .toString()
                    .padStart(2, '0')}`
                  : 'Focus'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {(youtubeId || !!descriptionText) && (
          <View style={styles.descriptionCard}>
            {youtubeId && (
              <YouTubePreview
                youtubeId={youtubeId}
                textColor={theme.text}
                bgColor={theme.text + '08'}
                showMeta={false}
              />
            )}

            {youtubeId && (
              <View style={styles.youtubeMetaContainer}>
                <Text style={styles.youtubeTitle} numberOfLines={2}>
                  {ytMeta ? ytMeta.title : 'Loading video title…'}
                </Text>
                <View style={styles.youtubeChannelRow}>
                  <Youtube size={13} color="#FF0000" />
                  <Text style={styles.youtubeChannel} numberOfLines={1}>
                    {ytMeta ? ytMeta.author : 'YouTube'}
                  </Text>
                </View>
              </View>
            )}

            {!!descriptionText && (
              <Text
                style={[
                  styles.descriptionText,
                  youtubeId && styles.descriptionWithYoutube,
                ]}
              >
                {descriptionText
                  .split(/(https?:\/\/[^\s]+)/g)
                  .map((part, index) => {
                    if (part.match(/(https?:\/\/[^\s]+)/g)) {
                      return (
                        <Text
                          key={index}
                          style={[
                            styles.linkText,
                            { color: theme.primary?.[4] || theme.text },
                          ]}
                          onPress={e => {
                            e.stopPropagation();
                            Linking.openURL(part).catch(err =>
                              console.log("Couldn't load page", err),
                            );
                          }}
                        >
                          {part}
                        </Text>
                      );
                    }
                    return part;
                  })}
              </Text>
            )}
          </View>
        )}

        <SubtaskList
          subtasks={subtasks}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onAddSubtask={handleAddSubtask}
        />

        {task.tag && task.tag.length > 0 && (
          <View style={styles.tagsContainer}>
            <Tag size={13} color={theme.text + '50'} />
            {task.tag.map((tag: string, idx: number) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {showActionButtons && (
        <View style={styles.actionButtonsContainer}>
          <View style={styles.advanceButtonWrapper}>
            <AnimatedIconButton
              style={[
                styles.advanceButton,
                { backgroundColor: advanceCfg.color },
              ]}
              onPress={effectiveOnAdvance}
            >
              {advanceCfg.Icon}
              <Text style={styles.advanceButtonText}>{advanceCfg.label}</Text>
            </AnimatedIconButton>
          </View>
          <AnimatedIconButton style={styles.deleteButton} onPress={effectiveOnDelete}>
            <Trash2 color={theme.error} size={22} />
          </AnimatedIconButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    paddingTop: 20,
    paddingBottom: 14,
  },
  title: {
    fontFamily: theme.fonts[700],
    fontSize: 26,
    color: theme.text,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.text + '06',
    borderWidth: 1,
    borderColor: theme.text + '0D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  dateText: {
    fontFamily: theme.fonts[500],
    fontSize: 13,
    color: theme.text + '90',
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  focusText: {
    fontFamily: theme.fonts[700],
    fontSize: 13,
  },
  descriptionCard: {
    backgroundColor: theme.text + '04',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.text + '0A',
    marginBottom: 20,
    overflow: 'hidden',
  },
  youtubeMetaContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 6,
  },
  youtubeTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 16,
    color: theme.text,
    lineHeight: 22,
  },
  youtubeChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youtubeChannel: {
    fontFamily: theme.fonts[500],
    fontSize: 13,
    color: theme.text + '70',
  },
  descriptionText: {
    fontFamily: theme.fonts[400],
    fontSize: 15,
    color: theme.text + '85',
    lineHeight: 24,
    padding: 16,
  },
  descriptionWithYoutube: {
    paddingTop: 0,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontFamily: theme.fonts[500],
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 24,
  },
  tagPill: {
    backgroundColor: theme.text + '04',
    borderWidth: 1,
    borderColor: theme.text + '0A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: theme.fonts[500],
    fontSize: 13,
    color: theme.text + '70',
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.background,
  },
  advanceButtonWrapper: {
    flex: 1,
  },
  advanceButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  advanceButtonText: {
    fontFamily: theme.fonts[600],
    fontSize: 15,
    color: theme.white,
    letterSpacing: 0.3,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.error + '25',
    backgroundColor: theme.error + '10',
  },
});
