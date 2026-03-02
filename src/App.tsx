import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertCircle, LogOut } from 'lucide-react';
import { User, Barang, Transaksi, CartItem, OrderGroup, PendingSyncItem } from './types';
import { getInitialData, submitOrder as submitOrderApi, updateApproval as updateApprovalApi, updateMasterBarang as updateMasterBarangApi, updateTerimaBarang as updateTerimaBarangApi, updateSettings as updateSettingsApi } from './services/api';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { POS } from './components/POS';
import { HistoryView } from './components/HistoryView';
import { AdminApprovalView } from './components/AdminApprovalView';
import { DetailModal } from './components/DetailModal';
import { AdminTerimaBarangView } from './components/AdminTerimaBarangView';
import { AdminMasterBarangView } from './components/AdminMasterBarangView';
import { AdminPOView } from './components/AdminPOView';
import { AdminReportView } from './components/AdminReportView';
import { AdminMonitoringView } from './components/AdminMonitoringView';
import { AdminSettingsView } from './components/AdminSettingsView';

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isEditing, setIsEditing] = useState<string | false>(false);
  const [originalItemIds, setOriginalItemIds] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderGroup | null>(null);
  const [pendingSync, setPendingSync] = useState<PendingSyncItem[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRequestEnabled, setIsRequestEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('elog_request_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Optimistic UI: Merge server data with pending local changes
  const displayTransaksi = React.useMemo(() => {
    let result = [...transaksi];
    
    // Sort pending sync by timestamp to apply in order
    const sortedSync = [...pendingSync].sort((a, b) => a.timestamp - b.timestamp);

    sortedSync.forEach(item => {
      if (item.type === 'submitOrder') {
        const { data, isUpdate, idOrder } = item.payload;
        if (isUpdate) {
          // Remove old items of this order
          result = result.filter(t => t.Idorder !== idOrder);
        }
        // Add new/updated items
        result = [...result, ...data];
      } else if (item.type === 'updateApproval') {
        const { iddetil, status, jmlAcc, totalAcc } = item.payload;
        result = result.map(t => t.iddetil === iddetil ? { 
          ...t, 
          ACC: status, 
          Qty: jmlAcc, 
          Subtotal: totalAcc 
        } : t);
      } else if (item.type === 'updateTerimaBarang') {
        const { iddetil, sesuai, jmlTerima, tanggalTerima } = item.payload;
        result = result.map(t => t.iddetil === iddetil ? { 
          ...t, 
          TerimaBarang: sesuai, 
          JmlTerima: jmlTerima, 
          TanggalTerima: tanggalTerima 
        } : t);
      }
    });

    return result;
  }, [transaksi, pendingSync]);

  const displayBarang = React.useMemo(() => {
    let result = [...barang];
    const sortedSync = [...pendingSync].sort((a, b) => a.timestamp - b.timestamp);

    sortedSync.forEach(item => {
      if (item.type === 'updateMasterBarang') {
        const payload = item.payload;
        const id = payload.id || payload.iddetil;
        const exists = result.findIndex(b => (b.id || b.iddetil) === id);
        if (exists !== -1) {
          result[exists] = { ...result[exists], ...payload };
        }
      }
    });
    return result;
  }, [barang, pendingSync]);

  // Load pending sync from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('elog_pending_sync');
    if (saved) {
      try {
        setPendingSync(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse pending sync', e);
      }
    }
  }, []);

  // Save pending sync to localStorage
  useEffect(() => {
    localStorage.setItem('elog_pending_sync', JSON.stringify(pendingSync));
  }, [pendingSync]);

  useEffect(() => {
    localStorage.setItem('elog_request_enabled', JSON.stringify(isRequestEnabled));
  }, [isRequestEnabled]);

  const fetchData = useCallback(async () => {
    const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbw_GYS3ifWnNnsEaCLpyGAlpms5T7Z4w7Wx78ollsEmPSdtQhdFmmrrkS4HgQMw-X0OQQ/exec';
    
    // Check if API_URL in api.ts is still the default one
    // We can't easily check the variable from here, but we can check if the request fails
    
    setLoading(true);
    try {
      const data = await getInitialData();
      setBarang(data.barang || []);
      setUserList(data.user || []);
      setTransaksi(data.transaksi || []);
      
      // Update settings from server if available
      if (data.settings) {
        const reqEnabled = data.settings.find((s: any) => s.key === 'isRequestEnabled');
        if (reqEnabled) {
          setIsRequestEnabled(reqEnabled.value === 'true' || reqEnabled.value === true);
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const data = await getInitialData();
      const foundUser = data.user.find(
        (x: User) => String(x.Username).toLowerCase() === username.toLowerCase() && String(x.Password) === pass
      );
      if (foundUser) {
        setUser(foundUser);
        setBarang(data.barang || []);
        setUserList(data.user || []);
        setTransaksi(data.transaksi || []);
        setShowGreeting(true);
        const isAdmin = foundUser.Role.toLowerCase() === 'admin';
        const initialView = isAdmin || isRequestEnabled ? 'pos' : 'history';
        setView(initialView);
      } else {
        setError('Username atau Password salah');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: Barang) => {
    const exists = cart.find((c) => c.NamaBarang === item.NamaBarang);
    if (exists) {
      setCart(cart.map((c) => (c.iddetil === exists.iddetil ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          ...item,
          qty: 1,
          iddetil: 'DTL-' + Math.random().toString(36).substr(2, 9),
        },
      ]);
    }
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => (c.iddetil === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleSetManualQty = (id: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      setCart(
        cart
          .map((c) => (c.iddetil === id ? { ...c, qty: num } : c))
          .filter((c) => c.qty > 0)
      );
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((c) => c.iddetil !== id));
  };

  const handleSubmitOrder = async () => {
    if (!user || cart.length === 0) return;
    
    const idOrder = isEditing ? (isEditing as string) : 'ORD-' + Math.floor(Date.now() / 1000);
    let tanggal = new Date().toLocaleDateString('id-ID');
    let unit = user.Unit;

    if (isEditing) {
      const originalGroup = groupTransactions(displayTransaksi).find(g => g.id === isEditing);
      if (originalGroup) {
        tanggal = originalGroup.tanggal;
        unit = originalGroup.unit;
      }
    }

    const currentItemIds = cart.map((c) => String(c.iddetil || ''));
    const deletedItemIds = isEditing ? originalItemIds.map(id => String(id)).filter((id) => !currentItemIds.includes(id)) : [];

    const orderData = cart.map((c) => ({
      iddetil: c.iddetil,
      Idorder: idOrder,
      Tanggal: tanggal,
      Unit: unit,
      NamaBarang: c.NamaBarang,
      Harga: c.Harga,
      Qty: c.qty,
      Subtotal: c.Harga * c.qty,
      Vendor: c.Vendor || '-',
      ACC: isEditing ? 'Pending' : 'Pending',
    }));

    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'submitOrder',
      payload: { data: orderData, isUpdate: !!isEditing, deletedIds: deletedItemIds, idOrder },
      timestamp: Date.now(),
      description: `Pesanan ${idOrder} (${cart.length} item)`
    };

    setPendingSync([...pendingSync, newItem]);
    setCart([]);
    setIsEditing(false);
    setOriginalItemIds([]);
    setView(user.Role.toLowerCase() === 'admin' ? 'admin_all_history' : 'history');
  };

  const handleEditOrder = (idOrder: string) => {
    const group = groupTransactions(displayTransaksi).find((g) => g.id === idOrder);
    if (!group) return;
    setOriginalItemIds(group.items.map((i) => i.iddetil));
    setCart(
      group.items.map((item) => ({
        iddetil: item.iddetil,
        NamaBarang: item.NamaBarang,
        Harga: parseFloat(item.Harga as any),
        qty: parseFloat(item.Qty as any),
        Vendor: item.Vendor,
      }))
    );
    setIsEditing(group.id);
    setView('pos');
    setDetailOrder(null);
  };

  const handleCancelEdit = () => {
    setCart([]);
    setIsEditing(false);
    setOriginalItemIds([]);
    setView(user?.Role.toLowerCase() === 'admin' ? 'admin_all_history' : 'history');
  };

  const handleApproval = (idOrder: string, status: string) => {
    const group = groupTransactions(displayTransaksi).find((g) => g.id === idOrder);
    if (!group) return;

    const newItems: PendingSyncItem[] = group.items.map(item => ({
      id: 'SYNC-' + Math.random().toString(36).substr(2, 9),
      type: 'updateApproval',
      payload: {
        iddetil: item.iddetil,
        status,
        jmlAcc: status === 'APPROVED' ? item.Qty : 0,
        totalAcc: status === 'APPROVED' ? item.Subtotal : 0
      },
      timestamp: Date.now(),
      description: `${status} Item: ${item.NamaBarang}`
    }));

    setPendingSync([...pendingSync, ...newItems]);
    setDetailOrder(null);
  };

  const handleUpdateTerima = async (idOrder: string, items: { iddetil: string; sesuai: string; jmlTerima: number }[]) => {
    const newItems: PendingSyncItem[] = items.map(item => ({
      id: 'SYNC-' + Math.random().toString(36).substr(2, 9),
      type: 'updateTerimaBarang',
      payload: {
        iddetil: item.iddetil,
        sesuai: item.sesuai,
        jmlTerima: item.jmlTerima,
        tanggalTerima: new Date().toLocaleDateString('id-ID'),
      },
      timestamp: Date.now(),
      description: `Terima Item ID: ${item.iddetil}`
    }));

    setPendingSync([...pendingSync, ...newItems]);
  };

  const handleSaveMaster = async (payload: any) => {
    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'updateMasterBarang',
      payload,
      timestamp: Date.now(),
      description: `Update Master: ${payload.NamaBarang}`
    };
    setPendingSync([...pendingSync, newItem]);
  };

  const handleToggleRequest = (enabled: boolean) => {
    setIsRequestEnabled(enabled);
    const newItem: PendingSyncItem = {
      id: 'SYNC-' + Date.now(),
      type: 'updateSettings',
      payload: { key: 'isRequestEnabled', value: enabled },
      timestamp: Date.now(),
      description: `Update Pengaturan: Menu Permintaan ${enabled ? 'ON' : 'OFF'}`
    };
    setPendingSync([...pendingSync, newItem]);
  };

  const handleSyncAll = async () => {
    if (pendingSync.length === 0) return;
    setLoading(true);
    setError(null);
    
    const items = [...pendingSync];
    const failed: PendingSyncItem[] = [];

    for (const item of items) {
      try {
        if (item.type === 'submitOrder') {
          await submitOrderApi(item.payload.data, item.payload.isUpdate, item.payload.deletedIds, item.payload.idOrder);
        } else if (item.type === 'updateApproval') {
          await updateApprovalApi(item.payload.iddetil, item.payload.status, item.payload.jmlAcc, item.payload.totalAcc);
        } else if (item.type === 'updateTerimaBarang') {
          await updateTerimaBarangApi(item.payload);
        } else if (item.type === 'updateMasterBarang') {
          await updateMasterBarangApi(item.payload);
        } else if (item.type === 'updateSettings') {
          await updateSettingsApi(item.payload);
        }
      } catch (err) {
        console.error('Sync failed for item:', item, err);
        failed.push(item);
      }
    }

    setPendingSync(failed);
    if (failed.length > 0) {
      setError(`${failed.length} item gagal disinkronisasi. Silakan coba lagi.`);
    } else {
      await fetchData();
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setUser(null);
    setView('login');
    setCart([]);
    setShowLogoutConfirm(false);
  };

  const groupTransactions = (items: Transaksi[]): OrderGroup[] => {
    const groups: { [key: string]: OrderGroup } = {};
    items.forEach((t) => {
      if (!groups[t.Idorder]) {
        groups[t.Idorder] = {
          id: t.Idorder,
          tanggal: t.Tanggal,
          unit: t.Unit,
          status: t.ACC || 'Pending',
          items: [],
          total: 0,
        };
      }
      groups[t.Idorder].items.push(t);
      groups[t.Idorder].total += parseFloat(t.Subtotal as any) || 0;
    });
    return Object.values(groups).reverse();
  };

  if (view === 'login' || !user) {
    return (
      <>
        <Login onLogin={handleLogin} loading={loading} />
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-5 right-5 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col border-l-4 border-red-500"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-2">
                <AlertCircle size={12} /> System Alert
              </p>
              <p className="text-xs font-medium leading-tight">{error}</p>
              <button onClick={() => setError(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 space-y-6"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="text-blue-600" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic">
                  Assalamualaikum
                </h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.Unit}</p>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                Silakan lengkapi data permintaan logistik Anda dengan teliti agar operasional unit tetap berjalan optimal.
              </p>
              <button
                onClick={() => {
                  setShowGreeting(false);
                  const isAdmin = user.Role.toLowerCase() === 'admin';
                  if (!isAdmin && !isRequestEnabled) {
                    setView('history');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] tracking-[0.2em] uppercase transition-all"
              >
                {user.Role.toLowerCase() === 'admin' || isRequestEnabled ? 'MULAI PERMINTAAN' : 'LIHAT RIWAYAT'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar 
        user={user} 
        currentView={view} 
        onViewChange={setView} 
        onLogout={handleLogout} 
        pendingSyncCount={pendingSync.length}
        onSync={handleSyncAll}
        syncLoading={loading}
        isRequestEnabled={isRequestEnabled}
      />

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6">
        {loading && barang.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 no-print">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Database...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {view === 'pos' && (
              user.Role.toLowerCase() === 'admin' || isRequestEnabled ? (
                <POS
                  barang={displayBarang}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQty={handleUpdateQty}
                  onSetManualQty={handleSetManualQty}
                  onRemoveFromCart={handleRemoveFromCart}
                  onSubmitOrder={handleSubmitOrder}
                  onCancelEdit={handleCancelEdit}
                  isEditing={isEditing}
                  loading={loading}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 w-full">
                  <div className="bg-amber-50 p-12 md:p-20 rounded-[3rem] border border-amber-100 w-full shadow-2xl shadow-amber-500/10">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-10">
                      <AlertCircle className="text-amber-600" size={48} />
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight mb-8 italic">
                      Akses Dibatasi Sementara
                    </h3>
                    <p className="font-black text-slate-700 leading-tight w-full text-balance" style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      UPPPS, Mohon maaf belum dapat melakukan input permintaan logistik,<br />
                      Menu input permintaan logistik akan muncul sesuai dengan jadwal input oleh Admin Pengadaan
                    </p>
                  </div>
                  <button 
                    onClick={() => setView('history')}
                    className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] hover:underline bg-blue-50 px-8 py-4 rounded-2xl transition-all"
                  >
                    Lihat Riwayat Unit
                  </button>
                </div>
              )
            )}
            {view === 'history' && (
              <HistoryView
                transaksi={displayTransaksi}
                unit={user.Unit}
                onEditOrder={handleEditOrder}
                onViewDetail={setDetailOrder}
                isRequestEnabled={isRequestEnabled}
                isAdmin={user.Role.toLowerCase() === 'admin'}
              />
            )}
            {view === 'admin_approval' && (
              <AdminApprovalView transaksi={displayTransaksi} onProcess={setDetailOrder} />
            )}
            {view === 'admin_terima_barang' && (
              <AdminTerimaBarangView
                transaksi={displayTransaksi}
                onUpdateTerima={handleUpdateTerima}
                loading={loading}
              />
            )}
            {view === 'admin_master_barang' && (
              <AdminMasterBarangView barang={displayBarang} onSave={handleSaveMaster} loading={loading} />
            )}
            {view === 'admin_po' && <AdminPOView transaksi={displayTransaksi} barang={displayBarang} />}
            {view === 'admin_report' && <AdminReportView transaksi={displayTransaksi} users={userList} barang={displayBarang} />}
            {view === 'admin_all_history' && (
              <AdminMonitoringView
                transaksi={displayTransaksi}
                onEditOrder={handleEditOrder}
                onViewDetail={setDetailOrder}
              />
            )}
            {view === 'admin_settings' && (
              <AdminSettingsView 
                isRequestEnabled={isRequestEnabled} 
                onToggleRequest={handleToggleRequest} 
              />
            )}
          </motion.div>
        )}
      </main>

      <DetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        group={detailOrder}
        isAdmin={user.Role.toLowerCase() === 'admin'}
        onApprove={(id) => handleApproval(id, 'APPROVED')}
        onReject={(id) => handleApproval(id, 'TOLAK')}
        loading={loading}
      />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="text-red-600" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic">
                  Konfirmasi Keluar
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Apakah Anda yakin ingin keluar dari aplikasi?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  BATAL
                </button>
                <button
                  onClick={confirmLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  YA, KELUAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-5 right-5 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col border-l-4 border-red-500"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-2">
              <AlertCircle size={12} /> System Alert
            </p>
            <p className="text-xs font-medium leading-tight">{error}</p>
            <button onClick={() => setError(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-6 text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] no-print">
        E-LOG RSDI &copy; 2026
      </footer>
    </div>
  );
}
