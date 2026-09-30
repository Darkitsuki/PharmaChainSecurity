import { useEffect, useState } from 'react';
import { Boxes, LoaderCircle, Search } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Drug, InventoryRow, PageResult } from '../types';

export function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [drugNames, setDrugNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiClient<PageResult<InventoryRow>>('/inventory?page=1&pageSize=100'),
      apiClient<PageResult<Drug>>('/drugs?page=1&pageSize=100'),
    ])
      .then(([inventory, drugs]) => {
        if (!active) return;
        setRows(inventory.items);
        setDrugNames(Object.fromEntries(drugs.items.map((drug) => [drug.drugId, drug.name])));
      })
      .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Could not load branch inventory.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || `${drugNames[row.drugId] ?? ''} ${row.drugId} ${row.batchId}`.toLocaleLowerCase().includes(query);
  });
  const totalUnits = rows.reduce((sum, row) => sum + row.quantity, 0);
  const lowStockRows = rows.filter((row) => row.quantity <= 10).length;

  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Branch stock</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Inventory</h1><p className="mt-1.5 text-sm text-slate-500">On-hand quantities by medicine and batch.</p></div>
        <label className="relative block w-full sm:w-[280px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine or batch" className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none" /></label>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-4 py-4"><span className="grid h-9 w-9 place-items-center rounded-md bg-mint text-forest"><Boxes size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Tracked units</p><p className="mt-1 font-mono text-lg font-semibold text-ink">{totalUnits.toLocaleString()}</p></div></div>
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-4 py-4"><span className={`grid h-9 w-9 place-items-center rounded-md ${lowStockRows ? 'bg-amber-50 text-amber-700' : 'bg-[#f3f6f4] text-slate-500'}`}><span className="font-mono text-xs font-bold">{lowStockRows}</span></span><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Low stock batches</p><p className="mt-1 text-xs text-slate-600">At or below 10 units</p></div></div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      <section className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-sm font-extrabold text-ink">Stock by batch</h2><span className="text-[11px] text-slate-500">{filteredRows.length} rows</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead><tr className="bg-[#f8faf9] text-[10px] uppercase tracking-[0.1em] text-slate-500"><th className="px-5 py-3 font-bold">Medicine</th><th className="px-4 py-3 font-bold">Drug ID</th><th className="px-4 py-3 font-bold">Batch ID</th><th className="px-5 py-3 text-right font-bold">On hand</th></tr></thead>
            <tbody className="divide-y divide-line">
              {loading ? <tr><td colSpan={4} className="h-36 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Loading inventory</span></td></tr> : !filteredRows.length ? <tr><td colSpan={4} className="h-36 text-center text-sm text-slate-500">{rows.length ? 'No rows match your search.' : 'No inventory records found.'}</td></tr> : filteredRows.map((row) => (
                <tr key={`${row.drugId}-${row.batchId}`} className="hover:bg-[#fbfcfb]"><td className="px-5 py-4 text-xs font-bold text-ink">{drugNames[row.drugId] ?? 'Unknown medicine'}</td><td className="px-4 py-4 font-mono text-[10px] text-slate-500">{row.drugId}</td><td className="px-4 py-4 font-mono text-[10px] text-slate-500">{row.batchId}</td><td className="px-5 py-4 text-right"><span className={`inline-flex min-w-12 justify-center rounded px-2 py-1 font-mono text-xs font-semibold ${row.quantity <= 10 ? 'bg-amber-50 text-amber-800' : 'bg-[#f0f7f3] text-forest'}`}>{row.quantity}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
