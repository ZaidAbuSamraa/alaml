'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface Supplier {
  id: number;
  name: string;
  phone: string;
}

interface AnalyticsData {
  summary: {
    totalInvoices: number;
    totalPayments: number;
    balance: number;
    invoiceCount: number;
    paymentCount: number;
  };
  bySupplier: Array<{
    supplier: Supplier;
    totalInvoices: number;
    totalPayments: number;
    balance: number;
  }>;
  transactions: Array<any>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [baseCash, setBaseCash] = useState(0);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [editCashValue, setEditCashValue] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [showAddSale, setShowAddSale] = useState(false);
  const [saleForm, setSaleForm] = useState({
    saleNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

    setUser(parsedUser);
    setLoading(false);
    fetchCash();
    fetchAnalytics();
    fetchSales();
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchCash = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cash`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBaseCash(Number(data.amount) || 0);
      }
    } catch (err) {
      console.error('Error fetching cash:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSales(data);
        const total = data.reduce((sum: number, sale: any) => sum + Number(sale.amount), 0);
        setTotalSales(total);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/notifications/unread`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/notifications/mark-read/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleCashDoubleClick = () => {
    setIsEditingCash(true);
    setEditCashValue(baseCash.toString());
  };

  const handleCashUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const newAmount = parseFloat(editCashValue) || 0;
      const response = await fetch(`${API_URL}/cash`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: newAmount }),
      });
      if (response.ok) {
        setBaseCash(newAmount);
        setIsEditingCash(false);
      }
    } catch (err) {
      console.error('Error updating cash:', err);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...saleForm,
          amount: parseFloat(saleForm.amount),
        }),
      });
      if (response.ok) {
        setSaleForm({ saleNumber: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
        setShowAddSale(false);
        fetchSales();
      }
    } catch (err) {
      console.error('Error adding sale:', err);
    }
  };

  const handleCashKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCashUpdate();
    } else if (e.key === 'Escape') {
      setIsEditingCash(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-xl text-primary-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="bg-dark-900 shadow-lg border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-400">لوحة التحكم</h1>
            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-300 hover:text-primary-400 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-80 bg-dark-900 border border-primary-500/30 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-primary-500/20">
                      <h3 className="text-lg font-bold text-primary-400">الإشعارات</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">لا توجد إشعارات</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 border-b border-dark-800 hover:bg-dark-800/50 transition cursor-pointer"
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <p className="text-white text-sm">{notif.message}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(notif.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="text-gray-300">مرحباً، abood</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Summary */}
        {analytics && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 mb-6">الملخص المالي</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Cash */}
              <div 
                className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 hover:border-primary-500/50 transition-all shadow-lg cursor-pointer"
                onDoubleClick={handleCashDoubleClick}
                title="اضغط مرتين للتعديل"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-400 text-sm font-semibold">الكاش</h3>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                {isEditingCash ? (
                  <input
                    type="number"
                    value={editCashValue}
                    onChange={(e) => setEditCashValue(e.target.value)}
                    onBlur={handleCashUpdate}
                    onKeyDown={handleCashKeyPress}
                    className="text-3xl font-bold bg-dark-800 text-white border-2 border-primary-500 rounded-lg px-2 py-1 w-full outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-3xl font-bold text-primary-400">{Math.round(baseCash)}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">الكاش الأساسي</p>
              </div>

              {/* Sales */}
              <Link href="/admin/sales">
                <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-all shadow-lg cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-sm font-semibold group-hover:text-green-300">إجمالي المبيعات</h3>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{Math.round(totalSales)}</p>
                  <p className="text-xs text-gray-500 mt-1">{sales.length} مبيعة</p>
                </div>
              </Link>

              {/* Calculated Cash (Base + Sales - Payments) */}
              <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-400 text-sm font-semibold">الكاش الفعلي</h3>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${
                  (baseCash + totalSales - analytics.summary.totalPayments) > 0 ? 'text-green-400' : (baseCash + totalSales - analytics.summary.totalPayments) < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>{Math.round(baseCash + totalSales - analytics.summary.totalPayments)}</p>
                <p className="text-xs text-gray-500 mt-1">الأساسي + المبيعات - الدفعات</p>
              </div>

              {/* Supplier Balance (Invoices - Payments) */}
              <Link href="/admin/analytics">
                <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-orange-500/30 hover:border-orange-500/50 transition-all shadow-lg cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-sm font-semibold group-hover:text-orange-300">الرصيد المستحق</h3>
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${
                    analytics.summary.balance > 0 ? 'text-red-400' : analytics.summary.balance < 0 ? 'text-green-400' : 'text-gray-400'
                  }`}>{Math.round(Math.abs(analytics.summary.balance))}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.summary.balance > 0 ? 'مستحق للموردين' : analytics.summary.balance < 0 ? 'زيادة دفع' : 'متوازن'}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Sales Modal */}
        {showAddSale && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddSale(false)}>
            <div className="bg-dark-900 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-primary-500/30" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary-400">إضافة مبيعة</h3>
                <button onClick={() => setShowAddSale(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-2">رقم المبيعة</label>
                  <input
                    type="text"
                    value={saleForm.saleNumber}
                    onChange={(e) => setSaleForm({ ...saleForm, saleNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-2">المبلغ</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={saleForm.date}
                    onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-2">الوصف</label>
                  <textarea
                    value={saleForm.description}
                    onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                >
                  إضافة
                </button>
              </form>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 mb-8">القوائم الرئيسية</h2>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/admin/requests">
            <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-primary-500/30 hover:border-primary-500/50 transition-all cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-primary-400 group-hover:text-primary-300 mb-3">الطلبات</h3>
                  <p className="text-gray-400 text-base">طلبات الموارد من الموظفين</p>
                </div>
                <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/employees">
            <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-primary-500/30 hover:border-primary-500/50 transition-all cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-primary-400 group-hover:text-primary-300 mb-3">الموظفين</h3>
                  <p className="text-gray-400 text-base">إدارة حسابات الموظفين</p>
                </div>
                <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/suppliers">
            <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-primary-500/30 hover:border-primary-500/50 transition-all cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-primary-400 group-hover:text-primary-300 mb-3">الموردين</h3>
                  <p className="text-gray-400 text-base">إدارة الموردين والفواتير</p>
                </div>
                <div className="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/cashflow" className="md:col-span-2 lg:col-span-3">
            <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer group hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300 mb-3">Cash Flow</h3>
                  <p className="text-gray-400 text-base">Track daily cash flow and payments</p>
                </div>
                <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
