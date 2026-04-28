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
  return (
    <NavigationContainer>
      <Root.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'fade',
        }}
      >
        <Root.Screen name="Splash" component={SplashScreen} />
        <Root.Screen name="Auth" component={AuthNavigator} />
        <Root.Screen name="Onboarding" component={OnboardingNavigator} />
        <Root.Screen name="Main" component={MainTabsNavigator} />
      </Root.Navigator>
    </NavigationContainer>
  );
}
