import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../../data/color-theme';
import { useNavigation } from '@react-navigation/native';
import { Plus, Calendar, BarChart2, Bell } from 'lucide-react-native';
import AddTaskBottomSheet, {
  NewTaskData,
} from '../../components/AddTaskBottomSheet';
import { useTaskManager } from '../../hooks/useTaskManager';

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  bgColor: string;
};

export default function QuickActionsWidget() {
  const navigation = useNavigation<any>();
  const { saveNewTask } = useTaskManager();
  const [addSheetVisible, setAddSheetVisible] = useState(false);

  const handleSaveTask = async (data: NewTaskData) => {
    await saveNewTask(data);
    setAddSheetVisible(false);
  };

  const quickActions: QuickAction[] = [
    {
      icon: <Plus stroke={theme.text} size={22} />,
      label: 'Add Task',
      onPress: () => setAddSheetVisible(true),
      bgColor: theme.primary[2],
    },
    {
      icon: <Calendar stroke={theme.text} size={22} />,
      label: 'Calendar',
      onPress: () => navigation.navigate('CalendarScreen'),
      bgColor: theme.white,
    },
    {
      icon: <BarChart2 stroke={theme.text} size={22} />,
      label: 'Analytics',
      onPress: () => navigation.navigate('AnalyticsScreen'),
      bgColor: theme.white,
    },
    {
      icon: <Bell stroke={theme.text} size={22} />,
      label: 'Focus',
      onPress: () => navigation.navigate('FocusSetupScreen'),
      bgColor: theme.white,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>

      <View style={styles.actionsContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={action.onPress}
            style={styles.actionButton}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.text + '10',
                },
              ]}
            >
              {action.icon}
            </View>
            <Text style={[styles.actionLabel]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AddTaskBottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSave={handleSaveTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    fontFamily: theme.fonts[600],
    fontSize: 16,
    color: theme.text,
    marginBottom: 12,
    paddingHorizontal: theme.padding.paddingMainX,
  },
  actionsContainer: {
    marginHorizontal: theme.padding.paddingMainX,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    backgroundColor: theme.text + '08',
    borderRadius: theme.border.radius.main,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.text + '15',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: theme.fonts[600],
    fontSize: 14,
    color: theme.text,
  },
});
