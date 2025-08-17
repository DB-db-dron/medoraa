'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'dron';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/greet/${name}`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, [name]);

  return (
    <main>
      <h1>Welcome to my humble aboard</h1>
      <h1>{message}</h1>
    </main>
  );
}
