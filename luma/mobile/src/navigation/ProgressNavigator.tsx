import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GamificationScreen from '../screens/gamification/GamificationScreen';

export type ProgressStackParamList = {
  GamificationMain: undefined;
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GamificationMain" component={GamificationScreen} />
    </Stack.Navigator>
  );
}
