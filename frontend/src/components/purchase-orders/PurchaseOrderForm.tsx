import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Send, LoaderCircle } from 'lucide-react';
import { AlertBanner } from '../common';
import { apiClient } from '../../services/apiClient';
import type { Drug, PageResult, Supplier } from '../../types';
import { fieldClass, money, primaryButton, secondaryButton } from './PurchaseOrderUi';

type Line = { drugId: string; quantity: number; estimatedUnitPrice: number; notes: string };
export interface OrderDraft { supplierId: string; notes: string | null; expectedDeliveryDate: string | null; items: Line[] }

export function PurchaseOrderForm({ busy, error, onSave, onCancel }: {
  busy: boolean; error: string; onSave: (draft: OrderDraft) => void; onCancel: () => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [validation, setValidation] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ drugId: '', quantity: 1, estimatedUnitPrice: 1000, notes: '' }]);
  useEffect(() => {
    const abort = new AbortController();
    async function catalogs() {
      try {
        const partners = await apiClient<Supplier[]>('/suppliers', { signal: abort.signal });
        const all: Drug[] = [];
        let page = 1, totalPages = 1;
        do {
          const result = await apiClient<PageResult<Drug>>(`/drugs?page=${page}&pageSize=100`, { signal: abort.signal });
          all.push(...result.items.filter(d => d.isActive)); totalPages = result.totalPages; page++;
        } while (page <= totalPages);
        if (!abort.signal.aborted) { setSuppliers(partners.filter(s => s.isActive)); setDrugs(all); }
      } catch (e) { if (!abort.signal.aborted) setCatalogError(e instanceof Error ? e.message : 'Không tải được danh mục.'); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }
    void catalogs(); return () => abort.abort();
  }, []);
  const total = lines.reduce((sum, line) => sum + line.quantity * line.estimatedUnitPrice, 0);
  function submit(e: FormEvent) {
    e.preventDefault(); setValidation('');
    if (!supplierId || lines.some(l => !l.drugId || !Number.isInteger(l.quantity) || l.quantity <= 0 || !Number.isSafeInteger(l.estimatedUnitPrice) || l.estimatedUnitPrice < 1000 || l.estimatedUnitPrice > 9_999_999_999_999)) { setValidation('Chọn nhà cung cấp, thuốc, số lượng nguyên dương và đơn giá nguyên từ 1.000đ.'); return; }
    if (new Set(lines.map(l => l.drugId)).size !== lines.length) { setValidation('Mỗi thuốc chỉ xuất hiện một lần trong đơn mua.'); return; }
    if (new TextEncoder().encode(notes.trim()).length > 500) { setValidation('Ghi chú vượt giới hạn 500 byte. Vui lòng rút ngắn nội dung.'); return; }
    onSave({ supplierId, expectedDeliveryDate: expected || null, notes: notes.trim() || null, items: lines });
  }
  function change(index: number, value: Partial<Line>) { setLines(old => old.map((line, i) => i === index ? { ...line, ...value } : line)); }
  return <form onSubmit={submit} className="space-y-5" aria-label="Tạo đơn mua">
    <AlertBanner message={error || validation || catalogError} />
    {loading && <p role="status" className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={16} className="animate-spin" />Đang tải danh mục thuốc và nhà cung cấp…</p>}
    <fieldset disabled={busy || loading || !!catalogError} className="min-w-0 space-y-5 disabled:opacity-60">
      <div><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">1. Nhà cung cấp & giao hàng</h3><div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Nhà cung cấp <span className="text-rose-600">*</span><select aria-label="Nhà cung cấp" required className={fieldClass} value={supplierId} onChange={e => setSupplierId(e.target.value)}><option value="">Chọn nhà cung cấp</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-700">Ngày giao dự kiến<input aria-label="Ngày giao dự kiến" type="date" className={fieldClass} value={expected} onChange={e => setExpected(e.target.value)} /></label>
      </div></div>
      <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Thuốc cần đặt mua</h3><span className="text-xs text-slate-400">{lines.length} / 100 mặt hàng</span></div><div className="space-y-3">
        {lines.map((line, i) => <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"><div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="min-w-0 text-xs font-semibold text-slate-600">Thuốc {i + 1}<select aria-label={`Thuốc ${i + 1}`} required className={fieldClass} value={line.drugId} onChange={e => change(i, { drugId: e.target.value })}><option value="">Chọn thuốc</option>{drugs.map(d => <option key={d.drugId} value={d.drugId}>{d.name} · {d.drugCode}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Số lượng<input aria-label={`Số lượng ${i + 1}`} required type="number" min="1" step="1" className={fieldClass} value={line.quantity} onChange={e => change(i, { quantity: Number(e.target.value) })} /></label>
          <label className="text-xs font-semibold text-slate-600">Đơn giá dự kiến (đ)<span className="mt-1.5 flex items-stretch"><button type="button" aria-label={`Giảm giá dự kiến ${i + 1}`} className="rounded-l-lg border border-r-0 border-slate-200 px-2 hover:bg-slate-100" onClick={() => change(i, { estimatedUnitPrice: Math.max(1000, line.estimatedUnitPrice - 1000) })}>−</button><input aria-label={`Giá dự kiến ${i + 1}`} required type="number" min="1000" max="9999999999999" step="1" className={`${fieldClass} !mt-0 rounded-none`} value={line.estimatedUnitPrice} onChange={e => change(i, { estimatedUnitPrice: Number(e.target.value) })} /><button type="button" aria-label={`Tăng giá dự kiến ${i + 1}`} className="rounded-r-lg border border-l-0 border-slate-200 px-2 hover:bg-slate-100" onClick={() => change(i, { estimatedUnitPrice: Math.min(9_999_999_999_999, line.estimatedUnitPrice + 1000) })}>+</button></span></label>
          <button type="button" className="mb-1 justify-self-end rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30" aria-label={`Bỏ thuốc ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines(old => old.filter((_, n) => n !== i))}><Trash2 size={16} /></button>
        </div><p className="mt-2 text-right text-xs text-slate-500">Thành tiền: <strong className="text-ink">{money(line.quantity * line.estimatedUnitPrice)}</strong></p></div>)}
      </div><button type="button" className={`${secondaryButton} mt-3`} disabled={lines.length >= 100} onClick={() => setLines(old => [...old, { drugId: '', quantity: 1, estimatedUnitPrice: 1000, notes: '' }])}><Plus size={14} />Thêm thuốc</button></div>
      <label className="block text-xs font-semibold text-slate-700">3. Ghi chú yêu cầu<textarea aria-label="Ghi chú đơn mua" className={fieldClass} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thông tin bổ sung cho người duyệt và nhà cung cấp" /></label>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/15 bg-mint/50 p-4"><div><p className="text-xs text-slate-600">Tổng chi phí dự kiến</p><strong className="font-display text-xl text-forest">{money(total)}</strong></div><p className="max-w-xs text-xs leading-relaxed text-slate-500">Gửi yêu cầu để Chủ nhà thuốc xem xét. Chưa đặt hàng, nhập kho hoặc thanh toán.</p></div>
    </fieldset>
    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondaryButton} disabled={busy} onClick={onCancel}>Hủy</button><button type="submit" className={primaryButton} disabled={busy || loading || !!catalogError}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}{busy ? 'Đang gửi…' : 'Gửi chờ duyệt'}</button></div>
  </form>;
}
