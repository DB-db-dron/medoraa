'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchSession, logout } from '../lib/api';

type Session = { role: 'patient' | 'hospital'; user: { name?: string; email?: string } };

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await fetchSession();
        if (mounted) setSession(s as Session);
      } catch (_err) {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-white">
      <div className="text-lg font-bold">Medora</div>
      <div className="flex gap-4 items-center">
        <Link href="/patient" className="text-sm underline">Patient</Link>
        <Link href="/hospital" className="text-sm underline">Hospital</Link>
        {!loading && (
          session ? (
            <>
              <span className="text-sm">{session.user?.name || session.user?.email}</span>
              <button onClick={handleLogout} className="text-sm underline">Logout</button>
              {session.role === 'hospital' && <Link href="/hospital/dashboard" className="ml-3 text-sm">Dashboard</Link>}
            </>
          ) : (
            <>
              <Link href="/patient/login" className="text-sm">Login</Link>
              <Link href="/patient/register" className="text-sm">Register</Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
