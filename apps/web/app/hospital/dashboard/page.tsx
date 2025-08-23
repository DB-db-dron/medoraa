'use client';

import Navbar from '../../../components/Navbar';
import { useEffect, useState } from 'react';
import { fetchBookings } from '../../../lib/api';

type Booking = { time: string; patient: string; doctor: string; type: string; status: string };

export default function HospitalDashboard() {
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
        console.warn('Failed to load bookings, falling back to empty', err);
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
      <div className="min-h-[80vh] bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-4">MedCare Hospital</h3>
            <nav className="flex flex-col gap-2 text-sm text-gray-700">
              <a className="px-2 py-2 rounded bg-indigo-50">Dashboard</a>
              <a className="px-2 py-2 rounded">Appointments</a>
              <a className="px-2 py-2 rounded">Doctors</a>
              <a className="px-2 py-2 rounded">Patients</a>
              <a className="px-2 py-2 rounded">Settings</a>
            </nav>
          </aside>

          <section className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Total Appointments</div>
                <div className="text-xl font-bold">24</div>
                <div className="text-xs text-green-500">+2 from yesterday</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Active Doctors</div>
                <div className="text-xl font-bold">12</div>
                <div className="text-xs text-gray-500">3 currently available</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Patients Today</div>
                <div className="text-xl font-bold">81</div>
                <div className="text-xs text-green-500">+12% from last week</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Revenue</div>
                <div className="text-xl font-bold">$12,450</div>
                <div className="text-xs text-green-500">+8% from last month</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Today's Appointments</h3>
                <button className="px-3 py-2 bg-blue-600 text-white rounded">Add Appointment</button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-2">Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5} className="py-6 text-center text-gray-500">Loading…</td></tr>
                  )}
                  {!loading && bookings.map((b, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 text-sm text-gray-600">{b.time}</td>
                      <td>{b.patient}</td>
                      <td>{b.doctor}</td>
                      <td className="text-sm text-gray-600">{b.type}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs ${b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'In Progress' ? 'bg-sky-100 text-sky-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
