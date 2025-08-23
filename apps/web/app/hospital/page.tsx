'use client';

import Navbar from '../../components/Navbar';

export default function HospitalPage() {
  return (
    <div>
      <Navbar />
      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl mb-2">Hospital Portal</h2>
          <p className="text-sm text-gray-600 mb-4">Manage appointments, doctors and patients from here.</p>
          <div className="flex gap-3">
            <a href="/hospital/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</a>
            <a href="/hospital/register" className="px-4 py-2 border rounded">Register</a>
            <a href="/hospital/dashboard" className="px-4 py-2 bg-emerald-600 text-white rounded">Dashboard</a>
            <a href="/hospital/appointments" className="px-4 py-2 bg-sky-600 text-white rounded">Appointments</a>
          </div>
        </div>
      </main>
    </div>
  );
}
