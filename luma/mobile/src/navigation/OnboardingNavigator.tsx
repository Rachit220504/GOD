import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';
import { OnboardingProfileScreen } from '../screens/onboarding/OnboardingProfileScreen';
import { AudioCheckScreen } from '../screens/onboarding/AudioCheckScreen';
import { OnboardingSuccessScreen } from '../screens/onboarding/OnboardingSuccessScreen';
import { Colors } from '../constants/theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="OnboardingProfile"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
      <Stack.Screen name="OnboardingAudioCheck" component={AudioCheckScreen} />
      <Stack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
    </Stack.Navigator>
  );
}
