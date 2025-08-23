"use client";

import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Unhandled error in app:", error);
  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p>{String(error?.message ?? "Unknown error")}</p>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => reset()} style={{ padding: '8px 12px' }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
