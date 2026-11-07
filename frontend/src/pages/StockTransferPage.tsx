import { dateTime, calendarDate } from '../utils/formatters';
import { PageHeader } from '../components/common/PageHeader';
import { loadAllPages } from '../utils/loadAllPages';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type {
  StockTransfer,
  StockTransferDetail,
  CreateStockTransferPayload,
  CreateStockTransferItemPayload,
  Branch,
  InventoryRow,
  Drug,
} from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

type PickerOption = { value: string; label: string; description?: string; searchText?: string };

function SearchablePicker({ value, options, placeholder, disabled, onChange }: {
  value: string;
  options: PickerOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option =>
    `${option.label} ${option.description ?? ''} ${option.searchText ?? ''}`.toLocaleLowerCase('vi')
      .includes(query.trim().toLocaleLowerCase('vi')),
  );

  function choose(nextValue: string) {
    onChange(nextValue);
    setQuery('');
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={open ? query : (selected?.label ?? '')}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setQuery(''); setActiveIndex(0); }}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); setQuery(''); inputRef.current?.blur(); }
          if (event.key === 'ArrowDown' && filtered.length > 0) { event.preventDefault(); setOpen(true); setActiveIndex(index => Math.min(index + 1, filtered.length - 1)); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
          if (event.key === 'Enter' && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex].value); }
        }}
        className="w-full rounded-lg border border-line bg-white p-2 text-xs text-ink focus:border-forest focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
      />
      {open && !disabled && (
        <div id={listId} role="listbox" className="mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-line bg-white p-1 shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">Không tìm thấy lựa chọn phù hợp.</div>
          ) : filtered.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(option.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-xs transition ${index === activeIndex ? 'bg-mint text-forest' : 'hover:bg-slate-50'}`}
            >
              <span className="block font-semibold">{option.label}</span>
              {option.description && <span className="mt-0.5 block text-slate-500">{option.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StockTransferPage() {
  const { currentUser } = useAuth();
  const currentBranchId = currentUser?.branchId;

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'OUTGOING' | 'INCOMING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Detail Modal
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailSuccess, setDetailSuccess] = useState('');
  const [pendingAction, setPendingAction] = useState<'SHIP' | 'RECEIVE' | 'CANCEL' | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Items in Create Modal
  const [availableStock, setAvailableStock] = useState<InventoryRow[]>([]);
  const [drugDict, setDrugDict] = useState<Record<string, Drug>>({});
  const [loadingStock, setLoadingStock] = useState(false);

  // Selected item line inputs
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState('');
  const [stagedItems, setStagedItems] = useState<(CreateStockTransferItemPayload & { drugName: string; drugCode: string; batchNo: string; maxQty: number })[]>([]);

  useEffect(() => {
    loadTransfers();
  }, [directionFilter]);

  async function loadTransfers() {
    setLoading(true);
    setError('');
    try {
      const url = directionFilter === 'ALL'
        ? '/stock-transfers'
        : `/stock-transfers?direction=${directionFilter}`;
      const data = await apiClient<StockTransfer[]>(url);
      setTransfers(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể tải danh sách điều chuyển kho.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDetail(id: string) {
    setDetailError('');
    setDetailSuccess('');
    try {
      const detail = await apiClient<StockTransferDetail>(`/stock-transfers/${id}`);
      setSelectedTransfer(detail);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể tải chi tiết phiếu điều chuyển.');
      }
    }
  }

  async function handleOpenCreateModal() {
    setShowCreateModal(true);
    setCreateError('');
    setTargetBranchId('');
    setTransferNotes('');
    setStagedItems([]);
    setSelectedDrugId('');
    setSelectedBatchId('');
    setInputQuantity(1);
    setItemNote('');

    // Load branch list and current branch available stock
    setLoadingStock(true);
    try {
      const [branchList, invPage, drugPage] = await Promise.all([
        apiClient<Branch[]>('/branches'),
        loadAllPages<InventoryRow>('/inventory'),
        loadAllPages<Drug>('/drugs'),
      ]);

      setBranches(branchList.filter(b => b.id !== currentBranchId));
      const nextDrugDict = Object.fromEntries(drugPage.map(d => [d.drugId, d]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setAvailableStock(invPage.filter(i =>
        i.availableQuantity > 0 &&
        nextDrugDict[i.drugId]?.isActive &&
        new Date(i.expiryDate) >= today,
      ));
      setDrugDict(nextDrugDict);
    } catch (err) {
      setCreateError('Không thể tải danh sách chi nhánh hoặc tồn kho.');
    } finally {
      setLoadingStock(false);
    }
  }

  function handleAddStagedItem() {
    if (!selectedDrugId || !selectedBatchId) return;
    const dId = selectedDrugId;
    const bId = selectedBatchId;
    const stockRow = availableStock.find(s => s.drugId === dId && s.batchId === bId);
    if (!stockRow) return;

    if (inputQuantity <= 0 || inputQuantity > stockRow.availableQuantity) {
      setCreateError(`Số lượng chuyển phải từ 1 đến ${stockRow.availableQuantity}.`);
      return;
    }

    if (stagedItems.some(i => i.drugId === dId && i.batchId === bId)) {
      setCreateError('Mặt hàng và lô này đã có trong danh sách điều chuyển.');
      return;
    }

    const drug = drugDict[dId];
    setStagedItems(prev => [
      ...prev,
      {
        drugId: dId,
        batchId: bId,
        quantity: inputQuantity,
        notes: itemNote.trim() || undefined,
        drugName: drug?.name || dId,
        drugCode: drug?.drugCode || '',
        batchNo: stockRow.batchNo,
        maxQty: stockRow.availableQuantity,
      },
    ]);

    setSelectedDrugId('');
    setSelectedBatchId('');
    setInputQuantity(1);
    setItemNote('');
    setCreateError('');
  }

  function handleRemoveStagedItem(drugId: string, batchId: string) {
    setStagedItems(prev => prev.filter(i => !(i.drugId === drugId && i.batchId === batchId)));
  }

  async function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!targetBranchId) {
      setCreateError('Vui lòng chọn chi nhánh nhận.');
      return;
    }
    if (stagedItems.length === 0) {
      setCreateError('Vui lòng thêm ít nhất một mặt hàng cần điều chuyển.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const payload: CreateStockTransferPayload = {
        toBranchId: targetBranchId,
        notes: transferNotes.trim() || undefined,
        items: stagedItems.map(i => ({
          drugId: i.drugId,
          batchId: i.batchId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      };

      const created = await apiClient<StockTransferDetail>('/stock-transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg(`Đã khởi tạo phiếu điều chuyển ${created.transferNo} thành công.`);
      setShowCreateModal(false);
      await loadTransfers();
      handleOpenDetail(created.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.detail || err.message);
      } else {
        setCreateError('Tạo phiếu điều chuyển thất bại.');
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleShipTransfer() {
    if (!selectedTransfer) return;
    setActionLoading(true);
    setDetailError('');
    try {
      const updated = await apiClient<StockTransferDetail>(`/stock-transfers/${selectedTransfer.id}/ship`, {
        method: 'POST',
      });
      setSelectedTransfer(updated);
      setPendingAction(null);
      setDetailSuccess('Đã xuất kho điều chuyển thành công. Hàng đang trên đường chuyển đến chi nhánh nhận.');
      await loadTransfers();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailError(err.detail || err.message);
      } else {
        setDetailError('Xuất kho thất bại.');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReceiveTransfer() {
    if (!selectedTransfer) return;
    setActionLoading(true);
    setDetailError('');
    try {
      const updated = await apiClient<StockTransferDetail>(`/stock-transfers/${selectedTransfer.id}/receive`, {
        method: 'POST',
      });
      setSelectedTransfer(updated);
      setPendingAction(null);
      setDetailSuccess('Đã tiếp nhận hàng thành công. Tồn kho chi nhánh nhận đã được cập nhật.');
      await loadTransfers();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailError(err.detail || err.message);
      } else {
        setDetailError('Tiếp nhận hàng thất bại.');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelTransfer() {
    if (!selectedTransfer) return;
    setActionLoading(true);
    setDetailError('');
    try {
      const updated = await apiClient<StockTransferDetail>(`/stock-transfers/${selectedTransfer.id}/cancel`, {
        method: 'POST',
      });
      setSelectedTransfer(updated);
      setPendingAction(null);
      setDetailSuccess('Đã hủy phiếu điều chuyển.');
      await loadTransfers();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailError(err.detail || err.message);
      } else {
        setDetailError('Hủy phiếu thất bại.');
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Filtered & Paginated
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        t.transferNo.toLowerCase().includes(q) ||
        t.fromBranchName.toLowerCase().includes(q) ||
        t.toBranchName.toLowerCase().includes(q) ||
        t.createdByName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transfers, searchTerm, statusFilter]);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, directionFilter]);

  const totalPages = Math.ceil(filteredTransfers.length / pageSize) || 1;
  useEffect(() => setCurrentPage(value => Math.min(value, totalPages)), [totalPages]);
  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, currentPage]);

  const transferColumns: Column<StockTransfer>[] = [
    {
      header: 'Mã phiếu',
      cell: t => <span className="font-mono font-bold text-ink">{t.transferNo}</span>,
    },
    {
      header: 'Lộ trình chuyển',
      cell: t => (
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-semibold ${t.fromBranchId === currentBranchId ? 'text-forest font-bold' : 'text-slate-700'}`}>
            {t.fromBranchName}
          </span>
          <ArrowRight size={13} className="text-slate-400 shrink-0" />
          <span className={`font-semibold ${t.toBranchId === currentBranchId ? 'text-forest font-bold' : 'text-slate-700'}`}>
            {t.toBranchName}
          </span>
        </div>
      ),
    },
    {
      header: 'Số lượng chuyển',
      cell: t => (
        <span className="text-xs font-semibold text-slate-700">
          {t.totalItemsCount} mặt hàng ({t.totalQuantity} SP)
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: t => {
        if (t.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Đã nhận hàng
            </span>
          );
        }
        if (t.status === 'IN_TRANSIT') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
              <Truck size={13} />
              Đang vận chuyển
            </span>
          );
        }
        if (t.status === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Clock size={13} />
              Chờ xuất kho
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <XCircle size={13} />
            Đã hủy
          </span>
        );
      },
    },
    {
      header: 'Thời gian tạo',
      cell: t => (
        <span className="text-xs text-slate-500">
          {calendarDate.format(new Date(t.createdDate))}
        </span>
      ),
    },
  ];

  return (
    <div className="ui-page">
      {/* Header */}
      <PageHeader title="Điều chuyển kho" actions={<>
<button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest/90"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo phiếu điều chuyển
        </button>
</>} />

      {/* Global Alerts */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Tổng phiếu chuyển"
          value={transfers.length}
          subValue="Tất cả các chiều"
          icon={ArrowLeftRight}
          colorTheme="blue"
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Chờ xuất kho"
          value={transfers.filter(t => t.status === 'PENDING').length}
          subValue="Chi nhánh gửi chưa xuất"
          icon={Clock}
          colorTheme="amber"
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Đang chuyển hàng"
          value={transfers.filter(t => t.status === 'IN_TRANSIT').length}
          subValue="Đang trên đường vận chuyển"
          icon={Truck}
          colorTheme="purple"
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Đã nhận hoàn tất"
          value={transfers.filter(t => t.status === 'COMPLETED').length}
          subValue="Đã cập nhật tồn kho đích"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
      </div>

      {/* Direction Tabs */}
      <div className="flex border-b border-line gap-4 text-sm font-semibold">
        <button
          onClick={() => setDirectionFilter('ALL')}
          className={`pb-3 px-1 border-b-2 transition ${directionFilter === 'ALL' ? 'border-forest text-forest' : 'border-transparent text-slate-500 hover:text-ink'}`}
        >
          Tất cả phiếu ({transfers.length})
        </button>
        <button
          onClick={() => setDirectionFilter('OUTGOING')}
          className={`pb-3 px-1 border-b-2 transition ${directionFilter === 'OUTGOING' ? 'border-forest text-forest' : 'border-transparent text-slate-500 hover:text-ink'}`}
        >
          Chuyển đi (Gửi từ chi nhánh)
        </button>
        <button
          onClick={() => setDirectionFilter('INCOMING')}
          className={`pb-3 px-1 border-b-2 transition ${directionFilter === 'INCOMING' ? 'border-forest text-forest' : 'border-transparent text-slate-500 hover:text-ink'}`}
        >
          Chuyển đến (Nhận tại chi nhánh)
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm mã phiếu, tên chi nhánh, người lập..."
          onRefresh={loadTransfers}
          loading={loading}
          filterSlot={
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm focus:border-forest focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xuất kho</option>
                <option value="IN_TRANSIT">Đang vận chuyển</option>
                <option value="COMPLETED">Đã nhận hàng</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-white shadow-xs">
        <DataTable
          columns={transferColumns}
          data={paginatedTransfers}
          keyExtractor={t => t.id}
          loading={loading}
          emptyMessage="Không tìm thấy phiếu điều chuyển nào."
          pagination={{
            page: currentPage,
            totalPages,
            totalCount: filteredTransfers.length,
            pageSize,
            onPageChange: setCurrentPage,
          }}
          onRowClick={(transfer) => void handleOpenDetail(transfer.id)}
          rowLabel={(transfer) => `Xem chi tiết phiếu điều chuyển ${transfer.transferNo}`}
        />
      </div>

      {/* Modal: Tạo phiếu điều chuyển mới */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        title="Tạo phiếu điều chuyển hàng sang chi nhánh khác"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          {createError && <AlertBanner type="error" message={createError} onClose={() => setCreateError('')} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Chi nhánh nhận hàng <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1">
                <SearchablePicker
                  value={targetBranchId}
                  placeholder="Tìm và chọn chi nhánh nhận"
                  options={branches.map(branch => ({
                    value: branch.id,
                    label: branch.branchName,
                    description: branch.address || 'Chưa cập nhật địa chỉ',
                  }))}
                  onChange={setTargetBranchId}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Ghi chú điều chuyển</label>
              <input
                type="text"
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
                placeholder="VD: Cân đối tồn kho chi nhánh, bổ sung thuốc thiếu..."
                className="mt-1 w-full rounded-lg border border-line p-2 text-xs focus:border-forest focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Chọn thuốc từ kho để chuyển */}
          <div className="rounded-xl border border-line bg-slate-50/70 p-3.5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chọn thuốc & lô từ kho hiện tại
            </h3>

            {loadingStock ? (
              <div className="py-4 text-center text-xs text-slate-400">Đang tải tồn kho chi nhánh...</div>
            ) : availableStock.length === 0 ? (
              <div className="py-4 text-center text-xs text-rose-500">
                Kho chi nhánh hiện tại không có sản phẩm nào có số lượng tồn khả dụng để chuyển.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <SearchablePicker
                    value={selectedDrugId}
                    placeholder="Tìm theo tên hoặc mã thuốc"
                    options={Array.from(new Set(availableStock.map(stock => stock.drugId))).map(drugId => ({
                      value: drugId,
                      label: drugDict[drugId]?.name ?? 'Thuốc chưa xác định',
                      description: drugDict[drugId]?.drugCode,
                    }))}
                    onChange={drugId => {
                      setSelectedDrugId(drugId);
                      setSelectedBatchId('');
                      setInputQuantity(1);
                    }}
                  />
                </div>

                <div className="sm:col-span-3">
                  <SearchablePicker
                    value={selectedBatchId}
                    disabled={!selectedDrugId}
                    placeholder={selectedDrugId ? 'Chọn lô còn hạn' : 'Chọn thuốc trước'}
                    options={availableStock.filter(stock => stock.drugId === selectedDrugId).map(stock => ({
                      value: stock.batchId,
                      label: `Lô ${stock.batchNo}`,
                      description: `HSD ${calendarDate.format(new Date(stock.expiryDate))} · Khả dụng ${stock.availableQuantity}`,
                      searchText: stock.batchNo,
                    }))}
                    onChange={batchId => {
                      setSelectedBatchId(batchId);
                      setInputQuantity(1);
                    }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={inputQuantity}
                    onChange={e => setInputQuantity(parseInt(e.target.value, 10) || 1)}
                    placeholder="Số lượng"
                    className="w-full rounded-lg border border-line bg-white p-2 text-xs text-center font-bold focus:border-forest focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={itemNote}
                    onChange={e => setItemNote(e.target.value)}
                    placeholder="Ghi chú mặt hàng"
                    className="w-full rounded-lg border border-line bg-white p-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="button"
                    disabled={!selectedDrugId || !selectedBatchId}
                    onClick={handleAddStagedItem}
                    className="w-full rounded-lg bg-forest py-2 text-xs font-bold text-white shadow-sm transition hover:bg-forest/90 disabled:opacity-40"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Staged Items List */}
          <div>
            <div className="flex items-center justify-between pb-1.5 text-xs font-semibold text-slate-700">
              <span>Danh sách mặt hàng sẽ chuyển ({stagedItems.length})</span>
              <span>Tổng số lượng: {stagedItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
            </div>

            <div className="max-h-48 overflow-auto rounded-lg border border-line bg-white">
              <table className="ui-data-table min-w-full divide-y divide-line text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Tên thuốc</th>
                    <th className="px-3 py-2">Số lô</th>
                    <th className="px-3 py-2 text-center">SL chuyển</th>
                    <th className="px-3 py-2">Ghi chú</th>
                    <th className="px-3 py-2 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-slate-700">
                  {stagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                        Chưa chọn mặt hàng nào.
                      </td>
                    </tr>
                  ) : (
                    stagedItems.map(item => (
                      <tr key={`${item.drugId}_${item.batchId}`}>
                        <td className="px-3 py-2 font-medium text-ink">{item.drugName}</td>
                        <td className="px-3 py-2 font-mono text-xs">{item.batchNo}</td>
                        <td className="px-3 py-2 text-center font-bold text-forest">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-500">{item.notes || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(item.drugId, item.batchId)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              disabled={creating}
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating || stagedItems.length === 0 || !targetBranchId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-forest/90 disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Khởi tạo phiếu chuyển'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Chi tiết phiếu điều chuyển */}
      <Modal
        isOpen={!!selectedTransfer}
        onClose={() => {
          if (!pendingAction && !actionLoading) setSelectedTransfer(null);
        }}
        title={`Chi tiết phiếu điều chuyển: ${selectedTransfer?.transferNo || ''}`}
        maxWidth="4xl"
      >
        {selectedTransfer && (
          <div className="space-y-4">
            {detailError && <AlertBanner type="error" message={detailError} onClose={() => setDetailError('')} />}
            {detailSuccess && <AlertBanner type="success" message={detailSuccess} onClose={() => setDetailSuccess('')} />}

            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-line bg-slate-50/70 p-3.5 text-xs">
              <div>
                <span className="text-slate-500">Chi nhánh gửi:</span>
                <div className="mt-0.5 font-bold text-ink">{selectedTransfer.fromBranchName}</div>
              </div>
              <div>
                <span className="text-slate-500">Chi nhánh nhận:</span>
                <div className="mt-0.5 font-bold text-ink">{selectedTransfer.toBranchName}</div>
              </div>
              <div>
                <span className="text-slate-500">Người lập phiếu:</span>
                <div className="mt-0.5 font-bold text-slate-800">{selectedTransfer.createdByName}</div>
              </div>
              <div>
                <span className="text-slate-500">Trạng thái:</span>
                <div className="mt-0.5 font-bold">
                  {selectedTransfer.status === 'COMPLETED' && <span className="text-emerald-700">Đã nhận hàng</span>}
                  {selectedTransfer.status === 'IN_TRANSIT' && <span className="text-purple-700">Đang vận chuyển</span>}
                  {selectedTransfer.status === 'PENDING' && <span className="text-amber-700">Chờ xuất kho</span>}
                  {selectedTransfer.status === 'CANCELLED' && <span className="text-slate-600">Đã hủy</span>}
                </div>
              </div>
            </div>

            {/* Timeline details */}
            <div className="rounded-lg border border-line p-3 text-xs grid grid-cols-1 gap-2 sm:grid-cols-3 bg-white">
              <div>
                <span className="text-slate-500">Ngày tạo:</span>
                <div className="font-medium text-slate-800">{dateTime.format(new Date(selectedTransfer.createdDate))}</div>
              </div>
              <div>
                <span className="text-slate-500">Ngày xuất hàng:</span>
                <div className="font-medium text-slate-800">
                  {selectedTransfer.shippedDate ? `${dateTime.format(new Date(selectedTransfer.shippedDate))} (${selectedTransfer.shippedByName || '—'})` : '—'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Ngày nhận hàng:</span>
                <div className="font-medium text-slate-800">
                  {selectedTransfer.receivedDate ? `${dateTime.format(new Date(selectedTransfer.receivedDate))} (${selectedTransfer.receivedByName || '—'})` : '—'}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="max-h-64 overflow-auto rounded-xl border border-line">
              <table className="ui-data-table min-w-full divide-y divide-line text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">Tên thuốc & Mã</th>
                    <th className="px-3 py-2.5">Số lô & Hạn dùng</th>
                    <th className="px-3 py-2.5 text-center">Đơn vị tính</th>
                    <th className="px-3 py-2.5 text-center">Số lượng</th>
                    <th className="px-3 py-2.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white text-slate-700">
                  {selectedTransfer.items.map(item => (
                    <tr key={`${item.drugId}_${item.batchId}`}>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-ink">{item.drugName}</div>
                        <div className="font-mono text-xs text-slate-400">{item.drugCode}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono font-medium text-slate-800">{item.batchNumber}</div>
                        <div className="text-xs text-slate-400">HSD: {calendarDate.format(new Date(item.expiryDate))}</div>
                      </td>
                      <td className="px-3 py-2 text-center">{item.unit}</td>
                      <td className="px-3 py-2 text-center font-bold text-forest">{item.quantity}</td>
                      <td className="px-3 py-2 text-slate-500">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-line">
              <div>
                {/* Cancel action: only from FromBranch when PENDING */}
                {selectedTransfer.fromBranchId === currentBranchId && selectedTransfer.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setDetailError(''); setPendingAction('CANCEL'); }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    Hủy phiếu điều chuyển này
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTransfer(null)}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>

                {/* Ship action: FromBranch when PENDING */}
                {selectedTransfer.fromBranchId === currentBranchId && selectedTransfer.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setDetailError(''); setPendingAction('SHIP'); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-forest/90 disabled:opacity-50"
                  >
                    <Send size={14} />
                    {actionLoading ? 'Đang xuất...' : 'Xác nhận xuất kho chuyển hàng'}
                  </button>
                )}

                {/* Receive action: ToBranch when IN_TRANSIT */}
                {selectedTransfer.toBranchId === currentBranchId && selectedTransfer.status === 'IN_TRANSIT' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setDetailError(''); setPendingAction('RECEIVE'); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    {actionLoading ? 'Đang nhận...' : 'Xác nhận đã nhận hàng & Nhập kho'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={pendingAction !== null}
        onClose={() => !actionLoading && setPendingAction(null)}
        closeOnOverlayClick={!actionLoading}
        title={pendingAction === 'SHIP' ? 'Xác nhận xuất kho chuyển hàng' : pendingAction === 'RECEIVE' ? 'Xác nhận nhận hàng' : 'Xác nhận hủy phiếu điều chuyển'}
        subtitle={selectedTransfer?.transferNo}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {pendingAction === 'SHIP' && 'Tồn kho khả dụng tại chi nhánh gửi sẽ được kiểm tra lại và trừ khi xuất hàng thành công.'}
            {pendingAction === 'RECEIVE' && 'Xác nhận hàng đã được nhận đủ. Tồn kho tại chi nhánh nhận sẽ được cộng sau khi hệ thống xử lý thành công.'}
            {pendingAction === 'CANCEL' && 'Phiếu sẽ chuyển sang trạng thái đã hủy và không thể tiếp tục xuất kho.'}
          </p>
          {detailError && <AlertBanner type="error" message={detailError} />}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setPendingAction(null)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void (pendingAction === 'SHIP' ? handleShipTransfer() : pendingAction === 'RECEIVE' ? handleReceiveTransfer() : handleCancelTransfer())}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${pendingAction === 'CANCEL' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-forest hover:bg-forest/90'}`}
            >
              {actionLoading ? 'Đang xử lý...' : pendingAction === 'CANCEL' ? 'Xác nhận hủy' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
