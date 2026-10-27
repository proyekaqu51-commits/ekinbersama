import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles, UserCheck, School } from 'lucide-react';
import { UserSession } from '../types';
import { StorageService } from '../services/storageService';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, showToast }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const appSettings = StorageService.getAppSettings();
  const teacherProfile = StorageService.getTeacherProfile();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = (username.trim() || 'ADMIN').toUpperCase();
    const cleanPass = password.trim() || 'admin123';

    setLoading(true);

    setTimeout(() => {
      // Check Admin / Guru PAI credentials
      if (cleanUser === 'ADMIN' && cleanPass === 'admin123') {
        const session: UserSession = {
          userId: 'admin-guru',
          role: 'admin',
          fullName: teacherProfile.fullName || 'Guru PAI',
          username: 'admin',
          classId: '',
          className: ''
        };
        StorageService.setSession(session);
        setLoading(false);
        onLoginSuccess(session);
        showToast('Selamat datang, Bapak/Ibu Guru PAI!', 'success');
        return;
      }

      setLoading(false);
      showToast('Username atau Password Guru PAI salah. Gunakan Username: admin, Password: admin123', 'error');
    }, 200);
  };

  const loginAsDemoTeacher = () => {
    setUsername('admin');
    setPassword('admin123');
    setTimeout(() => {
      const session: UserSession = {
        userId: 'admin-guru',
        role: 'admin',
        fullName: teacherProfile.fullName || 'Guru PAI',
        username: 'admin',
        classId: '',
        className: ''
      };
      StorageService.setSession(session);
      onLoginSuccess(session);
      showToast('Berhasil masuk sebagai Guru PAI', 'success');
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40">
      {/* Background Islamic Geometric Aesthetic Ambient */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* School & Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl mb-4 backdrop-blur-md">
            <img
              src={appSettings.appLogoUrl || 'https://jhlryjdhotxtndavacpd.supabase.co/storage/v1/object/public/logo/logo.png'}
              alt="Logo Sekolah"
              className="w-16 h-16 object-contain"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <School className="w-10 h-10 text-emerald-400 hidden only:block" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            E-KINERJA GURU PAI
          </h1>
          <p className="text-emerald-400 font-semibold text-xs sm:text-sm mt-1">
            SDN Ciketing Udik 2 Bantargebang
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Kota Bekasi &bull; Tahun Ajaran {appSettings.academicYear || '2026/2027'}
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Masuk Akun Guru / Admin
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Silakan masukkan Username dan Password Guru PAI untuk mengakses dashboard.
            </p>
          </div>

          {/* Quick Access Bar */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 mb-5">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-2">
              <span>Akses Cepat Guru PAI:</span>
            </div>
            <button
              type="button"
              onClick={loginAsDemoTeacher}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Masuk Langsung sebagai Guru PAI (admin)</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase text-sm"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-bold text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Portal Guru PAI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Credit */}
        <div className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} E-KINERJA &bull; SDN Ciketing Udik 2 Bantargebang
        </div>
      </div>
    </div>
  );
};
