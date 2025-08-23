'use client';

import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function InputField({ label, className = '', ...props }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <input className="border px-3 py-2 rounded" {...props} />
    </div>
  );
}
