'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface TimeLog {
  id: number;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  earnedSalary: number | null;
  status: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<TimeLog | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentEarnedSalary, setCurrentEarnedSalary] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    fetchEmployeeData(parsedUser.id);
    
    fetchActiveSession(parsedUser.id);
    fetchTimeLogs(parsedUser.id);
    fetchTotalEarnings(parsedUser.id);
    fetchMonthlyEarnings(parsedUser.id, selectedYear, selectedMonth);
  }, [router]);

  const fetchEmployeeData = async (employeeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          console.log('Employee data fetched:', data);
          console.log('hourlyWage value:', data.hourlyWage);
          setUser(data);
        }
        setLoading(false);
      } else {
        console.error('Failed to fetch employee data:', response.status);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMonthlyEarnings(user.id, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && user) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const clockIn = new Date(activeSession.clockIn).getTime();
        const elapsed = Math.floor((now - clockIn) / 1000);
        setElapsedTime(elapsed);
        
        const hoursWorked = elapsed / 3600;
        const hourlyWage = user.hourlyWage || 0;
        const calculatedSalary = hoursWorked * hourlyWage;
        console.log('Calculation:', { hoursWorked, hourlyWage, calculatedSalary, userHourlyWage: user.hourlyWage });
        setCurrentEarnedSalary(calculatedSalary);
      }, 1000);
    } else {
      setCurrentEarnedSalary(0);
    }
    return () => clearInterval(interval);
  }, [activeSession, user]);

  const fetchActiveSession = async (employeeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/active/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setActiveSession(data);
        }
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  const fetchTimeLogs = async (employeeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/employee/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setTimeLogs(data);
        }
      }
    } catch (err) {
      console.error('Error fetching time logs:', err);
    }
  };

  const fetchTotalEarnings = async (employeeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/earnings/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const total = await response.json();
        setTotalEarnings(total);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  };

  const fetchMonthlyEarnings = async (employeeId: number, year: number, month: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-logs/earnings/${employeeId}/${year}/${month}`, {
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

  const handleClockIn = async () => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      console.log('Clock-in attempt for user:', user);
      const response = await fetch(`${API_URL}/time-logs/clock-in/${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Clock-in response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Clock-in success:', data);
        setActiveSession(data);
        setSuccess('تم تسجيل الدخول بنجاح');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
        console.error('Clock-in error:', errorData);
        setError(errorData.message || 'فشل تسجيل الدخول');
      }
    } catch (err: any) {
      console.error('Clock-in exception:', err);
      setError(err.message || 'فشل تسجيل الدخول');
    }
  };

  const handleClockOut = async () => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      console.log('Clock-out attempt for user:', user);
      const response = await fetch(`${API_URL}/time-logs/clock-out/${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Clock-out response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Clock-out success:', data);
        setSuccess('تم تسجيل الخروج بنجاح');
        setActiveSession(null);
        setElapsedTime(0);
        fetchTimeLogs(user.id);
        fetchTotalEarnings(user.id);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
        console.error('Clock-out error:', errorData);
        setError(errorData.message || 'فشل تسجيل الخروج');
      }
    } catch (err: any) {
      console.error('Clock-out exception:', err);
      setError(err.message || 'فشل تسجيل الخروج');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatHoursWorked = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} ساعة و ${minutes} دقيقة`;
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
            <h1 className="text-2xl font-bold text-primary-400">لوحة تحكم الموظف</h1>
            <div className="flex items-center gap-3">
              {user?.specialization && (
                <div className="flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-primary-300 font-semibold">{user.specialization}</span>
                </div>
              )}
              <span className="text-gray-300">مرحباً، {user?.username}</span>
              <Link
                href="/employee/requests"
                className="bg-primary-600 hover:bg-primary-700 text-dark-950 px-4 py-2 rounded-lg transition font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                طلبات الموارد
              </Link>
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
        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-500 text-red-300 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/30 border-2 border-green-500 text-green-300 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        {/* Clock In/Out Card */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-500/30 mb-8 text-center">
          {activeSession ? (
            <div>
              <h2 className="text-2xl font-bold text-primary-400 mb-4">جلسة نشطة</h2>
              <div className="text-6xl font-bold text-green-400 mb-4">
                {formatElapsedTime(elapsedTime)}
              </div>
              <div className="bg-primary-500/20 border-2 border-primary-500/50 rounded-xl p-4 mb-6">
                <p className="text-gray-400 text-sm mb-2">الراتب المكتسب حتى الآن</p>
                <p className="text-3xl font-bold text-primary-300">
                  {currentEarnedSalary.toFixed(2)} ₪
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  ({(elapsedTime / 3600).toFixed(2)} ساعة × {user?.hourlyWage || 0} ₪/ساعة)
                </p>
              </div>
              <p className="text-gray-400 mb-6">
                بدأت في: {new Date(activeSession.clockIn).toLocaleString('ar-EG')}
              </p>
              <button
                onClick={handleClockOut}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-12 py-4 rounded-xl transition-all shadow-lg text-xl"
              >
                خروج
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-primary-400 mb-6">ابدأ يومك</h2>
              <button
                onClick={handleClockIn}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-12 py-4 rounded-xl transition-all shadow-lg text-xl"
              >
                دخول
              </button>
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">إجمالي الراتب</h3>
            <p className="text-4xl font-bold text-primary-400">{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-green-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">عدد الجلسات</h3>
            <p className="text-4xl font-bold text-green-400">{timeLogs.filter(log => log.status === 'completed').length}</p>
          </div>
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-yellow-500/30">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">الراتب الشهري</h3>
            <p className="text-4xl font-bold text-yellow-400">{monthlyEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border-2 border-primary-500/30 mb-8">
          <h3 className="text-xl font-bold text-primary-400 mb-4">اختر الشهر لعرض الراتب</h3>
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

        {/* Time Logs History */}
        <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl border-2 border-primary-500/30 overflow-hidden">
          <div className="p-6 border-b border-primary-500/20">
            <h2 className="text-2xl font-bold text-primary-400">سجل الحضور</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-primary-500/20">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">وقت الدخول</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">وقت الخروج</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الساعات</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الراتب المكتسب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {timeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      لا يوجد سجل حضور
                    </td>
                  </tr>
                ) : (
                  timeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-dark-800/50 transition">
                      <td className="px-6 py-4 text-white">
                        {formatDate(log.clockIn)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatTime(log.clockIn)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {log.clockOut ? formatTime(log.clockOut) : '-'}
                      </td>
                      <td className="px-6 py-4 text-primary-400 font-bold">
                        {log.hoursWorked ? formatHoursWorked(log.hoursWorked) : '-'}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-bold">
                        {log.earnedSalary ? Number(log.earnedSalary).toFixed(2) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'active' ? (
                          <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm">نشط</span>
                        ) : (
                          <span className="bg-gray-900/30 text-gray-400 px-3 py-1 rounded-full text-sm">مكتمل</span>
                        )}
                      </td>
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
