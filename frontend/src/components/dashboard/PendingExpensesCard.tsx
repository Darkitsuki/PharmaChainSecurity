import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import type { PageResult } from '../../types';
import { orderLabel } from '../purchase-orders/PurchaseOrderUi';
import type { PurchaseOrder } from '../../services/purchaseOrders';

export function PendingExpensesCard() {
  const [result, setResult] = useState<PageResult<PurchaseOrder> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    apiClient<PageResult<PurchaseOrder>>('/purchase-orders?status=PENDING&page=1&pageSize=5', { signal: abort.signal })
      .then(setResult).catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được đơn chờ duyệt.'); });
    return () => abort.abort();
  }, []);
  return <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-base font-bold">Đơn mua chờ duyệt</h2><Link className="text-sm text-forest underline" to="/purchase-orders">Xem và duyệt đơn</Link></div>
    {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : !result ? <p>Đang tải…</p> : <>
      <p className="mb-2 text-sm text-slate-500">{result.totalCount} đơn chờ trong chi nhánh của bạn</p>
      {!result.items.length && <p className="text-sm">Không có đơn chờ duyệt.</p>}
      {result.items.map(order => <div className="flex justify-between gap-3 border-t border-line py-3 text-sm" key={order.id}><span><strong>{orderLabel(order.orderNo)}</strong><span className="block text-slate-500">{order.supplierName} · {order.creatorName}</span></span><span>{order.totalEstimatedAmount.toLocaleString('vi-VN')} đ</span></div>)}
    </>}
  </section>;
}
