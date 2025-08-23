export async function fetchCurrentUser() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/patients/me`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Not authenticated: ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}

export async function fetchDoctors() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/doctors`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Failed to fetch doctors: ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}

export async function createPatient(payload: { name: string; email: string; password: string; phone?: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/patient/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res;
}

export async function logout() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res;
}

export async function fetchBookings() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bookings`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Failed to fetch bookings: ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}
