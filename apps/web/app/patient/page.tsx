'use client';

import { useEffect, useState } from 'react';
import { fetchDoctors } from '../../lib/api';
import Navbar from '../../components/Navbar';
import DoctorCard from '../../components/DoctorCard';

export default function PatientPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDoctors();
        if (!mounted) return;
        setDoctors(Array.isArray(data) ? data : data?.doctors || []);
      } catch (err: any) {
        console.warn('Error fetching doctors from backend', err?.message ?? err);
        if (mounted) setDoctors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <Navbar />
      <main className="p-6">
        <h2 className="text-2xl mb-4">Doctors</h2>
        {loading && <div>Loading doctors…</div>}
        {!loading && doctors.length === 0 && (
          <div className="text-sm text-gray-400">No doctors found. If this persists, check backend / Supabase connectivity.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </main>
    </div>
  );
}
