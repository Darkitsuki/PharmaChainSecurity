import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Boxes,
  Clock,
  Edit3,
  LoaderCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Drug, InventoryAlert, InventoryRow, PageResult } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  FefoExpiryBadge,
  StatCard,
  type Column,
} from '../components/common';

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
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể tải tồn kho chi nhánh.');
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'expiring') {
      apiClient<InventoryAlert[]>('/inventory/expiring-soon?days=90')
        .then((alerts) => setAlertRows(alerts))
        .catch((requestError) => {
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể tải danh sách lô cận hạn.');
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'low') {
      apiClient<InventoryAlert[]>('/inventory/low-stock?threshold=10')
        .then((alerts) => setAlertRows(alerts))
        .catch((requestError) => {
          setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể tải danh sách thuốc sắp hết hàng.');
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

      setSuccessNotice(`Đã cập nhật tồn kho lô thành công (${adjustNewQuantity} đơn vị).`);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err) {
      setAdjustError(err instanceof ApiError ? err.detail || err.message : 'Không thể điều chỉnh tồn kho.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredAllRows = rows.filter((row) => {
    const name = drugNames[row.drugId]?.toLowerCase() ?? '';
    return name.includes(normalizedSearch) || row.drugId.toLowerCase().includes(normalizedSearch) || row.batchId.toLowerCase().includes(normalizedSearch);
  });

  const filteredAlertRows = alertRows.filter((alert) => {
    return alert.drugName.toLowerCase().includes(normalizedSearch) || alert.drugCode.toLowerCase().includes(normalizedSearch) || alert.batchNo.toLowerCase().includes(normalizedSearch);
  });

  const totalUnits = rows.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = rows.filter((item) => item.quantity <= 10).length;

  const allColumns: Column<InventoryRow>[] = [
    {
      header: 'Thuốc',
      cell: (row) => <span className="font-bold text-ink">{drugNames[row.drugId] ?? 'Đang nạp...'}</span>,
    },
    {
      header: 'Mã Thuốc',
      cell: (row) => <span className="font-mono text-[11px] text-slate-500">{row.drugId}</span>,
    },
    {
      header: 'Mã Lô',
      cell: (row) => <span className="font-mono text-[11px] text-slate-500">{row.batchId}</span>,
    },
    {
      header: 'Tồn Khả Dụng',
      align: 'right',
      cell: (row) => (
        <span
          className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold ${
            row.quantity <= 10 ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20' : 'bg-mint text-forest'
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    ...(isAuthorizedToAdjust
      ? [
          {
            header: 'Thao Tác',
            align: 'center' as const,
            cell: (row: InventoryRow) => (
              <button
                type="button"
                onClick={() => handleOpenAdjust(row.drugId, row.batchId, row.quantity)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-forest hover:bg-mint hover:text-forest cursor-pointer transition-colors"
                title="Điều chỉnh số lượng lô này"
              >
                <Edit3 size={12} />
                <span>Chỉnh</span>
              </button>
            ),
          },
        ]
      : []),
  ];

  const alertColumns: Column<InventoryAlert>[] = [
    {
      header: 'Thuốc',
      cell: (alert) => <span className="font-bold text-ink">{alert.drugName}</span>,
    },
    {
      header: 'Mã Thuốc',
      cell: (alert) => <span className="font-mono text-[11px] text-slate-500">{alert.drugCode}</span>,
    },
    {
      header: 'Số Lô',
      cell: (alert) => <span className="font-mono text-[11px] text-slate-700 font-semibold">{alert.batchNo}</span>,
    },
    {
      header: 'Hạn Sử Dụng (FEFO)',
      cell: (alert) => <FefoExpiryBadge expiryDate={alert.expiryDate} size="sm" />,
    },
    {
      header: 'Tồn Khả Dụng',
      align: 'right',
      cell: (alert) => (
        <span
          className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold ${
            alert.quantity <= 10 ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/20' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20'
          }`}
        >
          {alert.quantity}
        </span>
      ),
    },
    ...(isAuthorizedToAdjust
      ? [
          {
            header: 'Thao Tác',
            align: 'center' as const,
            cell: (alert: InventoryAlert) => (
              <button
                type="button"
                onClick={() => handleOpenAdjust(alert.drugId, alert.batchId, alert.quantity)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-forest hover:bg-mint hover:text-forest cursor-pointer transition-colors"
              >
                <Edit3 size={12} />
                <span>Chỉnh</span>
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Quản lý kho chi nhánh</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Tồn Kho &amp; Lô Thuốc
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm soát số lượng khả dụng, cảnh báo cận hạn FEFO và điều chỉnh kiểm kê.
          </p>
        </div>

        {isAuthorizedToAdjust && (
          <button
            type="button"
            onClick={() => handleOpenAdjust()}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-forest/90 cursor-pointer"
          >
            <SlidersHorizontal size={15} />
            <span>Điều chỉnh tồn kho</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Tổng đơn vị tồn kho"
          value={totalUnits.toLocaleString('vi-VN')}
          icon={Boxes}
          badge={{ text: 'Thực tế tại quầy', variant: 'info' }}
        />
        <StatCard
          title="Lô sắp hết hàng"
          value={`${lowStockCount} lô`}
          icon={AlertTriangle}
          badge={{ text: 'Dưới 10 đơn vị', variant: lowStockCount > 0 ? 'warning' : 'success' }}
        />
      </div>

      {/* Alerts */}
      <AlertBanner type="success" message={successNotice} onClose={() => setSuccessNotice('')} />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Tab Switcher & Search Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all' ? 'bg-forest text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Boxes size={15} />
            <span>Tất cả tồn kho ({rows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expiring')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'expiring' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={15} />
            <span>Cảnh báo cận hạn (&le; 90 ngày)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('low')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'low' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Sắp hết hàng (&le; 10 đơn vị)</span>
          </button>
        </div>

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm thuốc hoặc số lô..."
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* Table Section */}
      {activeTab === 'all' ? (
        <DataTable
          columns={allColumns}
          data={filteredAllRows}
          keyExtractor={(item) => `${item.drugId}-${item.batchId}`}
          loading={loading}
          loadingText="Đang tải dữ liệu tồn kho chi nhánh..."
          emptyMessage={rows.length ? 'Không tìm thấy dòng khớp từ khóa tìm kiếm.' : 'Chưa có bản ghi tồn kho nào.'}
        />
      ) : (
        <DataTable
          columns={alertColumns}
          data={filteredAlertRows}
          keyExtractor={(item) => `${item.drugId}-${item.batchId}`}
          loading={loading}
          loadingText="Đang tải danh sách cảnh báo tồn kho..."
          emptyMessage="Không có thuốc nào thuộc diện cảnh báo này. Tình trạng tồn kho an toàn!"
        />
      )}

      {/* Modal Điều Chỉnh Tồn Kho */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều Chỉnh Tồn Kho Lô"
        subtitle="Cập nhật số lượng kiểm kê thực tế tại chi nhánh và ghi vết kiểm toán."
        icon={SlidersHorizontal}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <AlertBanner type="error" message={adjustError} onClose={() => setAdjustError('')} />

          <div>
            <label className="block text-xs font-semibold text-slate-700">Mã Thuốc</label>
            <input
              type="text"
              required
              value={adjustDrugId}
              onChange={(e) => setAdjustDrugId(e.target.value)}
              placeholder="ví dụ: dr-00000000-0000-0000-0000-000000000001"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-forest focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Mã Lô Hạn</label>
            <input
              type="text"
              required
              value={adjustBatchId}
              onChange={(e) => setAdjustBatchId(e.target.value)}
              placeholder="ví dụ: bt-00000000-0000-0000-0000-000000000001"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-forest focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Số Lượng Thực Tế Sau Điều Chỉnh</label>
            <input
              type="number"
              min="0"
              required
              value={adjustNewQuantity}
              onChange={(e) => setAdjustNewQuantity(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-forest focus:border-forest focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Lý Do Điều Chỉnh (Ghi sổ kiểm kê)</label>
            <textarea
              required
              rows={3}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="ví dụ: Kiểm kê định kỳ phát hiện vỡ 1 vỉ, hoặc điều chỉnh hao hụt..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdjust}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {isSubmittingAdjust ? <LoaderCircle size={14} className="animate-spin" /> : <SlidersHorizontal size={14} />}
              <span>{isSubmittingAdjust ? 'Đang cập nhật...' : 'Xác Nhận Điều Chỉnh'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
