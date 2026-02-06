'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/formatters';

interface Employee {
  id: number;
  name: string;
  username: string;
  hourlyWage: number;
  bonus: number;
  createdAt: string;
}

interface TimeLog {
  id: number;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  earnedSalary: number | null;
  status: string;
}

export default function EmployeeTimeLogPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  // Helper function to convert decimal hours to hours and minutes
  const formatHoursMinutes = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    if (hours === 0) {
      return `${minutes} دقيقة`;
    } else if (minutes === 0) {
      return `${hours} ساعة`;
    } else {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
  };

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [filteredTimeLogs, setFilteredTimeLogs] = useState<TimeLog[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSessionTimer, setActiveSessionTimer] = useState<{[key: number]: {elapsed: number, salary: number}}>({})
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchEmployeeData();
  }, [employeeId, router]);

  useEffect(() => {
    if (employeeId) {
      fetchMonthlyEarnings(Number(employeeId), selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, employeeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const activeLogs = filteredTimeLogs.filter(log => log.status === 'active');
      if (activeLogs.length > 0 && employee) {
        const updatedTimers: {[key: number]: {elapsed: number, salary: number}} = {};
        activeLogs.forEach(log => {
          const now = new Date().getTime();
          const clockIn = new Date(log.clockIn).getTime();
          const elapsed = Math.floor((now - clockIn) / 1000);
          const hoursWorked = elapsed / 3600;
          const calculatedSalary = hoursWorked * employee.hourlyWage;
          updatedTimers[log.id] = { elapsed, salary: calculatedSalary };
        });
        setActiveSessionTimer(updatedTimers);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [filteredTimeLogs, employee]);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch employee details
      const employeeRes = await fetch(`${API_URL}/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (employeeRes.ok) {
        const employeeData = await employeeRes.json();
        setEmployee(employeeData);
      }

      // Fetch time logs
      const timeLogsRes = await fetch(`${API_URL}/time-logs/employee/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (timeLogsRes.ok) {
        const timeLogsData = await timeLogsRes.json();
        setTimeLogs(timeLogsData);
        setFilteredTimeLogs(timeLogsData);
        
        // Calculate totals
        const total = timeLogsData.reduce((sum: number, log: TimeLog) => 
          sum + Number(log.earnedSalary || 0), 0
        );
        const hours = timeLogsData.reduce((sum: number, log: TimeLog) => 
          sum + Number(log.hoursWorked || 0), 0
        );
        setTotalEarnings(total);
        setTotalHours(hours);
      }

      // Fetch total earnings
      const earningsRes = await fetch(`${API_URL}/time-logs/earnings/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (earningsRes.ok) {
        const earnings = await earningsRes.json();
        setTotalEarnings(earnings);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyEarnings = async (empId: number, year: number, month: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/earnings/${empId}/${year}/${month}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const total = await response.json();
        setMonthlyEarnings(total);
      }
    } catch (err) {
      console.error('Error fetching monthly earnings:', err);
    }
  };

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    if (date) {
      const filtered = timeLogs.filter(log => {
        const logDate = new Date(log.clockIn).toISOString().split('T')[0];
        return logDate === date;
      });
      setFilteredTimeLogs(filtered);
      
      // Recalculate totals for filtered data
      const total = filtered.reduce((sum, log) => sum + Number(log.earnedSalary || 0), 0);
      const hours = filtered.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
      setTotalEarnings(total);
      setTotalHours(hours);
    } else {
      setFilteredTimeLogs(timeLogs);
      
      // Recalculate totals for all data
      const total = timeLogs.reduce((sum, log) => sum + Number(log.earnedSalary || 0), 0);
      const hours = timeLogs.reduce((sum, log) => sum + Number(log.hoursWorked || 0), 0);
      setTotalEarnings(total);
      setTotalHours(hours);
    }
  };

  const handleUpdateBonus = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/bonus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus: Number(bonusAmount) }),
      });
      
      if (response.ok) {
        showNotification('تم تحديث المكافأة بنجاح', 'success');
        setShowBonusModal(false);
        setBonusAmount('');
        fetchEmployeeData();
      } else {
        showNotification('حدث خطأ أثناء تحديث المكافأة', 'error');
      }
    } catch (err) {
      console.error('Error updating bonus:', err);
      showNotification('حدث خطأ أثناء تحديث المكافأة', 'error');
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{show: boolean; message: string; onConfirm: () => void}>({
    show: false,
    message: '',
    onConfirm: () => {}
  });

  const handleDeleteTimeLog = async (id: number) => {
    setConfirmDialog({
      show: true,
      message: 'هل أنت متأكد من حذف هذا السجل؟',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/time-logs/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            showNotification('تم حذف السجل بنجاح', 'success');
            fetchEmployeeData();
          } else {
            showNotification('حدث خطأ أثناء حذف السجل', 'error');
          }
        } catch (err) {
          console.error('Error deleting time log:', err);
          showNotification('حدث خطأ أثناء حذف السجل', 'error');
        }
        setConfirmDialog({ show: false, message: '', onConfirm: () => {} });
      }
    });
  };

  const handleEditTimeLog = (log: TimeLog) => {
    setEditingLog(log);
    setEditClockIn(new Date(log.clockIn).toISOString().slice(0, 16));
    setEditClockOut(log.clockOut ? new Date(log.clockOut).toISOString().slice(0, 16) : '');
  };

  const handleSaveEditTimeLog = async () => {
    if (!editingLog) return;
    
    try {
      const response = await fetch(`${API_URL}/time-logs/${editingLog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: editClockIn,
          clockOut: editClockOut || undefined,
        }),
      });
      
      if (response.ok) {
        showNotification('تم تحديث السجل بنجاح', 'success');
        setEditingLog(null);
        fetchEmployeeData();
      } else {
        showNotification('حدث خطأ أثناء تحديث السجل', 'error');
      }
    } catch (err) {
      console.error('Error updating time log:', err);
      showNotification('حدث خطأ أثناء تحديث السجل', 'error');
    }
  };

  const handleForceStopTimeLog = async (id: number) => {
    setConfirmDialog({
      show: true,
      message: 'هل أنت متأكد من إيقاف هذه الجلسة؟',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/time-logs/force-stop/${id}`, {
            method: 'POST',
          });
          
          if (response.ok) {
            showNotification('تم إيقاف الجلسة بنجاح', 'success');
            fetchEmployeeData();
          } else {
            showNotification('حدث خطأ أثناء إيقاف الجلسة', 'error');
          }
        } catch (err) {
          console.error('Error stopping time log:', err);
          showNotification('حدث خطأ أثناء إيقاف الجلسة', 'error');
        }
        setConfirmDialog({ show: false, message: '', onConfirm: () => {} });
      }
    });
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
              <Link href="/admin/employees" className="text-primary-400 hover:text-primary-300">
                ← العودة
              </Link>
              <h1 className="text-2xl font-bold text-primary-400">سجل حضور الموظف</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee Info Card */}
        {employee && (
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border-2 border-primary-500/30 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-primary-400">معلومات الموظف</h2>
              <button
                onClick={() => setShowBonusModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                إدارة المكافأة
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">اسم الموظف</p>
                <p className="text-white text-xl font-bold">{employee.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">اسم المستخدم</p>
                <p className="text-white text-lg">{employee.username}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">الراتب في الساعة</p>
                <p className="text-primary-400 text-xl font-bold">{employee.hourlyWage}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">المكافأة/الخصم</p>
                <p className={`text-xl font-bold ${employee.bonus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {employee.bonus >= 0 ? '+' : ''}{employee.bonus}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">تاريخ التعيين</p>
                <p className="text-white text-lg">
                  {formatDate(employee.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">إجمالي الأرباح</h3>
            <p className="text-4xl font-bold text-primary-400">{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-yellow-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">الأرباح الشهرية</h3>
            <p className="text-4xl font-bold text-yellow-400">{monthlyEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">إجمالي الوقت</h3>
            <p className="text-2xl font-bold text-green-400">{formatHoursMinutes(Number(totalHours))}</p>
          </div>
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">عدد الجلسات</h3>
            <p className="text-4xl font-bold text-blue-400">
              {filteredTimeLogs.filter(log => log.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border-2 border-primary-500/30 mb-6">
          <h3 className="text-xl font-bold text-primary-400 mb-4">اختر الشهر لعرض الأرباح</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">السنة</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-dark-800 border border-primary-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">الشهر</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-dark-800 border border-primary-500/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={7}>7</option>
                <option value={8}>8</option>
                <option value={9}>9</option>
                <option value={10}>10</option>
                <option value={11}>11</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label className="text-primary-400 font-medium">بحث بالتاريخ:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => handleDateFilter('')}
                className="text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                إلغاء
              </button>
            )}
          </div>
          {dateFilter && (
            <p className="text-sm text-gray-400 mt-2">
              تم العثور على {filteredTimeLogs.length} سجل
            </p>
          )}
        </div>

        {/* Time Logs Table */}
        <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border-2 border-primary-500/30 overflow-hidden">
          <div className="p-6 border-b border-primary-500/20">
            <h2 className="text-2xl font-bold text-primary-400">سجل الحضور</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-primary-500/20">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">#</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">وقت الدخول</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">وقت الخروج</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المدة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الراتب المكتسب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filteredTimeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      {dateFilter ? 'لا يوجد سجل حضور في هذا التاريخ' : 'لا يوجد سجل حضور'}
                    </td>
                  </tr>
                ) : (
                  filteredTimeLogs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-gray-300">{index + 1}</td>
                      <td className="px-6 py-4 text-white font-medium">
                        {formatDate(log.clockIn)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatTime(log.clockIn)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {log.clockOut ? formatTime(log.clockOut) : '-'}
                      </td>
                      <td className="px-6 py-4 text-primary-400 font-bold">
                        {log.status === 'active' && activeSessionTimer[log.id] 
                          ? formatHoursMinutes(activeSessionTimer[log.id].elapsed / 3600)
                          : log.hoursWorked ? formatHoursMinutes(Number(log.hoursWorked)) : '-'
                        }
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {log.status === 'active' && activeSessionTimer[log.id] ? (
                          <span className="text-yellow-400 animate-pulse">
                            {activeSessionTimer[log.id].salary.toFixed(2)} ₪
                          </span>
                        ) : log.earnedSalary ? (
                          <span className="text-green-400">{Number(log.earnedSalary).toFixed(2)} ₪</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'active' ? (
                          <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm">
                            نشط
                          </span>
                        ) : (
                          <span className="bg-gray-900/30 text-gray-400 px-3 py-1 rounded-full text-sm">
                            مكتمل
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTimeLog(log)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {log.status === 'active' && (
                            <button
                              onClick={() => handleForceStopTimeLog(log.id)}
                              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition"
                              title="إيقاف"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTimeLog(log.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

        {/* Bonus Modal */}
        {showBonusModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dark-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-primary-500/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-400">إدارة المكافأة</h2>
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">المكافأة (يمكن أن تكون موجبة أو سالبة)</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300 mb-1">
                    💡 <strong>ملاحظة:</strong> المكافآت تتراكم
                  </p>
                  <p className="text-xs text-gray-400">
                    • المبلغ الموجب يُضاف إلى المكافأة الحالية ({employee?.bonus || 0})
                  </p>
                  <p className="text-xs text-gray-400">
                    • المبلغ السالب يُخصم من المكافأة الحالية
                  </p>
                  <p className="text-xs text-gray-400">
                    • المكافأة تُضاف إلى إجمالي الراتب
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateBonus}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Time Log Modal */}
        {editingLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dark-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-primary-500/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-400">تعديل سجل الحضور</h2>
                <button
                  onClick={() => setEditingLog(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">وقت الدخول</label>
                  <input
                    type="datetime-local"
                    value={editClockIn}
                    onChange={(e) => setEditClockIn(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">وقت الخروج (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={editClockOut}
                    onChange={(e) => setEditClockOut(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEditTimeLog}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setEditingLog(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dark-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-primary-500/30 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">تأكيد العملية</h2>
              </div>
              <p className="text-gray-300 mb-6 text-lg">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
                >
                  تأكيد
                </button>
                <button
                  onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: () => {} })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  إلغاء
                </button>
              </div>
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
      </main>
    </div>
  );
}
