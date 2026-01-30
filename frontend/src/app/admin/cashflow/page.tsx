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

type ModalType = 'openingCash' | 'sales' | 'payment' | 'editDay' | null;

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

  const [openingCashForm, setOpeningCashForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [salesForm, setSalesForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    recipientName: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
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
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchMonthData();
    }
  }, [selectedMonth]);

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
          date: openingCashForm.date,
        }),
      });
      if (response.ok) {
        setActiveModal(null);
        setOpeningCashForm({ amount: '', date: new Date().toISOString().split('T')[0] });
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
          date: salesForm.date,
        }),
      });
      if (response.ok) {
        setActiveModal(null);
        setSalesForm({ amount: '', date: new Date().toISOString().split('T')[0] });
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
      const response = await fetch(`${API_URL}/cashflow/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          recipientName: paymentForm.recipientName,
          date: paymentForm.date,
          description: paymentForm.description,
        }),
      });
      if (response.ok) {
        setActiveModal(null);
        setPaymentForm({ amount: '', recipientName: '', date: new Date().toISOString().split('T')[0], description: '' });
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error adding payment:', err);
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
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cashflow/payment/${paymentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchMonthData();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
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
                        value={openingCashForm.amount}
                        onChange={(e) => setOpeningCashForm({ ...openingCashForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={openingCashForm.date}
                        onChange={(e) => setOpeningCashForm({ ...openingCashForm, date: e.target.value })}
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
                        value={salesForm.amount}
                        onChange={(e) => setSalesForm({ ...salesForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={salesForm.date}
                        onChange={(e) => setSalesForm({ ...salesForm, date: e.target.value })}
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
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={paymentForm.recipientName}
                        onChange={(e) => setPaymentForm({ ...paymentForm, recipientName: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>
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
                      const previousDayPayments = index > 0 && shiftPaymentsMode && !filteredData[index - 1].deductSameDay 
                        ? filteredData[index - 1].totalPayments 
                        : 0;
                      
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
                            {shiftPaymentsMode 
                              ? (previousDayPayments > 0 ? Math.round(previousDayPayments).toLocaleString() : '0')
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
                          {day.payments.length > 0 ? (
                            <div className="space-y-1">
                              {day.payments.map((p) => (
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
                    {!selectedDay.deductSameDay ? '🔄 منقول لليوم التالي' : '✓ نفس اليوم'}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {selectedDay.deductSameDay 
                      ? '• المدفوعات تُخصم من رصيد نهاية اليوم الحالي' 
                      : '• المدفوعات تظهر في عمود "مدفوعات الغد" وتُخصم من اليوم التالي'}
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
    </div>
  );
}
