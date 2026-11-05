import { useEffect, useRef, useState, useCallback } from 'react';
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

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDER' | 'PROCUREMENT' | 'INVENTORY'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
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
      }
    } catch {
      // Ignore background notification fetch errors
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000);

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

  const filteredItems = summary.items.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.category === activeTab;
  });

  const handleItemClick = (item: NotificationItem) => {
    setIsOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
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
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications(true);
        }}
        aria-label="Thông báo chi nhánh"
        aria-expanded={isOpen}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink focus:outline-none focus:ring-2 focus:ring-forest/20"
        title="Thông báo chi nhánh"
      >
        <Bell size={18} strokeWidth={2} />

        {summary.totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white">
            {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
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
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    {summary.totalUnread} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Hoạt động thời gian thực tại chi nhánh</p>
            </div>
            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              disabled={isLoading}
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-50"
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
              className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
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
              className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
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
              className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
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
              className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
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
            {filteredItems.length === 0 ? (
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

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-slate-50"
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
                        <p className="truncate text-xs font-bold text-ink group-hover:text-forest">
                          {item.title}
                        </p>
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
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line bg-slate-50/50 px-4 py-2.5">
            <span className="text-[11px] text-slate-400">Tự động đồng bộ mỗi 30s</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/invoices');
              }}
              className="text-[11px] font-bold text-forest hover:underline"
            >
              Xem hóa đơn bán hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
