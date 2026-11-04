import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Settings,
  ClipboardCheck,
  ListChecks,
  BookOpen,
  LogOut,
  X,
  ChevronRight
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 flex flex-col flex-shrink-0 bg-white border-r-2 border-emerald-500 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header (Mint Green Box matching reference image) */}
        <div className="p-4 sm:p-5 bg-[#a7f3d0] border-b-2 border-emerald-600 flex items-center justify-between">
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
              <h2 className="font-display font-black text-sm sm:text-base text-slate-950 tracking-wide uppercase">
                E-KINERJA GURU PAI
              </h2>
              <p className="text-xs text-slate-900 font-bold truncate max-w-[160px]" title={activeTeacher.schoolName}>
                {activeTeacher.schoolName || 'SDN Ciketing Udik 2'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-900 hover:text-slate-950 rounded-lg hover:bg-emerald-300/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 border-b border-emerald-300">
          <div
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            className="bg-white rounded-xl p-3 flex items-center justify-between gap-2.5 border-2 border-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-black text-slate-950 truncate" title={activeTeacher.fullName}>
                {activeTeacher.fullName || session.fullName}
              </p>
              <p className="text-xs text-slate-900 font-bold truncate mt-0.5">
                {activeTeacher.jabatan || 'Guru PAI'} &bull; <span className="underline font-extrabold text-[#064e3b]">Ganti</span>
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-900 shrink-0" />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#065f46] text-white shadow-sm'
                    : 'text-slate-950 hover:bg-[#d1fae5] hover:text-[#064e3b]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#064e3b]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-emerald-300">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-600 text-rose-950 text-xs font-extrabold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-900" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
