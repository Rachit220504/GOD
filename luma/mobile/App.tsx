import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFonts, Lexend_400Regular, Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import { ReadingComfortProvider } from './src/contexts/ReadingComfortContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Lexend: Lexend_400Regular,
    LexendSemiBold: Lexend_600SemiBold,
    LexendBold: Lexend_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
    OpenDyslexic: require('./assets/fonts/OpenDyslexic-Regular.ttf'),
    OpenDyslexicBold: require('./assets/fonts/OpenDyslexic-Bold.ttf'),
    // System font is always available
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReadingComfortProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <RootNavigator />
          </View>
        </ReadingComfortProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
