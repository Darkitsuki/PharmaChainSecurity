import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Clock, Edit3, LoaderCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Drug, InventoryAlert, InventoryRow, PageResult } from '../types';

export function InventoryPage() {
  const { currentUser } = useAuth();
  const isAuthorizedToAdjust = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';

  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'low'>('all');
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [alertRows, setAlertRows] = useState<InventoryAlert[]>([]);
  const [drugNames, setDrugNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Modal Điều Chỉnh Tồn Kho State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustDrugId, setAdjustDrugId] = useState('');
  const [adjustBatchId, setAdjustBatchId] = useState('');
  const [adjustNewQuantity, setAdjustNewQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const loadData = () => {
    setLoading(true);
    setError('');

    if (activeTab === 'all') {
      Promise.all([
        apiClient<PageResult<InventoryRow>>('/inventory?page=1&pageSize=100'),
        apiClient<PageResult<Drug>>('/drugs?page=1&pageSize=100'),
      ])
        .then(([inventory, drugs]) => {
          setRows(inventory.items);
          setDrugNames(Object.fromEntries(drugs.items.map((drug) => [drug.drugId, drug.name])));
        })
        .catch((requestError) => {
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Could not load branch inventory.');
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'expiring') {
      apiClient<InventoryAlert[]>('/inventory/expiring-soon?days=90')
        .then((alerts) => setAlertRows(alerts))
        .catch((requestError) => {
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Could not load expiring batches.');
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'low') {
      apiClient<InventoryAlert[]>('/inventory/low-stock?threshold=10')
        .then((alerts) => setAlertRows(alerts))
        .catch((requestError) => {
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Could not load low-stock items.');
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  function handleOpenAdjust(drugId = '', batchId = '', currentQty = 0) {
    setAdjustDrugId(drugId);
    setAdjustBatchId(batchId);
    setAdjustNewQuantity(currentQty);
    setAdjustReason('');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  }

  async function handleAdjustSubmit(e: FormEvent) {
    e.preventDefault();
    if (!adjustDrugId.trim() || !adjustBatchId.trim()) {
      setAdjustError('Vui lòng chọn thuốc và số lô hợp lệ.');
      return;
    }
    if (adjustNewQuantity < 0) {
      setAdjustError('Số lượng tồn không thể âm.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }

    setIsSubmittingAdjust(true);
    setAdjustError('');
    try {
      await apiClient('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          drugId: adjustDrugId.trim(),
          batchId: adjustBatchId.trim(),
          newQuantity: adjustNewQuantity,
          reason: adjustReason.trim(),
        }),
      });

      setSuccessNotice(`Đã cập nhật tồn kho lô ${adjustBatchId} thành công.`);
      setIsAdjustModalOpen(false);
      loadData();
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err) {
      setAdjustError(err instanceof ApiError ? err.detail || err.message : 'Không thể điều chỉnh tồn kho.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  }

  const filteredAllRows = rows.filter((row) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || `${drugNames[row.drugId] ?? ''} ${row.drugId} ${row.batchId}`.toLocaleLowerCase().includes(query);
  });

  const filteredAlertRows = alertRows.filter((alert) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || `${alert.drugName} ${alert.drugCode} ${alert.batchNo} ${alert.batchId}`.toLocaleLowerCase().includes(query);
  });

  const totalUnits = rows.reduce((sum, row) => sum + row.quantity, 0);
  const lowStockCount = rows.filter((row) => row.quantity <= 10).length;

  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Quản lý kho chi nhánh</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Tồn Kho & Lô Thuốc</h1>
          <p className="mt-1.5 text-sm text-slate-500">Kiểm soát số lượng khả dụng, cảnh báo cận hạn và điều chỉnh kiểm kê.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full sm:w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thuốc hoặc số lô..."
              className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none"
            />
          </label>

          {isAuthorizedToAdjust && (
            <button
              onClick={() => handleOpenAdjust()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-forest px-4 text-xs font-bold text-white shadow-sm hover:bg-[#1c594b] transition-colors"
            >
              <SlidersHorizontal size={15} /> Điều chỉnh tồn kho
            </button>
          )}
        </div>
      </div>

      {successNotice && (
        <div role="status" className="mb-5 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && <div role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-mint text-forest"><Boxes size={17} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Tổng đơn vị tồn kho</p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">{totalUnits.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-4 py-4">
          <span className={`grid h-9 w-9 place-items-center rounded-md ${lowStockCount ? 'bg-amber-50 text-amber-700' : 'bg-[#f3f6f4] text-slate-500'}`}>
            <span className="font-mono text-xs font-bold">{lowStockCount}</span>
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Lô sắp hết hàng</p>
            <p className="mt-1 text-xs text-slate-600">Dưới hoặc bằng 10 đơn vị</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'all' ? 'bg-forest text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes size={15} /> Tất cả tồn kho ({rows.length})
        </button>

        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'expiring' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock size={15} /> Cảnh báo cận hạn (&le; 90 ngày)
        </button>

        <button
          onClick={() => setActiveTab('low')}
          className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition-colors ${
            activeTab === 'low' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle size={15} /> Sắp hết hàng (&le; 10 đơn vị)
        </button>
      </div>

      <section className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-sm font-extrabold text-ink">
            {activeTab === 'all' && 'Danh sách tồn kho theo lô'}
            {activeTab === 'expiring' && 'Danh sách lô thuốc cận hạn sử dụng'}
            {activeTab === 'low' && 'Danh sách thuốc có lượng tồn dưới ngưỡng'}
          </h2>
          <span className="text-[11px] text-slate-500">
            {activeTab === 'all' ? `${filteredAllRows.length} dòng` : `${filteredAlertRows.length} cảnh báo`}
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'all' ? (
            <table className="w-full min-w-[650px] border-collapse text-left">
              <thead>
                <tr className="bg-[#f8faf9] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                  <th className="px-5 py-3 font-bold">Thuốc</th>
                  <th className="px-4 py-3 font-bold">Mã Thuốc</th>
                  <th className="px-4 py-3 font-bold">Mã Lô</th>
                  <th className="px-5 py-3 text-right font-bold">Tồn Khả Dụng</th>
                  {isAuthorizedToAdjust && <th className="px-4 py-3 text-center font-bold">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="h-36 text-center text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Đang tải dữ liệu tồn kho...</span>
                    </td>
                  </tr>
                ) : !filteredAllRows.length ? (
                  <tr>
                    <td colSpan={5} className="h-36 text-center text-sm text-slate-500">
                      {rows.length ? 'Không tìm thấy dòng khớp từ khóa tìm kiếm.' : 'Chưa có bản ghi tồn kho nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredAllRows.map((row) => (
                    <tr key={`${row.drugId}-${row.batchId}`} className="hover:bg-[#fbfcfb]">
                      <td className="px-5 py-4 text-xs font-bold text-ink">{drugNames[row.drugId] ?? 'Đang nạp...'}</td>
                      <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{row.drugId}</td>
                      <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{row.batchId}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex min-w-12 justify-center rounded px-2 py-1 font-mono text-xs font-semibold ${
                          row.quantity <= 10 ? 'bg-amber-50 text-amber-800' : 'bg-[#f0f7f3] text-forest'
                        }`}>
                          {row.quantity}
                        </span>
                      </td>
                      {isAuthorizedToAdjust && (
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleOpenAdjust(row.drugId, row.batchId, row.quantity)}
                            className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-forest hover:bg-mint hover:text-forest"
                            title="Điều chỉnh số lượng lô này"
                          >
                            <Edit3 size={12} /> Chỉnh
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-[#f8faf9] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                  <th className="px-5 py-3 font-bold">Thuốc</th>
                  <th className="px-4 py-3 font-bold">Mã Thuốc</th>
                  <th className="px-4 py-3 font-bold">Số Lô</th>
                  <th className="px-4 py-3 font-bold">Hạn Sử Dụng</th>
                  <th className="px-5 py-3 text-right font-bold">Tồn Khả Dụng</th>
                  {isAuthorizedToAdjust && <th className="px-4 py-3 text-center font-bold">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="h-36 text-center text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Đang tải danh sách cảnh báo...</span>
                    </td>
                  </tr>
                ) : !filteredAlertRows.length ? (
                  <tr>
                    <td colSpan={6} className="h-36 text-center text-sm text-slate-500">
                      Không có thuốc nào thuộc diện cảnh báo này. Tình trạng tốt!
                    </td>
                  </tr>
                ) : (
                  filteredAlertRows.map((alert) => (
                    <tr key={`${alert.drugId}-${alert.batchId}`} className="hover:bg-[#fbfcfb]">
                      <td className="px-5 py-4 text-xs font-bold text-ink">{alert.drugName}</td>
                      <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{alert.drugCode}</td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-600">{alert.batchNo}</td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {new Date(alert.expiryDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex min-w-12 justify-center rounded px-2 py-1 font-mono text-xs font-semibold ${
                          alert.quantity <= 10 ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {alert.quantity}
                        </span>
                      </td>
                      {isAuthorizedToAdjust && (
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleOpenAdjust(alert.drugId, alert.batchId, alert.quantity)}
                            className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-forest hover:bg-mint hover:text-forest"
                          >
                            <Edit3 size={12} /> Chỉnh
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* MODAL ĐIỀU CHỈNH TỒN KHO */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="animate-enter w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-forest" />
                <h3 className="font-display text-base font-extrabold text-ink">Điều Chỉnh Tồn Kho</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {adjustError && (
              <div role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mã Thuốc (Drug ID)</label>
                <input
                  required
                  value={adjustDrugId}
                  onChange={(e) => setAdjustDrugId(e.target.value)}
                  placeholder="Ví dụ: DRUG_001"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mã Lô (Batch ID)</label>
                <input
                  required
                  value={adjustBatchId}
                  onChange={(e) => setAdjustBatchId(e.target.value)}
                  placeholder="Ví dụ: BATCH_001"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Số Lượng Tồn Thực Tế Mới</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustNewQuantity}
                  onChange={(e) => setAdjustNewQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-10 w-full rounded border border-line px-3 font-mono text-sm text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Lý Do Điều Chỉnh</label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Kiểm kê định kỳ phát hiện chênh lệch, thuốc vỡ hỏng..."
                  className="w-full rounded border border-line p-2.5 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="h-9 rounded border border-line px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="inline-flex h-9 items-center gap-1.5 rounded bg-forest px-4 text-xs font-bold text-white hover:bg-[#1c594b] disabled:opacity-50"
                >
                  {isSubmittingAdjust ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
