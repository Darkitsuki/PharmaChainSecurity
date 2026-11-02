import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardCheck, ClipboardList, Clock3, Eye, LoaderCircle, PackageCheck, Plus, Truck } from 'lucide-react';
import { AlertBanner, DataTable, Modal, PaginationBar, SearchToolbar, StatCard, type Column } from '../components/common';
import { PurchaseOrderDetail } from '../components/purchase-orders/PurchaseOrderDetail';
import { PurchaseOrderForm, type OrderDraft } from '../components/purchase-orders/PurchaseOrderForm';
import { dateLabel, fieldClass, money, OrderBadge, orderLabel, primaryButton } from '../components/purchase-orders/PurchaseOrderUi';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import { purchaseOrderStatuses, type PurchaseOrder } from '../services/purchaseOrders';
import type { PageResult } from '../types';

export function PurchaseOrdersPage() {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const owner = currentUser?.role === 'OWNER';
  const warehouse = currentUser?.role === 'WAREHOUSE';
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [view, setView] = useState('ALL');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const firstLoad = useRef(true);
  const inFlight = useRef(false);
  const listAbort = useRef<AbortController>();

  // Existing GET pages supply complete branch totals and cross-page search.
  // No new API or misleading search restricted to the current page.
  const load = useCallback(async () => {
    listAbort.current?.abort();
    const abort = new AbortController(); listAbort.current = abort;
    setLoading(true); setError('');
    try {
      const all: PurchaseOrder[] = [];
      let next = 1, pages = 1;
      do {
        const result = await apiClient<PageResult<PurchaseOrder>>(`/purchase-orders?page=${next}&pageSize=100`, { signal: abort.signal });
        all.push(...result.items); pages = result.totalPages; next++;
      } while (next <= pages);
      if (!abort.signal.aborted) {
        setOrders(all);
        if (firstLoad.current) { setView(owner && all.some(o => o.status === 'PENDING') ? 'PENDING' : 'ALL'); firstLoad.current = false; }
      }
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được đơn mua.'); }
    finally { if (!abort.signal.aborted) setLoading(false); }
  }, [owner]);
  useEffect(() => { void load(); return () => listAbort.current?.abort(); }, [load]);
  useEffect(() => {
    if (!id) { setDetail(null); setDetailError(''); return; }
    const abort = new AbortController(); setDetail(null); setDetailLoading(true); setDetailError('');
    apiClient<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}`, { signal: abort.signal })
      .then(order => { if (!abort.signal.aborted) setDetail(order); })
      .catch(e => { if (!abort.signal.aborted) setDetailError(e instanceof Error ? e.message : 'Không tải được chi tiết đơn.'); })
      .finally(() => { if (!abort.signal.aborted) setDetailLoading(false); });
    return () => abort.abort();
  }, [id]);

  async function mutate(path: string, body: unknown, message: string) {
    if (inFlight.current) return false;
    inFlight.current = true; setBusy(true); setMutationError(''); setSuccess('');
    try {
      const order = await apiClient<PurchaseOrder>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      setDetail(order); setCreating(false); setSuccess(message); navigate(`/purchase-orders/${encodeURIComponent(order.id)}`);
      await load(); return true;
    } catch (e) { setMutationError(e instanceof ApiError ? e.detail || e.message : 'Chưa xác nhận được kết quả. Tải lại đơn để kiểm tra trước khi gửi lại.'); return false; }
    finally { inFlight.current = false; setBusy(false); }
  }
  const filtered = orders.filter(order => {
    const matchesView = view === 'PENDING' ? order.status === 'PENDING' : view === 'PROCESSED' ? order.status !== 'PENDING' : true;
    const haystack = `${order.orderNo} ${orderLabel(order.orderNo)} ${order.supplierName}`.toLocaleLowerCase('vi-VN');
    return matchesView && (!status || order.status === status) && haystack.includes(search.trim().toLocaleLowerCase('vi-VN'));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const count = (s: string) => orders.filter(o => o.status === s).length;
  function selectView(value: string) { setView(value); setStatus(''); setPage(1); }
  const columns: Column<PurchaseOrder>[] = [
    { header: 'Đơn mua / Nhà cung cấp', cell: o => <div className="max-w-[280px]"><Link to={`/purchase-orders/${encodeURIComponent(o.id)}`} title={o.orderNo} className="font-semibold text-forest hover:underline">{orderLabel(o.orderNo)}</Link><p className="mt-1 truncate text-[11px] text-slate-500" title={o.supplierName}>{o.supplierName}</p></div> },
    { header: 'Người lập', cell: o => <div><p className="font-medium">{o.creatorName}</p><p className="mt-1 text-[11px] text-slate-400">{dateLabel(o.createdDate)}</p></div> },
    { header: 'Chi phí dự kiến', align: 'right', cell: o => <strong className="whitespace-nowrap text-ink">{money(o.totalEstimatedAmount)}</strong> },
    { header: 'Trạng thái', cell: o => <OrderBadge status={o.status} /> },
    { header: 'Thao tác', align: 'right', cell: o => <Link aria-label={`Xem đơn ${orderLabel(o.orderNo)}`} to={`/purchase-orders/${encodeURIComponent(o.id)}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"><Eye size={14} />Chi tiết</Link> },
  ];
  return <div className="space-y-5">
    <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />
    {id ? <>
      {detailLoading && <div role="status" className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={22} className="animate-spin text-forest" />Đang tải chi tiết đơn mua…</div>}
      <AlertBanner message={detailError} />
      {detailError && <Link className="text-sm font-semibold text-forest underline" to="/purchase-orders">Quay về danh sách</Link>}
      {detail && <PurchaseOrderDetail key={detail.id} order={detail} role={currentUser?.role || ''} branchName={currentUser?.branchName || detail.branchId} busy={busy} error={mutationError} onAction={(action, reason) => mutate(`/purchase-orders/${encodeURIComponent(detail.id)}/${action}`, action === 'reject' ? { reason } : undefined, action === 'approve' ? 'Đã phê duyệt chi phí dự kiến. Đây không phải xác nhận thanh toán.' : action === 'reject' ? 'Đã từ chối đơn mua.' : 'Đã xác nhận đặt hàng. Có thể lập phiếu khi nhận hàng.')} />}
    </> : <>
      <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest text-white"><ClipboardList size={21} /></div><div><h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{owner ? 'Duyệt đơn mua thuốc' : 'Đặt mua thuốc'}</h1><p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">{owner ? 'Xem xét yêu cầu mua thuốc, kiểm tra chi phí dự kiến và phê duyệt cho chi nhánh.' : 'Lập yêu cầu mua thuốc từ nhà cung cấp và theo dõi quá trình phê duyệt, giao nhận.'}</p></div></div>{warehouse && <button className={primaryButton} onClick={() => { setCreating(true); setMutationError(''); }}><Plus size={16} />Tạo đơn mua</button>}</header>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        { title: 'Đơn chờ duyệt', status: 'PENDING', icon: Clock3, note: owner ? 'Cần bạn xem xét' : 'Chờ Chủ nhà thuốc duyệt' },
        { title: 'Đơn đã duyệt', status: 'APPROVED', icon: ClipboardCheck, note: 'Sẵn sàng đặt nhà cung cấp' },
        { title: 'Đang giao nhận', status: 'ORDERED', icon: Truck, note: 'Đã đặt / đang nhận từng đợt' },
        { title: 'Đã hoàn thành', status: 'RECEIVED', icon: PackageCheck, note: 'Đã nhận đủ số lượng đặt' },
      ].map(card => <StatCard key={card.status} title={card.title} value={loading || error ? '—' : count(card.status)} icon={card.icon} colorTheme={card.status === 'PENDING' ? 'amber' : card.status === 'RECEIVED' ? 'emerald' : 'slate'} subValue={card.note} className="!p-4 [&_span.uppercase]:!text-[10px]" />)}</div>
      <AlertBanner message={error} />
      <section className="min-w-0 space-y-4" aria-label="Danh sách đơn mua">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200"><div className="flex flex-wrap gap-4" role="tablist" aria-label="Nhóm đơn mua">{[{ value: 'PENDING', label: 'Chờ duyệt' }, ...(owner ? [{ value: 'PROCESSED', label: 'Đã xử lý' }] : []), { value: 'ALL', label: 'Tất cả đơn' }].map(tab => <button role="tab" aria-selected={view === tab.value} key={tab.value} onClick={() => selectView(tab.value)} className={`border-b-2 px-1 pb-3 text-xs font-semibold transition-colors ${view === tab.value ? 'border-forest text-forest' : 'border-transparent text-slate-500 hover:text-ink'}`}>{tab.label}{tab.value === 'PENDING' && !loading && !error && <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-[10px] text-forest">{count('PENDING')}</span>}</button>)}</div><span className="pb-3 text-[11px] text-slate-400">Phê duyệt chi phí · Không phải thanh toán</span></div>
        <SearchToolbar
          searchValue={search}
          onSearchChange={value => { setSearch(value); setPage(1); }}
          searchPlaceholder="Tìm mã đơn hoặc nhà cung cấp…"
          searchLabel="Tìm mã đơn hoặc nhà cung cấp"
          loading={loading}
          onRefresh={() => void load()}
          filterSlot={<>
            <select aria-label="Lọc trạng thái" className={`${fieldClass} !mt-0 !w-auto max-w-full`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(purchaseOrderStatuses).filter(([s]) => view === 'PENDING' ? s === 'PENDING' : view === 'PROCESSED' ? s !== 'PENDING' : true).map(([s, label]) => <option value={s} key={s}>{label}</option>)}
            </select>
            <select aria-label="Số đơn mỗi trang" className={`${fieldClass} !mt-0 !w-auto`} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 20].map(size => <option key={size} value={size}>{size} đơn / trang</option>)}
            </select>
          </>}
        />
        <div className="hidden md:block"><DataTable columns={columns} data={error ? [] : visible} keyExtractor={o => o.id} loading={loading} emptyMessage={error ? 'Không tải được dữ liệu. Vui lòng tải lại danh sách.' : search || status ? 'Không tìm thấy đơn phù hợp. Thử thay đổi bộ lọc.' : 'Chưa có đơn mua trong nhóm này.'} pagination={{ page: currentPage, totalPages, totalCount: error ? 0 : filtered.length, onPageChange: setPage, itemLabel: 'đơn mua' }} /></div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white md:hidden">{loading ? <p role="status" className="p-8 text-center text-xs text-slate-500">Đang tải đơn mua…</p> : !visible.length || error ? <div className="p-8 text-center text-slate-400"><ClipboardList className="mx-auto mb-2" size={28} /><p className="text-xs">{error ? 'Không tải được danh sách.' : 'Không có đơn phù hợp.'}</p></div> : <div className="divide-y divide-slate-100">{visible.map(order => <Link key={order.id} to={`/purchase-orders/${encodeURIComponent(order.id)}`} className="block space-y-3 p-4 hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="break-all text-xs text-forest">{orderLabel(order.orderNo)}</strong><OrderBadge status={order.status} /></div><p className="text-xs font-medium text-ink">{order.supplierName}</p><div className="flex flex-wrap justify-between gap-2 text-[11px]"><span className="text-slate-500">{order.creatorName} · {dateLabel(order.createdDate)}</span><strong className="text-ink">{money(order.totalEstimatedAmount)}</strong></div></Link>)}</div>}<PaginationBar page={currentPage} totalPages={totalPages} totalCount={error ? 0 : filtered.length} onPageChange={setPage} itemLabel="đơn mua" /></div>
      </section>
    </>}
    <Modal isOpen={creating} onClose={() => { if (!busy) setCreating(false); }} title="Tạo yêu cầu mua thuốc" subtitle="Gửi Chủ nhà thuốc phê duyệt chi phí dự kiến trước khi đặt hàng." icon={Plus} maxWidth="4xl" closeOnOverlayClick={!busy}>
      {creating && <PurchaseOrderForm busy={busy} error={mutationError} onCancel={() => setCreating(false)} onSave={(draft: OrderDraft) => { void mutate('/purchase-orders', draft, 'Đã gửi yêu cầu mua thuốc. Đơn đang chờ Chủ nhà thuốc duyệt.'); }} />}
    </Modal>
  </div>;
}
