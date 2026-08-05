import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Sparkles, Upload, CheckCircle2, RefreshCw, AlertTriangle, XCircle, Image as ImageIcon, IndianRupee, Plus } from 'lucide-react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import tw from 'twrnc';
import { FoodItem } from '../../backend/models/types';
import { requestNotificationPermission } from '../../backend/services/notifications';
import { ScannedProductResult, captureFrameFromVideo, performRealImageOCR } from '../../backend/services/ocrScanner';
import { scanQRFromFile } from '../../backend/services/qrScanner';
import { usePantry } from '@freshkeep/shared';

// All categories with display labels and emoji icons
const CATEGORIES: { value: FoodItem['category']; label: string; emoji: string; fridgeHint: string }[] = [
  { value: 'dairy',      label: 'Dairy',          emoji: '🥛', fridgeHint: 'Fridge' },
  { value: 'meat',       label: 'Meat',            emoji: '🥩', fridgeHint: 'Fridge' },
  { value: 'seafood',    label: 'Seafood',         emoji: '🐟', fridgeHint: 'Fridge' },
  { value: 'vegetables', label: 'Vegetables',      emoji: '🥦', fridgeHint: 'Fridge' },
  { value: 'fruits',     label: 'Fruits',          emoji: '🍎', fridgeHint: 'Fridge' },
  { value: 'bakery',     label: 'Bakery & Bread',  emoji: '🍞', fridgeHint: 'Shelf' },
  { value: 'beverages',  label: 'Beverages',       emoji: '🧃', fridgeHint: 'Fridge' },
  { value: 'frozen',     label: 'Frozen Foods',    emoji: '🧊', fridgeHint: 'Freezer' },
  { value: 'snacks',     label: 'Snacks',          emoji: '🍿', fridgeHint: 'Shelf' },
  { value: 'canned',     label: 'Canned Goods',    emoji: '🥫', fridgeHint: 'Shelf' },
  { value: 'spices',     label: 'Spices & Masala', emoji: '🌶️', fridgeHint: 'Shelf' },
  { value: 'pantry',     label: 'Pantry / Other',  emoji: '🧂', fridgeHint: 'Shelf' },
];

export default function Scanner() {
  const { addItem } = usePantry();
  const [scanMode, setScanMode] = useState<'ocr' | 'qr'>('ocr');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<ScannedProductResult | null>(null);
  
  const [noDateDetected, setNoDateDetected] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Form fields for verifying/editing detected item
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<FoodItem['category']>('pantry');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editMfgDate, setEditMfgDate] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editMrp, setEditMrp] = useState<string>('');
  
  const [savedSuccess, setSavedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied', err);
      setScanError('Camera access denied. Please allow camera permissions or upload an image.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isCameraActive && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!isCameraActive) stopCamera();
    };
  }, [isCameraActive, capturedImage, startCamera, stopCamera]);

  const resetScanStates = () => {
    setIsCameraActive(false);
    setIsAnalyzing(false);
    setCapturedImage(null);
    setDetectedProduct(null);
    setSavedSuccess(false);
    setNoDateDetected(false);
    setScanError(null);
    setEditName(''); setEditCategory('pantry');
    setEditExpiryDate(''); setEditMfgDate('');
    setEditBatch(''); setEditMrp('');
  };

  const handleStartScan = async () => {
    resetScanStates();
    setIsCameraActive(true);
    await requestNotificationPermission();
  };

  const populateFormFromResult = (result: ScannedProductResult) => {
    if (!result.expiryDate) setNoDateDetected(true);
    setDetectedProduct(result);
    setEditName(result.name || '');
    setEditCategory(result.category || 'pantry');
    setEditExpiryDate(result.expiryDate || '');
    setEditMfgDate(result.manufacturingDate || '');
    setEditBatch(result.batchNumber || '');
    setEditMrp(result.price ? String(result.price) : '');
  };

  const runOCRAnalysisOnImage = async (dataUrl: string) => {
    try {
      const result = await performRealImageOCR(dataUrl);
      populateFormFromResult(result);
    } catch (error: any) {
      console.error('OCR Error:', error);
      setScanError(error.message || 'Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current) return;
    const frameDataUrl = captureFrameFromVideo(videoRef.current);
    if (!frameDataUrl) return;
    
    stopCamera();
    setCapturedImage(frameDataUrl);
    setIsAnalyzing(true);
    setNoDateDetected(false);
    setScanError(null);
    await runOCRAnalysisOnImage(frameDataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    resetScanStates();
    setIsCameraActive(true);
    setIsAnalyzing(true);

    if (scanMode === 'qr') {
      const qrRes = await scanQRFromFile(file);
      if (qrRes && qrRes.parsedItem) {
        const prod: ScannedProductResult = {
          name: qrRes.parsedItem.name,
          category: qrRes.parsedItem.category,
          expiryDate: qrRes.parsedItem.expiryDate,
          manufacturingDate: '',
          batchNumber: '',
          hasExpiryDate: !!qrRes.parsedItem.expiryDate,
          confidence: 99,
          price: qrRes.parsedItem.price,
          quantity: qrRes.parsedItem.quantity,
          unit: 'pcs',
          rawTextDetected: qrRes.rawText,
        };
        populateFormFromResult(prod);
      } else {
        setScanError('No readable QR code found in the image.');
      }
      setIsAnalyzing(false);
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        await runOCRAnalysisOnImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (!editName.trim()) {
      setScanError('Please enter a product name before saving.');
      return;
    }
    
    setIsSaving(true);
    setScanError(null);
    
    try {
      const mrpValue = editMrp ? parseFloat(editMrp) : 0;
      const newItem: Omit<FoodItem, 'id'> = {
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
        scanMethod: capturedImage ? 'camera' : 'manual',
        imageUrl: capturedImage || undefined,
        storageLocation: 'pantry',
      };
      
      await addItem(newItem);
      setSavedSuccess(true);
      
      setTimeout(() => {
        resetScanStates();
      }, 2500);
    } catch (err: any) {
      console.error('[Scanner] Save failed:', err.message);
      setScanError(`Failed to save: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategoryInfo = CATEGORIES.find(c => c.value === editCategory);

  return (
    <ScrollView style={tw`w-full h-full bg-white md:bg-gray-50`} contentContainerStyle={tw`pb-24 md:pb-8`}>
      <View style={tw`max-w-[1400px] w-full mx-auto p-4 md:p-8`}>
        
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-extrabold text-gray-900 tracking-tight`}>Scan Product</Text>
          <Text style={tw`text-sm text-gray-500 font-medium mt-1`}>
            Use your camera to automatically detect the product name, dates, MRP, and category.
          </Text>
        </View>

        {savedSuccess && (
          <View style={tw`mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-row items-center gap-3`}>
            <CheckCircle2 color="#059669" size={24} />
            <View>
              <Text style={tw`font-bold text-emerald-900`}>Successfully saved to Pantry!</Text>
              <Text style={tw`text-sm text-emerald-700 mt-0.5`}>"{editName}" is now being tracked.</Text>
            </View>
          </View>
        )}

        <View style={tw`flex flex-col lg:flex-row gap-8 items-start`}>
          
          {/* === Camera Card === */}
          <View style={tw`flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
            <View style={tw`p-4 border-b border-gray-50 flex flex-row items-center justify-between bg-gray-50/50`}>
              <View style={tw`flex flex-row items-center gap-2`}>
                <Camera color="#6b7280" size={20} />
                <Text style={tw`font-bold text-gray-700 text-sm`}>Camera Preview</Text>
              </View>
              <View style={tw`flex flex-row bg-gray-200 p-1 rounded-lg`}>
                <TouchableOpacity
                  onPress={() => { setScanMode('ocr'); resetScanStates(); }}
                  style={tw`px-3 py-1 rounded-md ${scanMode === 'ocr' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text style={tw`text-xs font-bold ${scanMode === 'ocr' ? 'text-[#86A789]' : 'text-gray-500'}`}>OCR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setScanMode('qr'); resetScanStates(); }}
                  style={tw`px-3 py-1 rounded-md ${scanMode === 'qr' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text style={tw`text-xs font-bold ${scanMode === 'qr' ? 'text-[#86A789]' : 'text-gray-500'}`}>QR/Barcode</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`relative aspect-video lg:aspect-[4/3] bg-gray-900 flex items-center justify-center overflow-hidden`}>
              {isCameraActive ? (
                <>
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {isAnalyzing && (
                    <View style={tw`absolute inset-0 bg-black/60 flex flex-col items-center justify-center`}>
                      <RefreshCw color="#86A789" size={40} style={tw`animate-spin mb-4`} />
                      <Text style={tw`text-white font-bold text-lg tracking-wide`}>Analyzing image...</Text>
                      <Text style={tw`text-white/70 text-sm mt-1`}>Detecting product, dates & MRP</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={tw`items-center justify-center p-6`}>
                  <Camera color="#9ca3af" size={48} style={tw`opacity-50 mb-3`} />
                  <Text style={tw`text-sm font-medium text-gray-400`}>Camera is inactive</Text>
                  <Text style={tw`text-xs text-gray-400 mt-1`}>Click Start Camera or Upload Image</Text>
                </View>
              )}
            </View>

            <View style={tw`p-4 bg-white flex flex-row gap-3`}>
              {!isCameraActive || capturedImage ? (
                <TouchableOpacity
                  onPress={handleStartScan}
                  style={tw`flex-1 bg-[#86A789] py-3 rounded-xl flex flex-row items-center justify-center gap-2`}
                >
                  <Camera color="#ffffff" size={20} />
                  <Text style={tw`text-white font-bold text-sm`}>Start Camera</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleCaptureAndAnalyze}
                  disabled={isAnalyzing}
                  style={tw`flex-1 bg-[#86A789] py-3 rounded-xl flex flex-row items-center justify-center gap-2`}
                >
                  <Sparkles color="#ffffff" size={20} />
                  <Text style={tw`text-white font-bold text-sm`}>Capture</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => fileInputRef.current?.click()}
                style={tw`flex-1 bg-gray-100 py-3 rounded-xl flex flex-row items-center justify-center gap-2`}
              >
                <ImageIcon color="#374151" size={20} />
                <Text style={tw`text-gray-700 font-bold text-sm`}>Upload Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  resetScanStates();
                  setDetectedProduct({
                    name: '', category: 'pantry', expiryDate: '', manufacturingDate: '', batchNumber: '',
                    confidence: 100, price: 0, quantity: 1, unit: 'pcs', rawTextDetected: ''
                  });
                  setNoDateDetected(true);
                }}
                style={tw`flex-1 bg-gray-100 py-3 rounded-xl flex flex-row items-center justify-center gap-2`}
              >
                <Plus color="#374151" size={20} />
                <Text style={tw`text-gray-700 font-bold text-sm`}>Manual</Text>
              </TouchableOpacity>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </View>
          </View>

          {/* === Results / Form Card === */}
          {detectedProduct && !isAnalyzing ? (
            <View style={tw`flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5`}>
              <View style={tw`flex flex-row items-center gap-3 pb-4 border-b border-gray-100`}>
                <View style={tw`w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center`}>
                  <Sparkles color="#059669" size={20} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-extrabold text-gray-900 tracking-tight`}>PRODUCT DETECTED</Text>
                  <Text style={tw`text-xs font-semibold text-emerald-600 uppercase`}>Smart Recognition Complete</Text>
                </View>
                <View style={tw`px-2.5 py-1 rounded-full bg-emerald-100`}>
                  <Text style={tw`text-xs font-bold text-emerald-700`}>{detectedProduct.confidence}% confidence</Text>
                </View>
              </View>

              {scanError && (
                <View style={tw`p-3 bg-red-50 border border-red-100 rounded-xl flex flex-row items-start gap-2`}>
                  <XCircle color="#dc2626" size={16} style={tw`mt-0.5`} />
                  <Text style={tw`text-sm font-medium text-red-900`}>{scanError}</Text>
                </View>
              )}
              {noDateDetected && (
                <View style={tw`p-3 bg-amber-50 border border-amber-100 rounded-xl flex flex-row items-start gap-2`}>
                  <AlertTriangle color="#d97706" size={16} style={tw`mt-0.5`} />
                  <Text style={tw`text-sm font-medium text-amber-900`}>Expiry date not detected — please enter it manually below.</Text>
                </View>
              )}

              <View style={tw`space-y-1.5`}>
                <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Product Name *</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter product name"
                  style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900`}
                />
              </View>

              <View style={tw`space-y-2`}>
                <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>
                  Product Category {selectedCategoryInfo ? `(📍 Store: ${selectedCategoryInfo.fridgeHint})` : ''}
                </Text>
                <View style={tw`grid grid-cols-4 gap-2`}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => setEditCategory(cat.value)}
                      style={tw`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center ${
                        editCategory === cat.value ? 'border-[#86A789] bg-emerald-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <Text style={tw`text-lg`}>{cat.emoji}</Text>
                      <Text style={tw`text-[10px] font-bold text-gray-700`}>{cat.label.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={tw`flex flex-row gap-4`}>
                <View style={tw`flex-1 space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Mfg. Date</Text>
                  <input
                    type="date"
                    value={editMfgDate}
                    onChange={(e) => setEditMfgDate(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', fontSize: '14px', fontWeight: '600', color: '#111827' }}
                  />
                </View>
                <View style={tw`flex-1 space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Expiry Date *</Text>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    style={{ width: '100%', backgroundColor: noDateDetected && !editExpiryDate ? '#fef2f2' : '#f9fafb', border: noDateDetected && !editExpiryDate ? '1px solid #fca5a5' : '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', fontSize: '14px', fontWeight: '600', color: '#111827' }}
                  />
                </View>
              </View>

              <View style={tw`flex flex-row gap-4`}>
                <View style={tw`flex-1 space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>MRP (₹)</Text>
                  <TextInput
                    value={editMrp}
                    onChangeText={setEditMrp}
                    placeholder="0.00"
                    keyboardType="numeric"
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900`}
                  />
                </View>
                <View style={tw`flex-1 space-y-1.5`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Batch No.</Text>
                  <TextInput
                    value={editBatch}
                    onChangeText={setEditBatch}
                    placeholder="e.g. KA60044"
                    style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900`}
                  />
                </View>
              </View>

              <View style={tw`flex flex-row gap-3 pt-1`}>
                <TouchableOpacity
                  onPress={handleStartScan}
                  style={tw`flex-1 bg-gray-100 py-3.5 rounded-xl items-center`}
                >
                  <Text style={tw`text-gray-700 font-bold text-sm`}>🔄 Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProduct}
                  disabled={isSaving || !editName.trim()}
                  style={tw`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                    !editName.trim() || isSaving ? 'bg-gray-200' : 'bg-[#86A789] shadow-md'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw color="#ffffff" size={16} style={tw`animate-spin`} />
                      <Text style={tw`text-white font-bold text-sm`}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 color="#ffffff" size={16} />
                      <Text style={tw`text-white font-bold text-sm`}>Add to Pantry</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : !isCameraActive && !isAnalyzing && (
            <View style={tw`hidden lg:flex bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 flex-col items-center justify-center text-center h-full min-h-[400px]`}>
              <View style={tw`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4`}>
                <Camera color="#9ca3af" size={32} />
              </View>
              <Text style={tw`text-lg font-bold text-gray-900`}>Ready to Scan</Text>
              <Text style={tw`text-sm text-gray-500 mt-2 max-w-[280px]`}>
                Start the camera or upload a product image. Smart recognition will extract name, dates, MRP and category automatically.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}