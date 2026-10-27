const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronDesktop', {
  isElectron: true,
  platform: process.platform,
  appVersion: '1.0.0',
  regulation: 'Keputusan Kepala BKPDM Nomor 020 Tahun 2026 (Pendekatan KBC)'
});
