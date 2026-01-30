'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { API_URL } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

interface Supplier {
  id: number;
  name: string;
  phone: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  date: string;
  description: string;
}

interface Payment {
  id: number;
  paymentNumber: string;
  amount: number;
  date: string;
  notes: string;
}

interface CashflowNote {
  id: number;
  amount: number;
  recipientName: string;
  date: string;
  description: string;
  cashflowPaymentId: number;
}

// WhatsApp helper function
const sendWhatsApp = (phone: string, message: string) => {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashflowNotes, setCashflowNotes] = useState<CashflowNote[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'cashflow-notes'>('invoices');
  const [loading, setLoading] = useState(true);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
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
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    amount: '',
    date: getTodayDate(),
    description: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentNumber: '',
    amount: '',
    date: getTodayDate(),
    notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchSupplierData();
  }, [supplierId, router]);

  const fetchSupplierData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const supplierRes = await fetch(`${API_URL}/suppliers/${supplierId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (supplierRes.ok) {
        const supplierData = await supplierRes.json();
        setSupplier(supplierData);
      }

      const invoicesRes = await fetch(`${API_URL}/suppliers/${supplierId}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
        setFilteredInvoices(invoicesData);
      }

      const paymentsRes = await fetch(`${API_URL}/suppliers/${supplierId}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
      }

      const cashflowNotesRes = await fetch(`${API_URL}/suppliers/${supplierId}/cashflow-notes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (cashflowNotesRes.ok) {
        const cashflowNotesData = await cashflowNotesRes.json();
        setCashflowNotes(cashflowNotesData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingInvoice 
        ? `${API_URL}/suppliers/invoices/${editingInvoice.id}`
        : `${API_URL}/suppliers/invoices`;
      const method = editingInvoice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...invoiceForm,
          amount: parseFloat(invoiceForm.amount),
          supplierId: parseInt(supplierId),
        }),
      });

      if (response.ok) {
        setSuccess(editingInvoice ? 'تم تحديث الفاتورة بنجاح' : 'تم إضافة الفاتورة بنجاح');
        setInvoiceForm({ invoiceNumber: '', amount: '', date: getTodayDate(), description: '' });
        setShowAddInvoice(false);
        setEditingInvoice(null);
        fetchSupplierData();
      }
    } catch (err: any) {
      setError(err.message || 'فشل إضافة الفاتورة');
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount.toString(),
      date: invoice.date,
      description: invoice.description || '',
    });
    setShowAddInvoice(true);
  };

  const handleInvoiceDateFilter = (date: string) => {
    setInvoiceDateFilter(date);
    if (date) {
      const filtered = invoices.filter(invoice => invoice.date === date);
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  };

  const handlePaymentDateFilter = (date: string) => {
    setPaymentDateFilter(date);
    if (date) {
      const filtered = payments.filter(payment => payment.date === date);
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف فاتورة',
      message: 'هل أنت متأكد من حذف هذه الفاتورة؟ لن تتمكن من استرجاعها.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

          if (response.ok) {
            setSuccess('تم حذف الفاتورة بنجاح');
            fetchSupplierData();
          }
        } catch (err: any) {
          setError(err.message || 'فشل حذف الفاتورة');
        }
      },
    });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const url = editingPayment
        ? `${API_URL}/suppliers/payments/${editingPayment.id}`
        : `${API_URL}/suppliers/payments`;
      const method = editingPayment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...paymentForm,
          amount: parseFloat(paymentForm.amount),
          supplierId: parseInt(supplierId),
        }),
      });

      if (response.ok) {
        const paymentData = await response.json();
        setSuccess(editingPayment ? 'تم تحديث الدفعة بنجاح' : 'تم إضافة الدفعة بنجاح');
        
        // Show WhatsApp confirmation dialog only for new payments (not edits)
        if (!editingPayment && supplier && supplier.phone) {
          const paymentAmount = parseFloat(paymentForm.amount);
          const paymentDateValue = paymentForm.date;
          
          setConfirmDialog({
            isOpen: true,
            title: 'إرسال رسالة واتساب',
            message: 'هل تريد إرسال رسالة واتساب للمورد بتفاصيل الدفعة؟',
            type: 'success',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
              // Format the date in Arabic
              const paymentDate = formatDate(paymentDateValue);
              
              // Create WhatsApp message
              const message = `تم سداد دفعة\n\nالمبلغ: ${Math.round(paymentAmount)}\nتاريخ السداد: ${paymentDate}`;
              
              // Send WhatsApp message
              sendWhatsApp(supplier.phone, message);
            },
          });
        }
        
        setPaymentForm({ paymentNumber: '', amount: '', date: getTodayDate(), notes: '' });
        setShowAddPayment(false);
        setEditingPayment(null);
        fetchSupplierData();
      }
    } catch (err: any) {
      setError(err.message || 'فشل إضافة الدفعة');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      paymentNumber: payment.paymentNumber || '',
      amount: payment.amount.toString(),
      date: payment.date,
      notes: payment.notes || '',
    });
    setShowAddPayment(true);
  };

  const handleDeletePayment = (paymentId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف دفعة',
      message: 'هل أنت متأكد من حذف هذه الدفعة؟ لن تتمكن من استرجاعها.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

          if (response.ok) {
            setSuccess('تم حذف الدفعة بنجاح');
            fetchSupplierData();
          }
        } catch (err: any) {
          setError(err.message || 'فشل حذف الدفعة');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-xl text-primary-400">جاري التحميل...</div>
      </div>
    );
  }

  const totalInvoices = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalPayments = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const balance = totalInvoices - totalPayments;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Enhanced Header */}
      <div className="bg-dark-900/80 backdrop-blur-xl shadow-2xl border-b border-primary-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/admin/suppliers" 
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              العودة للموردين
            </Link>
          </div>
          
          {/* Prominent Supplier Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                <svg className="w-8 h-8 text-dark-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                  {supplier?.name}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-mono">{supplier?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 hover:border-primary-500/50 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">إجمالي الفواتير</h3>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{Math.round(totalInvoices)}</p>
            <p className="text-xs text-gray-500 mt-1">{invoices.length} فاتورة</p>
          </div>

          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 hover:border-primary-500/50 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">إجمالي الدفعات</h3>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{Math.round(totalPayments)}</p>
            <p className="text-xs text-gray-500 mt-1">{payments.length} دفعة</p>
          </div>

          <div className="bg-dark-900/80 backdrop-blur-xl p-6 rounded-2xl border border-primary-500/30 hover:border-primary-500/50 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm font-semibold">الرصيد المتبقي</h3>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                balance > 0 ? 'bg-red-500/20' : balance < 0 ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <svg className={`w-5 h-5 ${
                  balance > 0 ? 'text-red-400' : balance < 0 ? 'text-green-400' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-bold ${
              balance > 0 ? 'text-red-400' : balance < 0 ? 'text-green-400' : 'text-gray-400'
            }`}>{Math.round(Math.abs(balance))}</p>
            <p className="text-xs text-gray-500 mt-1">{balance > 0 ? 'مستحق' : balance < 0 ? 'زيادة في الدفع' : 'متوازن'}</p>
          </div>
        </div>

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

        {/* Enhanced Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
              activeTab === 'invoices'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-dark-950 shadow-lg shadow-primary-500/50 scale-105'
                : 'bg-dark-900/80 text-gray-400 hover:text-primary-400 border-2 border-dark-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            الفواتير
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              activeTab === 'invoices' ? 'bg-dark-950/30' : 'bg-primary-500/20 text-primary-400'
            }`}>
              {invoices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-dark-950 shadow-lg shadow-primary-500/50 scale-105'
                : 'bg-dark-900/80 text-gray-400 hover:text-primary-400 border-2 border-dark-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            الدفعات
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              activeTab === 'payments' ? 'bg-dark-950/30' : 'bg-primary-500/20 text-primary-400'
            }`}>
              {payments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cashflow-notes')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
              activeTab === 'cashflow-notes'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-dark-950 shadow-lg shadow-primary-500/50 scale-105'
                : 'bg-dark-900/80 text-gray-400 hover:text-primary-400 border-2 border-dark-700 hover:border-primary-500/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            ملاحظات Cashflow
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              activeTab === 'cashflow-notes' ? 'bg-dark-950/30' : 'bg-primary-500/20 text-primary-400'
            }`}>
              {cashflowNotes.length}
            </span>
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                قائمة الفواتير
              </h2>
              <button
                onClick={() => {
                  setShowAddInvoice(!showAddInvoice);
                  if (!showAddInvoice) {
                    setEditingInvoice(null);
                    const nextNumber = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
                    const autoInvoiceNumber = `INV-${nextNumber.toString().padStart(5, '0')}`;
                    setInvoiceForm({ invoiceNumber: autoInvoiceNumber, amount: '', date: getTodayDate(), description: '' });
                  }
                }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-dark-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/50 hover:scale-105 flex items-center gap-2"
              >
                {showAddInvoice ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إلغاء
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة فاتورة
                  </>
                )}
              </button>
            </div>

            {showAddInvoice && (
              <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-6 animate-fadeIn">
                <form onSubmit={handleAddInvoice} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-400 mb-2">
                        رقم الفاتورة
                        {!editingInvoice && <span className="text-xs text-gray-500 mr-2">(تلقائي - يمكن التعديل)</span>}
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.invoiceNumber}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="سيتم التوليد تلقائياً"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-400 mb-2">
                        المبلغ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={invoiceForm.amount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-400 mb-2">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-400 mb-2">
                      الوصف
                    </label>
                    <textarea
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                  >
                    إضافة الفاتورة
                  </button>
                </form>
              </div>
            )}

            {/* Invoice Date Filter */}
            <div className="bg-dark-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="text-primary-400 font-medium">بحث بالتاريخ:</label>
                <input
                  type="date"
                  value={invoiceDateFilter}
                  onChange={(e) => handleInvoiceDateFilter(e.target.value)}
                  className="px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                {invoiceDateFilter && (
                  <button
                    onClick={() => handleInvoiceDateFilter('')}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إلغاء
                  </button>
                )}
              </div>
              {invoiceDateFilter && (
                <p className="text-sm text-gray-400 mt-2">
                  تم العثور على {filteredInvoices.length} فاتورة
                </p>
              )}
            </div>

            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-500/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-800 border-b border-primary-500/20">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">رقم الفاتورة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المبلغ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الوصف</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        {invoiceDateFilter ? 'لا توجد فواتير في هذا التاريخ' : 'لا توجد فواتير'}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-dark-800/50 transition">
                        <td className="px-6 py-4 text-white font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 text-primary-400 font-bold">{Math.round(invoice.amount)}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="px-6 py-4 text-gray-400">{invoice.description || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
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
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                قائمة الدفعات
              </h2>
              <button
                onClick={() => {
                  setShowAddPayment(!showAddPayment);
                  if (!showAddPayment) {
                    setEditingPayment(null);
                    const nextNumber = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
                    const autoPaymentNumber = `PAY-${nextNumber.toString().padStart(5, '0')}`;
                    setPaymentForm({ paymentNumber: autoPaymentNumber, amount: '', date: getTodayDate(), notes: '' });
                  }
                }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-dark-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/50 hover:scale-105 flex items-center gap-2"
              >
                {showAddPayment ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إلغاء
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة دفعة
                  </>
                )}
              </button>
            </div>

            {showAddPayment && (
              <div className="bg-dark-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-6 animate-fadeIn">
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-400 mb-2">
                        رقم الدفعة
                        {!editingPayment && <span className="text-xs text-gray-500 mr-2">(تلقائي - يمكن التعديل)</span>}
                      </label>
                      <input
                        type="text"
                        value={paymentForm.paymentNumber}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="سيتم التوليد تلقائياً"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-400 mb-2">
                        المبلغ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-400 mb-2">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-400 mb-2">
                      ملاحظات
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold py-3 rounded-lg transition"
                  >
                    إضافة الدفعة
                  </button>
                </form>
              </div>
            )}

            {/* Payment Date Filter */}
            <div className="bg-dark-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border-2 border-primary-500/30 mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="text-primary-400 font-medium">بحث بالتاريخ:</label>
                <input
                  type="date"
                  value={paymentDateFilter}
                  onChange={(e) => handlePaymentDateFilter(e.target.value)}
                  className="px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                {paymentDateFilter && (
                  <button
                    onClick={() => handlePaymentDateFilter('')}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إلغاء
                  </button>
                )}
              </div>
              {paymentDateFilter && (
                <p className="text-sm text-gray-400 mt-2">
                  تم العثور على {filteredPayments.length} دفعة
                </p>
              )}
            </div>

            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-500/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-800 border-b border-primary-500/20">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">ID</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المبلغ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">ملاحظات</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        {paymentDateFilter ? 'لا توجد دفعات في هذا التاريخ' : 'لا توجد دفعات'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-dark-800/50 transition">
                        <td className="px-6 py-4 text-gray-400 font-mono">#{payment.id}</td>
                        <td className="px-6 py-4 text-primary-400 font-bold">{Math.round(payment.amount)}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-6 py-4 text-gray-400">{payment.notes || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
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
          </div>
        )}

        {activeTab === 'cashflow-notes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                ملاحظات Cashflow
              </h2>
            </div>

            <div className="bg-dark-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary-500/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-800 border-b border-primary-500/20">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">المبلغ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">التاريخ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">اسم المستلم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">الوصف</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-primary-400">مصدر الدفعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {cashflowNotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        لا توجد ملاحظات من Cashflow لهذا المورد
                      </td>
                    </tr>
                  ) : (
                    cashflowNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-dark-800/50 transition">
                        <td className="px-6 py-4 text-orange-400 font-bold">{Math.round(note.amount)}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(note.date)}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">{note.recipientName}</td>
                        <td className="px-6 py-4 text-gray-400">{note.description || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Cashflow #{note.cashflowPaymentId}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
