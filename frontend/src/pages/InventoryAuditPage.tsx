import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type {
  InventoryAudit,
  InventoryAuditDetail,
  CreateInventoryAuditPayload,
  UpdateAuditItemsPayload,
  ReconcileAuditPayload,
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

export function InventoryAuditPage() {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'OWNER';

  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DANG_KIEM' | 'CAN_BANG' | 'DA_HUY'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Create audit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createNote, setCreateNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Detail & Counting Modal
  const [selectedAudit, setSelectedAudit] = useState<InventoryAuditDetail | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [countedQuantities, setCountedQuantities] = useState<Record<string, number>>({});
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
  const [savingCounts, setSavingCounts] = useState(false);
  const [detailActionError, setDetailActionError] = useState('');
  const [detailSuccessMsg, setDetailSuccessMsg] = useState('');

  // Reconcile modal
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileReason, setReconcileReason] = useState('');
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    loadAudits();
  }, []);

  async function loadAudits() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<InventoryAudit[]>('/inventory-audits');
      setAudits(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể tải danh sách kiểm kê kho.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDetail(auditId: string) {
    setDetailActionError('');
    setDetailSuccessMsg('');
    setItemSearchTerm('');
    try {
      const detail = await apiClient<InventoryAuditDetail>(`/inventory-audits/${auditId}`);
      setSelectedAudit(detail);

      // Initialize local state for counted quantities and reasons
      const qMap: Record<string, number> = {};
      const rMap: Record<string, string> = {};
      detail.items.forEach(item => {
        qMap[item.id] = item.actualQuantity;
        rMap[item.id] = item.reason || '';
      });
      setCountedQuantities(qMap);
      setItemReasons(rMap);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể tải chi tiết đợt kiểm kê.');
      }
    }
  }

  async function handleCreateAudit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload: CreateInventoryAuditPayload = {
        note: createNote.trim() || undefined,
      };
      const newAudit = await apiClient<InventoryAuditDetail>('/inventory-audits', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg(`Đã khởi tạo đợt kiểm kê ${newAudit.code} thành công.`);
      setShowCreateModal(false);
      setCreateNote('');
      await loadAudits();

      // Automatically open detail for the newly created audit
      handleOpenDetail(newAudit.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.detail || err.message);
      } else {
        setCreateError('Khởi tạo đợt kiểm kê thất bại.');
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveCounts() {
    if (!selectedAudit) return;
    setSavingCounts(true);
    setDetailActionError('');
    setDetailSuccessMsg('');
    try {
      const payload: UpdateAuditItemsPayload = {
        items: selectedAudit.items.map(item => ({
          itemId: item.id,
          actualQuantity: countedQuantities[item.id] ?? item.systemQuantity,
          reason: itemReasons[item.id]?.trim() || undefined,
        })),
      };

      const updated = await apiClient<InventoryAuditDetail>(`/inventory-audits/${selectedAudit.id}/items`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSelectedAudit(updated);
      setDetailSuccessMsg('Đã lưu kết quả kiểm đếm thực tế thành công.');
      await loadAudits();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailActionError(err.detail || err.message);
      } else {
        setDetailActionError('Lưu kết quả kiểm đếm thất bại.');
      }
    } finally {
      setSavingCounts(false);
    }
  }

  async function handleReconcileSubmit() {
    if (!selectedAudit) return;
    setReconciling(true);
    setDetailActionError('');
    try {
      const payload: ReconcileAuditPayload = {
        reason: reconcileReason.trim() || undefined,
      };
      const reconciled = await apiClient<InventoryAuditDetail>(`/inventory-audits/${selectedAudit.id}/reconcile`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSelectedAudit(reconciled);
      setShowReconcileModal(false);
      setReconcileReason('');
      setSuccessMsg(`Đã duyệt cân đối tồn kho đợt ${reconciled.code} thành công.`);
      await loadAudits();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailActionError(err.detail || err.message);
      } else {
        setDetailActionError('Duyệt cân đối thất bại.');
      }
    } finally {
      setReconciling(false);
    }
  }

  async function handleCancelAudit() {
    if (!selectedAudit) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đợt kiểm kê ${selectedAudit.code}?`)) return;

    setDetailActionError('');
    try {
      const cancelled = await apiClient<InventoryAuditDetail>(`/inventory-audits/${selectedAudit.id}/cancel`, {
        method: 'POST',
      });
      setSelectedAudit(cancelled);
      setSuccessMsg(`Đã hủy đợt kiểm kê ${cancelled.code}.`);
      await loadAudits();
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailActionError(err.detail || err.message);
      } else {
        setDetailActionError('Hủy đợt kiểm kê thất bại.');
      }
    }
  }

  // Filter & Pagination for Main Table
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const matchSearch =
        a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.note && a.note.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [audits, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAudits.length / pageSize) || 1;
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAudits.slice(start, start + pageSize);
  }, [filteredAudits, currentPage]);

  // Filtered items in detail modal
  const filteredDetailItems = useMemo(() => {
    if (!selectedAudit) return [];
    if (!itemSearchTerm.trim()) return selectedAudit.items;
    const q = itemSearchTerm.toLowerCase();
    return selectedAudit.items.filter(
      item =>
        item.drugName.toLowerCase().includes(q) ||
        item.drugCode.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q)
    );
  }, [selectedAudit, itemSearchTerm]);

  // Statistics calculation for detail modal
  const auditSummary = useMemo(() => {
    if (!selectedAudit) return { totalItems: 0, discrepantCount: 0, totalDiffValue: 0, surplusCount: 0, deficitCount: 0 };
    let discrepantCount = 0;
    let totalDiffValue = 0;
    let surplusCount = 0;
    let deficitCount = 0;

    selectedAudit.items.forEach(item => {
      const actual = countedQuantities[item.id] ?? item.actualQuantity;
      const diff = actual - item.systemQuantity;
      if (diff !== 0) {
        discrepantCount++;
        totalDiffValue += diff * item.unitPrice;
        if (diff > 0) surplusCount++;
        else deficitCount++;
      }
    });

    return {
      totalItems: selectedAudit.items.length,
      discrepantCount,
      totalDiffValue,
      surplusCount,
      deficitCount,
    };
  }, [selectedAudit, countedQuantities]);

  const auditColumns: Column<InventoryAudit>[] = [
    {
      header: 'Mã đợt kiểm',
      cell: audit => (
        <span className="font-mono font-bold text-ink">
          {audit.code}
        </span>
      ),
    },
    {
      header: 'Ngày tạo',
      cell: audit => (
        <span className="text-xs text-slate-600">
          {new Date(audit.createdAt).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      header: 'Người lập',
      cell: audit => <span className="font-medium text-slate-700">{audit.createdByName}</span>,
    },
    {
      header: 'Trạng thái',
      cell: audit => {
        if (audit.status === 'CAN_BANG') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Đã cân bằng
            </span>
          );
        }
        if (audit.status === 'DANG_KIEM') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <RefreshCw size={13} className="animate-spin text-amber-600" />
              Đang kiểm kê
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <XCircle size={13} />
            Đã hủy
          </span>
        );
      },
    },
    {
      header: 'Tổng số mục',
      align: 'center',
      cell: audit => <span className="text-center font-semibold text-slate-700">{audit.totalItems}</span>,
    },
    {
      header: 'Chênh lệch',
      cell: audit => (
        <span
          className={`font-semibold ${
            audit.discrepantItems > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {audit.discrepantItems > 0 ? `${audit.discrepantItems} mục lệch` : 'Khớp 100%'}
        </span>
      ),
    },
    {
      header: 'Người duyệt cân đối',
      cell: audit => (
        <span className="text-xs text-slate-500">
          {audit.reconciledByName ? (
            <>
              <div className="font-medium text-slate-700">{audit.reconciledByName}</div>
              {audit.reconciledAt && <div>{new Date(audit.reconciledAt).toLocaleDateString('vi-VN')}</div>}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      align: 'right',
      cell: audit => (
        <button
          onClick={() => handleOpenDetail(audit.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-slate-50"
        >
          <Eye size={14} />
          {audit.status === 'DANG_KIEM' ? 'Kiểm đếm' : 'Chi tiết'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Kiểm kê & Cân đối kho
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khởi tạo đợt kiểm kê, ghi nhận số lượng kiểm đếm thực tế và cân đối số dư kho chi nhánh
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest/90"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo đợt kiểm kê mới
        </button>
      </div>

      {/* Global Alerts */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng đợt kiểm kê"
          value={audits.length}
          subValue="Tất cả các đợt"
          icon={FileSpreadsheet}
          colorTheme="blue"
        />
        <StatCard
          title="Đang kiểm kê"
          value={audits.filter(a => a.status === 'DANG_KIEM').length}
          subValue="Chờ kiểm đếm / cân đối"
          icon={ClipboardCheck}
          colorTheme="amber"
        />
        <StatCard
          title="Đã cân bằng"
          value={audits.filter(a => a.status === 'CAN_BANG').length}
          subValue="Đã chốt tồn kho hợp lệ"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
        <StatCard
          title="Đợt có chênh lệch"
          value={audits.filter(a => a.discrepantItems > 0).length}
          subValue="Có sản phẩm thừa / thiếu"
          icon={SlidersHorizontal}
          colorTheme="purple"
        />
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm mã đợt kiểm, người lập, ghi chú..."
          onRefresh={loadAudits}
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
                <option value="DANG_KIEM">Đang kiểm kê</option>
                <option value="CAN_BANG">Đã cân bằng</option>
                <option value="DA_HUY">Đã hủy</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Audit List Table */}
      <div className="rounded-xl border border-line bg-white shadow-xs">
        <DataTable
          columns={auditColumns}
          data={paginatedAudits}
          keyExtractor={a => a.id}
          loading={loading}
          emptyMessage="Chưa có đợt kiểm kê nào tại chi nhánh."
          pagination={{
            page: currentPage,
            totalPages,
            totalCount: filteredAudits.length,
            pageSize,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modal: Tạo đợt kiểm kê mới */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        title="Khởi tạo đợt kiểm kê kho mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAudit} className="space-y-4">
          {createError && <AlertBanner type="error" message={createError} onClose={() => setCreateError('')} />}

          <div className="rounded-lg bg-blue-50/70 p-3.5 text-xs text-blue-800">
            <p className="font-semibold">Cơ chế chụp ảnh tồn kho (Snapshot):</p>
            <p className="mt-1 leading-relaxed">
              Hệ thống sẽ ghi nhận tức thời số lượng tồn hiện tại của tất cả các lô thuốc đang quản lý tại chi nhánh để làm mốc so sánh với kết quả kiểm đếm thực tế.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Ghi chú đợt kiểm kê
            </label>
            <textarea
              rows={3}
              value={createNote}
              onChange={e => setCreateNote(e.target.value)}
              placeholder="VD: Kiểm kê định kỳ cuối tháng 10, kiểm kê đột xuất theo yêu cầu quản lý..."
              className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={creating}
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-forest/90 disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo đợt kiểm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Chi tiết & Kiểm đếm (Detail & Counting Modal) */}
      <Modal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={`Phiếu kiểm kê: ${selectedAudit?.code || ''}`}
        maxWidth="5xl"
      >
        {selectedAudit && (
          <div className="space-y-5">
            {detailActionError && <AlertBanner type="error" message={detailActionError} onClose={() => setDetailActionError('')} />}
            {detailSuccessMsg && <AlertBanner type="success" message={detailSuccessMsg} onClose={() => setDetailSuccessMsg('')} />}

            {/* Header info cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-line bg-slate-50/70 p-3.5 text-xs">
              <div>
                <span className="text-slate-500">Trạng thái:</span>
                <div className="mt-0.5 font-bold">
                  {selectedAudit.status === 'CAN_BANG' && <span className="text-emerald-700">Đã cân bằng</span>}
                  {selectedAudit.status === 'DANG_KIEM' && <span className="text-amber-700">Đang kiểm kê</span>}
                  {selectedAudit.status === 'DA_HUY' && <span className="text-slate-600">Đã hủy</span>}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Người lập:</span>
                <div className="mt-0.5 font-bold text-slate-800">{selectedAudit.createdByName}</div>
              </div>
              <div>
                <span className="text-slate-500">Thời gian tạo:</span>
                <div className="mt-0.5 font-bold text-slate-800">
                  {new Date(selectedAudit.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Ghi chú:</span>
                <div className="mt-0.5 font-medium text-slate-700 truncate" title={selectedAudit.note || ''}>
                  {selectedAudit.note || '—'}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-line bg-white p-3">
                <span className="text-[11px] font-medium text-slate-500">Tổng mặt hàng</span>
                <div className="text-lg font-bold text-ink">{auditSummary.totalItems}</div>
              </div>
              <div className="rounded-lg border border-line bg-white p-3">
                <span className="text-[11px] font-medium text-slate-500">Mặt hàng lệch</span>
                <div className={`text-lg font-bold ${auditSummary.discrepantCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {auditSummary.discrepantCount}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-white p-3">
                <span className="text-[11px] font-medium text-slate-500">Thừa / Thiếu</span>
                <div className="text-sm font-bold text-slate-700">
                  <span className="text-emerald-600">+{auditSummary.surplusCount}</span> /{' '}
                  <span className="text-rose-600">-{auditSummary.deficitCount}</span>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-white p-3">
                <span className="text-[11px] font-medium text-slate-500">Giá trị lệch</span>
                <div className={`text-base font-bold ${auditSummary.totalDiffValue < 0 ? 'text-rose-600' : auditSummary.totalDiffValue > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {moneyFormatter.format(auditSummary.totalDiffValue)}
                </div>
              </div>
            </div>

            {/* Item search filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={itemSearchTerm}
                  onChange={e => setItemSearchTerm(e.target.value)}
                  placeholder="Lọc thuốc theo tên, mã hoặc số lô trong phiếu..."
                  className="w-full rounded-lg border border-line bg-white pl-9 pr-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-500">
                Hiển thị {filteredDetailItems.length}/{selectedAudit.items.length} mặt hàng
              </span>
            </div>

            {/* Items Table with Live Editing */}
            <div className="max-h-[380px] overflow-auto rounded-xl border border-line">
              <table className="min-w-full divide-y divide-line text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Tên thuốc & Mã</th>
                    <th className="px-3 py-2.5">Số lô / HSD</th>
                    <th className="px-3 py-2.5 text-center">Tồn hệ thống</th>
                    <th className="px-3 py-2.5 text-center w-28">Đếm thực tế</th>
                    <th className="px-3 py-2.5 text-center">Chênh lệch</th>
                    <th className="px-3 py-2.5 text-right">Giá trị lệch</th>
                    <th className="px-3 py-2.5 w-44">Lý do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white text-slate-700">
                  {filteredDetailItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Không tìm thấy mặt hàng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredDetailItems.map(item => {
                      const isEditable = selectedAudit.status === 'DANG_KIEM';
                      const currentCount = countedQuantities[item.id] ?? item.systemQuantity;
                      const diff = currentCount - item.systemQuantity;
                      const diffVal = diff * item.unitPrice;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-ink">{item.drugName}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {item.drugCode} • {item.unit}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-mono font-medium text-slate-800">{item.batchNumber}</div>
                            <div className="text-[10px] text-slate-400">
                              HSD: {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">
                            {item.systemQuantity}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {isEditable ? (
                              <input
                                type="number"
                                min={0}
                                value={currentCount}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10);
                                  setCountedQuantities(prev => ({
                                    ...prev,
                                    [item.id]: isNaN(val) ? 0 : Math.max(0, val),
                                  }));
                                }}
                                className="w-20 rounded border border-line px-2 py-1 text-center font-bold text-ink focus:border-forest focus:outline-none"
                              />
                            ) : (
                              <span className="font-bold text-ink">{item.actualQuantity}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-400">0</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-600 font-bold">+{diff}</span>
                            ) : (
                              <span className="text-rose-600 font-bold">{diff}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {diffVal === 0 ? (
                              <span className="text-slate-400">0 ₫</span>
                            ) : (
                              <span className={diffVal > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {moneyFormatter.format(diffVal)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditable ? (
                              <input
                                type="text"
                                placeholder="Lý do lệch..."
                                value={itemReasons[item.id] || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setItemReasons(prev => ({
                                    ...prev,
                                    [item.id]: val,
                                  }));
                                }}
                                className="w-full rounded border border-line px-2 py-1 text-[11px] focus:border-forest focus:outline-none"
                              />
                            ) : (
                              <span className="text-xs text-slate-600">{item.reason || '—'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Audit Info if reconciled */}
            {selectedAudit.status === 'CAN_BANG' && (
              <div className="rounded-lg bg-emerald-50/70 p-3.5 text-xs text-emerald-800">
                <p className="font-semibold">Đợt kiểm kê đã được duyệt cân đối:</p>
                <p className="mt-1">
                  Người duyệt: <strong>{selectedAudit.reconciledByName}</strong> vào ngày{' '}
                  <strong>{selectedAudit.reconciledAt && new Date(selectedAudit.reconciledAt).toLocaleString('vi-VN')}</strong>.
                  Tồn kho chi nhánh và thẻ kho đã được điều chỉnh tự động.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-line">
              <div>
                {selectedAudit.status === 'DANG_KIEM' && (
                  <button
                    type="button"
                    onClick={handleCancelAudit}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    Hủy đợt kiểm kê này
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAudit(null)}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Đóng
                </button>

                {selectedAudit.status === 'DANG_KIEM' && (
                  <>
                    <button
                      type="button"
                      disabled={savingCounts}
                      onClick={handleSaveCounts}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-mint/50 px-4 py-2 text-xs font-bold text-forest transition hover:bg-mint"
                    >
                      {savingCounts ? 'Đang lưu...' : 'Lưu kết quả đếm'}
                    </button>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => setShowReconcileModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-forest/90"
                      >
                        <CheckCircle2 size={14} />
                        Duyệt cân đối tồn kho
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        (Chỉ Chủ nhà thuốc mới có quyền Duyệt cân đối kho)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Xác nhận duyệt cân đối (Owner Only) */}
      <Modal
        isOpen={showReconcileModal}
        onClose={() => !reconciling && setShowReconcileModal(false)}
        title="Xác nhận duyệt cân đối tồn kho"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3.5 text-xs text-amber-800">
            <p className="font-semibold">Cảnh báo nghiệp vụ an toàn:</p>
            <p className="mt-1 leading-relaxed">
              Hành động này sẽ cập nhật trực tiếp số lượng tồn kho của các lô thuốc theo số lượng thực tế kiểm đếm, đồng thời tự động ghi nhận các giao dịch xuất/nhập điều chỉnh vào thẻ kho.
            </p>
          </div>

          <div className="rounded-lg border border-line p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã đợt kiểm:</span>
              <span className="font-bold text-ink">{selectedAudit?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số lượng mặt hàng chênh lệch:</span>
              <span className="font-bold text-rose-600">{auditSummary.discrepantCount} mặt hàng</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng giá trị điều chỉnh:</span>
              <span className="font-bold text-ink">{moneyFormatter.format(auditSummary.totalDiffValue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Lý do / Phê duyệt của Chủ nhà thuốc:
            </label>
            <textarea
              rows={2}
              value={reconcileReason}
              onChange={e => setReconcileReason(e.target.value)}
              placeholder="VD: Đã đối chiếu camera và xác nhận hao hụt thực tế, đồng ý cân đối tồn kho."
              className="mt-1 w-full rounded-lg border border-line p-2 text-xs focus:border-forest focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={reconciling}
              onClick={() => setShowReconcileModal(false)}
              className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={reconciling}
              onClick={handleReconcileSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-forest/90 disabled:opacity-50"
            >
              {reconciling ? 'Đang cân đối...' : 'Xác nhận & Cân đối kho'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
