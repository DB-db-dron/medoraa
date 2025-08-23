'use client';

import React from 'react';
import Button from './Button';

export default function DoctorCard({ doctor, onBook }: { doctor: any; onBook?: () => void }) {
  return (
    <div className="p-4 border rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{doctor.name}</h3>
          <p className="text-sm text-gray-600">{doctor.specialty}</p>
        </div>
        <div className="ml-4">
          <Button onClick={onBook}>Book</Button>
        </div>
      </div>
    </div>
  );
}
