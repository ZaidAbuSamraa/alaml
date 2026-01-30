// API Configuration
// This file centralizes all API calls to use environment variables

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to make authenticated API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  
  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE: (id: number) => `/employees/${id}`,
  
  // Time Logs
  TIME_LOGS: '/time-logs',
  TIME_LOGS_ALL: '/time-logs/all',
  TIME_LOGS_EMPLOYEE: (id: number) => `/time-logs/employee/${id}`,
  TIME_LOGS_ACTIVE: (id: number) => `/time-logs/active/${id}`,
  TIME_LOGS_CLOCK_IN: (id: number) => `/time-logs/clock-in/${id}`,
  TIME_LOGS_CLOCK_OUT: (id: number) => `/time-logs/clock-out/${id}`,
  TIME_LOGS_EARNINGS: (id: number) => `/time-logs/earnings/${id}`,
  TIME_LOGS_MONTHLY_EARNINGS: (id: number, year: number, month: number) => 
    `/time-logs/earnings/${id}/${year}/${month}`,
  
  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER: (id: number) => `/suppliers/${id}`,
  SUPPLIER_INVOICES: (id: number) => `/suppliers/${id}/invoices`,
  SUPPLIER_PAYMENTS: (id: number) => `/suppliers/${id}/payments`,
  INVOICES: '/suppliers/invoices',
  INVOICE: (id: number) => `/suppliers/invoices/${id}`,
  PAYMENTS: '/suppliers/payments',
  PAYMENT: (id: number) => `/suppliers/payments/${id}`,
  
  // Sales
  SALES: '/sales',
  SALE: (id: number) => `/sales/${id}`,
  SALES_TOTAL: '/sales/total',
  
  // Cash
  CASH: '/cash',
  CASH_ITEM: (id: number) => `/cash/${id}`,
  CASH_BALANCE: '/cash/balance',
  
  // Analytics
  ANALYTICS_SUMMARY: '/analytics/summary',
  ANALYTICS_MONTHLY: '/analytics/monthly',
  
  // Resource Requests
  RESOURCE_REQUESTS: '/resource-requests',
  RESOURCE_REQUEST: (id: number) => `/resource-requests/${id}`,
  RESOURCE_REQUESTS_EMPLOYEE: (id: number) => `/resource-requests/employee/${id}`,
  RESOURCE_REQUEST_APPROVE: (id: number) => `/resource-requests/${id}/approve`,
  RESOURCE_REQUEST_REJECT: (id: number) => `/resource-requests/${id}/reject`,
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD: '/notifications/unread',
  NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
};
