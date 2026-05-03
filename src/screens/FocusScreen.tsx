import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ArrowLeft,
  Target,
  CheckCircle2,
  PartyPopper,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import theme from '../data/color-theme';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTimer } from '../context/TimerContext';
import { routeNames } from '../navigation/TabNavigator';
import {
  showFocusCompleteNotification,
  showActiveFocusNotification,
  cancelActiveFocusNotification,
  scheduleFocusCompletionNotification,
  cancelScheduledFocusCompletion,
} from '../services/NotificationService';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8;
const STROKE_WIDTH = 20;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Arc properties
const ARC_LENGTH = CIRCUMFERENCE * 0.75;
const GAP_LENGTH = CIRCUMFERENCE * 0.25;

export default function FocusScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<
    RouteProp<
      Record<
        string,
        {
          duration?: number;
          taskId?: number;
          taskColor?: string;
          taskTitle?: string;
        }
      >,
      string
    >
  >();
  const { setTaskStatus } = useTaskManager();
  const {
    timeLeft,
    isActive,
    durationMins,
    stopTimer,
    resumeTimer,
    endTimer,
    resetTimer: contextResetTimer,
    activeTaskId,
  } = useTimer();

  // The route params are just for display on this screen.
  // If the timer is active globally and matching the route params, we use the global values.
  // For simplicity, we assume FocusScreen displays the active timer if there is one, otherwise the setup values.
  const displayDurationMins = durationMins || route.params?.duration || 25;
  const TOTAL_SECONDS = Math.max(displayDurationMins * 60, 1);
  const taskId = activeTaskId || route.params?.taskId;
  const primaryColor = route.params?.taskColor || theme.primary[4];
  const taskTitle = route.params?.taskTitle || 'Focus Time';

  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const animatedProgress = useRef(new Animated.Value(timeLeft)).current;

  useEffect(() => {
    if (isActive) {
      showActiveFocusNotification(taskTitle, false);
      const endTimestamp = Date.now() + timeLeft * 1000;
      scheduleFocusCompletionNotification(taskTitle, endTimestamp);
    } else {
      showActiveFocusNotification(taskTitle, true);
    }
    return () => {
      cancelActiveFocusNotification();
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    if (isActive) {
      const endTimestamp = Date.now() + timeLeft * 1000;
      scheduleFocusCompletionNotification(taskTitle, endTimestamp);
      showActiveFocusNotification(taskTitle, false);
    } else {
      cancelScheduledFocusCompletion();
      showActiveFocusNotification(taskTitle, true);
    }
  }, [isActive]);

  const prevTimeLeft = useRef(timeLeft);
  useEffect(() => {
    if (prevTimeLeft.current > 0 && timeLeft === 0 && !isActive) {
      handleCompletion();
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, isActive]);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: timeLeft,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const handleCompletion = async () => {
    setShowConfetti(true);
    setShowSuccessModal(true);
    if (taskId != null) {
      await setTaskStatus(taskId, 'completed');
    }

    await cancelActiveFocusNotification();
    await cancelScheduledFocusCompletion();
    await showFocusCompleteNotification(taskTitle);
  };

  const handleKeepItUp = () => {
    navigation.replace(routeNames.home);
  };

  const toggleTimer = () => {
    if (isActive) stopTimer();
    else resumeTimer();
  };

  const resetTimer = () => {
    contextResetTimer();
    animatedProgress.setValue(TOTAL_SECONDS);
    setShowConfetti(false);
    cancelActiveFocusNotification();
    cancelScheduledFocusCompletion();
  };

  const skipTimer = () => {
    endTimer();
    animatedProgress.setValue(0);
    handleCompletion();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}.${s.toString().padStart(2, '0')}`;
  };

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const dashOffset = animatedProgress.interpolate({
    inputRange: [0, TOTAL_SECONDS],
    outputRange: [ARC_LENGTH, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Timer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.timerContainer}>
        <View style={[styles.timerCircle, { width: SIZE, height: SIZE }]}>
          <Svg width={SIZE} height={SIZE} style={styles.svgRotation}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={theme.text + '15'}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${ARC_LENGTH} ${GAP_LENGTH}`}
              strokeLinecap="round"
            />

            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={primaryColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </Svg>

          <View style={styles.timeTextContainer}>
            <Text style={[styles.timeText, { color: primaryColor }]}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerStatus}>
              {isActive ? 'RUNNING' : timeLeft === 0 ? 'FINISHED' : 'PAUSED'}
            </Text>
          </View>
        </View>

        <View style={styles.infoPill}>
          {taskId && <Target color={primaryColor} size={20} />}
          <Text style={styles.infoText}>
            {taskTitle} ({displayDurationMins}m)
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={resetTimer} style={styles.controlButton}>
          <RotateCcw color={theme.text + '80'} size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTimer}
          activeOpacity={0.8}
          style={[
            styles.controlPlayButton,
            {
              backgroundColor: isActive ? theme.text + '08' : primaryColor,
              shadowColor: isActive ? 'transparent' : primaryColor,
              borderWidth: isActive ? 1 : 0,
              borderColor: isActive ? theme.text + '15' : 'transparent',
            },
          ]}
        >
          {isActive ? (
            <Pause fill={theme.text} color={theme.text} size={36} />
          ) : (
            <Play
              fill={theme.background}
              color={theme.background}
              size={36}
              style={styles.playIcon}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipTimer} style={styles.controlButton}>
          <SkipForward color={theme.text + '80'} size={24} />
        </TouchableOpacity>
      </View>

      {showConfetti && (
        <View style={styles.confettiOverlay}>
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: -20 }}
            fallSpeed={2500}
            fadeOut={true}
            autoStart={true}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}

      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: primaryColor + '15' },
              ]}
            >
              <CheckCircle2 color={primaryColor} size={56} />
            </View>

            <Text style={styles.modalTitle}>Session Complete</Text>
            <Text style={styles.modalSubtitle}>
              Great work! You've stayed focused and reached your goal.
            </Text>

            <Pressable
              style={[styles.modalButton, { backgroundColor: primaryColor }]}
              onPress={handleKeepItUp}
            >
              <PartyPopper color={theme.background} size={22} />
              <Text style={styles.buttonText}>Keep it up</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  // Header styles
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
    // padding: 8,
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
    fontSize: 20,
  },
  headerSpacer: {
    width: 40,
  },
  // Timer container
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgRotation: {
    transform: [{ rotate: '135deg' }],
  },
  timeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: theme.fonts[800],
    fontSize: 80,
    lineHeight: 90,
    letterSpacing: -2,
    marginBottom: 4,
  },
  timerStatus: {
    color: theme.text + '60',
    fontFamily: theme.fonts[700],
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Info pill
  infoPill: {
    backgroundColor: theme.text + '05',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 32,
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  infoText: {
    color: theme.text + '90',
    fontFamily: theme.fonts[600],
    fontSize: 17,
  },
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
    gap: 32,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.text + '05',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.text + '08',
  },
  controlPlayButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4,
  },
  // Confetti
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 9999,
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9998,
  },
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 40,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.text + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 32,
    fontFamily: theme.fonts[800],
    color: theme.text,
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts[500],
    color: theme.text + '70',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 32,
    gap: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: theme.background,
    fontSize: 18,
    fontFamily: theme.fonts[700],
    letterSpacing: 0.5,
  },
});
