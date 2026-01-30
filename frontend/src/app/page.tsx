'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.type === 'employee') {
          router.push('/employee/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="text-xl text-primary-400">جاري التحميل...</div>
    </main>
  );
}
