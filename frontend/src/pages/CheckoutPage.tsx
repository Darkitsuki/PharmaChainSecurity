import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, LoaderCircle, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { CheckoutResponse, Drug, DrugBatch, PageResult } from '../types';

interface CartLine {
  drug: Drug;
  batch: DrugBatch;
  quantity: number;
}

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function CheckoutPage() {
  const [search, setSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [batches, setBatches] = useState<DrugBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(true);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<CheckoutResponse | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoadingDrugs(true);
      const query = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) query.set('search', search.trim());
      apiClient<PageResult<Drug>>(`/drugs?${query.toString()}`)
        .then((result) => { if (active) setDrugs(result.items); })
        .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.message : 'Could not load medicines.'); })
        .finally(() => { if (active) setIsLoadingDrugs(false); });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (!selectedDrug) {
      setBatches([]);
      setSelectedBatchId('');
      return;
    }
    let active = true;
    setIsLoadingBatches(true);
    setSelectedBatchId('');
    apiClient<DrugBatch[]>(`/drugs/${encodeURIComponent(selectedDrug.drugId)}/batches`)
      .then((result) => { if (active) setBatches(result); })
      .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.message : 'Could not load batches.'); })
      .finally(() => { if (active) setIsLoadingBatches(false); });
    return () => { active = false; };
  }, [selectedDrug]);

  const selectedBatch = batches.find((batch) => batch.batchId === selectedBatchId) ?? null;
  const total = cart.reduce((sum, line) => sum + line.drug.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function addToCart() {
    if (!selectedDrug || !selectedBatch || quantity < 1 || quantity > selectedBatch.stockQuantity) return;
    setError('');
    const existingIndex = cart.findIndex((line) => line.drug.drugId === selectedDrug.drugId && line.batch.batchId === selectedBatch.batchId);
    if (existingIndex >= 0 && cart[existingIndex].quantity + quantity > selectedBatch.stockQuantity) {
      setError('Requested quantity exceeds the selected batch stock.');
      return;
    }
    setCart(existingIndex < 0
      ? [...cart, { drug: selectedDrug, batch: selectedBatch, quantity }]
      : cart.map((line, index) => index === existingIndex ? { ...line, quantity: line.quantity + quantity } : line));
  }

  function updateQuantity(index: number, nextQuantity: number) {
    setCart((current) => current.flatMap((line, lineIndex) => {
      if (lineIndex !== index) return [line];
      if (nextQuantity <= 0) return [];
      if (nextQuantity > line.batch.stockQuantity) return [line];
      return [{ ...line, quantity: nextQuantity }];
    }));
  }

  async function submitCheckout() {
    if (!cart.length) return;
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiClient<CheckoutResponse>('/checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({ lines: cart.map(({ drug, batch, quantity: lineQuantity }) => ({ drugId: drug.drugId, batchId: batch.batchId, quantity: lineQuantity })) }),
      });
      setReceipt(response);
      setCart([]);
      idempotencyKey.current = crypto.randomUUID();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Checkout could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Sales desk</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Point of Sale</h1>
          <p className="mt-1.5 text-sm text-slate-500">Build an invoice from branch stock.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <ShoppingBag size={15} className="text-forest" /> {itemCount} units in cart
        </div>
      </div>

      {error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-extrabold text-ink">Medicine catalog <span className="ml-1 font-sans text-xs font-medium text-slate-400">{drugs.length}</span></h2>
            <label className="relative block w-full sm:w-[280px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine or code" className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none" />
            </label>
          </div>

          {isLoadingDrugs ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Loading catalog</div>
          ) : drugs.length ? (
            <div className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
              {drugs.map((drug) => (
                <button key={drug.drugId} onClick={() => setSelectedDrug(drug)} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-4 text-left last:border-b-0 hover:bg-[#f8faf9] sm:grid-cols-[minmax(0,1fr)_110px_90px] ${selectedDrug?.drugId === drug.drugId ? 'bg-[#f0f7f3]' : ''}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{drug.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">{drug.drugCode} · {drug.unit}{drug.activeIngredient ? ` · ${drug.activeIngredient}` : ''}</span>
                  </span>
                  <span className="hidden text-right text-xs font-semibold text-slate-600 sm:block">{drug.unit}</span>
                  <span className="text-right font-mono text-xs font-semibold text-forest">{money.format(drug.price)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-white px-5 py-12 text-center text-sm text-slate-500">No medicines match that search.</div>
          )}

          <div className="mt-5 grid gap-3 rounded-md border border-line bg-white p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Selected medicine</span>
              <span className="flex h-10 items-center truncate rounded-md bg-slate-50 px-3 text-xs font-semibold text-ink">{selectedDrug?.name ?? 'Choose from catalog'}</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Batch</span>
              <span className="relative block">
                <select disabled={!selectedDrug || isLoadingBatches} value={selectedBatchId} onChange={(event) => setSelectedBatchId(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-line bg-white px-3 pr-8 text-xs text-ink disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">{isLoadingBatches ? 'Loading…' : 'Select batch'}</option>
                  {batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.batchNo} · {batch.stockQuantity} available</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-slate-600">Quantity</span>
              <input type="number" min="1" max={selectedBatch?.stockQuantity ?? 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="h-10 w-full rounded-md border border-line px-3 text-xs text-ink" />
            </label>
            <button onClick={addToCart} disabled={!selectedDrug || !selectedBatch || quantity < 1 || quantity > (selectedBatch?.stockQuantity ?? 0)} className="flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-xs font-bold text-white hover:bg-forest disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /> Add</button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-md border border-line bg-white shadow-panel xl:sticky xl:top-[100px]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-extrabold text-ink">Current sale</h2>
            <span className="rounded bg-mint px-2 py-1 text-[10px] font-bold uppercase text-forest">{cart.length} lines</span>
          </div>
          <div className="max-h-[390px] min-h-[160px] divide-y divide-line overflow-auto px-5">
            {!cart.length ? (
              <div className="grid min-h-[160px] place-items-center text-center text-xs text-slate-400"><div><ShoppingBag className="mx-auto mb-2 text-slate-300" size={21} />Your cart is empty</div></div>
            ) : cart.map((line, index) => (
              <div key={`${line.drug.drugId}-${line.batch.batchId}`} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-xs font-bold text-ink">{line.drug.name}</p><p className="mt-1 truncate text-[10px] text-slate-500">{line.batch.batchNo} · {money.format(line.drug.price)} / {line.drug.unit}</p></div>
                  <button onClick={() => updateQuantity(index, 0)} aria-label={`Remove ${line.drug.name}`} className="text-slate-400 hover:text-rose-600"><X size={15} /></button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(index, line.quantity - 1)} className="grid h-7 w-7 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50" aria-label="Decrease quantity">−</button>
                    <span className="w-5 text-center font-mono text-xs font-semibold">{line.quantity}</span>
                    <button onClick={() => updateQuantity(index, line.quantity + 1)} disabled={line.quantity >= line.batch.stockQuantity} className="grid h-7 w-7 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Increase quantity">+</button>
                  </div>
                  <span className="font-mono text-xs font-semibold text-ink">{money.format(line.drug.price * line.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-line bg-[#fafcfb] px-5 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500"><span>Subtotal</span><span className="font-mono">{money.format(total)}</span></div>
            <div className="mt-3 flex items-end justify-between"><span className="text-sm font-bold text-ink">Total</span><span className="font-mono text-xl font-semibold text-forest">{money.format(total)}</span></div>
            <button onClick={submitCheckout} disabled={!cart.length || isSubmitting} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-coral text-sm font-bold text-white transition-colors hover:bg-[#bd5b3d] disabled:cursor-not-allowed disabled:opacity-40">
              {isSubmitting ? <><LoaderCircle size={16} className="animate-spin" /> Processing sale</> : <>Complete sale <Check size={16} /></>}
            </button>
          </div>
        </aside>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReceipt(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="animate-enter w-full max-w-[520px] rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-forest"><Check size={20} /></span><div><h2 id="receipt-title" className="font-display text-lg font-extrabold text-ink">Sale completed</h2><p className="mt-0.5 text-xs text-slate-500">Invoice issued and digitally signed.</p></div></div>
              <button onClick={() => setReceipt(null)} className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-slate-100" aria-label="Close receipt"><X size={17} /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Invoice</span><span className="font-mono font-semibold text-ink">{receipt.invoiceNumber}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Invoice ID</span><span className="max-w-[270px] truncate font-mono text-[10px] text-ink">{receipt.invoiceId}</span></div>
              <div className="flex items-center justify-between border-t border-line pt-4"><span className="text-sm font-bold text-ink">Total amount</span><span className="font-mono text-lg font-semibold text-forest">{money.format(receipt.totalAmount)}</span></div>
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">SHA-256 signature</p><div className="break-all rounded-md bg-[#f3f6f4] p-3 font-mono text-[10px] leading-5 text-ink">{receipt.hashValueSha256}</div></div>
            </div>
            <div className="border-t border-line px-6 py-4"><button onClick={() => setReceipt(null)} className="h-10 w-full rounded-md bg-ink text-xs font-bold text-white hover:bg-forest">Done</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
