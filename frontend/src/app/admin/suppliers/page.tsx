'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
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
    fetchSuppliers();
  }, [router]);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
        setFilteredSuppliers(data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إضافة المورد');
      }

      setSuccess('تم إضافة المورد بنجاح');
      setFormData({ name: '', phone: '' });
      setShowAddForm(false);
      fetchSuppliers();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة المورد');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف مورد',
      message: 'هل أنت متأكد من حذف هذا المورد؟ سيتم حذف جميع الفواتير والدفعات المرتبطة به.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try{
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

          if (response.ok) {
            setSuccess('تم حذف المورد بنجاح');
            fetchSuppliers();
          }
        } catch (err) {
          setError('فشل حذف المورد');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="bg-dark-900 shadow-lg border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-primary-400 hover:text-primary-300">
                ← العودة
              </Link>
              <h1 className="text-2xl font-bold text-primary-400">إدارة الموردين</h1>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold px-4 py-2 rounded-lg transition"
            >
              {showAddForm ? 'إلغاء' : '+ إضافة مورد'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Search Box */}
        <div className="bg-dark-900 p-4 rounded-lg shadow-xl border border-primary-500/30 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ابحث عن مورد بالاسم (اكتب حرفين على الأقل)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery.length >= 2 && (
            <p className="text-sm text-gray-400 mt-2">
              تم العثور على {filteredSuppliers.length} مورد
            </p>
          )}
        </div>

        {showAddForm && (
          <div className="bg-dark-900 p-6 rounded-lg shadow-xl border border-primary-500/30 mb-6">
            <h2 className="text-xl font-bold text-primary-400 mb-4">إضافة مورد جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  اسم المورد
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  رقم المورد
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
              >
                إضافة المورد
              </button>
            </form>
          </div>
        )}

        <div className="bg-dark-900 rounded-lg shadow-xl border border-primary-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-primary-500/20">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">#</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">اسم المورد</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">رقم المورد</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      {searchQuery.length >= 2 ? 'لا توجد نتائج للبحث' : 'لا يوجد موردين'}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <tr key={supplier.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-gray-300">{index + 1}</td>
                      <td className="px-6 py-4 text-white font-medium">{supplier.name}</td>
                      <td className="px-6 py-4 text-gray-300">{supplier.phone}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatDate(supplier.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/suppliers/${supplier.id}`}
                            className="bg-primary-500 hover:bg-primary-600 text-dark-950 px-3 py-1 rounded transition text-sm font-medium"
                          >
                            عرض
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-sm"
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

      {/* Confirm Dialog */}
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
