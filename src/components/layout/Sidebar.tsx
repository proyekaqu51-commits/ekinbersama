import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Settings,
  ClipboardCheck,
  ListChecks,
  BookOpen,
  LogOut,
  X
} from 'lucide-react';
import { UserSession, TeacherProfile } from '../../types';
import { StorageService } from '../../services/storageService';

interface SidebarProps {
  session: UserSession;
  currentView: string;
  onNavigate: (viewId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  currentView,
  onNavigate,
  isOpen,
  onClose,
  onLogout
}) => {
  const appSettings = StorageService.getAppSettings();
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile>(() =>
    StorageService.getActiveTeacher()
  );

  useEffect(() => {
    const handleTeacherChanged = () => {
      setActiveTeacher(StorageService.getActiveTeacher());
    };
    window.addEventListener('lms-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', handleTeacherChanged);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profil Guru', icon: User },
    { id: 'e-kinerja', label: 'E-Kinerja Harian', icon: ClipboardCheck },
    { id: 'jurnal-mengajar', label: 'Jurnal Mengajar', icon: BookOpen },
    { id: 'master-rhk', label: 'Daftar Master RHK', icon: ListChecks },
    { id: 'settings', label: 'Pengaturan', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 flex flex-col flex-shrink-0 glass-strong border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={appSettings.appLogoUrl || 'https://jhlryjdhotxtndavacpd.supabase.co/storage/v1/object/public/logo/logo.png'}
              alt="Logo"
              className="w-9 h-9 object-contain"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h2 className="font-display font-extrabold text-sm sm:text-base gradient-text tracking-wide">
                E-KINERJA
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]" title={activeTeacher.schoolName}>
                {activeTeacher.schoolName || 'Satuan Pendidikan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 border-b border-white/10">
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
              {(activeTeacher.fullName || session.fullName).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate" title={activeTeacher.fullName}>
                {activeTeacher.fullName || session.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider truncate">
                  {activeTeacher.nip ? `NIP. ${activeTeacher.nip}` : 'Guru PAI'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
