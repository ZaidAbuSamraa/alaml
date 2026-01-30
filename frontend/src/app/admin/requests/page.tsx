'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  employee: {
    id: number;
    name: string;
    username: string;
  };
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'success' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resource-requests`, {
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

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/resource-requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          adminNotes,
        }),
      });

      if (response.ok) {
        setSuccess(`تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} الطلب بنجاح`);
        setShowDetailModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        fetchRequests();
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحديث الطلب');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف طلب',
      message: 'هل أنت متأكد من حذف هذا الطلب؟',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/resource-requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            setSuccess('تم حذف الطلب بنجاح');
            fetchRequests();
          }
        } catch (err: any) {
          setError(err.message || 'فشل حذف الطلب');
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-semibold">موافق عليه</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-semibold">مرفوض</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-semibold">قيد المراجعة</span>;
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
              <Link href="/admin/dashboard" className="text-primary-400 hover:text-primary-300">
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

        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-primary-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-900/50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">#</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">اسم الطلب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الموظف</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-gray-400 font-mono">#{request.id}</td>
                      <td className="px-6 py-4 text-white font-semibold">{request.requestName}</td>
                      <td className="px-6 py-4 text-primary-400">{request.employee.name}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.adminNotes || '');
                              setShowDetailModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm"
                          >
                            عرض
                          </button>
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition text-sm"
                          >
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
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          
          <div className="relative bg-dark-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-400">تفاصيل الطلب</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">اسم الطلب</label>
                  <p className="text-white text-lg">{selectedRequest.requestName}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">الموظف</label>
                  <p className="text-white text-lg">{selectedRequest.employee.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">التاريخ</label>
                  <p className="text-white text-lg">
                    {formatDate(selectedRequest.requestDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">الوصف</label>
                  <p className="text-white bg-dark-900/50 p-4 rounded-lg">{selectedRequest.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">الحالة</label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary-400 mb-2">ملاحظات الإدارة</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    rows={3}
                    placeholder="أضف ملاحظات..."
                  />
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition"
                    >
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
