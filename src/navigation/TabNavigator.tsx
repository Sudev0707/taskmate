import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TaskScreen from '../screens/TaskScreen';
import BrainDumpScreen from '../screens/BrainDumpScreen';
import theme from '../data/color-theme';
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  Brain,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SettingScreen from '../screens/SettingScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

export const routeNames = {
  home: 'Home',
  tasks: 'Tasks',
  braindump: 'Brain Dump',
  settings: 'Settings',
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
//   const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.text + '80',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#f0f0f0' ,
          borderColor: theme.text + '20',
          height: 50 + insets.bottom,
          // paddingBottom: insets.bottom ,
          paddingTop: 7,
          marginHorizontal: 16,
          borderRadius: 30,
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts[500],
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name={routeNames.home}
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <LayoutDashboard
              color={focused ? theme.background : theme.background + '60'}
              size={22}
            />
          ),
        }}
      />
      <Tab.Screen
        name={routeNames.braindump}
        component={BrainDumpScreen}
        options={{
          tabBarLabel: 'Brain Dump',
          tabBarIcon: ({ focused }) => (
            <Brain color={focused ? theme.background : theme.background + '60'} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name={routeNames.tasks}
        component={TaskScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <ListTodo
              color={focused ? theme.background : theme.background + '60'}
              size={22}
            />
          ),
        }}
      />

      <Tab.Screen
        name={routeNames.settings}
        component={SettingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Settings
              color={focused ? theme.background : theme.background + '60'}
              size={22}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
