import { useEffect, useState } from 'react';
import {
  Building2,
  Eye,
  LoaderCircle,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Trash2,
  Truck,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type {
  CreateGoodsReceiptItemPayload,
  Drug,
  GoodsReceipt,
  PageResult,
  Supplier,
} from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

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
    { drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 },
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
    taxCode: '',
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
        apiClient<PageResult<Drug>>('/drugs?page=1&pageSize=100').catch(() => ({
          items: [],
          page: 1,
          pageSize: 100,
          totalCount: 0,
          totalPages: 0,
        })),
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
    setReceiptItems((prev) => [
      ...prev,
      { drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 },
    ]);
  }

  function handleRemoveItem(index: number) {
    if (receiptItems.length <= 1) return;
    setReceiptItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemChange<K extends keyof CreateGoodsReceiptItemPayload>(
    index: number,
    field: K,
    value: CreateGoodsReceiptItemPayload[K]
  ) {
    setReceiptItems((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  }

  async function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');

    if (!selectedSupplierId) {
      setCreateError('Vui lòng chọn nhà cung cấp.');
      return;
    }

    for (let i = 0; i < receiptItems.length; i++) {
      const it = receiptItems[i];
      if (!it.drugId) {
        setCreateError(`Dòng #${i + 1}: Vui lòng chọn loại thuốc.`);
        return;
      }
      if (!it.batchNo.trim()) {
        setCreateError(`Dòng #${i + 1}: Số lô thuốc không được để trống.`);
        return;
      }
      if (!it.expiryDate) {
        setCreateError(`Dòng #${i + 1}: Hạn dùng thuốc là bắt buộc (FEFO).`);
        return;
      }
      if (it.quantity <= 0) {
        setCreateError(`Dòng #${i + 1}: Số lượng nhập phải lớn hơn 0.`);
        return;
      }
      if (it.importPrice < 0) {
        setCreateError(`Dòng #${i + 1}: Giá nhập không thể âm.`);
        return;
      }
    }

    setCreating(true);
    try {
      await apiClient('/goods-receipts', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          note: receiptNote.trim() || null,
          items: receiptItems.map((item) => ({
            drugId: item.drugId,
            batchNo: item.batchNo.trim().toUpperCase(),
            expiryDate: item.expiryDate,
            mfgDate: item.mfgDate || null,
            quantity: Number(item.quantity),
            importPrice: Number(item.importPrice),
          })),
        }),
      });

      setShowCreateModal(false);
      setSelectedSupplierId('');
      setReceiptNote('');
      setReceiptItems([{ drugId: '', batchNo: '', expiryDate: '', mfgDate: '', quantity: 10, importPrice: 0 }]);
      await loadData();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail || err.message : 'Tạo phiếu nhập kho thất bại.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSupplierError('');

    if (!newSupplier.supplierCode.trim() || !newSupplier.supplierName.trim()) {
      setSupplierError('Mã nhà cung cấp và Tên công ty là bắt buộc.');
      return;
    }

    setCreatingSupplier(true);
    try {
      const created = await apiClient<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          supplierCode: newSupplier.supplierCode.trim().toUpperCase(),
          supplierName: newSupplier.supplierName.trim(),
          contactPerson: newSupplier.contactPerson.trim() || null,
          phoneNumber: newSupplier.phoneNumber.trim() || null,
          email: newSupplier.email.trim() || null,
          address: newSupplier.address.trim() || null,
          taxCode: newSupplier.taxCode.trim() || null,
        }),
      });

      setSuppliers((prev) => [created, ...prev]);
      setSelectedSupplierId(created.id);
      setShowSupplierModal(false);
      setNewSupplier({
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
        taxCode: '',
      });
    } catch (err) {
      setSupplierError(err instanceof ApiError ? err.detail || err.message : 'Tạo nhà cung cấp thất bại.');
    } finally {
      setCreatingSupplier(false);
    }
  }

  const filteredReceipts = receipts.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.receiptNo.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      (r.warehouseStaffName && r.warehouseStaffName.toLowerCase().includes(q))
    );
  });

  const totalReceiptAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  const columns: Column<GoodsReceipt>[] = [
    {
      header: 'Mã Phiếu',
      cell: (r) => <span className="font-mono font-bold text-ink">{r.receiptNo}</span>,
    },
    {
      header: 'Ngày Nhập',
      cell: (r) => <span className="text-slate-500">{dateTime.format(new Date(r.createdDate))}</span>,
    },
    {
      header: 'Nhà Cung Cấp',
      cell: (r) => <span className="font-semibold text-slate-900">{r.supplierName}</span>,
    },
    {
      header: 'Người Tiếp Nhận',
      cell: (r) => <span className="text-slate-600">{r.warehouseStaffName || 'Thủ kho'}</span>,
    },
    {
      header: 'Tổng Tiền',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink font-display">{money.format(r.totalAmount)}</span>,
    },
    {
      header: 'Trạng Thái',
      align: 'center',
      cell: (r) => (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          {r.status === 'COMPLETED' ? 'Đã nhập kho' : r.status}
        </span>
      ),
    },
    {
      header: 'Hành Động',
      align: 'right',
      cell: (r) => (
        <button
          type="button"
          onClick={() => handleViewDetail(r.id)}
          disabled={loadingDetailId === r.id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          {loadingDetailId === r.id ? <LoaderCircle size={13} className="animate-spin" /> : <Eye size={13} />}
          <span>Xem chi tiết</span>
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Nhập Kho Thuốc
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiếp nhận lô hàng từ nhà cung cấp, kiểm tra hạn dùng FEFO và tự động cộng dồn tồn kho chi nhánh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSupplierError('');
              setShowSupplierModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Building2 size={16} className="text-slate-500" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-forest/90 cursor-pointer"
          >
            <PackagePlus size={16} />
            <span>Tạo Phiếu Nhập Kho</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Tổng phiếu nhập"
          value={receipts.length}
          icon={ReceiptText}
          badge={{ text: 'Toàn kỳ', variant: 'info' }}
        />
        <StatCard
          title="Tổng giá trị nhập"
          value={money.format(totalReceiptAmount)}
          icon={Truck}
          badge={{ text: 'Vốn lưu kho', variant: 'info' }}
        />
        <StatCard
          title="Nhà cung cấp"
          value={`${suppliers.length} đối tác`}
          icon={Building2}
          badge={{ text: 'Hợp đồng active', variant: 'success' }}
        />
      </div>

      {/* Alerts */}
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Search Toolbar */}
      <SearchToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo số phiếu, tên nhà cung cấp..."
        onRefresh={loadData}
        loading={loading}
      />

      {/* Receipts DataTable */}
      <DataTable
        columns={columns}
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        loading={loading}
        loadingText="Đang tải danh sách phiếu nhập kho..."
        emptyMessage="Chưa có phiếu nhập kho nào. Bấm nút 'Tạo Phiếu Nhập Kho' để tiếp nhận lô thuốc mới."
      />

      {/* MODAL: CHI TIẾT PHIẾU NHẬP KHO */}
      <Modal
        isOpen={selectedReceipt !== null}
        onClose={() => setSelectedReceipt(null)}
        title="Chi Tiết Phiếu Nhập Kho"
        subtitle={selectedReceipt ? `Mã phiếu: ${selectedReceipt.receiptNo}` : undefined}
        icon={ReceiptText}
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer size={15} />
              <span>In Phiếu Nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        }
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-4">
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
              <p className="text-xs italic text-slate-500">
                <span className="font-semibold text-slate-600">Ghi chú:</span> {selectedReceipt.note}
              </p>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Mã / Tên Thuốc</th>
                    <th className="p-3">Số Lô</th>
                    <th className="p-3">Hạn Dùng</th>
                    <th className="p-3 text-center">Số Lượng</th>
                    <th className="p-3 text-right">Đơn Giá Nhập</th>
                    <th className="p-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReceipt.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-ink">
                        {item.drugName}
                        <span className="block font-mono text-[10px] text-slate-400">{item.drugCode}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{item.batchNo}</td>
                      <td className="p-3 text-slate-600">{dateTime.format(new Date(item.expiryDate))}</td>
                      <td className="p-3 text-center font-bold text-ink">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{money.format(item.importPrice)}</td>
                      <td className="p-3 text-right font-mono font-bold text-forest">{money.format(item.subTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50/50 font-bold">
                  <tr>
                    <td colSpan={5} className="p-3 text-right text-slate-700">
                      Tổng giá trị nhập kho:
                    </td>
                    <td className="p-3 text-right font-display text-sm text-forest">
                      {money.format(selectedReceipt.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: TẠO PHIẾU NHẬP KHO */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Lập Phiếu Nhập Kho Mới"
        subtitle="Tiếp nhận thuốc, số lô và cập nhật hạn sử dụng FEFO vào kho."
        icon={PackagePlus}
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-5">
          <AlertBanner type="error" message={createError} onClose={() => setCreateError('')} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Nhà Cung Cấp Đối Tác <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierName} ({s.supplierCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Ghi Chú Đơn Hàng / Số Hóa Đơn NCC</label>
              <input
                type="text"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="ví dụ: Nhập bổ sung theo HĐ đỏ số 004921"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Chi Tiết Lô Thuốc Tiếp Nhận ({receiptItems.length} mục)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forest hover:bg-mint transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm Dòng</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {receiptItems.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Thuốc</label>
                    <select
                      required
                      value={item.drugId}
                      onChange={(e) => handleItemChange(idx, 'drugId', e.target.value)}
                      className="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">-- Chọn thuốc --</option>
                      {drugs.map((d) => (
                        <option key={d.drugId} value={d.drugId}>
                          {d.name} ({d.drugCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Số Lô</label>
                    <input
                      type="text"
                      required
                      placeholder="LÔ-01"
                      value={item.batchNo}
                      onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)}
                      className="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Hạn Dùng (FEFO)</label>
                    <input
                      type="date"
                      required
                      value={item.expiryDate}
                      onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                      className="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Số Lượng</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-center font-bold"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Giá Nhập (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={item.importPrice}
                      onChange={(e) => handleItemChange(idx, 'importPrice', Number(e.target.value))}
                      className="mt-0.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-right font-mono"
                    />
                  </div>

                  {receiptItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="mt-4 sm:mt-3.5 p-1.5 text-rose-500 hover:text-rose-700"
                      title="Xóa dòng này"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {creating ? <LoaderCircle size={14} className="animate-spin" /> : <PackagePlus size={14} />}
              <span>{creating ? 'Đang tạo phiếu...' : 'Xác Nhận Nhập Kho'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: THÊM NHÀ CUNG CẤP */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Thêm Nhà Cung Cấp Mới"
        subtitle="Khai báo đối tác phân phối dược phẩm cho chuỗi."
        icon={Building2}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <AlertBanner type="error" message={supplierError} onClose={() => setSupplierError('')} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Mã Nhà Cung Cấp *</label>
              <input
                type="text"
                required
                placeholder="NCC005"
                value={newSupplier.supplierCode}
                onChange={(e) => setNewSupplier((p) => ({ ...p, supplierCode: e.target.value.toUpperCase() }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:border-forest focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Mã Số Thuế</label>
              <input
                type="text"
                placeholder="0300123456"
                value={newSupplier.taxCode}
                onChange={(e) => setNewSupplier((p) => ({ ...p, taxCode: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-forest focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Tên Doanh Nghiệp / Đơn Vị *</label>
            <input
              type="text"
              required
              placeholder="Công ty CP Dược Phẩm..."
              value={newSupplier.supplierName}
              onChange={(e) => setNewSupplier((p) => ({ ...p, supplierName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Người Liên Hệ</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={newSupplier.contactPerson}
                onChange={(e) => setNewSupplier((p) => ({ ...p, contactPerson: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Số Điện Thoại</label>
              <input
                type="tel"
                placeholder="028 1234 5678"
                value={newSupplier.phoneNumber}
                onChange={(e) => setNewSupplier((p) => ({ ...p, phoneNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Địa Chỉ Trụ Sở</label>
            <input
              type="text"
              placeholder="Số ..., Phường ..., Quận ..."
              value={newSupplier.address}
              onChange={(e) => setNewSupplier((p) => ({ ...p, address: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSupplierModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creatingSupplier}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {creatingSupplier ? <LoaderCircle size={14} className="animate-spin" /> : <Building2 size={14} />}
              <span>{creatingSupplier ? 'Đang lưu...' : 'Lưu Nhà Cung Cấp'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
