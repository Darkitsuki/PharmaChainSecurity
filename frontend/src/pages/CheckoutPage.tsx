import { calendarDate } from '../utils/formatters';
import { money } from '../utils/formatters';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Banknote, CalendarDays, Check, LoaderCircle, PackageCheck, Plus, Printer, QrCode, Search, ShoppingBag, User, UserPlus, X } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { AvailableInventory, CheckoutResponse, Drug, DrugBatch, PageResult, Customer, CreateCustomerPayload } from '../types';
import { useAuth } from '../context/AuthContext';
import { ReceiptPrintModal, type ReceiptData } from '../components/invoices/ReceiptPrintModal';
import { Modal } from '../components/common';
import { generateUUID } from '../utils';

interface CartLine {
  drug: Drug;
  batch: DrugBatch;
  quantity: number;
}



export function CheckoutPage() {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [batches, setBatches] = useState<DrugBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(true);
  const [availableByDrug, setAvailableByDrug] = useState<Map<string, number>>(new Map());
  const [inventoryStatus, setInventoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<CheckoutResponse | null>(null);
  const [printReceiptData, setPrintReceiptData] = useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const idempotencyKey = useRef(generateUUID());

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerPayload>({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerModalError, setCustomerModalError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferNotice, setShowTransferNotice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const loadAvailableInventory = useCallback(async () => {
    setInventoryStatus('loading');
    try {
      const result = await apiClient<AvailableInventory[]>('/inventory/available-by-drug');
      setAvailableByDrug(new Map(result.map((item) => [item.drugId, item.availableQuantity])));
      setInventoryStatus('ready');
    } catch {
      setAvailableByDrug(new Map());
      setInventoryStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadAvailableInventory();
  }, [loadAvailableInventory]);

  // Search Drugs
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoadingDrugs(true);
      const query = new URLSearchParams({ page: '1', pageSize: '100' });
      if (search.trim()) query.set('search', search.trim());
      apiClient<PageResult<Drug>>(`/drugs?${query.toString()}`)
        .then((result) => { if (active) setDrugs(result.items); })
        .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.message : 'Could not load medicines.'); })
        .finally(() => { if (active) setIsLoadingDrugs(false); });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  // Load Batches
  useEffect(() => {
    if (!selectedDrug) {
      setBatches([]);
      setSelectedBatchId('');
      return;
    }
    let active = true;
    setIsLoadingBatches(true);
    setSelectedBatchId('');
    apiClient<DrugBatch[]>(`/drugs/${encodeURIComponent(selectedDrug.drugId)}/batches`)
      .then((result) => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        const eligible = result
          .filter((batch) => batch.stockQuantity > 0 && batch.expiryDate.slice(0, 10) >= today)
          .sort((left, right) => left.expiryDate.localeCompare(right.expiryDate));
        setBatches(eligible);
        setSelectedBatchId(eligible[0]?.batchId ?? '');
        window.requestAnimationFrame(() => quantityInputRef.current?.focus());
      })
      .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.message : 'Could not load batches.'); })
      .finally(() => { if (active) setIsLoadingBatches(false); });
    return () => { active = false; };
  }, [selectedDrug]);

  // Search Customers by Phone/Name
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setIsSearchingCustomer(true);
      const query = new URLSearchParams({ search: customerSearch.trim() });
      apiClient<Customer[]>(`/customers?${query.toString()}`)
        .then((res) => {
          if (active) {
            setCustomerResults(res);
            setShowCustomerDropdown(true);
          }
        })
        .catch(() => {
          if (active) setCustomerResults([]);
        })
        .finally(() => {
          if (active) setIsSearchingCustomer(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerSearch]);

  const selectedBatch = batches.find((batch) => batch.batchId === selectedBatchId) ?? null;
  const total = cart.reduce((sum, line) => sum + line.drug.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function addToCart() {
    if (!selectedDrug || !selectedBatch || quantity < 1 || quantity > selectedBatch.stockQuantity) return;
    setError('');
    const existingIndex = cart.findIndex((line) => line.drug.drugId === selectedDrug.drugId && line.batch.batchId === selectedBatch.batchId);
    if (existingIndex >= 0 && cart[existingIndex].quantity + quantity > selectedBatch.stockQuantity) {
      setError(existingIndex < 0 ? '' : 'Số lượng yêu cầu vượt quá tồn kho của lô đã chọn.');
      return;
    }
    setCart(existingIndex < 0
      ? [...cart, { drug: selectedDrug, batch: selectedBatch, quantity }]
      : cart.map((line, index) => index === existingIndex ? { ...line, quantity: line.quantity + quantity } : line));
    setSelectedDrug(null);
    setQuantity(1);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function updateQuantity(index: number, nextQuantity: number) {
    setCart((current) => current.flatMap((line, lineIndex) => {
      if (lineIndex !== index) return [line];
      if (nextQuantity <= 0) return [];
      if (nextQuantity > line.batch.stockQuantity) return [line];
      return [{ ...line, quantity: nextQuantity }];
    }));
  }

  async function submitCheckout() {
    if (!cart.length) return;
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiClient<CheckoutResponse>('/checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({
          customerId: selectedCustomer?.id ?? null,
          paymentMethod: 'CASH',
          lines: cart.map(({ drug, batch, quantity: lineQuantity }) => ({
            drugId: drug.drugId,
            batchId: batch.batchId,
            quantity: lineQuantity,
          })),
        }),
      });

      // Lưu dữ liệu để in hóa đơn bán lẻ K80
      setPrintReceiptData({
        invoiceNumber: response.invoiceNumber,
        invoiceId: response.invoiceId,
        createdDate: new Date().toISOString(),
        branchName: currentUser?.branchName,
        cashierName: currentUser?.fullName || currentUser?.username,
        customerName: response.customerName || selectedCustomer?.fullName,
        customerPhone: selectedCustomer?.phoneNumber,
        items: cart.map(line => ({
          drugName: line.drug.name,
          drugCode: line.drug.drugCode,
          batchNo: line.batch.batchNo,
          unit: line.drug.unit,
          quantity: line.quantity,
          unitPrice: line.drug.price,
          subTotal: line.drug.price * line.quantity,
        })),
        totalAmount: response.totalAmount,
        signatureHash: response.hashValueSha256,
      });

      setReceipt(response);
      setShowPaymentModal(false);
      setCart([]);
      idempotencyKey.current = generateUUID();
      void loadAvailableInventory();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể hoàn tất thanh toán hóa đơn.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomer.fullName.trim() || !newCustomer.phoneNumber.trim()) {
      setCustomerModalError('Vui lòng nhập Họ tên và Số điện thoại khách hàng.');
      return;
    }
    setCustomerModalError('');
    setIsCreatingCustomer(true);
    try {
      const created = await apiClient<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });
      setSelectedCustomer(created);
      setShowCreateCustomerModal(false);
      setCustomerSearch('');
      setShowCustomerDropdown(false);
      setNewCustomer({ fullName: '', phoneNumber: '', email: '', address: '' });
    } catch (err) {
      setCustomerModalError(err instanceof ApiError ? err.detail || err.message : 'Không thể tạo khách hàng.');
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">Bán hàng tại quầy</h1>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button onClick={() => setError('')} aria-label="Bỏ qua thông báo"><X size={16} /></button>
        </div>
      )}

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* Left Column: Medicine Catalog */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-extrabold text-ink">
              Danh mục thuốc <span className="ml-1 font-sans text-xs font-medium text-slate-400">({drugs.length} mặt hàng)</span>
            </h2>
            <label className="relative block w-full sm:w-[280px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                ref={searchInputRef}
                placeholder="Tìm thuốc theo tên..."
                className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none"
              />
            </label>
          </div>

          {isLoadingDrugs ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={17} className="animate-spin" /> Đang tải danh mục thuốc...
            </div>
          ) : drugs.length ? (
            <div className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
              <div className="hidden grid-cols-[minmax(0,1.6fr)_80px_110px_120px] gap-3 border-b border-line bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:grid">
                <span>Tên thuốc</span><span>ĐVT</span><span className="text-right">Đơn giá</span><span className="text-right">Tồn khả dụng</span>
              </div>
              {inventoryStatus === 'error' && (
                <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <span>Không thể xác minh tồn kho. Tạm thời không thể chọn thuốc để bán.</span>
                  <button type="button" onClick={() => void loadAvailableInventory()} className="shrink-0 font-bold underline underline-offset-2">Tải lại</button>
                </div>
              )}
              {drugs.map((drug) => {
                const available = availableByDrug.get(drug.drugId) ?? 0;
                const isUnknown = inventoryStatus !== 'ready';
                const isInactive = drug.isActive === false;
                const isUnavailable = isUnknown || isInactive || available <= 0;
                const availabilityLabel = isInactive
                  ? 'Ngừng kinh doanh'
                  : isUnknown
                    ? (inventoryStatus === 'loading' ? 'Đang tải…' : 'Chưa xác định')
                    : available > 0 ? available.toLocaleString('vi-VN') : 'Hết hàng';
                return (
                  <button
                    key={drug.drugId}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => { setSelectedDrug(drug); setQuantity(1); }}
                    className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_80px_110px_120px] ${
                      selectedDrug?.drugId === drug.drugId ? 'bg-[#f0f7f3]' : 'hover:bg-[#f8faf9]'
                    } disabled:cursor-not-allowed disabled:bg-slate-50/70 disabled:hover:bg-slate-50/70`}
                    aria-label={`${drug.name}, tồn khả dụng ${availabilityLabel}`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-bold ${isUnavailable ? 'text-slate-500' : 'text-ink'}`}>{drug.name}</span>
                      {drug.activeIngredient && <span className="mt-1 block truncate text-[11px] text-slate-500">{drug.activeIngredient}</span>}
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:hidden">
                        <span className="text-slate-500">ĐVT: <strong className="text-slate-700">{drug.unit}</strong></span>
                        <span className="font-mono font-semibold text-forest">{money.format(drug.price)}</span>
                      </span>
                    </span>
                    <span className="hidden text-xs font-semibold text-slate-600 sm:block">{drug.unit}</span>
                    <span className="hidden text-right font-mono text-xs font-semibold text-forest sm:block">{money.format(drug.price)}</span>
                    <span className={`text-right text-xs font-bold ${isUnknown ? 'text-amber-700' : available > 0 && !isInactive ? 'text-forest' : 'text-slate-500'}`}>{availabilityLabel}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-white px-5 py-12 text-center text-sm text-slate-500">
              Không tìm thấy thuốc nào phù hợp với từ khóa tìm kiếm.
            </div>
          )}

        </section>

        {/* Right Column: Customer Info & Cart */}
        <aside className="overflow-hidden rounded-md border border-line bg-white shadow-panel xl:sticky xl:top-[100px]">
          {/* Customer Selection Panel */}
          <div className="border-b border-line bg-[#f8faf9] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <User size={14} className="text-forest" /> Khách hàng
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomerModalError('');
                  setShowCreateCustomerModal(true);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-forest hover:underline"
              >
                <UserPlus size={13} /> + Thêm khách
              </button>
            </div>

            {selectedCustomer ? (
              <div className="flex items-start justify-between gap-2 rounded border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{selectedCustomer.fullName}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                    {selectedCustomer.phoneNumber} · {selectedCustomer.customerCode}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ★ {selectedCustomer.points} điểm
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Đã chi: {money.format(selectedCustomer.totalSpent)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded p-1 text-slate-400 hover:bg-emerald-100 hover:text-slate-600"
                  title="Bỏ chọn (chuyển sang khách lẻ)"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => { if (customerResults.length) setShowCustomerDropdown(true); }}
                    placeholder="Tìm theo SĐT hoặc Tên khách..."
                    className="h-9 w-full rounded border border-line bg-white pl-8 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none"
                  />
                  {isSearchingCustomer && (
                    <LoaderCircle size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>

                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full divide-y divide-line overflow-auto rounded border border-line bg-white text-xs shadow-lg">
                    {customerResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                        className="flex w-full items-center justify-between p-2.5 text-left hover:bg-[#f3f7f4]"
                      >
                        <div>
                          <span className="block font-bold text-ink">{cust.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-500">{cust.phoneNumber}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-forest">★ {cust.points} đ</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px] italic text-slate-400">Mặc định: Khách lẻ vãng lai (không lưu hồ sơ)</p>
              </div>
            )}
          </div>

          {/* Current sale header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-extrabold text-ink">Đơn bán hiện tại</h2>
          </div>

          {/* Cart Items */}
          <div className="max-h-[350px] min-h-[140px] divide-y divide-line overflow-auto px-5">
            {!cart.length ? (
              <div className="grid min-h-[140px] place-items-center text-center text-xs text-slate-400">
                <div>
                  <ShoppingBag className="mx-auto mb-2 text-slate-300" size={21} />
                  Chưa chọn thuốc cho đơn bán
                </div>
              </div>
            ) : (
              cart.map((line, index) => (
                <div key={`${line.drug.drugId}-${line.batch.batchId}`} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{line.drug.name}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        Lô: {line.batch.batchNo} · {money.format(line.drug.price)} / {line.drug.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => updateQuantity(index, 0)}
                      aria-label={`Xóa ${line.drug.name}`}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, line.quantity - 1)}
                        className="grid h-7 w-7 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, line.quantity + 1)}
                        disabled={line.quantity >= line.batch.stockQuantity}
                        className="grid h-7 w-7 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono text-xs font-semibold text-ink">
                      {money.format(line.drug.price * line.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-line bg-[#fafcfb] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{cart.length} loại thuốc · {itemCount} đơn vị</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tạm tính</span>
              <span className="font-mono">{money.format(total)}</span>
            </div>
            {selectedCustomer && (
              <div className="mt-1 flex items-center justify-between text-xs text-emerald-700">
                <span>Điểm thưởng tích lũy:</span>
                <span className="font-semibold">+{(Math.floor(total / 10000))} điểm</span>
              </div>
            )}
            <div className="mt-3 flex items-end justify-between">
              <span className="text-sm font-bold text-ink">Tổng thanh toán</span>
              <span className="font-mono text-xl font-semibold text-forest">{money.format(total)}</span>
            </div>
            <button
              onClick={() => { setPaymentMethod('CASH'); setShowPaymentModal(true); }}
              disabled={!cart.length || isSubmitting}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-coral text-sm font-bold text-white transition-colors hover:bg-[#bd5b3d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" /> Đang phát hành và ký số hóa đơn...
                </>
              ) : (
                <>
                  Tiến hành thanh toán <Check size={16} />
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={Boolean(selectedDrug)}
        onClose={() => setSelectedDrug(null)}
        title={selectedDrug?.name ?? 'Chọn lô thuốc'}
        subtitle={selectedDrug ? `${selectedDrug.unit} · ${money.format(selectedDrug.price)}` : undefined}
        icon={PackageCheck}
        maxWidth="lg"
      >
        {isLoadingBatches ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={17} className="animate-spin" /> Đang tải lô khả dụng...
          </div>
        ) : batches.length ? (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-xs font-bold text-slate-700">Lô xuất bán theo FEFO</legend>
              <div className="space-y-2">
                {batches.map((batch, index) => (
                  <label key={batch.batchId} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${selectedBatchId === batch.batchId ? 'border-forest bg-mint/45' : 'border-line hover:bg-slate-50'}`}>
                    <span className="flex min-w-0 items-center gap-3">
                      <input type="radio" name="sale-batch" value={batch.batchId} checked={selectedBatchId === batch.batchId} onChange={(event) => setSelectedBatchId(event.target.value)} className="accent-forest" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">Lô {batch.batchNo}</span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={13} /> HSD {calendarDate.format(new Date(batch.expiryDate))}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-forest">Còn {batch.stockQuantity} {selectedDrug?.unit}</span>
                    {index === 0 && <span className="sr-only">Lô được ưu tiên theo FEFO</span>}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Số lượng</span>
                <input ref={quantityInputRef} type="number" min="1" max={selectedBatch?.stockQuantity ?? 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} onKeyDown={(event) => { if (event.key === 'Enter') addToCart(); }} className="h-11 w-full rounded-lg border border-line px-3 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15" />
              </label>
              <button type="button" onClick={addToCart} disabled={!selectedBatch || quantity < 1 || quantity > (selectedBatch?.stockQuantity ?? 0)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-forest disabled:cursor-not-allowed disabled:opacity-40">
                <Plus size={16} /> Thêm vào đơn
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">Thuốc này không có lô còn hàng và còn hạn sử dụng tại chi nhánh hiện tại.</div>
        )}
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => { if (!isSubmitting) setShowPaymentModal(false); }}
        title="Chọn phương thức thanh toán"
        subtitle={`Tổng thanh toán: ${money.format(total)}`}
        icon={Banknote}
        maxWidth="md"
        closeOnOverlayClick={false}
        footer={paymentMethod === 'CASH' ? <>
          <button type="button" onClick={() => setShowPaymentModal(false)} disabled={isSubmitting} className="h-10 rounded-lg border border-line px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Quay lại</button>
          <button type="button" onClick={submitCheckout} disabled={isSubmitting} className="flex h-10 items-center gap-2 rounded-lg bg-coral px-5 text-xs font-bold text-white hover:bg-[#bd5b3d] disabled:opacity-50">{isSubmitting ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} Thanh toán &amp; Xuất hóa đơn</button>
        </> : undefined}
      >
        <div className="space-y-3">
          <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${paymentMethod === 'CASH' ? 'border-forest bg-mint/45' : 'border-line hover:bg-slate-50'}`} aria-pressed={paymentMethod === 'CASH'}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-forest"><Banknote size={20} /></span>
            <span><span className="block text-sm font-bold text-ink">Tiền mặt</span><span className="mt-0.5 block text-xs text-slate-500">Phát hành hóa đơn sau khi xác nhận đã thu đủ tiền.</span></span>
          </button>
          <button type="button" onClick={() => { setPaymentMethod('BANK_TRANSFER'); setShowPaymentModal(false); setShowTransferNotice(true); }} className="flex w-full items-center gap-3 rounded-xl border border-line p-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/50" aria-label="Chuyển khoản, đang phát triển">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sky-700"><QrCode size={20} /></span>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="block text-sm font-bold text-ink">Chuyển khoản</span><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Đang phát triển</span></span><span className="mt-0.5 block text-xs text-slate-500">Thanh toán qua ngân hàng và mã QR sẽ được hỗ trợ trong phiên bản sau.</span></span>
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showTransferNotice}
        onClose={() => { setShowTransferNotice(false); setPaymentMethod('CASH'); }}
        title="Thanh toán chuyển khoản đang phát triển"
        icon={QrCode}
        maxWidth="sm"
        footer={<>
          <button type="button" onClick={() => { setShowTransferNotice(false); setPaymentMethod('CASH'); }} className="h-10 rounded-lg border border-line px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">Đã hiểu</button>
          <button type="button" onClick={() => { setShowTransferNotice(false); setPaymentMethod('CASH'); setShowPaymentModal(true); }} className="h-10 rounded-lg bg-forest px-4 text-xs font-bold text-white hover:bg-forest/90">Chọn tiền mặt</button>
        </>}
      >
        <p className="text-sm leading-6 text-slate-600">Phương thức thanh toán qua chuyển khoản ngân hàng và mã QR chưa khả dụng trong phiên bản hiện tại. Vui lòng sử dụng thanh toán tiền mặt để hoàn tất giao dịch.</p>
      </Modal>

      {/* Quick Create Customer Modal */}
      <Modal
        isOpen={showCreateCustomerModal}
        onClose={() => { if (!isCreatingCustomer) setShowCreateCustomerModal(false); }}
        title="Thêm khách hàng mới"
        subtitle="Khách hàng mới sẽ được chọn cho đơn bán hiện tại."
        icon={UserPlus}
        maxWidth="md"
        closeOnOverlayClick={false}
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
              {customerModalError && (
                <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {customerModalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên khách hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newCustomer.fullName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                  placeholder="Ví dụ: Hoàng Thị Mai"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                  placeholder="Ví dụ: 0901234567"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={newCustomer.address || ''}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Ví dụ: 12 Lê Lợi, Quận 1, TP.HCM"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email || ''}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Ví dụ: mai.hoang@gmail.com"
                  className="h-10 w-full rounded border border-line px-3 text-xs text-ink focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowCreateCustomerModal(false)}
                  className="h-9 px-4 rounded border border-line text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="flex h-9 items-center justify-center gap-1.5 rounded bg-forest px-4 text-xs font-bold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {isCreatingCustomer ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Lưu &amp; Chọn
                </button>
              </div>
        </form>
      </Modal>
      {/* Sale Receipt Modal */}
      {receipt && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReceipt(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="animate-enter w-full max-w-[520px] rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-forest">
                  <Check size={20} />
                </span>
                <div>
                  <h2 id="receipt-title" className="font-display text-lg font-extrabold text-ink">Thanh toán hoàn tất</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Backend đã xác nhận phát hành và ký số hóa đơn thành công.</p>
                </div>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-slate-100"
                aria-label="Đóng biên lai"
              >
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Số hóa đơn</span>
                <span className="font-mono font-semibold text-ink">{receipt.invoiceNumber}</span>
              </div>
              {receipt.customerName && (
                <div className="flex items-center justify-between text-xs rounded bg-mint/40 p-2">
                  <span className="text-slate-600 font-medium">Khách hàng</span>
                  <span className="font-bold text-forest">{receipt.customerName}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Mã định danh hóa đơn</span>
                <span className="max-w-[270px] truncate font-mono text-[10px] text-ink">{receipt.invoiceId}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm font-bold text-ink">Tổng tiền thanh toán</span>
                <span className="font-mono text-lg font-semibold text-forest">{money.format(receipt.totalAmount)}</span>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Chữ ký số SHA-256 (Ledger)</p>
                <div className="break-all rounded-md bg-[#f3f6f4] p-3 font-mono text-[10px] leading-5 text-ink">
                  {receipt.hashValueSha256}
                </div>
              </div>
            </div>
            <div className="border-t border-line px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="h-10 flex-1 flex items-center justify-center gap-2 rounded-md bg-forest text-xs font-bold text-white hover:bg-forest/90 cursor-pointer shadow-sm"
              >
                <Printer size={15} />
                <span>In hóa đơn (K80)</span>
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="h-10 px-5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal In hóa đơn bán lẻ K80 */}
      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={printReceiptData}
      />
    </div>
  );
}
