import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePantry } from '@freshkeep/shared';
import { Sparkles, Camera, RefreshCw, X, Check, IndianRupee } from 'lucide-react-native';
import tw from 'twrnc';

// Resolve host URL Dynamically based on dev machine environment
const BACKEND_URL = 'http://10.0.2.2:5001'; // Default Android emulator loopback. Change to your local network IP (e.g. 192.168.1.x) for physical device testing!

export default function CameraScreen({ navigation }: any) {
  const { addItem } = usePantry();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  // OCR Form States
  const [detectedProduct, setDetectedProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<any>('pantry');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editMfgDate, setEditMfgDate] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editBatch, setEditBatch] = useState('');

  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View style={tw`flex-1 bg-white justify-center items-center`}><ActivityIndicator size="large" color="#86A789" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center px-6 text-center`}>
        <Camera color="#86A789" size={48} style={tw`mb-4`} />
        <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Camera Permission Required</Text>
        <Text style={tw`text-sm text-gray-500 text-center mb-6`}>We need camera access to scan product labels and extract dates.</Text>
        <TouchableOpacity onPress={requestPermission} style={tw`bg-[#86A789] px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        setPhotoUri(photo.uri);
        setPhotoBase64(photo.base64);
        setIsCameraActive(false);
        await runOCR(photo.base64);
      } catch (err: any) {
        Alert.alert('Capture Error', err.message || 'Could not take photo.');
      }
    }
  };

  const runOCR = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Server error during label scanning.');
      }

      const data = await response.json();
      if (data.success && data.result) {
        const prod = data.result;
        setDetectedProduct(prod);
        setEditName(prod.name || '');
        setEditCategory(prod.category || 'pantry');
        setEditExpiryDate(prod.expiryDate || '');
        setEditMfgDate(prod.manufacturingDate || '');
        setEditMrp(prod.mrp ? String(prod.mrp) : '');
        setEditBatch(prod.batchNumber || '');
      } else {
        throw new Error('Labels could not be resolved cleanly.');
      }
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message || 'Could not connect to OCR server.');
      resetScanner();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setDetectedProduct(null);
    setIsCameraActive(true);
    setIsAnalyzing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const mrpValue = editMrp ? parseFloat(editMrp) : 0;
      await addItem({
        name: editName.trim(),
        category: editCategory,
        expiryDate: editExpiryDate || null,
        manufacturingDate: editMfgDate || null,
        batchNumber: editBatch || null,
        addedDate: new Date().toISOString().split('T')[0],
        freshnessScore: 100,
        confidence: detectedProduct?.confidence || 100,
        price: isNaN(mrpValue) ? 0 : mrpValue,
        quantity: 1,
        unit: 'pcs',
        imageUrl: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : undefined,
        storageLocation: 'pantry',
      });
      Alert.alert('Success', `Saved "${editName}" to Pantry!`);
      resetScanner();
      navigation.navigate('Dashboard');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Check database permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      {isCameraActive ? (
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.reticle}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={tw`text-white font-bold text-xs mt-6 text-center bg-black/40 px-3 py-1 rounded-full`}>
              Center product label details inside box
            </Text>
            
            {/* Capture controls */}
            <View style={tw`absolute bottom-10 left-0 right-0 items-center`}>
              <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      ) : (
        <ScrollView style={tw`flex-1 bg-white`} contentContainerStyle={tw`pb-10`}>
          {photoUri && (
            <View style={tw`w-full aspect-video bg-gray-900 relative`}>
              <Image source={{ uri: photoUri }} style={tw`w-full h-full`} resizeMode="cover" />
              {isAnalyzing && (
                <View style={tw`absolute inset-0 bg-black/50 items-center justify-center`}>
                  <RefreshCw color="#86A789" size={32} style={tw`animate-spin mb-2`} />
                  <Text style={tw`text-white font-bold text-sm`}>Analyzing Product Label...</Text>
                </View>
              )}
            </View>
          )}

          {detectedProduct && !isAnalyzing && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`flex flex-row items-center justify-between pb-3 border-b border-gray-100`}>
                <View style={tw`flex flex-row items-center gap-2`}>
                  <Sparkles color="#059669" size={18} />
                  <Text style={tw`text-base font-bold text-gray-900`}>Review Scanned Details</Text>
                </View>
                <Text style={tw`text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold`}>
                  Conf: {detectedProduct.confidence}%
                </Text>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-bold text-gray-500 uppercase`}>Product Name *</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 mt-1`}
                />
              </View>

              <View style={tw`flex flex-row gap-4 mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase`}>Mfg. Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={editMfgDate}
                    onChangeText={setEditMfgDate}
                    placeholder="YYYY-MM-DD"
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 mt-1`}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase`}>Expiry Date * (YYYY-MM-DD)</Text>
                  <TextInput
                    value={editExpiryDate}
                    onChangeText={setEditExpiryDate}
                    placeholder="YYYY-MM-DD"
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 mt-1`}
                  />
                </View>
              </View>

              <View style={tw`flex flex-row gap-4 mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase`}>MRP (₹)</Text>
                  <TextInput
                    value={editMrp}
                    onChangeText={setEditMrp}
                    keyboardType="numeric"
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 mt-1`}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase`}>Batch No.</Text>
                  <TextInput
                    value={editBatch}
                    onChangeText={setEditBatch}
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 mt-1`}
                  />
                </View>
              </View>

              <View style={tw`flex flex-row gap-4 pt-4`}>
                <TouchableOpacity
                  onPress={resetScanner}
                  style={tw`flex-1 bg-gray-100 py-3.5 rounded-xl flex flex-row justify-center items-center gap-1.5`}
                >
                  <X color="#374151" size={16} />
                  <Text style={tw`text-gray-700 font-bold text-sm`}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSaving}
                  style={tw`flex-1 bg-[#86A789] py-3.5 rounded-xl flex flex-row justify-center items-center gap-1.5 shadow-md`}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Check color="#ffffff" size={16} />
                      <Text style={tw`text-white font-bold text-sm`}>Save to Pantry</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 280,
    height: 200,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#86A789',
  },
  topLeft: {
    top: -3,
    left: -3,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -3,
    right: -3,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
});
