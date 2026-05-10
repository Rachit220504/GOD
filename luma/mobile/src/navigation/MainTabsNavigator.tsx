import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, HomeStackParamList } from '../types';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { TAB_BAR_HEIGHT } from '../utils/responsive';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProgressNavigator } from './ProgressNavigator';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { PhonicsPracticeScreen } from '../screens/phonics/PhonicsPracticeScreen';
import { StoryDetailScreen } from '../screens/home/StoryDetailScreen';
import { ReadingModeScreen } from '../screens/reading/ReadingModeScreen';
import { ReadingHubScreen } from '../screens/reading/ReadingHubScreen';
import { GenerateStoryScreen } from '../screens/home/GenerateStoryScreen';
import { ParentDashboardScreen } from '../screens/parent/ParentDashboardScreen';
import { LinkChildScreen } from '../screens/parent/LinkChildScreen';

// ─── Tab bar icon ─────────────────────────────────────────────────────────────

function TabIcon({
  emoji,
  label,
  focused,
  image,
  customImage, // Renamed to avoid conflicts
}: {
  emoji: string;
  label: string;
  focused: boolean;
  image?: any;
  customImage?: any; // New prop for custom images
}) {
  return (
    <View style={styles.tabItem}>
      {customImage ? (
        <Image source={customImage} style={styles.tabImage} />
      ) : image ? (
        <Image source={image} style={styles.tabImage} />
      ) : (
        <Text style={styles.tabEmoji}>{emoji}</Text>
      )}
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
      <HomeStack.Screen name="LinkChild" component={LinkChildScreen} />
    </HomeStack.Navigator>
  );
}

// Reading Stack - Hub for browsing stories and reading
const ReadingStack = createNativeStackNavigator<HomeStackParamList>();

function ReadingStackNavigator() {
  return (
    <ReadingStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Reading hub is the entry point - shown as "HomeScreen" in this stack's context */}
      <ReadingStack.Screen name="ReadingMode" component={ReadingHubScreen} />
      <ReadingStack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <ReadingStack.Screen name="GenerateStory" component={GenerateStoryScreen} />
    </ReadingStack.Navigator>
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
            <View style={styles.tabTouchable}>
              <TouchableOpacity
                {...props}
                accessibilityRole="tab"
                accessibilityLabel="Home"
              >
                <TabIcon
                  emoji="🏠"
                  label="Home"
                  focused={props.accessibilityState?.selected ?? false}
                  image={require('../../assets/home-icon.png')}
                  customImage={props.accessibilityState?.selected ? require('../../assets/home-icon-blue.png') : require('../../assets/home-icon.png')}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Reading"
        component={ReadingStackNavigator}
        options={{
          tabBarButton: (props) => (
            <View style={styles.tabTouchable}>
              <TouchableOpacity
                {...props}
                accessibilityRole="tab"
                accessibilityLabel="Read"
              >
                <TabIcon
                  emoji="🏠"
                  label="Read"
                  focused={props.accessibilityState?.selected ?? false}
                  image={require('../../assets/read-icon.png')}
                  customImage={props.accessibilityState?.selected ? require('../../assets/read-icon-blue.png') : require('../../assets/read-icon.png')}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Phonics"
        component={PhonicsPracticeScreen}
        options={{
          tabBarButton: (props) => (
            <View style={styles.tabTouchable}>
              <TouchableOpacity
                {...props}
                accessibilityRole="tab"
                accessibilityLabel="Phonics"
              >
                <TabIcon
                  emoji="🏠"
                  label="Phonics"
                  focused={props.accessibilityState?.selected ?? false}
                  image={require('../../assets/phonics-icon.png')}
                  customImage={props.accessibilityState?.selected ? require('../../assets/phonics-icon-blue.png') : require('../../assets/phonics-icon.png')}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressNavigator}
        options={{
          tabBarButton: (props) => (
            <View style={styles.tabTouchable}>
              <TouchableOpacity
                {...props}
                accessibilityRole="tab"
                accessibilityLabel="Progress"
              >
                <TabIcon
                  emoji="🏠"
                  label="Progress"
                  focused={props.accessibilityState?.selected ?? false}
                  image={require('../../assets/progress-icon.png')}
                  customImage={props.accessibilityState?.selected ? require('../../assets/progress-icon-blue.png') : require('../../assets/progress-icon.png')}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButton: (props) => (
            <View style={styles.tabTouchable}>
              <TouchableOpacity
                {...props}
                accessibilityRole="tab"
                accessibilityLabel="Settings"
              >
                <TabIcon
                  emoji="🏠"
                  label="Settings"
                  focused={props.accessibilityState?.selected ?? false}
                  image={require('../../assets/settings-icon.png')}
                  customImage={props.accessibilityState?.selected ? require('../../assets/settings-icon-blue.png') : require('../../assets/settings-icon.png')}
                />
              </TouchableOpacity>
            </View>
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
    height: TAB_BAR_HEIGHT,
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
  tabImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
