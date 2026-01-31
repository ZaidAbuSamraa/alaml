'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface Payment {
  id: number;
  amount: number;
  recipientName: string;
  date: string;
  description?: string;
}

interface DayData {
  date: string;
  day: string;
  sales: number;
  openingCash: number;
  endingCash: number;
  tomorrowPayments: number;
  payments: Payment[];
  totalPayments: number;
  status: 'Safe' | 'Warning' | 'Deficit';
  deductSameDay: boolean;
  isOpeningCashManual: boolean;
  useDefaultSales: boolean;
}

interface Settings {
  id: number;
  defaultDailySales: number;
  safetyThreshold: number;
}

type ModalType = 'openingCash' | 'sales' | 'payment' | 'editDay' | 'reset' | 'export' | null;

export default function CashFlowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showOnlyWarning, setShowOnlyWarning] = useState(false);
  const [shiftPaymentsMode, setShiftPaymentsMode] = useState(false);
  const [resetMonth, setResetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [suppliers, setSuppliers] = useState<Array<{id: number; name: string; phone: string}>>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const formatDateToDDMMYYYY = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDDMMYYYYToISO = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const [openingCashForm, setOpeningCashForm] = useState({
    amount: '',
    date: formatDateToDDMMYYYY(new Date()),
  });
  const [salesForm, setSalesForm] = useState({
    amount: '',
    date: formatDateToDDMMYYYY(new Date()),
  });
  const [isDailyPayment, setIsDailyPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    recipientName: '',
    date: formatDateToDDMMYYYY(new Date()),
    description: '',
    dateFrom: formatDateToDDMMYYYY(new Date()),
    dateTo: formatDateToDDMMYYYY(new Date()),
  });
  
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );
  const [settingsForm, setSettingsForm] = useState({
    defaultDailySales: '',
    safetyThreshold: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setLoading(false);
    fetchSettings();
    fetchMonthData();
    fetchSuppliers();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchMonthData();
    }
  }, [selectedMonth]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.supplier-dropdown-container')) {
        setShowSupplierDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeModal !== 'payment') {
      setSupplierSearch('');
      setShowSupplierDropdown(false);
    }
  }, [activeModal]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSettingsForm({
          defaultDailySales: data.defaultDailySales.toString(),
          safetyThreshold: data.safetyThreshold.toString(),
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchMonthData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/month/${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMonthData(data);
      }
    } catch (err) {
      console.error('Error fetching month data:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          defaultDailySales: parseFloat(settingsForm.defaultDailySales),
          safetyThreshold: parseFloat(settingsForm.safetyThreshold),
        }),
      });
      if (response.ok) {
        fetchSettings();
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleOpeningCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/opening-cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(openingCashForm.amount),
          date: parseDDMMYYYYToISO(openingCashForm.date),
        }),
      });
      if (response.ok) {
        setActiveModal(null);
        setOpeningCashForm({ amount: '', date: formatDateToDDMMYYYY(new Date()) });
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error setting opening cash:', err);
    }
  };

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(salesForm.amount),
          date: parseDDMMYYYYToISO(salesForm.date),
        }),
      });
      if (response.ok) {
        setActiveModal(null);
        setSalesForm({ amount: '', date: formatDateToDDMMYYYY(new Date()) });
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error setting sales:', err);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (isDailyPayment) {
        // Daily Payment Mode - create payment for each day in range
        const startDate = new Date(parseDDMMYYYYToISO(paymentForm.dateFrom));
        const endDate = new Date(parseDDMMYYYYToISO(paymentForm.dateTo));
        
        const promises = [];
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const isoDate = date.toISOString().split('T')[0];
          promises.push(
            fetch(`${API_URL}/cashflow/payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: parseFloat(paymentForm.amount),
                recipientName: paymentForm.recipientName,
                date: isoDate,
                description: paymentForm.description,
              }),
            })
          );
        }
        
        await Promise.all(promises);
        setActiveModal(null);
        setPaymentForm({ 
          amount: '', 
          recipientName: '', 
          date: formatDateToDDMMYYYY(new Date()), 
          description: '',
          dateFrom: formatDateToDDMMYYYY(new Date()),
          dateTo: formatDateToDDMMYYYY(new Date()),
        });
        setIsDailyPayment(false);
        fetchMonthData();
      } else {
        // Single Payment Mode
        const response = await fetch(`${API_URL}/cashflow/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parseFloat(paymentForm.amount),
            recipientName: paymentForm.recipientName,
            date: parseDDMMYYYYToISO(paymentForm.date),
            description: paymentForm.description,
          }),
        });
        if (response.ok) {
          setActiveModal(null);
          setPaymentForm({ 
            amount: '', 
            recipientName: '', 
            date: formatDateToDDMMYYYY(new Date()), 
            description: '',
            dateFrom: formatDateToDDMMYYYY(new Date()),
            dateTo: formatDateToDDMMYYYY(new Date()),
          });
          fetchMonthData();
        }
      }
    } catch (err) {
      console.error('Error adding payment:', err);
    }
  };

  const handleResetCashflow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/reset/${resetMonth}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setActiveModal(null);
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error resetting cashflow:', err);
    }
  };

  const handleShiftPaymentsToggle = async (enabled: boolean) => {
    setShiftPaymentsMode(enabled);
    
    try {
      const token = localStorage.getItem('token');
      
      const updatePromises = monthData.map(day => 
        fetch(`${API_URL}/cashflow/day/${day.date}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            deductSameDay: !enabled,
          }),
        })
      );
      
      await Promise.all(updatePromises);
      await fetchMonthData();
    } catch (err) {
      console.error('Error toggling shift payments mode:', err);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/payment/${paymentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        if (selectedDay) {
          setSelectedDay({
            ...selectedDay,
            payments: selectedDay.payments.filter(p => p.id !== paymentId),
            totalPayments: selectedDay.totalPayments - (selectedDay.payments.find(p => p.id === paymentId)?.amount || 0)
          });
        }
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/export/${exportMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cashflow-${exportMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Safe': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Deficit': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredData = showOnlyWarning 
    ? monthData.filter(d => d.status !== 'Safe')
    : monthData;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-xl text-primary-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <nav className="bg-dark-900 shadow-lg border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-gray-400 hover:text-primary-400 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-primary-400">Cash Flow</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border border-primary-500/30 p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-bold text-primary-400 mb-4 sm:mb-6 text-center">Controls</h2>
              
              {/* Action Buttons - Horizontal */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveModal('openingCash')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition text-sm font-medium"
                >
                  Opening Cash
                </button>
                <button
                  onClick={() => setActiveModal('sales')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition text-sm font-medium"
                >
                  Sales
                </button>
                <button
                  onClick={() => setActiveModal('payment')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-lg transition text-sm font-medium"
                >
                  Payments
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={() => setActiveModal('export')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition font-semibold mb-6 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير Excel
              </button>

              {/* Opening Cash Modal */}
              {activeModal === 'openingCash' && (
                <div className="bg-dark-800 rounded-xl p-4 mb-4 border border-blue-500/30">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Set Opening Cash</h3>
                  <form onSubmit={handleOpeningCashSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={openingCashForm.amount}
                        onChange={(e) => setOpeningCashForm({ ...openingCashForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date (DD/MM/YYYY)</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={openingCashForm.date}
                        onChange={(e) => setOpeningCashForm({ ...openingCashForm, date: e.target.value })}
                        pattern="\d{2}/\d{2}/\d{4}"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition">
                        Save
                      </button>
                      <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sales Modal */}
              {activeModal === 'sales' && (
                <div className="bg-dark-800 rounded-xl p-4 mb-4 border border-green-500/30">
                  <h3 className="text-lg font-bold text-green-400 mb-4">Set Sales</h3>
                  <form onSubmit={handleSalesSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={salesForm.amount}
                        onChange={(e) => setSalesForm({ ...salesForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date (DD/MM/YYYY)</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={salesForm.date}
                        onChange={(e) => setSalesForm({ ...salesForm, date: e.target.value })}
                        pattern="\d{2}/\d{2}/\d{4}"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                        Save
                      </button>
                      <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Payment Modal */}
              {activeModal === 'payment' && (
                <div className="bg-dark-800 rounded-xl p-4 mb-4 border border-orange-500/30">
                  <h3 className="text-lg font-bold text-orange-400 mb-4">Add Payment</h3>
                  <form onSubmit={handlePaymentSubmit} className="space-y-3">
                    <div className="flex items-center gap-3 mb-3 p-3 bg-dark-700/50 rounded-lg border border-orange-500/20">
                      <input
                        type="checkbox"
                        id="dailyPaymentToggle"
                        checked={isDailyPayment}
                        onChange={(e) => setIsDailyPayment(e.target.checked)}
                        className="w-5 h-5 text-orange-500 bg-dark-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <label htmlFor="dailyPaymentToggle" className="text-orange-400 font-semibold cursor-pointer">
                        Daily Payment (دفعة يومية)
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>
                    <div className="relative supplier-dropdown-container">
                      <label className="block text-sm text-gray-400 mb-1">Recipient Name (اسم المورد)</label>
                      <input
                        type="text"
                        value={supplierSearch || paymentForm.recipientName}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setPaymentForm({ ...paymentForm, recipientName: e.target.value });
                          setShowSupplierDropdown(true);
                        }}
                        onFocus={() => setShowSupplierDropdown(true)}
                        placeholder="ابحث عن مورد أو اكتب اسم جديد"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                      {showSupplierDropdown && filteredSuppliers.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-dark-800 border-2 border-orange-500/50 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              onClick={() => {
                                setPaymentForm({ ...paymentForm, recipientName: supplier.name });
                                setSupplierSearch(supplier.name);
                                setShowSupplierDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-orange-500/20 cursor-pointer border-b border-dark-700 last:border-b-0 transition"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-medium">{supplier.name}</p>
                                  <p className="text-gray-400 text-sm">{supplier.phone}</p>
                                </div>
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isDailyPayment ? (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">From Date (من تاريخ) - DD/MM/YYYY</label>
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={paymentForm.dateFrom}
                            onChange={(e) => setPaymentForm({ ...paymentForm, dateFrom: e.target.value })}
                            pattern="\d{2}/\d{2}/\d{4}"
                            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">To Date (إلى تاريخ) - DD/MM/YYYY</label>
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={paymentForm.dateTo}
                            onChange={(e) => setPaymentForm({ ...paymentForm, dateTo: e.target.value })}
                            pattern="\d{2}/\d{2}/\d{4}"
                            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Date (DD/MM/YYYY)</label>
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={paymentForm.date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                          pattern="\d{2}/\d{2}/\d{4}"
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition">
                        Add
                      </button>
                      <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Export Modal */}
              {activeModal === 'export' && (
                <div className="bg-dark-800 rounded-xl p-4 mb-4 border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">تصدير Excel</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">اختر الشهر (YYYY-MM)</label>
                      <input
                        type="month"
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleExportExcel}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition font-semibold"
                      >
                        تصدير
                      </button>
                      <button 
                        onClick={() => setActiveModal(null)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Month Settings */}
              <div className="border-t border-dark-700 pt-6">
                <h3 className="text-lg font-bold text-gray-300 mb-4">Month Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Month (YYYY-MM)</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Safety Threshold</label>
                      <input
                        type="number"
                        value={settingsForm.safetyThreshold}
                        onChange={(e) => setSettingsForm({ ...settingsForm, safetyThreshold: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Default Daily Sales</label>
                      <input
                        type="number"
                        value={settingsForm.defaultDailySales}
                        onChange={(e) => setSettingsForm({ ...settingsForm, defaultDailySales: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-2 rounded-lg transition"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => setActiveModal('reset')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    إعادة تعيين Cash Flow
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Table is generated from today to 31/12. Month picker is only for browsing.
              </p>
            </div>
          </div>

          {/* Right Side - Table */}
          <div className="flex-1">
            {/* Table Controls */}
            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border border-primary-500/30 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 sm:p-4 w-full">
                    <label className="flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shiftPaymentsMode}
                        onChange={(e) => handleShiftPaymentsToggle(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-primary-500 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0"
                      />
                      <div>
                        <div className="text-sm sm:text-base font-bold text-primary-400">
                          نقل المدفوعات لليوم التالي
                        </div>
                        <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                          عند التفعيل: المدفوعات من اليوم الحالي تنتقل لليوم التالي
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyWarning}
                      onChange={(e) => setShowOnlyWarning(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-dark-800 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                    />
                    عرض التحذيرات فقط
                  </label>
                  <div className="text-xs text-gray-500">
                    اضغط على أي يوم لعرض التفاصيل
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-primary-400 mb-4">Cash Flow Table</h2>

            {/* Table */}
            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border border-primary-500/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-dark-800/50">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Day</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Sales</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Opening</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">
                        {shiftPaymentsMode ? "مدفوعات الغد" : "المدفوعات"}
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Ending</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-300 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((day, index) => {
                      // حساب المدفوعات التي ستظهر في عمود "المدفوعات"
                      // عندما يكون shift mode مفعل، نعرض مدفوعات اليوم التالي
                      const nextDayTotalPayments = index < filteredData.length - 1 && !day.deductSameDay 
                        ? filteredData[index + 1].totalPayments 
                        : 0;
                      
                      // حساب تفاصيل المدفوعات التي ستظهر في عمود Details
                      // عندما يكون shift mode مفعل، نعرض دفعات اليوم التالي
                      const nextDayPayments = index < filteredData.length - 1 && !day.deductSameDay 
                        ? filteredData[index + 1].payments 
                        : [];
                      
                      const displayPayments = shiftPaymentsMode && !day.deductSameDay 
                        ? nextDayPayments 
                        : day.payments;
                      
                      return (
                        <tr 
                          key={day.date} 
                          className={`border-t border-dark-700 hover:bg-dark-800/50 transition cursor-pointer ${
                            index % 2 === 0 ? 'bg-dark-900/30' : 'bg-dark-900/10'
                          }`}
                          onClick={() => setSelectedDay(day)}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white font-medium text-center">{day.date}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 text-center">{day.day}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-yellow-400 font-medium text-center">{Math.round(day.sales).toLocaleString()}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-blue-400 font-medium text-center">{Math.round(day.openingCash).toLocaleString()}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-orange-400 font-medium text-center">
                            {shiftPaymentsMode && !day.deductSameDay
                              ? (nextDayTotalPayments > 0 ? Math.round(nextDayTotalPayments).toLocaleString() : '0')
                              : (day.totalPayments > 0 ? Math.round(day.totalPayments).toLocaleString() : '0')
                            }
                          </td>
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-center ${day.endingCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {Math.round(day.endingCash).toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(day.status)}`}>
                              {day.status}
                            </span>
                          </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 max-w-xs text-center">
                          {displayPayments.length > 0 ? (
                            <div className="space-y-1">
                              {displayPayments.map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                  <span className="text-orange-300">{p.recipientName}</span>
                                  <span className="text-gray-500">—</span>
                                  <span className="text-white">{Math.round(p.amount).toLocaleString()}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePayment(p.id);
                                    }}
                                    className="text-red-400 hover:text-red-300 ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {monthData.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                No data for this month yet. Add opening cash to get started.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedDay(null)}>
          <div className="bg-dark-900 rounded-2xl p-8 max-w-lg w-full mx-4 border-2 border-primary-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-primary-400">{selectedDay.date} - {selectedDay.day}</h3>
              <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-400">Opening Cash</p>
                  <p className="text-xl font-bold text-blue-400">{Math.round(selectedDay.openingCash).toLocaleString()}</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-400">Sales</p>
                  <p className="text-xl font-bold text-yellow-400">{Math.round(selectedDay.sales).toLocaleString()}</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-400">Total Payments</p>
                  <p className="text-xl font-bold text-orange-400">{Math.round(selectedDay.totalPayments).toLocaleString()}</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-400">Ending Cash</p>
                  <p className={`text-xl font-bold ${selectedDay.endingCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.round(selectedDay.endingCash).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded-xl border-2 border-primary-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 font-semibold">وضع المدفوعات (Payment Mode)</span>
                  <span className={`px-4 py-2 rounded-lg font-bold text-sm ${!selectedDay.deductSameDay ? 'bg-orange-500/30 text-orange-300 border-2 border-orange-500/50' : 'bg-green-500/30 text-green-300 border-2 border-green-500/50'}`}>
                    {!selectedDay.deductSameDay ? '🔄 منقول لليوم السابق' : '✓ نفس اليوم'}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {selectedDay.deductSameDay 
                      ? '• المدفوعات تُخصم من رصيد نهاية اليوم الحالي' 
                      : '• المدفوعات تُخصم من رصيد نهاية اليوم السابق'}
                  </p>
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 mt-2">
                    <p className="text-xs text-primary-300 font-medium">
                      💡 استخدم الـ checkbox أعلى الجدول لتفعيل وضع النقل لجميع الأيام
                    </p>
                  </div>
                </div>
              </div>

              {selectedDay.payments.length > 0 && (
                <div className="bg-dark-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Payments</p>
                  <div className="space-y-2">
                    {selectedDay.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-dark-700 p-2 rounded-lg">
                        <div>
                          <span className="text-orange-300 font-medium">{p.recipientName}</span>
                          {p.description && <span className="text-gray-500 text-sm ml-2">({p.description})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{Math.round(p.amount).toLocaleString()}</span>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-xl border ${getStatusColor(selectedDay.status)}`}>
                <p className="text-center font-bold">Status: {selectedDay.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Cashflow Modal */}
      {activeModal === 'reset' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setActiveModal(null)}>
          <div className="bg-dark-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-red-500/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                إعادة تعيين Cash Flow
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-red-300 font-bold mb-1">تحذير!</h4>
                  <p className="text-red-200 text-sm">
                    سيتم حذف جميع بيانات Cash Flow للشهر المحدد بشكل نهائي.
                    <strong className="block mt-1">⚠️ هذا الإجراء لا يمكن التراجع عنه!</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">اختر الشهر المراد إعادة تعيينه</label>
              <input
                type="month"
                value={resetMonth}
                onChange={(e) => setResetMonth(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleResetCashflow}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
