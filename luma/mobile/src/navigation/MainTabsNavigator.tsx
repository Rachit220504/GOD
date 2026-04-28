import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, HomeStackParamList } from '../types';
import { Colors, FontSize, Spacing, Shadow } from '../constants/theme';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { StoryDetailScreen } from '../screens/home/StoryDetailScreen';
import { ReadingModeScreen } from '../screens/reading/ReadingModeScreen';
import { GenerateStoryScreen } from '../screens/home/GenerateStoryScreen';
import { ParentDashboardScreen } from '../screens/parent/ParentDashboardScreen';

// ─── Tab bar icon ─────────────────────────────────────────────────────────────

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Home Stack ───────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <HomeStack.Screen name="ReadingMode" component={ReadingModeScreen} />
      <HomeStack.Screen name="GenerateStory" component={GenerateStoryScreen} />
      <HomeStack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              accessibilityRole="tab"
              accessibilityLabel="Home"
              style={styles.tabTouchable}
            >
              <TabIcon
                emoji="🏠"
                label="Home"
                focused={props.accessibilityState?.selected ?? false}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Reading"
        component={ReadingModeScreen}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              accessibilityRole="tab"
              accessibilityLabel="Reading"
              style={styles.tabTouchable}
            >
              <TabIcon
                emoji="📖"
                label="Read"
                focused={props.accessibilityState?.selected ?? false}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              accessibilityRole="tab"
              accessibilityLabel="Progress"
              style={styles.tabTouchable}
            >
              <TabIcon
                emoji="📊"
                label="Progress"
                focused={props.accessibilityState?.selected ?? false}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              accessibilityRole="tab"
              accessibilityLabel="Settings"
              style={styles.tabTouchable}
            >
              <TabIcon
                emoji="⚙️"
                label="Settings"
                focused={props.accessibilityState?.selected ?? false}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    height: 72,
    paddingBottom: 8,
    ...Shadow.md,
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    minWidth: 56,
  },
  tabItemFocused: {
    backgroundColor: Colors.lavender,
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: Colors.purple,
  },
});
