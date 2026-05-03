import { useState, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

export function useTaskSheet() {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openTaskSheet = (task: any) => {
    setSelectedTask(task);
    setSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start();
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

  return {
    selectedTask,
    sheetVisible,
    slideAnim,
    panResponder,
    openTaskSheet,
    closeTaskSheet,
  };
}
