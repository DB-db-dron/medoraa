'use client';

import Navbar from '../../../components/Navbar';
import { fetchDoctors } from '../../../lib/api';
import { useEffect, useState } from 'react';
import DoctorCard from '../../../components/DoctorCard';

export default function PatientDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDoctors();
        if (!mounted) return;
        setDoctors(Array.isArray(data) ? data : data?.doctors || []);
      } catch (err) {
        console.warn('Error fetching doctors', err);
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
        <h2 className="text-2xl mb-4">Patient Dashboard</h2>
        <div className="flex gap-4 mb-6">
          <a href="/patient/booking/" className="px-4 py-2 bg-blue-600 text-white rounded">Book Appointment</a>
          <a href="/patient/profile" className="px-4 py-2 border rounded">Profile</a>
        </div>
        {loading && <div>Loading doctors…</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      </main>
    </div>
  );
}
