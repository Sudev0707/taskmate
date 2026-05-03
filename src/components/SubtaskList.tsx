import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Plus, ListChecks } from 'lucide-react-native';
import theme from '../data/color-theme';
import { Subtask } from '../domain/models/TaskEntity';
import SubtaskItem from './SubtaskItem';
import AnimatedIconButton from './AnimatedIconButton';

type SubtaskListProps = {
  subtasks: Subtask[];
  onToggleSubtask: (id: number) => void;
  onDeleteSubtask: (id: number) => void;
  onAddSubtask: (title: string) => void;
};

export default function SubtaskList({
  subtasks,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const completedCount = subtasks.filter(s => s.isCompleted).length;
  const totalCount = subtasks.length;

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (title) {
      onAddSubtask(title);
      setNewSubtaskTitle('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ListChecks size={16} color={theme.text + '70'} />
          <Text style={styles.headerTitle}>Subtasks</Text>
        </View>
        {totalCount > 0 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        )}
      </View>

      {/* Add Subtask Input */}
      <View style={styles.addContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[styles.input, isInputFocused && styles.inputFocused]}
            placeholder="Add a subtask..."
            placeholderTextColor={theme.text + '50'}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={handleAddSubtask}
            returnKeyType="done"
          />
          <AnimatedIconButton
            style={[
              styles.addButton,
              newSubtaskTitle.trim() && styles.addButtonActive,
            ]}
            onPress={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
          >
            <Plus
              color={newSubtaskTitle.trim() ? theme.white : theme.text + '50'}
              size={20}
            />
          </AnimatedIconButton>
        </View>
      </View>

      {/* Subtask List */}
      {totalCount > 0 && (
        <View style={styles.listContainer}>
          {subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No subtasks yet. Add one below!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: theme.fonts[600],
    fontSize: 15,
    color: theme.text + '90',
  },
  counterBadge: {
    backgroundColor: theme.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    fontFamily: theme.fonts[600],
    fontSize: 13,
    color: theme.success,
  },
  listContainer: {
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: theme.text + '08',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.text + '10',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: theme.fonts[400],
    fontSize: 14,
    color: theme.text + '60',
    textAlign: 'center',
  },
  addContainer: {
    marginTop: 4,
     marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.text + '08',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts[500],
    fontSize: 15,
    color: theme.text + '90',
    borderWidth: 1,
    borderColor: theme.text + '10',
  },
  inputFocused: {
    borderColor: theme.primary[4],
    backgroundColor: theme.text + '0C',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.text + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: theme.primary[4],
  },
});
