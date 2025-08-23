import React from 'react';

export default function HeroIllustration() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <img src="/hero.svg" alt="Hero illustration" className="w-80 h-64 object-cover rounded-xl shadow-inner" />
    </div>
  );
}
