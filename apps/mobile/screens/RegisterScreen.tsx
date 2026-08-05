import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@freshkeep/shared';
import { Leaf, Mail, Lock, User } from 'lucide-react-native';
import tw from 'twrnc';

export default function RegisterScreen({ navigation }: any) {
  const { registerWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password.trim(), name.trim());
      Alert.alert('Success', 'Account registered successfully!');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white justify-center px-6`}
    >
      <View style={tw`items-center mb-8`}>
        <View style={tw`w-14 h-14 rounded-2xl bg-emerald-600 items-center justify-center shadow-md mb-3`}>
          <Leaf color="#ffffff" size={32} />
        </View>
        <Text style={tw`text-2xl font-black text-gray-900`}>Create Account</Text>
        <Text style={tw`text-sm text-gray-500 mt-1`}>Start tracking your pantry freshness</Text>
      </View>

      <View style={tw`space-y-4`}>
        <View>
          <Text style={tw`text-xs font-semibold text-gray-600 mb-1.5`}>Full Name</Text>
          <View style={tw`flex flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3`}>
            <User color="#9ca3af" size={18} style={tw`mr-2`} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Santhosh Kumar"
              style={tw`flex-1 text-sm text-gray-900`}
            />
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Text style={tw`text-xs font-semibold text-gray-600 mb-1.5`}>Email address</Text>
          <View style={tw`flex flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3`}>
            <Mail color="#9ca3af" size={18} style={tw`mr-2`} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@gmail.com"
              style={tw`flex-1 text-sm text-gray-900`}
            />
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Text style={tw`text-xs font-semibold text-gray-600 mb-1.5`}>Password</Text>
          <View style={tw`flex flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3`}>
            <Lock color="#9ca3af" size={18} style={tw`mr-2`} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter password"
              style={tw`flex-1 text-sm text-gray-900`}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={tw`w-full bg-[#86A789] py-3.5 rounded-xl items-center justify-center mt-6 shadow-md`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={tw`text-white font-bold text-sm`}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={tw`flex flex-row justify-center mt-6`}>
          <Text style={tw`text-sm text-gray-500`}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={tw`text-emerald-700 font-bold text-sm`}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
