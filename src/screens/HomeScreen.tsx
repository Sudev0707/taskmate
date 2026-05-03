import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../data/color-theme';
import HeaderHeroScreen from '../layouts/homeScreen/Header';
import TodayRecentTasks from '../layouts/homeScreen/TodayRecentTasks';
import { useStreak } from '../hooks/useStreak';
import { useTaskManager } from '../hooks/useTaskManager';
import ProductivityStatsWidget from '../layouts/homeScreen/ProductivityStatsWidget';

export default function HomeScreen() {
  const { tasks } = useTaskManager();
  const { currentStreak } = useStreak(tasks);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
      >
        <HeaderHeroScreen streak={currentStreak} />
        <TodayRecentTasks />
        <ProductivityStatsWidget />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
});
