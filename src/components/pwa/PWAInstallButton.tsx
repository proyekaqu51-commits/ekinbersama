import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running in standalone / installed PWA mode
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className={`p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-200">Aplikasi Terpasang (PWA Aktif)</h4>
              <p className="text-xs text-slate-400">Aplikasi E-Kinerja sudah terinstall di perangkat ini.</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-medium">
            WFA Standalone Mode
          </span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`p-5 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 shadow-xl ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-100">Pasang Aplikasi ke Layar Utama (PWA / WFA)</h4>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  Bisa WFA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Install aplikasi ke HP, Tablet, atau Laptop untuk kemudahan isi E-Kinerja dari mana saja, bahkan saat sinyal lemah.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            {isInstallable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {installing ? 'Memasang...' : 'Install Aplikasi Sekarang'}
              </button>
            ) : isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50 text-teal-200 text-xs font-semibold transition"
              >
                <Smartphone className="w-4 h-4 text-teal-400" />
                Petunjuk Pasang di iPhone/iPad
              </button>
            ) : (
              <button
                type="button"
                onClick={() => alert('Untuk memasang di browser ini, buka menu titik tiga (⋮) di kanan atas browser lalu pilih "Instal E-Kinerja" atau "Tambahkan ke Layar Utama".')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Pasang ke HP / Desktop
              </button>
            )}
          </div>
        </div>

        {/* Modal petunjuk iOS */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-teal-400">
                  <Smartphone className="w-5 h-5" />
                  <span>Pasang di iPhone / iPad</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">1</span>
                  <p>Buka website E-Kinerja ini di browser <strong>Safari</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    Tekan tombol Bagikan <Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> di bilah bawah Safari.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">3</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    Gulir ke bawah dan pilih <span className="font-semibold text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-teal-400" /> "Add to Home Screen"</span> (Tambahkan ke Layar Utama).
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact navbar button
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={installing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-medium shadow-sm transition active:scale-95 ${className}`}
        title="Install Aplikasi E-Kinerja ke Perangkat (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline">Install PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition ${className}`}
          title="Pasang di iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-teal-400">
                  <Smartphone className="w-5 h-5" />
                  <span>Pasang di iPhone / iPad</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">1</span>
                  <p>Buka website ini di <strong>Safari</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">2</span>
                  <div>Tekan tombol Bagikan <Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> di bilah Safari.</div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">3</span>
                  <div>Pilih <strong>"Add to Home Screen"</strong> / Tambahkan ke Layar Utama.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
