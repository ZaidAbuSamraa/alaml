'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface Sale {
  id: number;
  saleNumber: string;
  amount: number;
  date: string;
  description: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [saleForm, setSaleForm] = useState({
    saleNumber: '',
    amount: '',
    date: getTodayDate(),
    description: '',
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

    setUser(parsedUser);
    setLoading(false);
    fetchSales();
  }, [router]);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingSale 
        ? `${API_URL}/sales/${editingSale.id}`
        : `${API_URL}/sales`;
      const method = editingSale ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
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
        setSuccess(editingSale ? 'تم تحديث المبيعة بنجاح' : 'تم إضافة المبيعة بنجاح');
        setSaleForm({ saleNumber: '', amount: '', date: getTodayDate(), description: '' });
        setShowAddSale(false);
        setEditingSale(null);
        fetchSales();
      }
    } catch (err: any) {
      setError(err.message || 'فشل إضافة المبيعة');
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      saleNumber: sale.saleNumber,
      amount: sale.amount.toString(),
      date: sale.date,
      description: sale.description || '',
    });
    setShowAddSale(true);
  };

  const handleDeleteSale = async (saleId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المبيعة؟')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sales/${saleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('تم حذف المبيعة بنجاح');
        fetchSales();
      }
    } catch (err: any) {
      setError(err.message || 'فشل حذف المبيعة');
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

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);

  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="bg-dark-900 shadow-lg border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-primary-400 hover:text-primary-300 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-primary-400">المبيعات</h1>
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
        {/* Summary Card */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-gray-400 text-sm font-semibold mb-2">إجمالي المبيعات</h2>
              <p className="text-4xl font-bold text-primary-400">{Math.round(totalSales)}</p>
              <p className="text-sm text-gray-500 mt-1">{sales.length} مبيعة</p>
            </div>
            <button
              onClick={() => {
                setShowAddSale(true);
                setEditingSale(null);
                const nextNumber = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
                const autoSaleNumber = `SALE-${nextNumber.toString().padStart(5, '0')}`;
                setSaleForm({ saleNumber: autoSaleNumber, amount: '', date: getTodayDate(), description: '' });
              }}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-dark-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/50 hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة مبيعة
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-500 text-red-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border-2 border-green-500 text-green-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Add/Edit Sale Modal */}
        {showAddSale && (
          <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-primary-400 mb-4">
              {editingSale ? 'تعديل المبيعة' : 'إضافة مبيعة جديدة'}
            </h3>
            <form onSubmit={handleAddSale} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-2">
                    رقم المبيعة
                    {!editingSale && <span className="text-xs text-gray-500 mr-2">(تلقائي - يمكن التعديل)</span>}
                  </label>
                  <input
                    type="text"
                    value={saleForm.saleNumber}
                    onChange={(e) => setSaleForm({ ...saleForm, saleNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="سيتم التوليد تلقائياً"
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                >
                  {editingSale ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSale(false);
                    setEditingSale(null);
                    setSaleForm({ saleNumber: '', amount: '', date: getTodayDate(), description: '' });
                  }}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-500/30 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-800 border-b border-primary-500/20">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">رقم المبيعة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الوصف</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    لا توجد مبيعات
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-dark-800/50 transition">
                    <td className="px-6 py-4 text-white font-medium">{sale.saleNumber}</td>
                    <td className="px-6 py-4 text-primary-400 font-bold">{Math.round(sale.amount)}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{sale.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
