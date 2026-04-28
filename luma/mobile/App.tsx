import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { ReadingComfortProvider } from './src/contexts/ReadingComfortContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ReadingComfortProvider>
        <RootNavigator />
      </ReadingComfortProvider>
    </AuthProvider>
  );
}
