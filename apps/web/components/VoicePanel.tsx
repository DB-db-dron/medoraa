"use client";

import React, { useState } from "react";
import { fetchDoctors } from "../lib/api";

export default function VoicePanel() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [results, setResults] = useState<any[]>([]);

  async function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser');
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onresult = async (ev: any) => {
      const t = ev.results[0][0].transcript;
      setText(t);
      // naive: call backend doctors endpoint to fetch and filter
      try {
        const docs = await fetchDoctors();
        const flat = Array.isArray(docs) ? docs : docs?.doctors || [];
        const q = t.toLowerCase();
        const matched = flat.filter((d: any) => String(d.name || d.specialty || '').toLowerCase().includes(q) || String(d.specialty || '').toLowerCase().includes(q));
        setResults(matched.slice(0, 6));
      } catch (err) {
        console.warn('voice search fetch failed', err);
      }
    };
    recog.start();
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-gradient-to-br from-sky-100 to-emerald-100 rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-center">Voice Booking</h3>
      <p className="text-sm text-gray-600 text-center mb-4">Say something like: "I need a cardiologist for tomorrow"</p>
      <div className="flex justify-center">
        <button onClick={startListening} className={`w-20 h-20 rounded-full ${listening ? 'bg-red-500' : 'bg-blue-600'} text-white flex items-center justify-center shadow-lg hover:opacity-90`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11m0 0a3 3 0 103 3H9a3 3 0 003-3z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-700">{text ? `Heard: "${text}"` : 'Tap to start voice booking'}</div>

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {results.map((d, i) => (
            <div key={i} className="bg-white/90 p-2 rounded shadow-sm">
              <div className="font-medium">{d.name || d.title || 'Unknown'}</div>
              <div className="text-xs text-gray-500">{d.specialty || d.specialization || ''}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-gray-700">
        <div className="bg-white/60 p-2 rounded">Allow microphone access for voice booking</div>
        <div className="bg-white/60 p-2 rounded">Speak clearly and naturally</div>
        <div className="bg-white/60 p-2 rounded">Try: "I need a cardiologist for tomorrow"</div>
        <div className="bg-white/60 p-2 rounded">Say the specialty and preferred time</div>
      </div>
    </div>
  );
}
