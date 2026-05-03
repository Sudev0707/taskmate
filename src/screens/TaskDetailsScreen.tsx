import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ChevronsRight, CheckCircle, Trash2 } from 'lucide-react-native';
import theme from '../data/color-theme';
import TaskDetailsInfo from '../components/TaskDetailsInfo';
import AnimatedIconButton from '../components/AnimatedIconButton';
import { useTaskManager } from '../hooks/useTaskManager';

type RouteParams = {
  task: any;
};

export default function TaskDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { task } = (route.params ?? {}) as RouteParams;
  const { advanceTaskStatus, deleteTask } = useTaskManager();

  if (!task) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Task not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? theme.text + '18' : theme.text + '0E',
          })}
        >
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
        }}
      >
        <TaskDetailsInfo
          task={task}
          onClose={() => navigation.goBack()}
          onAdvanceStatus={() => {
            advanceTaskStatus(task.id);
            navigation.goBack();
          }}
          onDelete={() => {
            deleteTask(task.id);
            navigation.goBack();
          }}
          showActionButtons={false}
        />
      </ScrollView>

      {/* Fixed bottom action buttons */}
      <View style={styles.fixedBottomBar}>
        <View style={styles.advanceButtonWrapper}>
          <AnimatedIconButton
            style={[styles.advanceButton, { backgroundColor: theme.success }]}
            onPress={() => {
              advanceTaskStatus(task.id);
              navigation.goBack();
            }}
          >
            {task.status === 'to-do' ? (
              <ChevronsRight color={theme.white} size={18} />
            ) : (
              <CheckCircle color={theme.white} size={18} />
            )}
            <Text style={styles.advanceButtonText}>
              {task.status === 'to-do'
                ? 'Move to In Progress'
                : task.status === 'in-progress'
                  ? 'Mark as Done'
                  : 'Reschedule for Tomorrow'}
            </Text>
          </AnimatedIconButton>
        </View>
        <AnimatedIconButton
          style={styles.deleteButton}
          onPress={() => {
            deleteTask(task.id);
            navigation.goBack();
          }}
        >
          <Trash2 color={theme.error} size={22} />
        </AnimatedIconButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.padding.paddingMainX,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.text + '10',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: pressed ? theme.text + "18" : theme.text + "0E",
  },
  headerTitle: {
    fontFamily: theme.fonts[700],
    fontSize: 17,
    color: theme.text,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fonts[500],
    fontSize: 16,
    color: theme.text + '70',
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.text + '10',
  },
  advanceButtonWrapper: {
    flex: 1,
  },
  advanceButton: {
    width: '100%',
    height: 56,
    borderRadius: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  advanceButtonText: {
    fontFamily: theme.fonts[600],
    fontSize: 15,
    color: theme.white,
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.error + '30',
    backgroundColor: theme.error + '18',
  },
});
