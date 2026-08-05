import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useAuth } from '@freshkeep/shared';
import { Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react-native';
import tw from 'twrnc';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of FreshKeep?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`} contentContainerStyle={tw`pb-10`}>
      {/* Profile Header */}
      <View style={tw`bg-white p-6 items-center border-b border-gray-100 mb-6`}>
        {user?.picture ? (
          <Image
            source={{ uri: user.picture }}
            style={tw`w-20 h-20 rounded-full mb-3 bg-gray-100`}
            resizeMode="cover"
          />
        ) : (
          <View style={tw`w-20 h-20 rounded-full bg-emerald-600 items-center justify-center mb-3`}>
            <Text style={tw`text-white font-extrabold text-2xl`}>{user?.name?.[0] || 'U'}</Text>
          </View>
        )}
        <Text style={tw`text-lg font-black text-gray-900`}>{user?.name || 'Santhosh Kumar'}</Text>
        <Text style={tw`text-xs text-gray-400 mt-0.5`}>{user?.email || 'santhosh@gmail.com'}</Text>
      </View>

      {/* Preferences Group */}
      <View style={tw`bg-white border-y border-gray-100 px-5 py-3 mb-6`}>
        <View style={tw`flex flex-row items-center gap-2 pb-3 mb-3 border-b border-gray-100`}>
          <Bell color="#374151" size={16} />
          <Text style={tw`text-xs font-bold text-gray-700 uppercase`}>Notification Preferences</Text>
        </View>

        <View style={tw`flex flex-row justify-between items-center py-2.5`}>
          <View>
            <Text style={tw`text-sm font-bold text-gray-800`}>Expiry Alerts</Text>
            <Text style={tw`text-xs text-gray-450 mt-0.5`}>Get notified 3 days before items expire.</Text>
          </View>
          <Switch
            value={expiryAlerts}
            onValueChange={setExpiryAlerts}
            trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
            thumbColor={expiryAlerts ? '#059669' : '#f3f4f6'}
          />
        </View>

        <View style={tw`flex flex-row justify-between items-center py-2.5`}>
          <View>
            <Text style={tw`text-sm font-bold text-gray-800`}>Weekly Summary Digest</Text>
            <Text style={tw`text-xs text-gray-450 mt-0.5`}>Receive a weekly pantry health review.</Text>
          </View>
          <Switch
            value={weeklyDigest}
            onValueChange={setWeeklyDigest}
            trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
            thumbColor={weeklyDigest ? '#059669' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Support Group */}
      <View style={tw`bg-white border-y border-gray-100 px-5 py-3 mb-6`}>
        <View style={tw`flex flex-row items-center gap-2 pb-3 mb-3 border-b border-gray-100`}>
          <Shield color="#374151" size={16} />
          <Text style={tw`text-xs font-bold text-gray-700 uppercase`}>About & Support</Text>
        </View>

        <TouchableOpacity style={tw`flex-row justify-between items-center py-2.5`}>
          <Text style={tw`text-sm font-bold text-gray-800`}>Privacy Policy</Text>
          <HelpCircle color="#9ca3af" size={16} />
        </TouchableOpacity>

        <TouchableOpacity style={tw`flex-row justify-between items-center py-2.5`}>
          <Text style={tw`text-sm font-bold text-gray-800`}>Help & Feedback</Text>
          <HelpCircle color="#9ca3af" size={16} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={tw`px-5`}>
        <TouchableOpacity
          onPress={handleLogout}
          style={tw`w-full border-2 border-red-200 py-3.5 rounded-xl flex flex-row justify-center items-center gap-2 bg-white`}
        >
          <LogOut color="#dc2626" size={18} />
          <Text style={tw`text-red-600 font-bold text-sm`}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
