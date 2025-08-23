'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout } from '../lib/api';

export default function Navbar() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await fetchCurrentUser();
        if (mounted) setUser(u);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-white">
      <div className="text-lg font-bold">Medora</div>
      <div className="flex gap-4 items-center">
        <Link href="/patient" className="text-sm underline">Patient</Link>
        <Link href="/hospital" className="text-sm underline">Hospital</Link>
        {!loading && (
          user ? (
            <>
              <span className="text-sm">{user.name}</span>
              <button onClick={handleLogout} className="text-sm underline">Logout</button>
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
