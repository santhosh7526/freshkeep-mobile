import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Sparkles, Upload, CheckCircle2, RefreshCw, QrCode, AlertTriangle, XCircle, Zap, Image as ImageIcon, IndianRupee, Plus } from 'lucide-react';
import { FoodItem } from '../../backend/models/types';
import { requestNotificationPermission } from '../../backend/services/notifications';
import { ScannedProductResult, captureFrameFromVideo, performRealImageOCR, calculateExpiryInfo } from '../../backend/services/ocrScanner';
import { scanQRFromFile } from '../../backend/services/qrScanner';
import { usePantry } from '../context/PantryContext';

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

const GEMINI_KEY_SET = !!(import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE');

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
    // Reset file input so same file can be re-selected
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
      
      console.log('[Scanner] ✅ Saved to Pantry:', newItem.name);
      setSavedSuccess(true);
      
      setTimeout(() => {
        resetScanStates();
      }, 2500);
    } catch (err: any) {
      console.error('[Scanner] ❌ Save failed:', err.message);
      setScanError(`Failed to save: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategoryInfo = CATEGORIES.find(c => c.value === editCategory);

  return (
    <div className="w-full h-full bg-white md:bg-gray-50 flex justify-center pb-24 md:pb-8">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scan Product</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Use your camera to automatically detect the product name, dates, MRP, and category.
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-900">✅ Successfully saved to Pantry!</p>
              <p className="text-sm text-emerald-700 mt-0.5">"{editName}" is now being tracked.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* === Camera Card === */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-gray-700 text-sm">Camera Preview</span>
              </div>
              <div className="flex bg-gray-200/50 p-1 rounded-lg">
                <button
                  onClick={() => { setScanMode('ocr'); resetScanStates(); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scanMode === 'ocr' ? 'bg-white text-[#86A789] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >OCR</button>
                <button
                  onClick={() => { setScanMode('qr'); resetScanStates(); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scanMode === 'qr' ? 'bg-white text-[#86A789] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >QR/Barcode</button>
              </div>
            </div>

            <div className="relative aspect-video lg:aspect-[4/3] bg-gray-900 flex items-center justify-center overflow-hidden">
              {isCameraActive ? (
                <>
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                  {!capturedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                      <div className="border border-white/40 rounded-xl relative shadow-2xl w-64 h-48 flex items-center justify-center">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#86A789] rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#86A789] rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#86A789] rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#86A789] rounded-br-lg" />
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#86A789] animate-scan shadow-[0_0_15px_#86A789]" />
                        <p className="text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm mt-32">
                          Position the product label inside frame
                        </p>
                      </div>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <RefreshCw className="w-10 h-10 text-[#86A789] animate-spin mb-4" />
                      <p className="text-white font-bold text-lg tracking-wide">Analyzing image...</p>
                      <p className="text-white/70 text-sm mt-1">Detecting product, dates & MRP</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center justify-center h-full text-gray-400">
                  <Camera className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Camera is inactive</p>
                  <p className="text-xs mt-1">Click Start Camera or Upload Image</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white flex items-center gap-3">
              {!isCameraActive || capturedImage ? (
                <button
                  onClick={handleStartScan}
                  className="flex-1 bg-[#86A789] hover:bg-[#729275] text-white py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={handleCaptureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 bg-[#86A789] hover:bg-[#729275] disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Capture & Analyze
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Upload Image
              </button>
              <button
                onClick={() => {
                  resetScanStates();
                  setDetectedProduct({
                    name: '', category: 'pantry', expiryDate: '', manufacturingDate: '', batchNumber: '',
                    hasExpiryDate: false, confidence: 100, price: 0, quantity: 1, unit: 'pcs', rawTextDetected: ''
                  });
                  setNoDateDetected(true);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Enter Manually
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>

          {/* === Results / Form Card === */}
          {detectedProduct && !isAnalyzing ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-7 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">PRODUCT DETECTED</h2>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Smart Recognition Complete</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${detectedProduct.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' : detectedProduct.confidence >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {detectedProduct.confidence}% confidence
                </div>
              </div>

              {/* Scan Error */}
              {scanError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-900">{scanError}</p>
                </div>
              )}
              {noDateDetected && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-900">Expiry date not detected — please enter it manually below.</p>
                </div>
              )}

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
                />
              </div>

              {/* Category Picker Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Product Category
                  {selectedCategoryInfo && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedCategoryInfo.fridgeHint === 'Fridge' ? 'bg-blue-100 text-blue-700' : selectedCategoryInfo.fridgeHint === 'Freezer' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      📍 Store: {selectedCategoryInfo.fridgeHint}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setEditCategory(cat.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                        editCategory === cat.value
                          ? 'border-[#86A789] bg-emerald-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg leading-none">{cat.emoji}</span>
                      <span className="text-[10px] font-bold text-gray-700 leading-tight">{cat.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mfg. Date</label>
                  <input
                    type="date"
                    value={editMfgDate}
                    onChange={(e) => setEditMfgDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Expiry Date {noDateDetected && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#86A789] ${noDateDetected && !editExpiryDate ? 'bg-red-50 border-red-300 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
              </div>

              {/* MRP + Batch Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">MRP (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editMrp}
                      onChange={(e) => setEditMrp(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Batch No.</label>
                  <input
                    type="text"
                    value={editBatch}
                    placeholder="e.g. KA60044"
                    onChange={(e) => setEditBatch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleStartScan}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-all text-sm"
                >
                  🔄 Scan Again
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving || !editName.trim()}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    !editName.trim() || isSaving
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#86A789] text-white shadow-md hover:bg-[#729275] active:scale-[0.98]'
                  }`}
                >
                  {isSaving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Add to Pantry</>
                  )}
                </button>
              </div>
            </div>
          ) : !isCameraActive && !isAnalyzing && (
            <div className="hidden lg:flex bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ready to Scan</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-[280px]">
                Start the camera or upload a product image. Smart recognition will extract name, dates, MRP and category automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}