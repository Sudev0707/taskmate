import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
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

// ─── Subtask type ───────────────────────────────────────────────────────────────
export type Subtask = {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
};

// ─── Task type ───────────────────────────────────────────────────────────────
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

// ─── Status constants ────────────────────────────────────────────────────────
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

// ─── Priority config (updated) ────────────────────────────────────────────────
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
    icon: <ArrowDown size={12} color="#616161" />,
    label: 'Low',
    color: '#616161',
    bg: theme.primary[5],
    dot: '#616161',
  },
};

// ─── Swipe-right helpers ─────────────────────────────────────────────────────
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

// ─── Screen constants ────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const ABSOLUTE_FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// ─── Props ───────────────────────────────────────────────────────────────────
type TaskCardProps = {
  task: Task;
  bgColor: string;
  onPress: () => void;
  onAdvanceStatus?: () => void;
  onSetStatus?: (newStatus: string, newDueDate?: Date) => void;
  onDelete?: () => void;
  onComplete?: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
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

  // Store latest callbacks to avoid stale closures in PanResponder
  const latestCallbacks = useRef({ onAdvanceStatus, onComplete, onDelete });
  latestCallbacks.current = { onAdvanceStatus, onComplete, onDelete };

  const { timeLeft, isActive, activeTaskId } = useTimer();
  const navigation = useNavigation<any>();

  // ── Status navigation ─────────────────────────────────────────────────
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

  // ── PanResponder ──────────────────────────────────────────────────────
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
    <View style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
      {/* ── LEFT bg (swipe right) ─────────────────────────────────── */}
      <Animated.View
        style={[
          ABSOLUTE_FILL,
          {
            backgroundColor: STATUS_COLORS[task.status] + '20',
            borderRadius: theme.border.radius.main,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 24,
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
          style={{
            backgroundColor: STATUS_COLORS[task.status] + '30',
            height: 40,
            width: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SwipeRightIcon status={task.status} />
        </View>
        <Text
          style={{
            fontFamily: theme.fonts[600],
            fontSize: 14,
            color: theme.white,
            marginLeft: 12,
          }}
        >
          {swipeRightLabel}
        </Text>
      </Animated.View>

      {/* ── RIGHT bg (swipe left) ─────────────────────────────────── */}
      <Animated.View
        style={[
          ABSOLUTE_FILL,
          {
            backgroundColor: '#FF575715',
            borderRadius: theme.border.radius.main,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 24,
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
        <Text
          style={{
            fontFamily: theme.fonts[600],
            fontSize: 14,
            color: '#FF5757',
            marginRight: 12,
          }}
        >
          Delete
        </Text>
        <View
          style={{
            backgroundColor: '#FF575725',
            height: 40,
            width: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Trash2 color="#FF5757" size={20} />
        </View>
      </Animated.View>

      {/* ── Foreground card ───────────────────────────────────────── */}
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
          style={{
            backgroundColor: bgColor,
            borderRadius: 20,
            padding: 16,
            gap: 12,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Status Badge */}
          <View
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
            //   backgroundColor: STATUS_COLORS[task.status] + '20',
            //   paddingHorizontal: 8,
            //   paddingVertical: 4,
            //   borderRadius: 12,
            }}
          >
            {/* <Text style={{ 
                            fontFamily: theme.fonts[600], 
                            fontSize: 10, 
                            color: STATUS_COLORS[task.status],
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            {STATUS_LABELS[task.status]}
                        </Text> */}
            {/* Priority pill */}
            {priorityCfg && (
              <View
                style={{
                  backgroundColor: theme.white,
                  paddingHorizontal: 7,
                  paddingVertical: 5,
                  borderRadius: 50,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {priorityCfg.icon}
                <Text
                  style={{
                    fontFamily: theme.fonts[600],
                    fontSize: 11,
                    color: priorityCfg.color,
                  }}
                >
                  {priorityCfg.label}
                </Text>
              </View>
            )}
          </View>

          {/* ── Title ─────────────────────────── */}
          <View style={{ paddingRight: 80 }}>
            <Text
              style={{
                fontFamily: theme.fonts[600],
                fontSize: 18,
                color: theme.background,
                lineHeight: 24,
                marginBottom: 4,
              }}
            >
              {youtubeId
                ? task.title
                : task.title.split('-')[1]?.trim() || task.title}
            </Text>

            {/* ── Description ───────────────────── */}
            {!!hideYouTubeUrl(task.description) && (
              <Text
                style={{
                  fontFamily: theme.fonts[400],
                  fontSize: 14,
                  color: theme.background + '80',
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {hideYouTubeUrl(task.description)
                  .split(/(https?:\/\/[^\s]+)/g)
                  .map((part, index) => {
                    if (part.match(/(https?:\/\/[^\s]+)/g)) {
                      return (
                        <Text
                          key={index}
                          style={{
                            textDecorationLine: 'underline',
                            color: theme.background + 'CC',
                          }}
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

          {/* ── YouTube Thumbnail ─────────────── */}
          {youtubeId && (
            <View style={{ marginVertical: 4 }}>
              <YouTubePreview
                youtubeId={youtubeId}
                textColor={theme.background}
                bgColor={theme.background + '10'}
              />
            </View>
          )}

          {/* ── Bottom section: metadata ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 4,
            }}
          >
            {/* Left side: Tags & Due Date */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
                flex: 1,
              }}
            >
              {/* Due Date */}
              {/* {task.dueDate && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.background + "10", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                                    <Calendar size={12} color={theme.background + "70"} />
                                    <Text style={{ fontFamily: theme.fonts[500], fontSize: 11, color: theme.background + "70" }}>
                                        {formatDueDate(task.dueDate)}
                                    </Text>
                                </View>
                            )} */}

              {/* Tags */}
              {task.tag?.slice(0, 2).map((tagName: string, i: number) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: theme.background + '10',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                  }}
                >
                  <Tag size={10} color={theme.background + '60'} />
                  <Text
                    key={i}
                    style={{
                      fontFamily: theme.fonts[500],
                      fontSize: 11,
                      color: theme.background + '70',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tagName}
                  </Text>
                </View>
              ))}

              {(task.tag?.length ?? 0) > 2 && (
                <View
                  style={{
                    backgroundColor: theme.background + '10',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts[600],
                      fontSize: 11,
                      color: theme.background + '70',
                    }}
                  >
                    +{(task.tag?.length ?? 0) - 2}
                  </Text>
                </View>
              )}
            </View>

            {/* Right side: Priority & Timer */}
            <View
              style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
            >
              {/* Timer Button */}
              {task.status !== 'completed' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isActive && activeTaskId === task.id) {
                      navigation.navigate('FocusScreen', {
                        taskId: task.id,
                        duration: Math.floor(timeLeft / 60),
                      });
                    } else {
                      navigation.navigate('FocusSetupScreen', {
                        taskId: task.id,
                      });
                    }
                  }}
                  style={{
                    backgroundColor:
                      isActive && activeTaskId === task.id
                        ? theme.background
                        : theme.background + '15',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: isActive && activeTaskId === task.id ? 0 : 1,
                    borderColor: theme.background + '20',
                  }}
                >
                  <Play
                    fill={
                      isActive && activeTaskId === task.id
                        ? theme.white
                        : theme.background
                    }
                    color={
                      isActive && activeTaskId === task.id
                        ? theme.white
                        : theme.background
                    }
                    size={10}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts[700],
                      fontSize: 12,
                      color:
                        isActive && activeTaskId === task.id
                          ? theme.white
                          : theme.background + '90',
                    }}
                  >
                    {isActive && activeTaskId === task.id
                      ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                          .toString()
                          .padStart(2, '0')}`
                      : 'Focus'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Indicator for long-press */}
          {task.status !== 'to-do' && !showStatusMenu && (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                right: 0,
                alignItems: 'center',
                opacity: 0.3,
              }}
            >
              <MoreVertical size={12} color={theme.background} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Long-press status menu ────────── */}
      {showStatusMenu && task.status !== 'to-do' && (
        <View
          style={{
            marginTop: -8,
            paddingTop: 8,
            backgroundColor: bgColor,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: theme.background + '15',
            }}
          >
            {/* ← Prev */}
            {prevStatus ? (
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: theme.background + '10',
                  paddingVertical: 10,
                  borderRadius: 30,
                }}
                onPress={handlePrevStatus}
                activeOpacity={0.85}
              >
                <ArrowLeft size={14} color={theme.background} />
                <Text
                  style={{
                    fontFamily: theme.fonts[600],
                    fontSize: 13,
                    color: theme.background,
                  }}
                >
                  {STATUS_LABELS[prevStatus]}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {/* Next → */}
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: STATUS_COLORS[nextStatus],
                paddingVertical: 10,
                borderRadius: 30,
              }}
              onPress={handleNextStatus}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontFamily: theme.fonts[600],
                  fontSize: 13,
                  color: theme.white,
                }}
              >
                {STATUS_LABELS[nextStatus]}
              </Text>
              {nextIsTomorrow && (
                <Text
                  style={{
                    fontFamily: theme.fonts[400],
                    fontSize: 10,
                    color: theme.white + 'CC',
                  }}
                >
                  Tomorrow
                </Text>
              )}
              <ArrowRight size={14} color={theme.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
