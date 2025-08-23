'use client';

import { useState } from 'react';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Navbar from '../../../components/Navbar';

export default function HospitalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.detail || data.error || 'Login failed');
      } else {
        setMessage('Logged in — cookie set');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMessage(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl mb-4">Hospital Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        {message && <div className="mt-4 text-sm">{message}</div>}
      </main>
    </div>
  );
}
