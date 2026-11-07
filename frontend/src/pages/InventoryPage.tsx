import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CalendarClock, PackageCheck, PackageX } from 'lucide-react';
import { loadAllPages } from '../utils/loadAllPages';
import { calendarDate, quantity } from '../utils/formatters';
import { ApiError } from '../services/apiClient';
import type { InventoryRow } from '../types';
import { AlertBanner, DataTable, FefoExpiryBadge, Modal, PageHeader, SearchToolbar, StatCard, type Column } from '../components/common';

type InventoryTab = 'all' | 'expiring' | 'expired' | 'low';
const LOW_STOCK_THRESHOLD = 10;
const EXPIRING_DAYS = 90;

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function dateOnly(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function isExpired(row: InventoryRow) {
  return dateOnly(row.expiryDate) < startOfToday();
}

function isExpiring(row: InventoryRow) {
  const expiry = dateOnly(row.expiryDate);
  const limit = startOfToday();
  limit.setDate(limit.getDate() + EXPIRING_DAYS);
  return row.quantity > 0 && expiry >= startOfToday() && expiry <= limit;
}

export function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await loadAllPages<InventoryRow>('/inventory'));
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.detail || requestError.message
        : 'Không thể tải tồn kho chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const metrics = useMemo(() => {
    const availableByDrug = new Map<string, number>();
    rows.forEach(row => availableByDrug.set(row.drugId, (availableByDrug.get(row.drugId) ?? 0) + row.availableQuantity));
    return {
      recorded: rows.reduce((sum, row) => sum + row.quantity, 0),
      sellable: rows.reduce((sum, row) => sum + row.availableQuantity, 0),
      expiredLots: rows.filter(row => row.quantity > 0 && isExpired(row)).length,
      outOfStockDrugs: [...availableByDrug.values()].filter(value => value === 0).length,
    };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('vi-VN');
    return rows.filter(row => {
      const matches = !term
        || row.drugName.toLocaleLowerCase('vi-VN').includes(term)
        || row.batchNo.toLocaleLowerCase('vi-VN').includes(term);
      if (!matches) return false;
      if (activeTab === 'expiring') return isExpiring(row);
      if (activeTab === 'expired') return row.quantity > 0 && isExpired(row);
      if (activeTab === 'low') return !isExpired(row) && row.availableQuantity <= LOW_STOCK_THRESHOLD;
      return true;
    });
  }, [activeTab, rows, search]);

  const columns: Column<InventoryRow>[] = [
    { header: 'Thuốc', cell: row => <span className="font-semibold text-ink">{row.drugName}</span> },
    { header: 'Số lô', cell: row => <span className="font-mono text-xs font-semibold text-slate-600">{row.batchNo}</span> },
    { header: 'Hạn sử dụng', cell: row => <FefoExpiryBadge expiryDate={row.expiryDate} size="sm" /> },
    { header: 'Tồn ghi nhận', align: 'right', cell: row => <span className="font-mono font-semibold">{quantity.format(row.quantity)}</span> },
    {
      header: 'Có thể bán', align: 'right', cell: row => (
        <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold ${row.availableQuantity <= LOW_STOCK_THRESHOLD ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20' : 'bg-mint text-forest'}`}>
          {quantity.format(row.availableQuantity)}
        </span>
      ),
    },
  ];

  const tabs: Array<{ id: InventoryTab; label: string; icon: typeof Boxes }> = [
    { id: 'all', label: `Tất cả (${rows.length})`, icon: Boxes },
    { id: 'expiring', label: `Cận hạn ≤ ${EXPIRING_DAYS} ngày`, icon: CalendarClock },
    { id: 'expired', label: 'Đã hết hạn', icon: PackageX },
    { id: 'low', label: `Sắp hết ≤ ${LOW_STOCK_THRESHOLD}`, icon: AlertTriangle },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Tồn kho chi nhánh" description="Theo dõi tồn ghi nhận và số lượng đủ điều kiện bán. Điều chỉnh chênh lệch được thực hiện qua quy trình kiểm kê và OWNER phê duyệt." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} unavailable={Boolean(error)} title="Tồn ghi nhận" value={quantity.format(metrics.recorded)} icon={Boxes} subValue="Tổng đơn vị đang lưu trong kho" />
        <StatCard loading={loading} unavailable={Boolean(error)} title="Có thể bán" value={quantity.format(metrics.sellable)} icon={PackageCheck} subValue="Còn hạn và thuốc đang hoạt động" />
        <StatCard loading={loading} unavailable={Boolean(error)} title="Lô đã hết hạn" value={`${metrics.expiredLots} lô`} icon={PackageX} subValue="Vẫn được giữ trong tồn ghi nhận" />
        <StatCard loading={loading} unavailable={Boolean(error)} title="Thuốc hết hàng" value={`${metrics.outOfStockDrugs} thuốc`} icon={AlertTriangle} subValue="Tổng tồn có thể bán bằng 0" />
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bộ lọc trạng thái tồn kho">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return <button key={tab.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${selected ? 'bg-forest text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={15} />{tab.label}
            </button>;
          })}
        </div>
        <SearchToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm theo tên thuốc hoặc số lô..." onRefresh={() => void loadData()} loading={loading} />
      </div>

      <DataTable
        columns={columns}
        data={visibleRows}
        keyExtractor={row => `${row.drugId}-${row.batchId}`}
        loading={loading}
        loadingText="Đang tải tồn kho chi nhánh..."
        emptyMessage={rows.length ? 'Không có lô thuốc phù hợp bộ lọc.' : 'Chưa có dữ liệu tồn kho.'}
        onRowClick={setSelectedRow}
        rowLabel={row => `Xem chi tiết ${row.drugName}, lô ${row.batchNo}`}
      />

      <Modal isOpen={selectedRow !== null} onClose={() => setSelectedRow(null)} title="Chi tiết lô tồn kho" subtitle="Thông tin chỉ đọc của lô thuốc tại chi nhánh hiện tại." icon={Boxes} maxWidth="lg">
        {selectedRow && <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Thuốc" value={selectedRow.drugName} />
          <Detail label="Số lô" value={selectedRow.batchNo} mono />
          <Detail label="Ngày sản xuất" value={selectedRow.mfgDate ? calendarDate.format(new Date(selectedRow.mfgDate)) : 'Chưa ghi nhận'} />
          <Detail label="Hạn sử dụng" value={calendarDate.format(new Date(selectedRow.expiryDate))} />
          <Detail label="Tồn ghi nhận" value={quantity.format(selectedRow.quantity)} />
          <Detail label="Có thể bán" value={quantity.format(selectedRow.availableQuantity)} />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái hạn dùng</dt>
            <dd className="mt-2"><FefoExpiryBadge expiryDate={selectedRow.expiryDate} /></dd>
          </div>
        </dl>}
      </Modal>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-lg border border-slate-200 px-4 py-3">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className={`mt-1 text-sm font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>;
}
