import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { NotificationItem, NotificationSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';

const SEEN_NOTIFICATIONS_STORAGE_PREFIX = 'pharmasecure:seen_notification_ids';

function getInitialSeenIds(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const seenStorageKey = `${SEEN_NOTIFICATIONS_STORAGE_PREFIX}:${currentUser?.userId ?? 'anonymous'}:${currentUser?.branchId ?? 'none'}`;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDER' | 'PROCUREMENT' | 'INVENTORY'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>(() => getInitialSeenIds(seenStorageKey));
  const [loadError, setLoadError] = useState('');
  const [, setNowTick] = useState<number>(Date.now());
  const [summary, setSummary] = useState<NotificationSummary>({
    totalUnread: 0,
    ordersCount: 0,
    procurementCount: 0,
    inventoryAlertsCount: 0,
    items: [],
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await apiClient<NotificationSummary>('/notifications/summary');
      if (data) {
        setSummary(data);
        setLoadError('');
      }
    } catch {
      setLoadError('Không thể tải thông báo. Dữ liệu hiện tại có thể chưa được cập nhật.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSeenIds(getInitialSeenIds(seenStorageKey));
  }, [seenStorageKey]);

  // Polling every 12s when page is visible for real-time responsiveness
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 12000);

    const handleWindowFocus = () => fetchNotifications();
    const handleCustomRefresh = () => fetchNotifications();

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pharmasecure:refresh-notifications', handleCustomRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pharmasecure:refresh-notifications', handleCustomRefresh);
    };
  }, [fetchNotifications]);

  // Live timer tick every 30s so relative time labels ('Vừa xong', 'X phút trước') update dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper to persist seen notification IDs to localStorage
  const markItemsAsSeen = useCallback((itemsToMark: NotificationItem[]) => {
    if (!itemsToMark.length) return;
    setSeenIds((prev) => {
      const currentIds = itemsToMark.map((i) => i.id);
      const combined = Array.from(new Set([...currentIds, ...prev])).slice(0, 200);
      try {
        localStorage.setItem(seenStorageKey, JSON.stringify(combined));
      } catch {
        // Ignore localStorage quota errors
      }
      return combined;
    });
  }, [seenStorageKey]);

  // Automatically mark items as seen if popover is open when new items arrive
  useEffect(() => {
    if (isOpen && summary.items.length > 0) {
      markItemsAsSeen(summary.items);
    }
  }, [isOpen, summary.items, markItemsAsSeen]);

  // Click outside and Esc handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calculate unread badge count: only items that have NOT been viewed
  const unseenItems = useMemo(
    () => summary.items.filter((item) => !seenIds.includes(item.id)),
    [summary.items, seenIds]
  );
  const unseenCount = unseenItems.length;

  const filteredItems = summary.items.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.category === activeTab;
  });

  const handleToggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications(true);
      // Immediately clear badge count on user click
      if (summary.items.length > 0) {
        markItemsAsSeen(summary.items);
      }
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    setIsOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      if (!isoString) return '';
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      let diffMs = now.getTime() - date.getTime();

      // Guard against minor client-server clock skew
      if (diffMs < 0 && Math.abs(diffMs) < 120000) {
        diffMs = 0;
      }
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Thông báo chi nhánh"
        aria-expanded={isOpen}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 cursor-pointer"
        title="Thông báo chi nhánh"
      >
        <Bell size={18} strokeWidth={2} />

        {/* Badge number: only displayed when there are unseen notifications */}
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white animate-in zoom-in-75 duration-150">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 sm:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">Trung tâm thông báo</span>
                {summary.totalUnread > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {summary.totalUnread} cần xử lý
                  </span>
                )}
                {unseenCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 animate-pulse">
                    {unseenCount} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Hoạt động thời gian thực tại chi nhánh</p>
            </div>
            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              disabled={isLoading}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-50 cursor-pointer"
              title="Làm mới thông báo"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-line bg-slate-50/70 p-1.5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-forest font-bold shadow-sm'
                  : 'hover:text-ink text-slate-500'
              }`}
            >
              Tất cả ({summary.totalUnread})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ORDER')}
              className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                activeTab === 'ORDER'
                  ? 'bg-white text-forest font-bold shadow-sm'
                  : 'hover:text-ink text-slate-500'
              }`}
            >
              🛒 Đơn mới ({summary.ordersCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PROCUREMENT')}
              className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                activeTab === 'PROCUREMENT'
                  ? 'bg-white text-forest font-bold shadow-sm'
                  : 'hover:text-ink text-slate-500'
              }`}
            >
              📋 Kho ({summary.procurementCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INVENTORY')}
              className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                activeTab === 'INVENTORY'
                  ? 'bg-white text-forest font-bold shadow-sm'
                  : 'hover:text-ink text-slate-500'
              }`}
            >
              ⚠️ Cảnh báo ({summary.inventoryAlertsCount})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
            {loadError && (
              <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
                <span>{loadError}</span>
                <button type="button" onClick={() => fetchNotifications(true)} className="shrink-0 font-bold underline underline-offset-2">
                  Thử lại
                </button>
              </div>
            )}
            {filteredItems.length === 0 && !loadError ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 size={36} className="text-emerald-500" />
                <p className="mt-2 text-xs font-bold text-ink">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400">
                  Mọi hoạt động và chỉ số tồn kho đều trong trạng thái bình thường.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isOrder = item.category === 'ORDER';
                const isProcurement = item.category === 'PROCUREMENT';
                const isInventory = item.category === 'INVENTORY';
                const isItemUnseen = !seenIds.includes(item.id);

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group flex w-full cursor-pointer items-start gap-3 p-3.5 text-left transition-colors hover:bg-slate-50 ${
                      isItemUnseen ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white ${
                        isOrder
                          ? 'bg-amber-500'
                          : isProcurement
                          ? 'bg-blue-600'
                          : item.severity === 'URGENT'
                          ? 'bg-rose-600'
                          : 'bg-amber-600'
                      }`}
                    >
                      {isOrder && <ShoppingCart size={16} />}
                      {isProcurement && <ClipboardList size={16} />}
                      {isInventory && <AlertTriangle size={16} />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {isItemUnseen && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                              title="Thông báo mới chưa xem"
                            />
                          )}
                          <p className="truncate text-xs font-bold text-ink group-hover:text-forest">
                            {item.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                        {item.subtitle}
                      </p>
                    </div>

                    <ExternalLink
                      size={14}
                      className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-forest"
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line bg-slate-50/50 px-4 py-2.5">
            <span className="text-[11px] text-slate-400">Tự động đồng bộ mỗi 12s</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/invoices');
              }}
              className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
            >
              Xem hóa đơn bán hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
