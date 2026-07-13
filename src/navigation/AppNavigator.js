import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import MiningScreen from '../screens/MiningScreen';
import WalletScreen from '../screens/WalletScreen';
import LightningScreen from '../screens/LightningScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Mineração: '⛏️',
  Carteira: '👛',
  Lightning: '⚡',
  Ajustes: '⚙️',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#f7931a',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: { backgroundColor: '#14161b', borderTopColor: '#222' },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Mineração" component={MiningScreen} />
        <Tab.Screen name="Carteira" component={WalletScreen} />
        <Tab.Screen name="Lightning" component={LightningScreen} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
