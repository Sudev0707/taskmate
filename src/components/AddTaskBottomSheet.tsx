import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  PanResponder,
  ScrollView,
} from 'react-native';
import theme from '../data/color-theme';
import AnimatedIconButton from './AnimatedIconButton';
import {
  X,
  CheckCircle,
  CalendarDays,
  Sunrise,
  ChevronsDown,
  Minus,
  ChevronsUp,
  Bell,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';

export type NewTaskData = {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'to-do' | 'in-progress' | 'completed';
  tag: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (task: NewTaskData) => void;
  initialTaskData?: { title?: string; description?: string };
};

export default function AddTaskBottomSheet({
  visible,
  onClose,
  onSave,
  initialTaskData,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('low');
  const [selectedDateMode, setSelectedDateMode] = useState<
    'today' | 'tomorrow'
  >('today');

  // Missing reminder-related state variables
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [reminderPanelOpen, setReminderPanelOpen] = useState(false);

  // New animated modal for time picker
  const timePickerAnim = useRef(new Animated.Value(0)).current;

  // Local state for when the modal is actually mounted (for exit animation)
  const [isMounted, setIsMounted] = useState(visible);

  // Helper function to get ink color (assuming it should be theme.background)
  const ink = theme.background;

  // Helper function to format reminder time
  const getDisplayReminder = () => {
    if (!reminderTime) return '';
    const hours = reminderTime.getHours();
    const minutes = reminderTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const displayReminder = getDisplayReminder();

  // Reminder control functions
  const openReminderPanel = () => {
    if (!reminderTime) {
      // Set default reminder time (6:00 PM for today, 9:00 AM for tomorrow)
      const defaultTime = new Date();
      if (selectedDateMode === 'tomorrow') {
        defaultTime.setDate(defaultTime.getDate() + 1);
        defaultTime.setHours(9, 0, 0, 0);
      } else {
        defaultTime.setHours(18, 0, 0, 0); // 6:00 PM
      }
      setReminderTime(defaultTime);
    }
    // Animate modal open
    setReminderPanelOpen(true);
    Animated.spring(timePickerAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();
  };

  const closeTimePickerModal = () => {
    Animated.timing(timePickerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setReminderPanelOpen(false);
    });
  };

  const clearReminder = () => {
    setReminderTime(null);
    setReminderPanelOpen(false);
  };

  const bumpHours = (delta: number) => {
    if (!reminderTime) return;
    const newTime = new Date(reminderTime);
    newTime.setHours(newTime.getHours() + delta);
    setReminderTime(newTime);
  };

  const bumpMinutes = (delta: number) => {
    if (!reminderTime) return;
    const newTime = new Date(reminderTime);
    newTime.setMinutes(newTime.getMinutes() + delta);
    setReminderTime(newTime);
  };

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setTitle(initialTaskData?.title || '');
      setDescription(initialTaskData?.description || '');
      setTags([]);
      setCurrentTag('');
      setPriority('low');
      setSelectedDateMode('today');
      setReminderTime(null);
      setReminderPanelOpen(false);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    } else if (isMounted) {
      closeSheet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialTaskData]);

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
      onClose();
    });
  };

  const panResponder = useRef(
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
          onClose(); // Triggers the useEffect to close it
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

  const onTagTextChange = (text: string) => {
    if (text.endsWith(',')) {
      const newTag = text.replace(',', '').trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTag('');
    } else {
      setCurrentTag(text);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    let finalTags = [...tags];
    if (currentTag.trim().length > 0) {
      finalTags.push(currentTag.trim());
    }

    const taskDueDate = new Date();
    if (selectedDateMode === 'tomorrow') {
      taskDueDate.setDate(taskDueDate.getDate() + 1);
      taskDueDate.setHours(9, 0, 0, 0);
    } else {
      taskDueDate.setHours(0, 0, 0, 0);
    }

    onSave({
      title,
      description,
      priority,
      status: 'to-do',
      tag: finalTags.length ? finalTags : ['general'],
      dueDate: taskDueDate,
    });
  };

  if (!isMounted) return null;

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrapper}
      >
        {/* Backdrop */}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
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
          {/* Drag handle */}
          <View style={styles.handleBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                borderBottomWidth: 1,
                borderColor: theme.background + '20',
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts[600],
                  fontSize: 22,
                  color: theme.background,
                  paddingBottom: 16,
                }}
              >
                New Task
              </Text>
            </View>

            <Text style={styles.label}>Task Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Redesign landing page"
              placeholderTextColor={theme.background + '50'}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Describe the task"
              placeholderTextColor={theme.background + '50'}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Tags</Text>
            <View
              style={[
                styles.input,
                {
                  paddingVertical: 10,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                },
              ]}
            >
              {tags.map(t => (
                <View
                  key={t}
                  style={{
                    backgroundColor: theme.background,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color: theme.white,
                      fontFamily: theme.fonts[500],
                      fontSize: 13,
                    }}
                  >
                    #{t}
                  </Text>
                  <Pressable onPress={() => removeTag(t)}>
                    <X size={14} color={theme.white} />
                  </Pressable>
                </View>
              ))}
              <TextInput
                style={{
                  flex: 1,
                  minWidth: 100,
                  fontSize: 16,
                  fontFamily: theme.fonts[500],
                  color: theme.background,
                  paddingVertical: 4,
                }}
                placeholder={tags.length === 0 ? 'Type and press comma to add tags' : ''}
                placeholderTextColor={theme.background + '50'}
                value={currentTag}
                onChangeText={onTagTextChange}
                onSubmitEditing={() => onTagTextChange(currentTag + ',')}
                blurOnSubmit={false}
              />
            </View>

            <Text style={styles.label}>Due Date</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <AnimatedIconButton
                  onPress={() => setSelectedDateMode('today')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 44,
                    borderWidth: 1,
                    borderColor:
                      selectedDateMode === 'today'
                        ? theme.background
                        : theme.background + '20',
                    backgroundColor:
                      selectedDateMode === 'today'
                        ? theme.background
                        : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flexDirection: 'row',
                  }}
                >
                  <CalendarDays
                    size={18}
                    color={
                      selectedDateMode === 'today'
                        ? theme.white
                        : theme.background
                    }
                  />
                  <Text
                    style={{
                      color:
                        selectedDateMode === 'today'
                          ? theme.white
                          : theme.background,
                      fontFamily: theme.fonts[500],
                    }}
                  >
                    Today
                  </Text>
                </AnimatedIconButton>
              </View>
              <View style={{ flex: 1 }}>
                <AnimatedIconButton
                  onPress={() => setSelectedDateMode('tomorrow')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 44,
                    borderWidth: 1,
                    borderColor:
                      selectedDateMode === 'tomorrow'
                        ? theme.background
                        : theme.background + '20',
                    backgroundColor:
                      selectedDateMode === 'tomorrow'
                        ? theme.background
                        : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flexDirection: 'row',
                  }}
                >
                  <Sunrise
                    size={18}
                    color={
                      selectedDateMode === 'tomorrow'
                        ? theme.white
                        : theme.background
                    }
                  />
                  <Text
                    style={{
                      color:
                        selectedDateMode === 'tomorrow'
                          ? theme.white
                          : theme.background,
                      fontFamily: theme.fonts[500],
                    }}
                  >
                    Tomorrow
                  </Text>
                </AnimatedIconButton>
              </View>
            </View>

            <Text style={styles.label}>Reminder</Text>
            <View style={styles.reminderBlock}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderHint}>
                      {reminderTime
                        ? `Notifies at ${displayReminder} (${selectedDateMode === 'today' ? 'today' : 'tomorrow'
                        })`
                        : 'Default: 6:00 PM today or 9:00 AM tomorrow'}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderActions}>
                  {reminderTime ? (
                    <Pressable
                      onPress={openReminderPanel}
                      style={({ pressed }) => [
                        styles.reminderBtn,
                        pressed && { opacity: 0.9 },
                      ]}
                    >
                      <Clock size={16} color={theme.white} strokeWidth={2} />
                      <Text style={styles.reminderBtnText}>Edit</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={openReminderPanel}
                      style={({ pressed }) => [
                        styles.reminderBtn,
                        pressed && { opacity: 0.9 },
                      ]}
                    >
                      <Clock size={16} color={theme.white} strokeWidth={2} />
                      <Text style={styles.reminderBtnText}>Set time</Text>
                    </Pressable>
                  )}
                  {reminderTime && (
                    <Pressable
                      onPress={clearReminder}
                      style={({ pressed }) => [
                        styles.reminderBtnGhost,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={styles.reminderBtnGhostText}>Clear</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Time Picker Modal */}
            <Modal
              visible={reminderPanelOpen}
              transparent
              animationType="none"
              statusBarTranslucent
              onRequestClose={closeTimePickerModal}
            >
              <Animated.View
                style={[
                  styles.timePickerModalWrapper,
                  {
                    opacity: timePickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ]}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={closeTimePickerModal}
                />
                <Animated.View
                  style={[
                    styles.timePickerSheet,
                    {
                      transform: [
                        {
                          translateY: timePickerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [300, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {/* Header with Cancel/Done */}
                  <View style={styles.timePickerHeader}>
                    <Pressable onPress={closeTimePickerModal}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.timePickerTitle}>Set Reminder</Text>
                    <Pressable onPress={closeTimePickerModal}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </Pressable>
                  </View>

                  {/* Time Display */}
                  <Text style={styles.timeDisplayModal}>{displayReminder}</Text>

                  {/* Stepper Controls */}
                  <View style={styles.stepperRow}>
                    <View style={styles.stepperCol}>
                      <Text style={styles.stepperLabel}>Hour</Text>
                      <Pressable
                        onPress={() => bumpHours(1)}
                        style={styles.stepperHit}
                      >
                        <ChevronUp size={25} color={ink} strokeWidth={2} />
                      </Pressable>
                      <Pressable
                        onPress={() => bumpHours(-1)}
                        style={styles.stepperHit}
                      >
                        <ChevronDown size={25} color={ink} strokeWidth={2} />
                      </Pressable>
                    </View>
                    <View style={styles.stepperDivider} />
                    <View style={styles.stepperCol}>
                      <Text style={styles.stepperLabel}>Minute</Text>
                      <Pressable
                        onPress={() => bumpMinutes(15)}
                        style={styles.stepperHit}
                      >
                        <ChevronUp size={25} color={ink} strokeWidth={2} />
                      </Pressable>
                      <Pressable
                        onPress={() => bumpMinutes(-15)}
                        style={styles.stepperHit}
                      >
                        <ChevronDown size={25} color={ink} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.stepperFootnote}>
                    ±15 min per tap · uses your due day
                  </Text>
                </Animated.View>
              </Animated.View>
            </Modal>

            <Text style={styles.label}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
              {(['low', 'medium', 'high'] as const).map(p => {
                const isSelected = priority === p;
                const isHigh = p === 'high';

                const getIcon = () => {
                  if (p === 'low')
                    return (
                      <ChevronsDown
                        size={18}
                        color={isSelected ? theme.white : theme.background}
                      />
                    );
                  if (p === 'medium')
                    return (
                      <Minus
                        size={18}
                        color={isSelected ? theme.white : theme.background}
                      />
                    );
                  return (
                    <ChevronsUp
                      size={18}
                      color={isSelected ? theme.white : theme.error}
                    />
                  );
                };

                return (
                  <AnimatedIconButton
                    key={p}
                    onPress={() => setPriority(p as any)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 500,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? isHigh
                          ? theme.errorDark
                          : theme.background
                        : isHigh
                          ? theme.errorDark + '20'
                          : theme.background + '20',
                      backgroundColor: isSelected
                        ? isHigh
                          ? theme.errorDark
                          : theme.background
                        : 'transparent',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                      paddingHorizontal: 16,
                    }}
                  >
                    {getIcon()}
                    <Text
                      style={{
                        color: isSelected
                          ? theme.white
                          : isHigh
                            ? theme.error
                            : theme.background,
                        fontFamily: theme.fonts[500],
                        textTransform: 'capitalize',
                      }}
                    >
                      {p}
                    </Text>
                  </AnimatedIconButton>
                );
              })}
            </View>

            <AnimatedIconButton
              style={{
                width: '100%',
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.success,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                opacity: title.trim().length ? 1 : 0.5,
              }}
              onPress={handleSave}
              disabled={!title.trim().length}
            >
              <CheckCircle color={theme.white} size={20} />
              <Text
                style={{
                  fontFamily: theme.fonts[500],
                  fontSize: 16,
                  color: theme.white,
                }}
              >
                Save Task
              </Text>
            </AnimatedIconButton>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.white,
    borderRadius: 36,
    marginBottom: 32,
    overflow: 'hidden',
    maxHeight: '75%', // Ensure long forms become scrollable
  },
  handleBar: {
    width: 56,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.background + '20',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  label: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.background + '80',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.background + '08',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.fonts[500],
    color: theme.background,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.background + '10',
  },

  // reminder
  reminderBlock: {
    borderRadius: 9,
    // borderWidth: 1,
    borderColor: theme.background + '12',
    // backgroundColor: theme.background + '05',
    // padding: 16,
    marginBottom: 18,
  },
  reminderHeader: {
    gap: 12,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bellIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.primary[1] + '22',
    borderWidth: 1,
    borderColor: theme.primary[1] + '35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderHint: {
    fontFamily: theme.fonts[400],
    fontSize: 12,
    color: theme.background + '60',
    lineHeight: 17,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.background + '18',
  },
  reminderBtnText: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.white,
  },
  reminderBtnGhost: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.background + '18',
  },
  reminderBtnGhostText: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.background + '88',
  },
  timePanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.background + '14',
    alignItems: 'center',
  },
  timeDisplay: {
    fontFamily: theme.fonts[800],
    fontSize: 32,
    color: theme.background,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 24,
  },
  stepperCol: {
    alignItems: 'center',
    minWidth: 100,
    gap: 8,
  },
  stepperLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 11,
    color: theme.background + '50',
    textTransform: 'uppercase',
    letterSpacing: 0.8,

    // marginBottom: 8,
  },
  stepperHit: {
    // paddingVertical: 8,
    // paddingHorizontal: 20,
    // borderWidth:0.8,
    width: 35,
    height: 35,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background + '10',
  },
  stepperDivider: {
    width: 3,
    backgroundColor: theme.background + '14',
    marginVertical: 5,
    borderRadius: 9,
  },
  stepperFootnote: {
    fontFamily: theme.fonts[400],
    fontSize: 11,
    color: theme.background + '45',
    marginTop: 12,
  },

  // Time Picker Modal
  timePickerModalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerSheet: {
    backgroundColor: theme.primary[5],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timePickerCancel: {
    fontFamily: theme.fonts[400],
    fontSize: 16,
    color: theme.background + '80',
  },
  timePickerTitle: {
    fontFamily: theme.fonts[600],
    fontSize: 17,
    color: theme.background,
  },
  timePickerDone: {
    fontFamily: theme.fonts[600],
    fontSize: 16,
    color: theme.background,
  },
  timeDisplayModal: {
    fontFamily: theme.fonts[800],
    fontSize: 48,
    color: theme.background,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 32,
  },
});
