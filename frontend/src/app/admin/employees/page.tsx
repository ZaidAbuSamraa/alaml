'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface Employee {
  id: number;
  name: string;
  username: string;
  hourlyWage: number;
  specialty?: string;
  createdAt: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    hourlyWage: 0,
    specialty: '',
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editHourlyWage, setEditHourlyWage] = useState<{[key: number]: number}>({});
  const [activeSessions, setActiveSessions] = useState<{[key: number]: boolean}>({});
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
    fetchEmployees();
    fetchActiveSessions();
    
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [router]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
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
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إضافة الموظف');
      }

      setSuccess('تم إضافة الموظف بنجاح');
      setFormData({ name: '', username: '', password: '', hourlyWage: 0, specialty: '' });
      setShowAddForm(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة الموظف');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف موظف',
      message: 'هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع سجلات الحضور الخاصة به.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

          if (response.ok) {
            setSuccess('تم حذف الموظف بنجاح');
            fetchEmployees();
          }
        } catch (err) {
          setError('فشل حذف الموظف');
        }
      },
    });
  };

  const handleUpdateHourlyWage = async (employeeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ hourlyWage: editHourlyWage[employeeId] }),
      });

      if (response.ok) {
        setSuccess('تم تحديث الراتب بنجاح');
        setEditingEmployee(null);
        fetchEmployees();
      }
    } catch (err) {
      setError('فشل تحديث الراتب');
    }
  };

  const startEditHourlyWage = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditHourlyWage({ ...editHourlyWage, [employee.id]: employee.hourlyWage });
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const logs = await response.json();
        const active: {[key: number]: boolean} = {};
        logs.forEach((log: any) => {
          if (log.status === 'active') {
            active[log.employeeId] = true;
          }
        });
        setActiveSessions(active);
      }
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    }
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
              <h1 className="text-2xl font-bold text-primary-400">إدارة الموظفين</h1>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold px-4 py-2 rounded-lg transition"
            >
              {showAddForm ? 'إلغاء' : '+ إضافة موظف'}
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

        {showAddForm && (
          <div className="bg-dark-900 p-6 rounded-lg shadow-xl border border-primary-500/30 mb-6">
            <h2 className="text-xl font-bold text-primary-400 mb-4">إضافة موظف جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  اسم الموظف
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
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  الراتب في الساعة
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourlyWage}
                  onChange={(e) => setFormData({ ...formData, hourlyWage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  التخصص
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-400 mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
              >
                إضافة الموظف
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
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الاسم</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">اسم المستخدم</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التخصص</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الراتب في الساعة</th>
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
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      لا يوجد موظفين
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-gray-400 font-mono">#{employee.id}</td>
                      <td className="px-6 py-4 text-white font-semibold">{employee.name}</td>
                      <td className="px-6 py-4 text-gray-300">{employee.username}</td>
                      <td className="px-6 py-4 text-primary-400">{employee.specialty || '-'}</td>
                      <td className="px-6 py-4">
                        {editingEmployee?.id === employee.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={editHourlyWage[employee.id] || 0}
                              onChange={(e) => setEditHourlyWage({ ...editHourlyWage, [employee.id]: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 bg-dark-800 border border-primary-500 text-white rounded focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <button
                              onClick={() => handleUpdateHourlyWage(employee.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingEmployee(null)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-primary-400 font-bold">{employee.hourlyWage}</span>
                            <button
                              onClick={() => startEditHourlyWage(employee)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              تعديل
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/employees/${employee.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            عرض السجل
                          </Link>
                          <button
                            onClick={() => handleDelete(employee.id)}
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
