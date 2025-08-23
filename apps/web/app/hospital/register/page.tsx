'use client';

import Navbar from '../../../components/Navbar';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import { useState } from 'react';

export default function HospitalRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/hospital/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.detail || data?.error || 'Registration failed');
      } else {
        setMessage('Registered successfully — please login');
        setName(''); setEmail(''); setPassword('');
      }
    } catch (err: any) {
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
        <h2 className="text-2xl mb-4">Hospital Register</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField label="Hospital name" value={name} onChange={(e) => setName(e.target.value)} />
          <InputField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Register</Button>
        </form>
        {message && <div className="mt-4 text-sm">{message}</div>}
      </main>
    </div>
  );
}
