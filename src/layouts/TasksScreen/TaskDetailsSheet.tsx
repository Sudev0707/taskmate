import React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import theme from '../../data/color-theme';
import TaskDetailsInfo from '../../components/TaskDetailsInfo';

type Props = {
  visible: boolean;
  selectedTask: any | null;
  slideAnim: Animated.Value;
  panHandlers: object;
  onClose: () => void;
  onAdvanceStatus: () => void;
  onDelete: () => void;
  onUpdateTask?: (updatedTask: any) => void;
};

export default function TaskDetailsSheet({
  visible,
  selectedTask,
  slideAnim,
  panHandlers,
  onClose,
  onAdvanceStatus,
  onDelete,
  onUpdateTask,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

     
        <Animated.View
          {...panHandlers}
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
              onClose={onClose}
              onAdvanceStatus={onAdvanceStatus}
              onDelete={onDelete}
              onUpdateTask={onUpdateTask}
            />
          )}

          <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
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
    // margin: 16,
    overflow: 'hidden',
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
});
