import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@freshkeep/shared';
import { ScanLine, LayoutDashboard, ListChecks, ShoppingCart, Trash2, Settings } from 'lucide-react-native';

// Import screens (will create them next)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PantryScreen from '../screens/PantryScreen';
import CameraScreen from '../screens/CameraScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import WasteLogScreen from '../screens/WasteLogScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Pantry: undefined;
  Scan: undefined;
  ShoppingList: undefined;
  WasteLog: undefined;
  Settings: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'Dashboard') {
          return <LayoutDashboard color={color} size={size} />;
        } else if (route.name === 'Pantry') {
          return <ListChecks color={color} size={size} />;
        } else if (route.name === 'Scan') {
          return <ScanLine color={color} size={size} />;
        } else if (route.name === 'ShoppingList') {
          return <ShoppingCart color={color} size={size} />;
        } else if (route.name === 'WasteLog') {
          return <Trash2 color={color} size={size} />;
        } else {
          return <Settings color={color} size={size} />;
        }
      },
      tabBarActiveTintColor: '#86A789',
      tabBarInactiveTintColor: '#9ca3af',
      headerShown: true,
      headerStyle: { backgroundColor: '#ffffff' },
      headerTitleStyle: { fontWeight: 'bold', color: '#111827' },
      tabBarStyle: { height: 60, paddingBottom: 8 },
    })}
  >
    <Tab.Screen name="Scan" component={CameraScreen} options={{ title: 'Scan Product' }} />
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Pantry" component={PantryScreen} />
    <Tab.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
    <Tab.Screen name="WasteLog" component={WasteLogScreen} options={{ title: 'Waste Log' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={TabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
