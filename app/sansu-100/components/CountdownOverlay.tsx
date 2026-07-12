'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const STEPS = ['3', '2', '1', 'スタート！'];

export default function CountdownOverlay({ onDone }: Props): React.JSX.Element {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, onDone]);

  const isGo = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/90 dark:bg-blue-900/90"
      data-testid="countdown-overlay"
    >
      <div
        key={step}
        className={`select-none text-center font-extrabold text-white transition-all ${
          isGo ? 'text-5xl' : 'text-9xl'
        }`}
        data-testid="countdown-number"
        style={{ animation: 'countdown-pop 0.3s ease-out' }}
      >
        {STEPS[step]}
      </div>
      <style>{`
        @keyframes countdown-pop {
          0% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
