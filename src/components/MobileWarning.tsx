import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'nn-mobile-warning-dismissed';

export function MobileWarning({ breakpoint = 900 }: { breakpoint?: number }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === '1') {
      setDismissed(true);
    }

    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isNarrow = width < breakpoint;
      const isPortrait = height > width;
      setShow(isNarrow || isPortrait);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, [breakpoint]);

  const handleDismiss = () => {
    setDismissed(true);
    window.localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-amber-400/50 bg-slate-900 shadow-2xl shadow-amber-500/20 p-6 space-y-3 text-center">
        <div className="text-amber-300 text-sm font-semibold uppercase tracking-wide">Mobile Notice</div>
        <h2 className="text-xl font-bold text-white">Switch to desktop or rotate your phone</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This simulator is optimized for larger screens. For the best experience, open it on a desktop or rotate
          your phone to landscape mode.
        </p>
        <button
          onClick={handleDismiss}
          className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 transition-colors"
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
}
