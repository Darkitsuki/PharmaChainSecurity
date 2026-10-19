import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Plus,
  RotateCcw,
  Search,
  Undo2,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type {
  ReturnOrder,
  ReturnableInvoice,
  CreateReturnPayload,
  CreateReturnItemPayload,
} from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View detail modal
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create return modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupInvoice, setLookupInvoice] = useState<ReturnableInvoice | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createFormError, setCreateFormError] = useState('');

  // Selected return items mapping: { [drugId_batchId]: { quantity: number, actionType: 'RESTOCK' | 'DISCARD' } }
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { quantity: number; actionType: 'RESTOCK' | 'DISCARD' }>
  >({});

  useEffect(() => {
    loadReturns();
  }, []);

  async function loadReturns() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<ReturnOrder[]>('/returns');
      setReturns(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể kết nối đến máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDetail(ret: ReturnOrder) {
    setLoadingDetail(true);
    setSelectedReturn(ret);
    try {
      const full = await apiClient<ReturnOrder>(`/returns/${ret.id}`);
      setSelectedReturn(full);
    } catch {
      // Giữ nguyên dữ liệu ban đầu nếu lỗi load items
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleOpenCreateModal() {
    setInvoiceQuery('');
    setLookupInvoice(null);
    setLookupError('');
    setCreateFormError('');
    setReturnReason('');
    setSelectedItems({});
    setShowCreateModal(true);
  }

  async function handleLookupInvoice(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!invoiceQuery.trim()) {
      setLookupError('Vui lòng nhập mã hóa đơn.');
      return;
    }

    setSearchingInvoice(true);
    setLookupError('');
    setLookupInvoice(null);
    setSelectedItems({});

    try {
      const invoice = await apiClient<ReturnableInvoice>(
        `/returns/lookup-invoice/${encodeURIComponent(invoiceQuery.trim())}`
      );
      setLookupInvoice(invoice);

      // Mặc định khởi tạo selectedItems với quantity = 0
      const initialMap: Record<string, { quantity: number; actionType: 'RESTOCK' | 'DISCARD' }> = {};
      invoice.items.forEach(item => {
        initialMap[`${item.drugId}_${item.batchId}`] = {
          quantity: 0,
          actionType: 'RESTOCK',
        };
      });
      setSelectedItems(initialMap);
    } catch (err) {
      if (err instanceof ApiError) {
        setLookupError(err.detail || err.message);
      } else {
        setLookupError('Không tìm thấy hóa đơn hoặc hóa đơn không thuộc chi nhánh hiện tại.');
      }
    } finally {
      setSearchingInvoice(false);
    }
  }

  function handleItemQuantityChange(key: string, qty: number, maxQty: number) {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: validQty,
      },
    }));
  }

  function handleItemActionChange(key: string, action: 'RESTOCK' | 'DISCARD') {
    setSelectedItems(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        actionType: action,
      },
    }));
  }

  // Tính tổng tiền hoàn trả dự kiến
  const calculatedRefundTotal = useMemo(() => {
    if (!lookupInvoice) return 0;
    return lookupInvoice.items.reduce((sum, item) => {
      const key = `${item.drugId}_${item.batchId}`;
      const entry = selectedItems[key];
      if (entry && entry.quantity > 0) {
        return sum + entry.quantity * item.unitPrice;
      }
      return sum;
    }, 0);
  }, [lookupInvoice, selectedItems]);

  async function handleCreateReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateFormError('');

    if (!lookupInvoice) {
      setCreateFormError('Vui lòng tra cứu hóa đơn hợp lệ trước.');
      return;
    }

    if (!returnReason.trim()) {
      setCreateFormError('Vui lòng nhập lý do đổi trả hàng.');
      return;
    }

    const itemsToSubmit: CreateReturnItemPayload[] = [];
    lookupInvoice.items.forEach(item => {
      const key = `${item.drugId}_${item.batchId}`;
      const entry = selectedItems[key];
      if (entry && entry.quantity > 0) {
        itemsToSubmit.push({
          drugId: item.drugId,
          batchId: item.batchId,
          quantity: entry.quantity,
          refundPrice: item.unitPrice,
          actionType: entry.actionType,
        });
      }
    });

    if (itemsToSubmit.length === 0) {
      setCreateFormError('Vui lòng chọn ít nhất 1 sản phẩm có số lượng trả lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateReturnPayload = {
        invoiceId: lookupInvoice.invoiceId,
        reason: returnReason.trim(),
        items: itemsToSubmit,
      };

      const created = await apiClient<ReturnOrder>('/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setReturns(prev => [created, ...prev]);
      setShowCreateModal(false);
      setSuccessMsg(`Tạo phiếu trả hàng "${created.returnNo}" thành công. Đã hoàn tiền ${moneyFormatter.format(created.totalRefundAmount)}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateFormError(err.detail || err.message);
      } else {
        setCreateFormError('Không thể tạo phiếu đổi trả.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Lọc và Tìm kiếm
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const matchSearch =
        r.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.customerName && r.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSearch;
    });
  }, [returns, searchTerm]);

  // Phân trang
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage]);

  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;

  // Thống kê KPIs
  const stats = useMemo(() => {
    const totalCount = returns.length;
    const totalAmount = returns.reduce((sum, r) => sum + r.totalRefundAmount, 0);
    return { totalCount, totalAmount };
  }, [returns]);

  const columns: Column<ReturnOrder>[] = [
    {
      header: 'Mã phiếu / Ngày lập',
      cell: r => (
        <div>
          <div className="font-mono font-bold text-xs text-forest">{r.returnNo}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {new Date(r.createdDate).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      header: 'Hóa đơn gốc',
      cell: r => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
          {r.invoiceNo}
        </span>
      ),
    },
    {
      header: 'Khách hàng & Thu ngân',
      cell: r => (
        <div className="text-xs">
          <div className="font-medium text-ink">
            {r.customerName ? r.customerName : <span className="text-slate-400 italic">Khách lẻ vãng lai</span>}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Thu ngân: {r.cashierName}</div>
        </div>
      ),
    },
    {
      header: 'Tiền hoàn trả',
      cell: r => (
        <span className="font-mono font-bold text-xs text-rose-600">
          {moneyFormatter.format(r.totalRefundAmount)}
        </span>
      ),
    },
    {
      header: 'Lý do trả hàng',
      cell: r => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-[200px]" title={r.reason}>
          {r.reason}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Hoàn tất
        </span>
      ),
    },
    {
      header: 'Thao tác',
      cell: r => (
        <button
          onClick={() => handleOpenDetail(r)}
          className="p-1.5 text-slate-400 hover:text-forest hover:bg-mint/40 rounded-md transition-colors cursor-pointer"
          title="Xem chi tiết phiếu trả"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-ink">Đổi trả hàng & Hoàn tiền</h1>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
              {returns.length} phiếu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Xử lý tiếp nhận thuốc trả lại, nhập lại kho khả dụng hoặc xuất hủy, tự động hoàn tiền
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-white px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Tạo phiếu đổi trả</span>
        </button>
      </div>

      {/* Thông báo */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Thống kê KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={RotateCcw}
          title="Tổng lượt đổi trả"
          value={stats.totalCount}
          subValue="Phiếu trả hàng đã thực hiện tại chi nhánh"
          colorTheme="blue"
        />
        <StatCard
          icon={Undo2}
          title="Tổng tiền đã hoàn trả"
          value={moneyFormatter.format(stats.totalAmount)}
          subValue="Số tiền hoàn lại cho khách hàng"
          colorTheme="amber"
        />
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-line shadow-sm space-y-3">
        <SearchToolbar
          searchValue={searchTerm}
          onSearchChange={t => {
            setSearchTerm(t);
            setCurrentPage(1);
          }}
          searchPlaceholder="Tìm theo mã phiếu trả (TH...), mã hóa đơn (HD...), tên khách hàng, lý do..."
          onRefresh={loadReturns}
          loading={loading}
        />
      </div>

      {/* Bảng danh sách phiếu trả hàng */}
      <DataTable<ReturnOrder>
        columns={columns}
        data={paginatedReturns}
        keyExtractor={r => r.id}
        loading={loading}
        emptyMessage="Chưa có phiếu đổi trả hàng nào."
        pagination={{
          page: currentPage,
          totalPages,
          totalCount: filteredReturns.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Modal Xem chi tiết phiếu trả hàng */}
      <Modal
        isOpen={Boolean(selectedReturn)}
        title={`Chi tiết phiếu đổi trả: ${selectedReturn?.returnNo}`}
        onClose={() => setSelectedReturn(null)}
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Hóa đơn gốc:</span>
                <span className="font-mono font-bold text-ink">{selectedReturn.invoiceNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Ngày thực hiện:</span>
                <span className="text-ink">
                  {new Date(selectedReturn.createdDate).toLocaleString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Khách hàng:</span>
                <span className="font-semibold text-ink">
                  {selectedReturn.customerName || 'Khách lẻ vãng lai'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Dược sĩ tiếp nhận:</span>
                <span className="text-ink">{selectedReturn.cashierName}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Lý do đổi trả:</span>
                <span className="text-slate-700 italic">{selectedReturn.reason}</span>
              </div>
            </div>

            {/* Danh sách mặt hàng trong phiếu trả */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mặt hàng trả lại
              </h4>
              {loadingDetail ? (
                <div className="py-6 text-center text-xs text-slate-400">Đang tải chi tiết...</div>
              ) : selectedReturn.items && selectedReturn.items.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-[1fr_80px_70px_80px_90px] bg-slate-50 px-3 py-2 font-bold text-slate-500 text-[11px]">
                    <span>Tên thuốc & Lô</span>
                    <span className="text-center">Số lượng</span>
                    <span className="text-right">Đơn giá</span>
                    <span className="text-right">Thành tiền</span>
                    <span className="text-center">Xử lý kho</span>
                  </div>
                  {selectedReturn.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_80px_70px_80px_90px] px-3 py-2 items-center"
                    >
                      <div>
                        <div className="font-semibold text-ink">{item.drugName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Lô: {item.batchNo}</div>
                      </div>
                      <div className="text-center font-bold text-ink">{item.quantity}</div>
                      <div className="text-right font-mono text-slate-600">
                        {moneyFormatter.format(item.refundPrice)}
                      </div>
                      <div className="text-right font-mono font-bold text-rose-600">
                        {moneyFormatter.format(item.subTotal)}
                      </div>
                      <div className="text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            item.actionType === 'RESTOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.actionType === 'RESTOCK' ? 'Nhập lại kho' : 'Xuất hủy'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">Không có dữ liệu mặt hàng</div>
              )}
            </div>

            {/* Tổng tiền */}
            <div className="flex justify-between items-center bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs font-bold text-rose-900">
              <span>Tổng tiền đã hoàn trả khách:</span>
              <span className="text-sm font-mono text-rose-700">
                {moneyFormatter.format(selectedReturn.totalRefundAmount)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tạo phiếu đổi trả mới */}
      <Modal
        isOpen={showCreateModal}
        title="Tạo phiếu đổi trả hàng & Hoàn tiền"
        onClose={() => setShowCreateModal(false)}
      >
        <form onSubmit={handleCreateReturnSubmit} className="space-y-4">
          {createFormError && <AlertBanner type="error" message={createFormError} />}

          {/* Bước 1: Tra cứu hóa đơn gốc */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Tra cứu Hóa đơn gốc cần đổi trả <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invoiceQuery}
                onChange={e => setInvoiceQuery(e.target.value)}
                placeholder="Nhập mã hóa đơn (ví dụ: HD20261019...)"
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest font-mono uppercase bg-white"
              />
              <button
                type="button"
                onClick={() => handleLookupInvoice()}
                disabled={searchingInvoice}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search size={14} />
                <span>{searchingInvoice ? 'Đang tìm...' : 'Tra cứu'}</span>
              </button>
            </div>
            {lookupError && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle size={13} /> {lookupError}
              </p>
            )}
          </div>

          {/* Hiển thị thông tin hóa đơn và các dòng mặt hàng có thể trả */}
          {lookupInvoice && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-mint/30 p-3 rounded-lg border border-forest/20 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Số HĐ:</span>
                  <span className="font-mono font-bold text-ink">{lookupInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Khách hàng:</span>
                  <span className="font-semibold text-ink">
                    {lookupInvoice.customerName
                      ? `${lookupInvoice.customerName} (${lookupInvoice.customerPhone || ''})`
                      : 'Khách lẻ vãng lai'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tổng tiền đơn:</span>
                  <span className="font-mono font-bold text-forest">
                    {moneyFormatter.format(lookupInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Bảng chọn mặt hàng trả */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Chọn mặt hàng trả lại
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Chỉ những mặt hàng có số lượng khả dụng mới được trả
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-[minmax(0,1.5fr)_70px_70px_80px_100px] bg-slate-100/70 px-3 py-2 font-bold text-slate-500 text-[11px]">
                    <span>Tên thuốc & Lô</span>
                    <span className="text-center">Đã mua</span>
                    <span className="text-center">Có thể trả</span>
                    <span className="text-center">SL Trả</span>
                    <span className="text-center">Xử lý kho</span>
                  </div>

                  {lookupInvoice.items.map(item => {
                    const key = `${item.drugId}_${item.batchId}`;
                    const entry = selectedItems[key] || { quantity: 0, actionType: 'RESTOCK' };

                    return (
                      <div
                        key={key}
                        className={`grid grid-cols-[minmax(0,1.5fr)_70px_70px_80px_100px] px-3 py-2.5 items-center gap-1.5 transition-colors ${
                          entry.quantity > 0 ? 'bg-mint/10' : 'bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-ink leading-tight">{item.drugName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Lô: {item.batchNo} · {moneyFormatter.format(item.unitPrice)}/đv
                          </div>
                        </div>

                        <div className="text-center text-slate-500">{item.originalQuantity}</div>

                        <div className="text-center font-bold text-slate-700">
                          {item.availableToReturnQuantity > 0 ? (
                            item.availableToReturnQuantity
                          ) : (
                            <span className="text-rose-500 text-[10px]">Đã hết</span>
                          )}
                        </div>

                        <div className="text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.availableToReturnQuantity}
                            value={entry.quantity}
                            onChange={e =>
                              handleItemQuantityChange(
                                key,
                                parseInt(e.target.value, 10) || 0,
                                item.availableToReturnQuantity
                              )
                            }
                            disabled={item.availableToReturnQuantity <= 0}
                            className="w-16 px-2 py-1 text-center font-bold border border-slate-200 rounded focus:outline-none focus:border-forest disabled:bg-slate-100 disabled:text-slate-400 text-xs"
                          />
                        </div>

                        <div className="text-center">
                          <select
                            value={entry.actionType}
                            onChange={e =>
                              handleItemActionChange(key, e.target.value as 'RESTOCK' | 'DISCARD')
                            }
                            disabled={entry.quantity <= 0}
                            className="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-forest disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="RESTOCK">Nhập kho</option>
                            <option value="DISCARD">Xuất hủy</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lý do trả hàng */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do đổi trả hàng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Ví dụ: Bác sĩ đổi phác đồ điều trị, vỏ hộp bị móp méo khi mua..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest resize-none"
                  required
                />
              </div>

              {/* Tổng kết tiền hoàn trả */}
              <div className="flex justify-between items-center bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Tổng tiền hoàn trả khách:</span>
                  <span className="text-[11px] text-rose-600">
                    Số tiền sẽ được trích xuất hoàn lại cho khách hàng
                  </span>
                </div>
                <div className="text-lg font-mono font-extrabold text-rose-600">
                  {moneyFormatter.format(calculatedRefundTotal)}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !lookupInvoice || calculatedRefundTotal <= 0}
              className="px-5 py-2 text-xs font-medium bg-forest hover:bg-forest-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận Đổi trả & Hoàn tiền'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
