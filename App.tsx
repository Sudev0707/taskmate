import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JSX, useEffect } from "react";
import { StatusBar } from "react-native";
import TabNavigator from "./src/navigation/TabNavigator";
import TaskDetailsScreen from "./src/screens/TaskDetailsScreen";
import FocusSetupScreen from "./src/screens/FocusSetupScreen";
import FocusScreen from "./src/screens/FocusScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import HelpSupportScreen from "./src/screens/HelpSupportScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import { TimerProvider } from "./src/context/TimerContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import GlobalCelebration from "./src/components/GlobalCelebration";
import { ShareIntentHandler } from "./src/presentation/ShareIntentHandler";
import {
  createNotificationChannel,
  requestNotificationPermission,
  scheduleDailyStreakReminder,
} from "./src/services/NotificationService";

const Stack = createNativeStackNavigator();

function AppContent(): JSX.Element {
  const { theme, isDarkMode } = useTheme();

  const AppTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      text: theme.text,
      primary: theme.primary[2],
    },
  };

  useEffect(() => {
    async function initNotifications() {
      await requestNotificationPermission();
      await createNotificationChannel();
      await scheduleDailyStreakReminder();
    }

    initNotifications();
  }, []);

  return (
    <TimerProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <NavigationContainer theme={AppTheme}>
        <GlobalCelebration />
        <ShareIntentHandler />
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="TaskDetailsScreen" component={TaskDetailsScreen} />
          <Stack.Screen name="FocusSetupScreen" component={FocusSetupScreen} />
          <Stack.Screen name="FocusScreen" component={FocusScreen} />
          <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
          <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
          <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </TimerProvider>
  );
}

export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
