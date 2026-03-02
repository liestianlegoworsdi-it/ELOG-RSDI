import React, { useState } from 'react';
import { Eye, Edit2, AlertCircle } from 'lucide-react';
import { Transaksi, OrderGroup } from '../types';

interface HistoryViewProps {
  transaksi: Transaksi[];
  unit: string;
  onEditOrder: (idOrder: string) => void;
  onViewDetail: (group: OrderGroup) => void;
  isRequestEnabled?: boolean;
  isAdmin?: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  transaksi, 
  unit, 
  onEditOrder, 
  onViewDetail,
  isRequestEnabled = true,
  isAdmin = false
}) => {
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

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

  const filteredTransaksi = transaksi.filter(
    (t) => String(t.Unit).toLowerCase() === unit.toLowerCase() && (t.ACC || 'Pending').toLowerCase() === tab
  );

  const groups = groupTransactions(filteredTransaksi);

  return (
    <div className="space-y-6">
      {!isAdmin && !isRequestEnabled && (
        <div className="bg-amber-50 border border-amber-100 p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-xl shadow-amber-500/5 w-full text-center">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
            <AlertCircle size={32} />
          </div>
          <p className="font-black text-slate-700 leading-tight w-full text-balance" style={{ fontSize: 'clamp(1.2rem, 4vw, 3rem)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            UPPPS, Mohon maaf belum dapat melakukan input permintaan logistik,<br />
            Menu input permintaan logistik akan muncul sesuai dengan jadwal input oleh Admin Pengadaan
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Riwayat Unit</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white shadow text-amber-600' : 'text-slate-500'
            }`}
          >
            Menunggu
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'approved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Disetujui
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ID Order</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Tanggal</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Status</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 italic">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4 font-black text-blue-600 text-[10px]">{g.id}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{g.tanggal}</td>
                  <td className="px-6 py-4 text-[10px] font-black text-right">
                    Rp {g.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        g.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-4">
                      {g.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => onEditOrder(g.id)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onViewDetail(g)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
