import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { Colors } from '../constants/theme';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  // 1. Pull the authentication state directly from your context
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();

  return (
    <NavigationContainer
      onStateChange={() => {
        // Suppress development-only warnings about navigation actions
      }}
    >
      <Root.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'fade',
        }}
      >
        {/* 2. Conditionally render the correct stack based on state */}
        {isLoading ? (
          // Show splash screen while checking secure storage for tokens
          <Root.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          // No user? Force them into the Auth flow
          <Root.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          // Authenticated but needs to complete setup? Show Onboarding
          <Root.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          // Fully authenticated and onboarded? Show the Main app
          <Root.Screen name="Main" component={MainTabsNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}