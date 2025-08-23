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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('Not implemented yet');
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
