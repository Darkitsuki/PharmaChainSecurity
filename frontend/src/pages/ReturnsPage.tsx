import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Eye,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Undo2,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertBanner, DataTable, Modal, PageHeader, SearchToolbar, StatCard, type Column } from '../components/common';
import { ApiError, apiClient } from '../services/apiClient';
import type {
  AvailableInventory,
  CreateExchangeItemPayload,
  CreateReturnItemPayload,
  CreateReturnPayload,
  Drug,
  DrugBatch,
  PageResult,
  ReturnOrder,
  ReturnableInvoice,
} from '../types';
import { dateTime as dateTimeFormatter, money as moneyFormatter } from '../utils/formatters';

const money = (value: number) => moneyFormatter.format(value);
const dateTime = (value: Date | number) => dateTimeFormatter.format(value);

type ReturnSelection = {
  quantity: number;
  actionType: 'RESTOCK' | 'DISCARD';
  restockInspectionConfirmed: boolean;
};

type ReplacementSelection = CreateExchangeItemPayload & {
  drugName: string;
  batchNo: string;
  unitPrice: number;
  availableQuantity: number;
};

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/10 disabled:bg-slate-100 disabled:text-slate-400';

export function ReturnsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [invoice, setInvoice] = useState<ReturnableInvoice | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [reason, setReason] = useState('');
  const [selections, setSelections] = useState<Record<string, ReturnSelection>>({});
  const [replacementDrugs, setReplacementDrugs] = useState<Drug[]>([]);
  const [replacementDrugId, setReplacementDrugId] = useState('');
  const [replacementBatches, setReplacementBatches] = useState<DrugBatch[]>([]);
  const [replacementBatchId, setReplacementBatchId] = useState('');
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [replacements, setReplacements] = useState<ReplacementSelection[]>([]);
  const [settlementConfirmed, setSettlementConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const pageSize = 10;

  async function loadReturns() {
    setLoading(true);
    setError('');
    try {
      setReturns(await apiClient<ReturnOrder[]>('/returns'));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.detail || cause.message : 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadReturns(); }, []);

  useEffect(() => {
    const returnId = searchParams.get('returnId');
    if (!returnId) return;
    setDetailLoading(true);
    apiClient<ReturnOrder>(`/returns/${encodeURIComponent(returnId)}`)
      .then(setSelectedReturn)
      .catch(() => setError('Không thể tải phiếu đổi trả được liên kết.'))
      .finally(() => setDetailLoading(false));
  }, [searchParams]);

  async function loadReplacementDrugs() {
    const [drugPage, available] = await Promise.all([
      apiClient<PageResult<Drug>>('/drugs?page=1&pageSize=100'),
      apiClient<AvailableInventory[]>('/inventory/available-by-drug'),
    ]);
    const availableIds = new Set(available.filter(item => item.availableQuantity > 0).map(item => item.drugId));
    setReplacementDrugs(drugPage.items.filter(item => item.isActive !== false && availableIds.has(item.drugId)));
  }

  function openCreate() {
    setTransactionType('RETURN');
    setInvoiceQuery('');
    setInvoice(null);
    setReason('');
    setSelections({});
    setReplacements([]);
    setReplacementDrugId('');
    setReplacementBatches([]);
    setReplacementBatchId('');
    setSettlementConfirmed(false);
    setFormError('');
    setIdempotencyKey(crypto.randomUUID());
    setCreateOpen(true);
  }

  async function lookupInvoice() {
    if (!invoiceQuery.trim()) {
      setFormError('Vui lòng nhập mã hóa đơn gốc.');
      return;
    }
    setLookupLoading(true);
    setFormError('');
    try {
      const result = await apiClient<ReturnableInvoice>(`/returns/lookup-invoice/${encodeURIComponent(invoiceQuery.trim())}`);
      setInvoice(result);
      setSelections(Object.fromEntries(result.items.map(item => [
        `${item.drugId}_${item.batchId}`,
        { quantity: 0, actionType: 'DISCARD', restockInspectionConfirmed: false },
      ])));
    } catch (cause) {
      setInvoice(null);
      setFormError(cause instanceof ApiError ? cause.detail || cause.message : 'Không tìm thấy hóa đơn hợp lệ.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function chooseReplacementDrug(drugId: string) {
    setReplacementDrugId(drugId);
    setReplacementBatchId('');
    setReplacementBatches([]);
    if (!drugId) return;
    try {
      const batches = await apiClient<DrugBatch[]>(`/drugs/${encodeURIComponent(drugId)}/batches`);
      const today = new Date().toISOString().slice(0, 10);
      setReplacementBatches(batches.filter(batch => batch.stockQuantity > 0 && batch.expiryDate.slice(0, 10) >= today));
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.detail || cause.message : 'Không thể tải lô thuốc.');
    }
  }

  function addReplacement() {
    const drug = replacementDrugs.find(item => item.drugId === replacementDrugId);
    const batch = replacementBatches.find(item => item.batchId === replacementBatchId);
    if (!drug || !batch || replacementQuantity <= 0 || replacementQuantity > batch.stockQuantity) {
      setFormError('Vui lòng chọn thuốc, lô và số lượng hợp lệ.');
      return;
    }
    if (replacements.some(item => item.drugId === drug.drugId && item.batchId === batch.batchId)) {
      setFormError('Lô thuốc này đã có trong danh sách đổi.');
      return;
    }
    setReplacements(items => [...items, {
      drugId: drug.drugId,
      batchId: batch.batchId,
      quantity: replacementQuantity,
      drugName: drug.name,
      batchNo: batch.batchNo,
      unitPrice: drug.price,
      availableQuantity: batch.stockQuantity,
    }]);
    setReplacementQuantity(1);
    setFormError('');
  }

  const refundTotal = useMemo(() => invoice?.items.reduce((sum, item) => {
    const selection = selections[`${item.drugId}_${item.batchId}`];
    return sum + (selection?.quantity ?? 0) * item.unitPrice;
  }, 0) ?? 0, [invoice, selections]);
  const replacementTotal = useMemo(() => replacements.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [replacements]);
  const difference = replacementTotal - refundTotal;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!invoice || !reason.trim()) {
      setFormError('Vui lòng tra cứu hóa đơn và nhập lý do.');
      return;
    }
    const items: CreateReturnItemPayload[] = invoice.items.flatMap(item => {
      const selection = selections[`${item.drugId}_${item.batchId}`];
      return selection?.quantity > 0 ? [{
        drugId: item.drugId,
        batchId: item.batchId,
        quantity: selection.quantity,
        refundPrice: item.unitPrice,
        actionType: selection.actionType,
        restockInspectionConfirmed: selection.restockInspectionConfirmed,
      }] : [];
    });
    if (!items.length) {
      setFormError('Vui lòng chọn ít nhất một mặt hàng trả.');
      return;
    }
    if (transactionType === 'EXCHANGE' && (!replacements.length || !settlementConfirmed)) {
      setFormError('Vui lòng chọn thuốc mới và xác nhận phương án chênh lệch.');
      return;
    }

    const payload: CreateReturnPayload = {
      invoiceId: invoice.invoiceId,
      reason: reason.trim(),
      items,
      transactionType,
      replacementItems: transactionType === 'EXCHANGE'
        ? replacements.map(({ drugId, batchId, quantity }) => ({ drugId, batchId, quantity }))
        : undefined,
      paymentMethod: 'CASH',
      settlementConfirmed: transactionType === 'EXCHANGE' && settlementConfirmed,
    };

    setSubmitting(true);
    setFormError('');
    try {
      const created = await apiClient<ReturnOrder>('/returns', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      });
      setReturns(current => [created, ...current]);
      setCreateOpen(false);
      setSuccess(created.transactionType === 'EXCHANGE'
        ? `Đã ghi nhận phiếu đổi ${created.returnNo} và hóa đơn mới ${created.exchangeInvoiceNo}.`
        : `Đã ghi nhận phiếu trả ${created.returnNo}. Khoản ${money(created.totalRefundAmount)} cần được hoàn cho khách.`);
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.detail || cause.message : 'Không thể hoàn tất giao dịch.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => returns.filter(item => [item.returnNo, item.invoiceNo, item.exchangeInvoiceNo, item.customerName, item.reason]
    .some(value => value?.toLowerCase().includes(search.toLowerCase()))), [returns, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(current => Math.min(current, totalPages)), [totalPages]);

  async function openDetail(item: ReturnOrder) {
    setSelectedReturn(item);
    setDetailLoading(true);
    try { setSelectedReturn(await apiClient<ReturnOrder>(`/returns/${encodeURIComponent(item.id)}`)); }
    finally { setDetailLoading(false); }
  }

  const columns: Column<ReturnOrder>[] = [
    { header: 'Phiếu / Ngày lập', cell: item => <div><strong className="text-forest">{item.returnNo}</strong><p className="text-xs text-slate-500">{dateTime(new Date(item.createdDate))}</p></div> },
    { header: 'Loại', cell: item => <span className="font-medium">{item.transactionType === 'EXCHANGE' ? 'Đổi thuốc' : 'Trả hàng'}</span> },
    { header: 'Hóa đơn', cell: item => <div><span>{item.invoiceNo}</span>{item.exchangeInvoiceNo && <p className="text-xs text-slate-500 font-semibold text-emerald-700">Đổi: {item.exchangeInvoiceNo}</p>}</div> },
    { header: 'Khách hàng', cell: item => item.customerName || 'Khách lẻ' },
    { header: 'Giá trị', cell: item => <div className="text-right"><strong>{money(item.totalRefundAmount)}</strong>{item.transactionType === 'EXCHANGE' && <p className="text-xs text-slate-500">Chênh lệch: {money(item.balanceDifference)}</p>}</div> },
    { header: 'Trạng thái tiền', cell: item => settlementLabel(item.settlementStatus) },
    {
      header: 'Thao tác',
      cell: item => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => void openDetail(item)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title="Xem chi tiết phiếu trả"
          >
            <Eye size={13} /> Chi tiết
          </button>
          {!item.exchangeInvoiceId && (
            <button
              type="button"
              onClick={() => navigate(`/checkout?exchangeReturnId=${encodeURIComponent(item.id)}&returnNo=${encodeURIComponent(item.returnNo)}&refundAmount=${item.totalRefundAmount}`)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              title="Xuất hóa đơn đổi thuốc tại quầy POS"
            >
              <ShoppingBag size={13} /> Đổi thuốc (POS)
            </button>
          )}
        </div>
      ),
    },
  ];

  return <div className="ui-page">
    <PageHeader title="Đổi trả & Hoàn tiền" actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"><Plus size={16}/>Tạo giao dịch</button>} />
    {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
    {success && <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />}

<div className="grid gap-4 sm:grid-cols-3">
      <StatCard loading={loading} unavailable={Boolean(error)} icon={RotateCcw} title="Tổng giao dịch" value={returns.length} subValue="Phiếu đã ghi nhận" colorTheme="blue" />
      <StatCard loading={loading} unavailable={Boolean(error)} icon={Undo2} title="Trả hàng" value={returns.filter(item => item.transactionType === 'RETURN').length} subValue="Khoản hoàn cần xử lý" colorTheme="amber" />
      <StatCard loading={loading} unavailable={Boolean(error)} icon={ArrowRightLeft} title="Đổi thuốc" value={returns.filter(item => item.transactionType === 'EXCHANGE').length} subValue="Có hóa đơn mới liên kết" colorTheme="emerald" />
    </div>

    <SearchToolbar searchValue={search} onSearchChange={value => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm mã phiếu, hóa đơn, khách hàng..." onRefresh={loadReturns} loading={loading} />
    <DataTable
      columns={columns}
      data={paged}
      keyExtractor={item => item.id}
      loading={loading}
      emptyMessage="Chưa có giao dịch đổi trả."
      onRowClick={item => void openDetail(item)}
      rowLabel={item => `Mở chi tiết phiếu ${item.returnNo}`}
      pagination={{ page, totalPages, totalCount: filtered.length, pageSize, onPageChange: setPage }}
    />

    <Modal isOpen={Boolean(selectedReturn)} onClose={() => setSelectedReturn(null)} title={`Chi tiết ${selectedReturn?.returnNo ?? ''}`} maxWidth="3xl">
      {detailLoading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải chi tiết...</p> : selectedReturn && <ReturnDetail item={selectedReturn} />}
    </Modal>

    <Modal isOpen={createOpen} onClose={() => !submitting && setCreateOpen(false)} title="Tạo giao dịch đổi trả" subtitle="Giá và số tiền được Backend xác định từ dữ liệu hóa đơn" maxWidth="5xl" closeOnOverlayClick={!submitting}>
      <form onSubmit={submit} className="space-y-6">
        {formError && <AlertBanner type="error" message={formError} />}
        <section>
          <h3 className="mb-3 text-sm font-bold text-ink">1. Loại giao dịch</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['RETURN', 'EXCHANGE'] as const).map(type => <button key={type} type="button" onClick={() => { setTransactionType(type); setSettlementConfirmed(false); if (type === 'EXCHANGE' && !replacementDrugs.length) void loadReplacementDrugs().catch(() => setFormError('Không thể tải danh mục thuốc.')); }} className={`rounded-xl border p-4 text-left transition-colors ${transactionType === type ? 'border-forest bg-mint text-forest' : 'border-slate-200 hover:border-forest/40'}`}><strong>{type === 'RETURN' ? 'Trả hàng & Hoàn tiền' : 'Đổi thuốc'}</strong><p className="mt-1 text-xs text-slate-500">{type === 'RETURN' ? 'Ghi nhận hàng trả và khoản tiền cần hoàn.' : 'Nhận thuốc trả, xuất thuốc mới và tạo hóa đơn ký số.'}</p></button>)}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-ink">2. Hóa đơn gốc</h3>
          <div className="flex flex-col gap-2 sm:flex-row"><input value={invoiceQuery} onChange={event => setInvoiceQuery(event.target.value)} className={inputClass} placeholder="Nhập mã hóa đơn"/><button type="button" onClick={() => void lookupInvoice()} disabled={lookupLoading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search size={15}/>{lookupLoading ? 'Đang tìm...' : 'Tra cứu'}</button></div>
          {invoice && <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-slate-500">Hóa đơn:</span> <strong>{invoice.invoiceNumber}</strong></p><p><span className="text-slate-500">Khách:</span> {invoice.customerName || 'Khách lẻ'}</p><p><span className="text-slate-500">Tổng:</span> <strong>{money(invoice.totalAmount)}</strong></p></div>}
        </section>

        {invoice && <ReturnItemEditor invoice={invoice} selections={selections} onChange={setSelections} />}
        {invoice && transactionType === 'EXCHANGE' && <ReplacementEditor drugs={replacementDrugs} drugId={replacementDrugId} batches={replacementBatches} batchId={replacementBatchId} quantity={replacementQuantity} items={replacements} onDrugChange={value => void chooseReplacementDrug(value)} onBatchChange={setReplacementBatchId} onQuantityChange={setReplacementQuantity} onAdd={addReplacement} onRemove={index => setReplacements(items => items.filter((_, itemIndex) => itemIndex !== index))} />}

        {invoice && <section><h3 className="mb-2 text-sm font-bold text-ink">{transactionType === 'EXCHANGE' ? '5' : '4'}. Lý do và ghi chú</h3><textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} className={inputClass} placeholder="Mô tả lý do đổi trả"/></section>}
        {invoice && <section className="border-t border-slate-200 pt-4"><div className="grid gap-3 text-sm sm:grid-cols-3"><p>Giá trị thuốc trả<br/><strong className="text-lg">{money(refundTotal)}</strong></p>{transactionType === 'EXCHANGE' && <><p>Giá trị thuốc mới<br/><strong className="text-lg">{money(replacementTotal)}</strong></p><p>Chênh lệch<br/><strong className={difference < 0 ? 'text-rose-600' : 'text-forest'}>{difference > 0 ? `Khách trả thêm ${money(difference)}` : difference < 0 ? `Cần hoàn khách ${money(Math.abs(difference))}` : 'Không phát sinh'}</strong></p></>}</div>{transactionType === 'EXCHANGE' && <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={settlementConfirmed} onChange={event => setSettlementConfirmed(event.target.checked)} className="mt-1"/><span>Tôi đã đối chiếu phương án chênh lệch tiền mặt. Khoản cần hoàn cho khách vẫn được ghi nhận là <strong>cần xử lý</strong> do hệ thống chưa lưu xác nhận chi tiền riêng.</span></label>}</section>}

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white pt-4"><button type="button" onClick={() => setCreateOpen(false)} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Hủy</button><button type="submit" disabled={submitting || !invoice || refundTotal <= 0} className="rounded-lg bg-forest px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Đang xử lý...' : 'Xác nhận giao dịch'}</button></div>
      </form>
    </Modal>
  </div>;
}

function ReturnItemEditor({ invoice, selections, onChange }: { invoice: ReturnableInvoice; selections: Record<string, ReturnSelection>; onChange: React.Dispatch<React.SetStateAction<Record<string, ReturnSelection>>> }) {
  return <section><h3 className="mb-3 text-sm font-bold text-ink">3. Thuốc khách trả và xử lý kho</h3><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Thuốc / Lô</th><th className="p-3 text-center">Có thể trả</th><th className="p-3 text-center">Số lượng</th><th className="p-3">Xử lý kho</th><th className="p-3">Xác nhận kiểm tra</th></tr></thead><tbody>{invoice.items.map(item => { const key = `${item.drugId}_${item.batchId}`; const value = selections[key]; return <tr key={key} className="border-t border-slate-100"><td className="p-3"><strong>{item.drugName}</strong><p className="text-xs text-slate-500">Lô {item.batchNo} · {money(item.unitPrice)}</p></td><td className="p-3 text-center">{item.availableToReturnQuantity}</td><td className="p-3"><input type="number" min={0} max={item.availableToReturnQuantity} value={value?.quantity ?? 0} onChange={event => onChange(current => ({ ...current, [key]: { ...current[key], quantity: Math.min(item.availableToReturnQuantity, Math.max(0, Number(event.target.value))) } }))} className={`${inputClass} mx-auto w-20 text-center`}/></td><td className="p-3"><select value={value?.actionType ?? 'DISCARD'} onChange={event => onChange(current => ({ ...current, [key]: { ...current[key], actionType: event.target.value as 'RESTOCK' | 'DISCARD', restockInspectionConfirmed: false } }))} className={inputClass} disabled={!value?.quantity}><option value="DISCARD">Không nhập lại kho</option><option value="RESTOCK">Nhập lại kho</option></select></td><td className="p-3">{value?.actionType === 'RESTOCK' ? <label className="flex gap-2"><input type="checkbox" checked={value.restockInspectionConfirmed} onChange={event => onChange(current => ({ ...current, [key]: { ...current[key], restockInspectionConfirmed: event.target.checked } }))}/><span className="text-xs">Đã kiểm tra, đủ điều kiện tiếp tục lưu thông</span></label> : <span className="text-xs text-slate-500">Không tăng tồn bán được</span>}</td></tr>; })}</tbody></table></div><p className="mt-2 text-xs text-slate-500">“Nhập lại kho” chỉ dùng sau khi nhân viên kiểm tra hàng đủ điều kiện tiếp tục lưu thông. Hệ thống không ghi nhận biên bản kiểm định hoặc tiêu hủy.</p></section>;
}

function ReplacementEditor({ drugs, drugId, batches, batchId, quantity, items, onDrugChange, onBatchChange, onQuantityChange, onAdd, onRemove }: { drugs: Drug[]; drugId: string; batches: DrugBatch[]; batchId: string; quantity: number; items: ReplacementSelection[]; onDrugChange: (value: string) => void; onBatchChange: (value: string) => void; onQuantityChange: (value: number) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return <section><h3 className="mb-3 text-sm font-bold text-ink">4. Thuốc mới</h3><div className="grid gap-3 md:grid-cols-[2fr_2fr_100px_auto]"><select value={drugId} onChange={event => onDrugChange(event.target.value)} className={inputClass}><option value="">Chọn thuốc</option>{drugs.map(item => <option key={item.drugId} value={item.drugId}>{item.name} · {money(item.price)}</option>)}</select><select value={batchId} onChange={event => onBatchChange(event.target.value)} className={inputClass} disabled={!drugId}><option value="">Chọn lô theo FEFO</option>{batches.map(item => <option key={item.batchId} value={item.batchId}>{item.batchNo} · còn {item.stockQuantity} · HSD {item.expiryDate.slice(0, 10)}</option>)}</select><input type="number" min={1} value={quantity} onChange={event => onQuantityChange(Math.max(1, Number(event.target.value)))} className={inputClass}/><button type="button" onClick={onAdd} className="rounded-lg border border-forest px-4 py-2 text-sm font-semibold text-forest hover:bg-mint">Thêm</button></div>{items.length > 0 && <div className="mt-3 divide-y divide-slate-100 border-y border-slate-200">{items.map((item, index) => <div key={`${item.drugId}_${item.batchId}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{item.drugName}</strong> · Lô {item.batchNo} · {item.quantity} × {money(item.unitPrice)}</span><button type="button" onClick={() => onRemove(index)} className="text-rose-600 hover:underline">Bỏ</button></div>)}</div>}</section>;
}

function ReturnDetail({ item }: { item: ReturnOrder }) {
  const navigate = useNavigate();
  return <div className="space-y-5 text-sm"><div className="grid gap-3 sm:grid-cols-2"><p><span className="text-slate-500">Loại:</span> {item.transactionType === 'EXCHANGE' ? 'Đổi thuốc' : 'Trả hàng & hoàn tiền'}</p><p><span className="text-slate-500">Ngày:</span> {dateTime(new Date(item.createdDate))}</p><p><span className="text-slate-500">Hóa đơn gốc:</span> {item.invoiceNo}</p>{item.exchangeInvoiceNo && <p><span className="text-slate-500">Hóa đơn mới:</span> <Link to={`/invoices?invoiceId=${encodeURIComponent(item.exchangeInvoiceId!)}`} className="font-semibold text-forest underline">{item.exchangeInvoiceNo}</Link></p>}<p><span className="text-slate-500">Khách:</span> {item.customerName || 'Khách lẻ'}</p><p><span className="text-slate-500">Nhân viên:</span> {item.cashierName}</p></div><div><strong>Thuốc trả</strong><div className="mt-2 divide-y divide-slate-100 border-y border-slate-200">{item.items.map(returnItem => <div key={`${returnItem.drugId}_${returnItem.batchId}`} className="flex flex-wrap justify-between gap-2 py-3"><span>{returnItem.drugName} · Lô {returnItem.batchNo} · SL {returnItem.quantity}</span><span>{returnItem.actionType === 'RESTOCK' ? 'Nhập lại kho' : 'Không nhập lại kho'} · {money(returnItem.subTotal)}</span></div>)}</div></div><div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-3"><p>Giá trị thuốc trả<br/><strong>{money(item.totalRefundAmount)}</strong></p>{item.transactionType === 'EXCHANGE' && <><p>Hóa đơn mới<br/><strong>{money(item.replacementTotalAmount)}</strong></p><p>Chênh lệch<br/><strong>{money(item.balanceDifference)}</strong></p></>}</div><p className="text-slate-600"><strong>Lý do:</strong> {item.reason}</p><p className="rounded-lg bg-amber-50 p-3 text-amber-900">{settlementLabel(item.settlementStatus)}</p>{!item.exchangeInvoiceId && <div className="pt-2"><button type="button" onClick={() => navigate(`/checkout?exchangeReturnId=${encodeURIComponent(item.id)}&returnNo=${encodeURIComponent(item.returnNo)}&refundAmount=${item.totalRefundAmount}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white hover:bg-forest/90 cursor-pointer"><ShoppingBag size={14}/>Xuất hóa đơn đổi thuốc (POS)</button></div>}</div>;
}

function settlementLabel(status: ReturnOrder['settlementStatus']) {
  if (status === 'SETTLED') return 'Đã xác nhận thanh toán phần chênh lệch';
  if (status === 'NO_DIFFERENCE') return 'Không phát sinh chênh lệch';
  if (status === 'PAYMENT_PENDING') return 'Chờ xác nhận thanh toán';
  return 'Cần hoàn tiền cho khách — chưa có xác nhận chi tiền trong hệ thống';
}
