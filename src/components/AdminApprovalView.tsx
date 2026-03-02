import React, { useState } from 'react';
import { Transaksi, OrderGroup } from '../types';

interface AdminApprovalViewProps {
  transaksi: Transaksi[];
  onProcess: (group: OrderGroup) => void;
}

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({ transaksi, onProcess }) => {
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

  const filteredTransaksi = transaksi.filter((t) => (t.ACC || 'Pending').toLowerCase() === tab);
  const groups = groupTransactions(filteredTransaksi);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Persetujuan Pesanan</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white shadow text-amber-600' : 'text-slate-500'
            }`}
          >
            Antrian
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'approved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Unit</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ID Order</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4 text-[10px] font-black uppercase italic">{g.unit}</td>
                  <td className="px-6 py-4 font-black text-blue-600 text-[10px]">{g.id}</td>
                  <td className="px-6 py-4 text-right text-[10px] font-black">
                    Rp {g.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onProcess(g)}
                      className="bg-slate-900 text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      PROSES
                    </button>
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
