import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import { StorageService } from './services/storageService';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LoginView } from './components/LoginView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Admin Components (4 Selected Views)
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfileAndSettingsView } from './components/admin/ProfileAndSettingsView';
import { EKinerjaHarianView } from './components/admin/EKinerjaHarianView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(StorageService.getSession());
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cloudSyncRevision, setCloudSyncRevision] = useState(0);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Automatic Offline-First IndexedDB cache & Supabase cloud sync engine
  useEffect(() => {
    const cleanup = StorageService.initOfflineSyncEngine(showToast);
    return cleanup;
  }, []);

  // Re-render mounted views when cloud data is pulled or synced across browsers/devices
  useEffect(() => {
    const handleCloudSynced = () => {
      setCloudSyncRevision(prev => prev + 1);
      setSession(prevSession => {
        if (!prevSession) return prevSession;
        const prof = StorageService.getTeacherProfile();
        return { ...prevSession, fullName: prof.fullName };
      });
    };
    window.addEventListener('lms-cloud-synced', handleCloudSynced);
    return () => window.removeEventListener('lms-cloud-synced', handleCloudSynced);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = () => {
    StorageService.clearSession();
    setSession(null);
    setCurrentView('dashboard');
    showToast('Anda telah keluar dari aplikasi', 'info');
  };

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setCurrentView('dashboard');
  };

  // Dynamic header titles based on 4 allowed views
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Dashboard Utama',
          subtitle: 'Ringkasan Kinerja Pendidik PAI, Kalender Akademik & E-Kinerja SDN Ciketing Udik 2'
        };
      case 'profile':
        return {
          title: 'Profil Guru PAI',
          subtitle: 'Identitas pendidik, NIP, pangkat/golongan, dan informasi satuan pendidikan'
        };
      case 'e-kinerja':
        return {
          title: 'E-Kinerja Harian Pegawai / Guru PAI',
          subtitle: 'Identitas otomatis, periode bulan & tahun, RKH, Rencana Aksi, Tindak Lanjut & Multi-Foto'
        };
      case 'master-rhk':
        return {
          title: 'Bank Master RHK, Rencana Aksi & Tindak Lanjut',
          subtitle: 'Katalog acuan RHK dan rencana aksi kinerja guru yang bisa dipilih dan disesuaikan'
        };
      case 'settings':
        return {
          title: 'Pengaturan Sistem & Profil',
          subtitle: 'Profil Instansi, Cadangan & Sinkronisasi Sistem'
        };
      default:
        return {
          title: 'E-KINERJA SDN Ciketing Udik 2',
          subtitle: 'Aplikasi E-Kinerja Harian Pegawai & Guru'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  if (!session) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LoginView key={cloudSyncRevision} onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden w-full relative bg-slate-950 text-slate-100">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <OfflineIndicator />

      {/* Main Sidebar */}
      <Sidebar
        session={session}
        currentView={currentView}
        onNavigate={view => setCurrentView(view)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        <Header
          session={session}
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showToast={showToast}
        />

        <main key={cloudSyncRevision} className="flex-1 overflow-y-auto p-4 sm:p-6 w-full scrollbar-thin">
          {currentView === 'dashboard' && (
            <AdminDashboard
              onNavigate={view => setCurrentView(view)}
              showToast={showToast}
            />
          )}
          {currentView === 'profile' && (
            <ProfileAndSettingsView
              mode="profile"
              showToast={showToast}
              onProfileUpdated={newName => {
                setSession({ ...session, fullName: newName });
              }}
            />
          )}
          {currentView === 'e-kinerja' && (
            <EKinerjaHarianView
              initialTab="harian"
              showToast={showToast}
              onProfileUpdated={newName => {
                setSession({ ...session, fullName: newName });
              }}
            />
          )}
          {currentView === 'master-rhk' && (
            <EKinerjaHarianView
              initialTab="master_rhk"
              showToast={showToast}
              onProfileUpdated={newName => {
                setSession({ ...session, fullName: newName });
              }}
            />
          )}
          {currentView === 'settings' && (
            <ProfileAndSettingsView mode="settings" showToast={showToast} />
          )}
          {!['dashboard', 'profile', 'e-kinerja', 'master-rhk', 'settings'].includes(currentView) && (
            <AdminDashboard
              onNavigate={view => setCurrentView(view)}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
