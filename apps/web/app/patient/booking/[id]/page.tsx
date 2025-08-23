'use client';

import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';

export default function BookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  return (
    <div>
      <Navbar />
      <main className="p-6">
        <h2 className="text-2xl mb-4">Book with doctor {id}</h2>
        <p>Booking UI and slot selection will go here.</p>
        <div className="mt-6">
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => router.push('/patient/dashboard')}>
            Confirm (demo)
          </button>
        </div>
      </main>
    </div>
  );
}
