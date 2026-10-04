import { useEffect, useState } from 'react';
import { 
  Building2, 
  CircleAlert, 
  Eye, 
  LoaderCircle, 
  PackagePlus, 
  Plus, 
  Printer, 
  ReceiptText, 
  RefreshCw, 
  Trash2, 
  Truck, 
  X 
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { 
  CreateGoodsReceiptItemPayload, 
  Drug, 
  GoodsReceipt, 
  PageResult, 
  Supplier 
} from '../types';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export function GoodsReceiptPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // View Detail Modal
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  // Create Goods Receipt Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptItems, setReceiptItems] = useState<CreateGoodsReceiptItemPayload[]>([
    { drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 }
  ]);

  // Create Quick Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [supplierError, setSupplierError] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    taxCode: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [receiptData, supplierData, drugData] = await Promise.all([
        apiClient<GoodsReceipt[]>('/goods-receipts'),
        apiClient<Supplier[]>('/suppliers'),
        apiClient<PageResult<Drug>>('/drugs?page=1&pageSize=100').catch(() => ({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 }))
      ]);
      setReceipts(receiptData || []);
      setSuppliers(supplierData || []);
      setDrugs(drugData?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || err.message : 'Không thể tải dữ liệu nhập kho.');
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetail(receiptId: string) {
    setLoadingDetailId(receiptId);
    try {
      const detail = await apiClient<GoodsReceipt>(`/goods-receipts/${encodeURIComponent(receiptId)}`);
      setSelectedReceipt(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || err.message : 'Không thể tải chi tiết phiếu nhập.');
    } finally {
      setLoadingDetailId(null);
    }
  }

  function handleAddItem() {
    setReceiptItems(prev => [
      ...prev,
      { drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 }
    ]);
  }

  function handleRemoveItem(index: number) {
    if (receiptItems.length <= 1) return;
    setReceiptItems(prev => prev.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof CreateGoodsReceiptItemPayload, value: any) {
    setReceiptItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');

    if (!selectedSupplierId) {
      setCreateError('Vui lòng chọn nhà cung cấp.');
      return;
    }

    if (receiptItems.length === 0) {
      setCreateError('Phiếu nhập phải có ít nhất 1 sản phẩm.');
      return;
    }

    for (let i = 0; i < receiptItems.length; i++) {
      const it = receiptItems[i];
      if (!it.drugId) {
        setCreateError(`Dòng ${i + 1}: Vui lòng chọn thuốc.`);
        return;
      }
      if (!it.batchNo.trim()) {
        setCreateError(`Dòng ${i + 1}: Vui lòng nhập số lô.`);
        return;
      }
      if (!it.expiryDate) {
        setCreateError(`Dòng ${i + 1}: Vui lòng nhập ngày hết hạn.`);
        return;
      }
      if (it.quantity <= 0) {
        setCreateError(`Dòng ${i + 1}: Số lượng phải lớn hơn 0.`);
        return;
      }
      if (it.importPrice < 0) {
        setCreateError(`Dòng ${i + 1}: Đơn giá nhập không thể âm.`);
        return;
      }
    }

    setCreating(true);
    try {
      await apiClient('/goods-receipts', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          note: receiptNote || undefined,
          items: receiptItems.map(it => ({
            drugId: it.drugId,
            batchNo: it.batchNo.trim(),
            expiryDate: it.expiryDate,
            mfgDate: it.mfgDate || undefined,
            quantity: Number(it.quantity),
            importPrice: Number(it.importPrice)
          }))
        })
      });

      setShowCreateModal(false);
      setReceiptItems([{ drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 }]);
      setReceiptNote('');
      setSelectedSupplierId('');
      await loadData();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail || err.message : 'Tạo phiếu nhập thất bại.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSupplierError('');

    if (!newSupplier.supplierCode.trim() || !newSupplier.supplierName.trim()) {
      setSupplierError('Mã NCC và Tên NCC là bắt buộc.');
      return;
    }

    setCreatingSupplier(true);
    try {
      const created = await apiClient<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(newSupplier)
      });
      setSuppliers(prev => [...prev, created]);
      setSelectedSupplierId(created.id);
      setShowSupplierModal(false);
      setNewSupplier({
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
        taxCode: ''
      });
    } catch (err) {
      setSupplierError(err instanceof ApiError ? err.detail || err.message : 'Thêm nhà cung cấp thất bại.');
    } finally {
      setCreatingSupplier(false);
    }
  }

  const filteredReceipts = receipts.filter(r => 
    r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    r.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceiptAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  const modalReceiptTotal = receiptItems.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.importPrice) || 0), 
    0
  );

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Quản Lý Nhập Kho
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiếp nhận lô thuốc từ nhà cung cấp, tự động tăng tồn kho chi nhánh và lưu vết kiểm toán.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Building2 size={16} className="text-slate-500" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-forest/90"
          >
            <PackagePlus size={16} />
            <span>Tạo Phiếu Nhập Kho</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng phiếu nhập</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-forest">
              <ReceiptText size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{receipts.length}</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng giá trị nhập</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <Truck size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{money.format(totalReceiptAmount)}</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhà cung cấp</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Building2 size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{suppliers.length} đối tác</p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <CircleAlert size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo số phiếu, tên nhà cung cấp..."
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
          />
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <LoaderCircle size={18} className="animate-spin text-forest" />
            <span>Đang tải danh sách phiếu nhập kho...</span>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <PackagePlus size={36} className="text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-ink">Chưa có phiếu nhập kho nào</p>
            <p className="mt-1 text-xs text-slate-400">Bấm nút "Tạo Phiếu Nhập Kho" để bắt đầu tiếp nhận lô thuốc mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 font-semibold text-slate-600">
                  <th className="px-4 py-3.5">Mã Phiếu</th>
                  <th className="px-4 py-3.5">Ngày Nhập</th>
                  <th className="px-4 py-3.5">Nhà Cung Cấp</th>
                  <th className="px-4 py-3.5">Người Tiếp Nhận</th>
                  <th className="px-4 py-3.5 text-right">Tổng Tiền</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredReceipts.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-ink">{r.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-500">{dateTime.format(new Date(r.createdDate))}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.supplierName}</td>
                    <td className="px-4 py-3 text-slate-600">{r.warehouseStaffName || 'Thủ kho'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{money.format(r.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {r.status === 'COMPLETED' ? 'Đã nhập kho' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetail(r.id)}
                        disabled={loadingDetailId === r.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                      >
                        {loadingDetailId === r.id ? <LoaderCircle size={13} className="animate-spin" /> : <Eye size={13} />}
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT PHIẾU NHẬP KHO                                            */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-line bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-mint text-forest">
                  <ReceiptText size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-ink">Chi Tiết Phiếu Nhập Kho</h2>
                  <p className="font-mono text-xs text-slate-500">{selectedReceipt.receiptNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6">
              {/* Receipt Info Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-slate-50/70 p-4 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</span>
                  <p className="mt-1 font-semibold text-ink">{selectedReceipt.supplierName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian tạo</span>
                  <p className="mt-1 text-slate-700">{dateTime.format(new Date(selectedReceipt.createdDate))}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Người lập phiếu</span>
                  <p className="mt-1 text-slate-700">{selectedReceipt.warehouseStaffName || 'Thủ kho'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</span>
                  <p className="mt-1 font-semibold text-emerald-700">Đã cập nhật kho</p>
                </div>
              </div>

              {selectedReceipt.note && (
                <p className="mt-3 text-xs italic text-slate-500">
                  <span className="font-semibold text-slate-600">Ghi chú:</span> {selectedReceipt.note}
                </p>
              )}

              {/* Items Table */}
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục thuốc nhập</h3>
              <div className="mt-2 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-slate-50 font-semibold text-slate-600">
                      <th className="px-3.5 py-2.5">Mã / Tên Thuốc</th>
                      <th className="px-3.5 py-2.5">Số Lô</th>
                      <th className="px-3.5 py-2.5">Hạn Dùng</th>
                      <th className="px-3.5 py-2.5 text-right">Số Lượng</th>
                      <th className="px-3.5 py-2.5 text-right">Giá Nhập</th>
                      <th className="px-3.5 py-2.5 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {selectedReceipt.items.map(it => (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2.5">
                          <p className="font-semibold text-ink">{it.drugName}</p>
                          <p className="font-mono text-[11px] text-slate-400">{it.drugCode}</p>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-700">{it.batchNo}</td>
                        <td className="px-3.5 py-2.5 text-slate-600">
                          {new Date(it.expiryDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-medium text-ink">{it.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">{money.format(it.importPrice)}</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-forest">{money.format(it.subTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-slate-50/90 font-bold">
                      <td colSpan={5} className="px-3.5 py-3 text-right text-xs uppercase tracking-wide text-slate-600">Tổng cộng</td>
                      <td className="px-3.5 py-3 text-right font-display text-sm text-forest">{money.format(selectedReceipt.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line bg-slate-50/50 px-6 py-4">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Printer size={15} />
                <span>In Phiếu Nhập</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO PHIẾU NHẬP KHO MỚI                                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-forest text-white">
                  <PackagePlus size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-ink">Lập Phiếu Nhập Kho</h2>
                  <p className="text-xs text-slate-500">Ghi nhận tăng tồn kho và tự động tạo lô thuốc mới.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReceipt} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {createError && (
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                    <CircleAlert size={16} className="shrink-0 text-rose-600" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Supplier & Note Header Inputs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Nhà Cung Cấp <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                    >
                      <option value="">-- Chọn Nhà Cung Cấp --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.supplierName} ({s.supplierCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Ghi chú phiếu nhập</label>
                    <input
                      type="text"
                      value={receiptNote}
                      onChange={e => setReceiptNote(e.target.value)}
                      placeholder="Nhập bổ sung định kỳ, kiểm hàng..."
                      className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Danh mục thuốc tiếp nhận</h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-forest shadow-2xs hover:bg-slate-50"
                    >
                      <Plus size={14} />
                      <span>Thêm thuốc</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {receiptItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-slate-50/60 p-3.5 sm:grid-cols-12 sm:items-end"
                      >
                        {/* Drug selection */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600">Thuốc</label>
                          <select
                            value={item.drugId}
                            onChange={e => handleItemChange(index, 'drugId', e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-forest focus:outline-hidden"
                          >
                            <option value="">-- Chọn thuốc --</option>
                            {drugs.map(d => (
                              <option key={d.drugId} value={d.drugId}>
                                {d.name} ({d.drugCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Batch No */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600">Số lô</label>
                          <input
                            type="text"
                            value={item.batchNo}
                            onChange={e => handleItemChange(index, 'batchNo', e.target.value)}
                            placeholder="LÔ-01"
                            required
                            className="mt-1 w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-forest focus:outline-hidden"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600">Hạn dùng</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={e => handleItemChange(index, 'expiryDate', e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink focus:border-forest focus:outline-hidden"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-slate-600">SL</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink focus:border-forest focus:outline-hidden"
                          />
                        </div>

                        {/* Import Price */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600">Giá nhập (₫)</label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.importPrice}
                            onChange={e => handleItemChange(index, 'importPrice', e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink focus:border-forest focus:outline-hidden"
                          />
                        </div>

                        {/* Delete row */}
                        <div className="flex justify-end sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={receiptItems.length <= 1}
                            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                            title="Xóa dòng"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Subtotal Bar */}
                <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-mint/50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest">Tổng tiền dự kiến</span>
                  <span className="font-display text-xl font-bold text-forest">{money.format(modalReceiptTotal)}</span>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-line bg-slate-50/50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-forest/90 disabled:opacity-50"
                >
                  {creating && <LoaderCircle size={15} className="animate-spin" />}
                  <span>Xác Nhận Nhập Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM NHANH NHÀ CUNG CẤP                                            */}
      {/* ========================================================================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Building2 size={18} className="text-forest" />
                <h2 className="font-display text-sm font-bold text-ink">Thêm Nhà Cung Cấp Mới</h2>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6">
              {supplierError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  {supplierError}
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700">Mã NCC <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newSupplier.supplierCode}
                    onChange={e => setNewSupplier(prev => ({ ...prev, supplierCode: e.target.value }))}
                    placeholder="VD: DHG, TRAPHACO"
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Tên Nhà Cung Cấp <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newSupplier.supplierName}
                    onChange={e => setNewSupplier(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="VD: Công ty CP Dược Hậu Giang"
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700">Người liên hệ</label>
                    <input
                      type="text"
                      value={newSupplier.contactPerson}
                      onChange={e => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Số điện thoại</label>
                    <input
                      type="text"
                      value={newSupplier.phoneNumber}
                      onChange={e => setNewSupplier(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="0901234567"
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Địa chỉ</label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={e => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Số 10 Hàm Nghi, Q.1, TP.HCM"
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  disabled={creatingSupplier}
                  className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingSupplier}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {creatingSupplier && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Lưu Nhà Cung Cấp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
