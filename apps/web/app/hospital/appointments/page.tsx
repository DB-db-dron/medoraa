'use client';

import Navbar from '../../../components/Navbar';
import { useEffect, useState } from 'react';
import { fetchBookings } from '../../../lib/api';

type Booking = { time: string; patient: string; doctor: string; type: string; status: string };

export default function HospitalAppointments() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchBookings();
        if (!mounted) return;
        setBookings(Array.isArray(data) ? data : data?.bookings || []);
      } catch (err) {
        console.warn('Failed to load bookings', err);
        if (mounted) setBookings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div>
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Appointments</h2>
          {loading && <div className="text-gray-500">Loading…</div>}
          {!loading && bookings.length === 0 && <div className="text-gray-500">No appointments found.</div>}
          {!loading && bookings.length > 0 && (
            <ul className="space-y-3">
              {bookings.map((b, idx) => (
                <li key={idx} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{b.time} • {b.type}</div>
                      <div className="font-medium">{b.patient}</div>
                      <div className="text-sm text-gray-600">Doctor: {b.doctor}</div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'In Progress' ? 'bg-sky-100 text-sky-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
