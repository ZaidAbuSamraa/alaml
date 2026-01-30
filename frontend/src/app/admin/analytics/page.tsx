'use client';

import { useEffect, useState } from 'react';
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

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Set default dates to current year
  const today = new Date();
  const currentYear = today.getFullYear();
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = today.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedSupplier, setSelectedSupplier] = useState('');

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
    fetchSuppliers();
    fetchAnalytics();
  }, [router]);

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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedSupplier) params.append('supplierId', selectedSupplier);

      const response = await fetch(`${API_URL}/analytics?${params}`, {
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

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [startDate, endDate, selectedSupplier]);

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
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <nav className="bg-dark-900/80 backdrop-blur-xl shadow-2xl border-b border-primary-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                العودة للوحة التحكم
              </Link>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">التحليلات المالية</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">مرحباً، {user?.username}</span>
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
        {/* Filters */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-primary-400 mb-2">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary-400 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary-400 mb-2">المورد</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                <option value="">جميع الموردين</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-400 text-sm font-semibold">إجمالي الفواتير</h3>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{Math.round(analytics.summary.totalInvoices)}</p>
                <p className="text-sm text-gray-500">{analytics.summary.invoiceCount} فاتورة</p>
              </div>

              <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-all shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-400 text-sm font-semibold">إجمالي الدفعات</h3>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{Math.round(analytics.summary.totalPayments)}</p>
                <p className="text-sm text-gray-500">{analytics.summary.paymentCount} دفعة</p>
              </div>

              <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 hover:border-primary-500/50 transition-all shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-400 text-sm font-semibold">الرصيد الإجمالي</h3>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    analytics.summary.balance > 0 ? 'bg-red-500/20' : analytics.summary.balance < 0 ? 'bg-green-500/20' : 'bg-gray-500/20'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      analytics.summary.balance > 0 ? 'text-red-400' : analytics.summary.balance < 0 ? 'text-green-400' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-4xl font-bold mb-1 ${
                  analytics.summary.balance > 0 ? 'text-red-400' : analytics.summary.balance < 0 ? 'text-green-400' : 'text-gray-400'
                }`}>{Math.round(Math.abs(analytics.summary.balance))}</p>
                <p className="text-sm text-gray-500">{analytics.summary.balance > 0 ? 'مستحق' : analytics.summary.balance < 0 ? 'زيادة دفع' : 'متوازن'}</p>
              </div>
            </div>

            {/* By Supplier */}
            {analytics.bySupplier.length > 0 && (
              <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border border-primary-500/30 overflow-hidden">
                <div className="p-6 border-b border-dark-800">
                  <h3 className="text-xl font-bold text-primary-400">التحليل حسب المورد</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-800">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المورد</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الفواتير</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الدفعات</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {analytics.bySupplier.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-dark-800/50 transition">
                          <td className="px-6 py-4 text-white font-medium">{item.supplier.name}</td>
                          <td className="px-6 py-4 text-blue-400 font-bold">{Math.round(item.totalInvoices)}</td>
                          <td className="px-6 py-4 text-green-400 font-bold">{Math.round(item.totalPayments)}</td>
                          <td className={`px-6 py-4 font-bold ${
                            item.balance > 0 ? 'text-red-400' : item.balance < 0 ? 'text-green-400' : 'text-gray-400'
                          }`}>{Math.round(Math.abs(item.balance))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
