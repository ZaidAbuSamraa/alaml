'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface ResourceRequest {
  id: number;
  requestName: string;
  description: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export default function EmployeeRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    requestName: '',
    description: '',
    requestDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr!);
      
      const response = await fetch(`${API_URL}/resource-requests/employee/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr!);

      const response = await fetch(`${API_URL}/resource-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          employeeId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إضافة الطلب');
      }

      setSuccess('تم إضافة الطلب بنجاح');
      setFormData({
        requestName: '',
        description: '',
        requestDate: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">موافق عليه</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">مرفوض</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm">قيد المراجعة</span>;
    }
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
            <div className="flex items-center gap-4">
              <Link href="/employee/dashboard" className="text-primary-400 hover:text-primary-300">
                ← العودة
              </Link>
              <h1 className="text-xl font-bold text-white">طلبات الموارد</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-600/20 border border-red-600/50 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-600/20 border border-green-600/50 text-green-400 rounded-lg">
            {success}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary-600 hover:bg-primary-700 text-dark-950 px-6 py-3 rounded-lg font-bold transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            طلب جديد
          </button>
        </div>

        {showAddForm && (
          <div className="bg-dark-800/50 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 mb-6">
            <h2 className="text-2xl font-bold text-primary-400 mb-6">إضافة طلب موارد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  اسم الطلب
                </label>
                <input
                  type="text"
                  value={formData.requestName}
                  onChange={(e) => setFormData({ ...formData, requestName: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-dark-950 py-3 rounded-lg font-bold transition"
                >
                  إرسال الطلب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-lg font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-primary-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-900/50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">#</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">اسم الطلب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">ملاحظات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-gray-400 font-mono">#{request.id}</td>
                      <td className="px-6 py-4 text-white font-semibold">{request.requestName}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 text-gray-400">{request.adminNotes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
