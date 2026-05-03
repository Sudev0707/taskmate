import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
  StyleSheet,
} from 'react-native';
import theme from '../data/color-theme';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronsRight,
  Trash2,
  Play,
  Clock,
  Tag,
  MoreVertical,
  Calendar,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
} from 'lucide-react-native';
import { useTimer } from '../context/TimerContext';
import { useNavigation } from '@react-navigation/native';
import { extractYouTubeId, hideYouTubeUrl } from '../utils/youtube';
import YouTubePreview from './YouTubePreview';

export type Subtask = {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | string;
  tag?: string[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  subtasks?: Subtask[];
  [key: string]: any;
};

const STATUS_ORDER = ['to-do', 'in-progress', 'completed'] as const;
type TaskStatus = (typeof STATUS_ORDER)[number];

const STATUS_LABELS: Record<string, string> = {
  'to-do': 'To Do',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  'to-do': theme.primary[4],
  'in-progress': '#FFB224',
  completed: '#4CAF50',
};

const getTomorrow = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
};

export const PRIORITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bg: string; dot: string }
> = {
  high: {
    icon: <Flame size={12} color="#FF5757" />,
    label: 'High',
    color: '#FF5757',
    bg: theme.primary[4],
    dot: '#FF5757',
  },
  medium: {
    icon: <Minus size={12} color="#FFB224" />,
    label: 'Medium',
    color: '#FFB224',
    bg: theme.primary[7],
    dot: '#FFB224',
  },
  low: {
    icon: <ArrowDown size={12} color="#2e7bdf" />,
    label: 'Low',
    color: '#2e7bdf',
    bg: theme.primary[5],
    dot: '#2e7bdf',
  },
};

const getSwipeRightLabel = (status: string) => {
  if (status === 'to-do') return 'Move to In Progress';
  if (status === 'in-progress') return 'Mark as Done';
  return 'Reschedule for Tomorrow';
};

const SwipeRightIcon = ({ status }: { status: string }) => {
  if (status === 'in-progress') return <Check color={theme.white} size={20} />;
  if (status === 'completed')
    return <CalendarClock color={theme.white} size={20} />;
  return <ChevronsRight color={theme.white} size={20} />;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

type TaskCardProps = {
  task: Task;
  bgColor: string;
  onPress: () => void;
  onAdvanceStatus?: () => void;
  onSetStatus?: (newStatus: string, newDueDate?: Date) => void;
  onDelete?: () => void;
  onComplete?: () => void;
};

export default function TaskCard({
  task,
  bgColor,
  onPress,
  onAdvanceStatus,
  onSetStatus,
  onDelete,
  onComplete,
}: TaskCardProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const [dismissed, setDismissed] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const latestCallbacks = useRef({ onAdvanceStatus, onComplete, onDelete });
  latestCallbacks.current = { onAdvanceStatus, onComplete, onDelete };

  const { timeLeft, isActive, activeTaskId } = useTimer();
  const navigation = useNavigation<any>();

  const currentIdx = STATUS_ORDER.indexOf(task.status as TaskStatus);
  const prevStatus: TaskStatus | null =
    currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus: TaskStatus =
    task.status === 'completed'
      ? 'to-do'
      : STATUS_ORDER[Math.min(currentIdx + 1, 2)];
  const nextIsTomorrow = task.status === 'completed';

  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? null;
  const swipeRightLabel = getSwipeRightLabel(task.status);
  const youtubeId = extractYouTubeId(task.description);

  // Format due date
  const formatDueDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (showStatusMenu) return false;
        return (
          Math.abs(gs.dx) > Math.abs(gs.dy) &&
          Math.abs(gs.dx) > 10 &&
          !dismissed
        );
      },
      onPanResponderMove: (_, gs) => pan.setValue(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setDismissed(true);
            const cbs = latestCallbacks.current;
            if (cbs.onAdvanceStatus) cbs.onAdvanceStatus();
            else if (cbs.onComplete) cbs.onComplete();
          });
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setDismissed(true);
            latestCallbacks.current.onDelete?.();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 12,
            speed: 20,
          }).start();
        }
      },
    }),
  ).current;

  if (dismissed) return null;

  const handlePrevStatus = () => {
    if (!prevStatus) return;
    onSetStatus?.(prevStatus);
    setShowStatusMenu(false);
  };
  const handleNextStatus = () => {
    onSetStatus?.(nextStatus, nextIsTomorrow ? getTomorrow() : undefined);
    setShowStatusMenu(false);
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Right swipe background */}
      <Animated.View
        style={[
          styles.swipeRightBg,
          {
            backgroundColor: STATUS_COLORS[task.status] + '20',
            opacity: pan.interpolate({
              inputRange: [0, SWIPE_THRESHOLD],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: pan.interpolate({
                  inputRange: [0, SWIPE_THRESHOLD],
                  outputRange: [0.95, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.swipeIconContainer,
            { backgroundColor: STATUS_COLORS[task.status] + '30' },
          ]}
        >
          <SwipeRightIcon status={task.status} />
        </View>
        <Text style={styles.swipeRightLabel}>{swipeRightLabel}</Text>
      </Animated.View>

      {/* Left swipe background (Delete) */}
      <Animated.View
        style={[
          styles.swipeLeftBg,
          {
            opacity: pan.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: pan.interpolate({
                  inputRange: [-SWIPE_THRESHOLD, 0],
                  outputRange: [1, 0.95],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.swipeLeftLabel}>Delete</Text>
        <View style={styles.swipeDeleteIconContainer}>
          <Trash2 color="#FF5757" size={20} />
        </View>
      </Animated.View>

      {/* Foreground card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [
            { translateX: pan },
            {
              rotateZ: pan.interpolate({
                inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                outputRange: ['-8deg', '0deg', '8deg'],
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() =>
            showStatusMenu ? setShowStatusMenu(false) : onPress()
          }
          onLongPress={
            task.status !== 'to-do' ? () => setShowStatusMenu(true) : undefined
          }
          delayLongPress={500}
          style={[styles.cardTouchable, { backgroundColor: bgColor + '60', borderColor: bgColor }]}
        >
          {/* Priority Badge */}
          <View style={styles.priorityBadgeWrapper}>
            {priorityCfg && (
              <View style={styles.priorityBadge}>
                {priorityCfg.icon}
                <Text
                  style={[
                    styles.priorityBadgeText,
                    { color: priorityCfg.color },
                  ]}
                >
                  {priorityCfg.label}
                </Text>
              </View>
            )}
          </View>

          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              {youtubeId
                ? task.title
                : task.title.split('-')[1]?.trim() || task.title}
            </Text>

            {!!hideYouTubeUrl(task.description) && (
              <Text style={styles.descriptionText} numberOfLines={2}>
                {hideYouTubeUrl(task.description)
                  .split(/(https?:\/\/[^\s]+)/g)
                  .map((part, index) => {
                    if (part.match(/(https?:\/\/[^\s]+)/g)) {
                      return (
                        <Text
                          key={index}
                          style={styles.linkText}
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

          {/* Bottom section: metadata */}
          <View style={styles.metadataContainer}>
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {task.tag?.slice(0, 2).map((tagName: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Tag size={10} color={theme.text} />
                  <Text style={styles.tagText}>
                    {tagName}
                  </Text>
                </View>
              ))}

              {(task.tag?.length ?? 0) > 2 && (
                <View style={styles.extraTagCount}>
                  <Text style={styles.extraTagCountText}>
                    +{(task.tag?.length ?? 0) - 2}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Indicator for long-press */}
          {task.status !== 'to-do' && !showStatusMenu && (
            <View style={styles.longPressIndicator}>
              <MoreVertical size={12} color={theme.background} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Long-press status menu */}
      {showStatusMenu && task.status !== 'to-do' && (
        <View style={[styles.statusMenu, { backgroundColor: bgColor }]}>
          <View style={styles.statusMenuContent}>
            {/* Previous Status Button */}
            {prevStatus ? (
              <TouchableOpacity
                style={styles.prevStatusButton}
                onPress={handlePrevStatus}
                activeOpacity={0.85}
              >
                <ArrowLeft size={14} color={theme.background} />
                <Text style={styles.statusButtonText}>
                  {STATUS_LABELS[prevStatus]}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptySpace} />
            )}

            {/* Next Status Button */}
            <TouchableOpacity
              style={[
                styles.nextStatusButton,
                { backgroundColor: STATUS_COLORS[nextStatus] },
              ]}
              onPress={handleNextStatus}
              activeOpacity={0.85}
            >
              <Text style={styles.nextStatusButtonText}>
                {STATUS_LABELS[nextStatus]}
              </Text>
              {nextIsTomorrow && (
                <Text style={styles.tomorrowBadge}>Tomorrow</Text>
              )}
              <ArrowRight size={14} color={theme.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
  },
  // Swipe Right Background
  swipeRightBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.border.radius.main,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
  },
  swipeIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeRightLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.white,
    marginLeft: 12,
  },
  // Swipe Left Background
  swipeLeftBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF575715',
    borderRadius: theme.border.radius.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
  },
  swipeLeftLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: '#FF5757',
    marginRight: 12,
  },
  swipeDeleteIconContainer: {
    backgroundColor: '#FF575725',
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card Touchable
  cardTouchable: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
  },
  // Priority Badge
  priorityBadgeWrapper: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  priorityBadge: {
    backgroundColor: theme.white,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityBadgeText: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
  },
  // Title Section
  titleContainer: {
    paddingRight: 80,
  },
  titleText: {
    fontFamily: theme.fonts[600],
    fontSize: 18,
    color: theme.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  descriptionText: {
    fontFamily: theme.fonts[400],
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: theme.background + 'CC',
  },
  // Metadata Section
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.text + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: theme.fonts[500],
    fontSize: 11,
    color: theme.text,
    textTransform: 'capitalize',
  },
  extraTagCount: {
    backgroundColor: theme.background + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  extraTagCountText: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
    color: theme.background + '70',
  },
  // Long Press Indicator
  longPressIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.3,
  },
  // Status Menu
  statusMenu: {
    marginTop: -8,
    paddingTop: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  statusMenuContent: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.background + '15',
  },
  prevStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.background + '10',
    paddingVertical: 10,
    borderRadius: 30,
  },
  statusButtonText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
    color: theme.background,
  },
  emptySpace: {
    flex: 1,
  },
  nextStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 30,
  },
  nextStatusButtonText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
    color: theme.white,
  },
  tomorrowBadge: {
    fontFamily: theme.fonts[400],
    fontSize: 10,
    color: theme.white + 'CC',
  },
});