import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Operator } from './src/api/auth';
import { loadSession } from './src/session';
import { PROCESS_SCREEN, RootStackParamList } from './src/navigation/types';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CleaningScreen from './src/screens/CleaningScreen';
import AcceptScreen from './src/screens/AcceptScreen';
import RepairsScreen from './src/screens/RepairsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  // undefined = still reading the saved session; null = nobody signed in.
  const [operator, setOperator] = useState<Operator | null | undefined>(undefined);

  useEffect(() => {
    loadSession().then(setOperator);
  }, []);

  if (operator === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  // Someone already signed in this shift goes straight to their process.
  const initialRoute = operator ? PROCESS_SCREEN[operator.process] : 'Login';
  const sessionParams = operator ? { operator } : undefined;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} initialParams={sessionParams} />
          <Stack.Screen
            name="Cleaning"
            component={CleaningScreen}
            initialParams={sessionParams}
          />
          <Stack.Screen
            name="Accept"
            component={AcceptScreen}
            initialParams={sessionParams}
          />
          <Stack.Screen
            name="Repairs"
            component={RepairsScreen}
            initialParams={sessionParams}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ground,
  },
});

export default App;
