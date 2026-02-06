'use client';

import { useState, useRef } from 'react';
import { API_URL } from '@/lib/api';

interface VoiceRecorderProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ExtractedData {
  supplierName: string;
  amount: number;
  date: string;
  description?: string;
}

interface Supplier {
  id: number;
  name: string;
  similarity: number;
}

export default function VoiceRecorder({ onClose, onSuccess }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [showSupplierSelection, setShowSupplierSelection] = useState(false);
  const [storageLocation, setStorageLocation] = useState<'suppliers' | 'cashflow'>('cashflow');
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      showNotification('فشل الوصول إلى الميكروفون', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fetchAllSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setAllSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      console.log('Processing audio blob, size:', audioBlob.size);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Sending to:', `${API_URL}/voice/transcribe`);
      
      const response = await fetch(`${API_URL}/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Result:', result);
      
      setTranscription(result.transcription);
      setExtractedData(result.extractedData);
      setSuppliers(result.suppliers);

      if (result.needsSupplierSelection && result.suppliers.length > 0) {
        setShowSupplierSelection(true);
      } else if (result.suppliers.length === 1) {
        setSelectedSupplier(result.suppliers[0].id);
      } else {
        // No suppliers found - show manual search
        showNotification('لم يتم العثور على موردين مطابقين، يرجى البحث يدوياً', 'error');
        await fetchAllSuppliers();
        setShowManualSearch(true);
      }
    } catch (error: any) {
      console.error('Error processing audio:', error);
      showNotification(`فشل في معالجة التسجيل: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSuppliers = searchQuery
    ? allSuppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allSuppliers;

  const handleConfirmPayment = async () => {
    if (!extractedData || !selectedSupplier) {
      showNotification('يرجى اختيار المورد', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/voice/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          amount: extractedData.amount,
          date: extractedData.date,
          notes: extractedData.description || transcription,
          storageLocation: storageLocation, // 'suppliers' or 'cashflow'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment');
      }

      const locationText = storageLocation === 'suppliers' ? 'صفحة الموردين' : 'CashFlow';
      showNotification(`تم حفظ الدفعة في ${locationText} بنجاح`, 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving payment:', error);
      showNotification('فشل في حفظ الدفعة', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-900 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-primary-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-400">تسجيل المعلومات صوتياً</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Recording Section */}
        {!transcription && (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-primary-500/20'
              }`}>
                <svg className={`w-16 h-16 ${isRecording ? 'text-red-400' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>

            {isProcessing ? (
              <div className="text-primary-400 text-lg mb-4">
                جاري معالجة التسجيل...
              </div>
            ) : (
              <>
                <p className="text-gray-300 mb-6">
                  {isRecording ? 'جاري التسجيل... اضغط لإيقاف التسجيل' : 'اضغط على الزر للبدء في التسجيل'}
                </p>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-primary-500 hover:bg-primary-600'
                  } text-white px-8 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50`}
                >
                  {isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="space-y-6">
            <div className="bg-dark-800 p-4 rounded-lg border border-primary-500/30">
              <h3 className="text-primary-400 font-bold mb-2">النص المستخرج:</h3>
              <p className="text-white">{transcription}</p>
            </div>

            {/* Extracted Data */}
            {extractedData && (
              <div className="bg-dark-800 p-4 rounded-lg border border-green-500/30">
                <h3 className="text-green-400 font-bold mb-3">البيانات المستخرجة:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">اسم المورد:</p>
                    <p className="text-white font-bold">{extractedData.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">المبلغ:</p>
                    <p className="text-white font-bold">{extractedData.amount} ₪</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">التاريخ:</p>
                    <p className="text-white font-bold">{extractedData.date}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Selection */}
            {showSupplierSelection && suppliers.length > 0 && (
              <div className="bg-dark-800 p-4 rounded-lg border border-yellow-500/30">
                <h3 className="text-yellow-400 font-bold mb-3">اختر المورد:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {suppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier.id)}
                      className={`w-full text-right p-3 rounded-lg transition ${
                        selectedSupplier === supplier.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{supplier.name}</span>
                        <span className="text-sm opacity-75">{supplier.similarity}% تطابق</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Supplier Search */}
            {showManualSearch && (
              <div className="bg-dark-800 p-4 rounded-lg border border-red-500/30">
                <h3 className="text-red-400 font-bold mb-3">لم يتم التعرف على المورد - ابحث يدوياً:</h3>
                
                {/* Search Input */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن المورد..."
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                {/* Suppliers Dropdown */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => {
                          setSelectedSupplier(supplier.id);
                          setShowManualSearch(false);
                        }}
                        className={`w-full text-right p-3 rounded-lg transition ${
                          selectedSupplier === supplier.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        }`}
                      >
                        <span className="font-bold">{supplier.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">لا توجد نتائج</p>
                  )}
                </div>
              </div>
            )}

            {/* Storage Location Selection */}
            {selectedSupplier && (
              <div className="bg-dark-800 p-4 rounded-lg border border-blue-500/30">
                <h3 className="text-blue-400 font-bold mb-3">اختر مكان الحفظ:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStorageLocation('cashflow')}
                    className={`p-4 rounded-lg transition ${
                      storageLocation === 'cashflow'
                        ? 'bg-primary-500 text-white border-2 border-primary-400'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="font-bold">CashFlow</span>
                      <span className="text-xs opacity-75">جدول التدفق النقدي</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setStorageLocation('suppliers')}
                    className={`p-4 rounded-lg transition ${
                      storageLocation === 'suppliers'
                        ? 'bg-primary-500 text-white border-2 border-primary-400'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-bold">الموردين</span>
                      <span className="text-xs opacity-75">صفحة الموردين</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmPayment}
                disabled={!selectedSupplier}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تأكيد وحفظ الدفعة
              </button>
              <button
                onClick={() => {
                  setTranscription('');
                  setExtractedData(null);
                  setSuppliers([]);
                  setSelectedSupplier(null);
                  setShowSupplierSelection(false);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
              >
                إعادة التسجيل
              </button>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification.show && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <div className={`${
              notification.type === 'success' 
                ? 'bg-green-600 border-green-500' 
                : 'bg-red-600 border-red-500'
            } border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-3 min-w-[300px]`}>
              {notification.type === 'success' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className="text-white font-semibold">{notification.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
