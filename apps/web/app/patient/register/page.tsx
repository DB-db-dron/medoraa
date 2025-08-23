'use client';

import React, { useState } from 'react';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Navbar from '../../../components/Navbar';
import { createPatient } from '../../../lib/api';

export default function PatientRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await createPatient({ name, email, password, phone });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.detail || data?.error || 'Registration failed');
      } else {
        setMessage('Registered — please login');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl mb-4">Patient Register</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
          <InputField label="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
          <InputField label="Phone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
        </form>
        {message && <div className="mt-4 text-sm">{message}</div>}
      </main>
    </div>
  );
}
