"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroIllustration from '../components/HeroIllustration';
import VoicePanel from '../components/VoicePanel';

export default function Home() {
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'dron';

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (!backend) {
      setMessage('Backend URL not configured (NEXT_PUBLIC_BACKEND_URL).');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${backend.replace(/\/+$/,'')}/greet/${name}`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
        }
        const data = await res.json();
        setMessage(data?.message ?? 'No message');
      } catch (err: any) {
        // show a friendly error instead of crashing the whole app
        // Use debug to avoid triggering Next dev overlay for expected network errors
        console.debug('Homepage fetch error', err);
        setMessage(`Failed to fetch greeting: ${err?.message ?? err}`);
      }
    })();
  }, [name]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">Medora</div>
          <div className="text-sm text-gray-600">For Patients &nbsp; For Hospitals</div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-lg p-12 shadow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="mb-4 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Trusted by 50,000+ patients</div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Book Your Doctor in a <span className="text-indigo-600">Single Call</span></h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Revolutionary voice-powered appointment booking system. Simply speak your needs and get connected with the right healthcare provider instantly.</p>

            <div className="flex items-center justify-center gap-4">
              <a href="/patient/login" className="px-6 py-3 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700">Book as Patient</a>
              <a href="/hospital/login" className="px-6 py-3 bg-emerald-500 text-white rounded shadow hover:bg-emerald-600">Hospital Dashboard</a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <HeroIllustration />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">2,500+</div>
            <div className="text-sm text-gray-500">Active Doctors</div>
          </div>
          <div>
            <div className="text-2xl font-bold">50,000+</div>
            <div className="text-sm text-gray-500">Happy Patients</div>
          </div>
          <div>
            <div className="text-2xl font-bold">1M+</div>
            <div className="text-sm text-gray-500">Appointments</div>
          </div>
          <div>
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-gray-500">Hospitals</div>
          </div>
        </div>
      </section>
  <VoicePanel />
    </main>
  );
}
