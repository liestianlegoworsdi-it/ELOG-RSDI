import React, { useState } from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Transaksi, OrderGroup } from '../types';

interface AdminMonitoringViewProps {
  transaksi: Transaksi[];
  onEditOrder: (idOrder: string) => void;
  onViewDetail: (group: OrderGroup) => void;
}

export const AdminMonitoringView: React.FC<AdminMonitoringViewProps> = ({ transaksi, onEditOrder, onViewDetail }) => {
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
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Monitoring Logistik</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white shadow text-amber-600' : 'text-slate-500'
            }`}
          >
            Proses
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'approved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Approved
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[650px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Unit</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ID Order</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 italic">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              groups.map((g, idx) => (
                <tr key={g.id || `mon-${idx}`}>
                  <td className="px-6 py-4 text-[10px] font-black uppercase italic">{g.unit}</td>
                  <td className="px-6 py-4 font-black text-slate-800 text-[10px]">{g.id}</td>
                  <td className="px-6 py-4 text-[10px] font-black text-right">
                    Rp {g.total.toLocaleString('id-ID')}
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
