import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Transaksi, OrderGroup } from '../types';

interface AdminTerimaBarangViewProps {
  transaksi: Transaksi[];
  onUpdateTerima: (idOrder: string, items: { iddetil: string; sesuai: string; jmlTerima: number }[]) => Promise<void>;
  loading: boolean;
}

export const AdminTerimaBarangView: React.FC<AdminTerimaBarangViewProps> = ({ transaksi, onUpdateTerima, loading }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [terimaData, setTerimaData] = useState<{ [key: string]: { sesuai: string; jmlTerima: number } }>({});

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

  // Filter approved orders that haven't been received yet
  const openApproved = transaksi.filter((t) => t.ACC === 'APPROVED' && !t.TerimaBarang);
  const groups = groupTransactions(openApproved);

  const handleUpdateInput = (iddetil: string, key: 'sesuai' | 'jmlTerima', val: any) => {
    const current = terimaData[iddetil] || { sesuai: 'YA', jmlTerima: 0 };
    const trans = transaksi.find(t => t.iddetil === iddetil);
    
    const newData = { ...current, [key]: val };
    if (key === 'sesuai' && val === 'YA' && trans) {
      newData.jmlTerima = trans.Qty;
    }
    
    setTerimaData({ ...terimaData, [iddetil]: newData });
  };

  const handleSubmit = async (idOrder: string) => {
    const group = groups.find(g => g.id === idOrder);
    if (!group) return;

    const itemsToSubmit = group.items.map(item => {
      const data = terimaData[item.iddetil] || { sesuai: 'YA', jmlTerima: item.Qty };
      return {
        iddetil: item.iddetil,
        sesuai: data.sesuai,
        jmlTerima: data.jmlTerima
      };
    });

    await onUpdateTerima(idOrder, itemsToSubmit);
    setExpandedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">
          Penerimaan Barang per Pengajuan
        </h2>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-[1.5rem] p-20 border border-dashed border-slate-200 text-center">
          <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest">
            Tidak ada pengajuan yang siap diterima
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groups.map((g) => {
            const isExpanded = expandedOrder === g.id;
            return (
              <div
                key={g.id}
                className={`bg-white rounded-2xl border ${
                  isExpanded ? 'border-blue-500 shadow-lg ring-1 ring-blue-500/20' : 'border-slate-200'
                } overflow-hidden transition-all duration-300`}
              >
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : g.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase italic leading-none">{g.unit}</p>
                      <h4 className="text-sm font-black text-slate-800 mt-1 uppercase">{g.id}</h4>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Pesan</p>
                      <p className="text-[10px] font-black text-slate-600 uppercase">{g.tanggal}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Item</p>
                      <p className="text-[10px] font-black text-slate-600 uppercase">{g.items.length} ITEM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`bg-slate-100 text-slate-500 p-2 rounded-lg transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">Barang</th>
                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center w-24">
                              Qty Acc
                            </th>
                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center w-32">
                              Sesuai?
                            </th>
                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center w-32">
                              Jml Terima
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                          {g.items.map((item) => {
                            const input = terimaData[item.iddetil] || { sesuai: 'YA', jmlTerima: item.Qty };
                            return (
                              <tr key={item.iddetil}>
                                <td className="px-6 py-4">
                                  <p className="text-[10px] font-black uppercase text-slate-800">
                                    {item.NamaBarang}
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                    {item.Vendor || '-'}
                                  </p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[10px]">
                                    {item.Qty}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center">
                                    <select
                                      value={input.sesuai}
                                      onChange={(e) => handleUpdateInput(item.iddetil, 'sesuai', e.target.value)}
                                      className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-2 ring-blue-500/20"
                                    >
                                      <option value="YA">YA</option>
                                      <option value="TIDAK">TIDAK</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="number"
                                      value={input.jmlTerima}
                                      readOnly={input.sesuai === 'YA'}
                                      onChange={(e) =>
                                        handleUpdateInput(item.iddetil, 'jmlTerima', parseInt(e.target.value))
                                      }
                                      className={`w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-black text-center outline-none ${
                                        input.sesuai === 'YA'
                                          ? 'bg-slate-50 text-slate-300'
                                          : 'focus:ring-2 ring-blue-500/20 text-blue-600 font-extrabold'
                                      }`}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => handleSubmit(g.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
                      >
                        {loading && <Loader2 className="animate-spin" size={12} />}
                        SIMPAN PENERIMAAN GROUP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
