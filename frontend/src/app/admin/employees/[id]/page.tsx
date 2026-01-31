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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filteredTimeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
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
