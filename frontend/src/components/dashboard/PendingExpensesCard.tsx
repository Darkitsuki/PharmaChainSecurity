import React from 'react';
import { Wallet, X, ShieldCheck, Clock } from 'lucide-react';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export interface ExpenseItem {
  id: string;
  title: string;
  requestor: string;
  amount: number;
  time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const defaultExpenses: ExpenseItem[] = [
  {
    id: 'EXP-001',
    title: 'Mua cồn sát khuẩn 70 độ & bông gạc quầy bán',
    requestor: 'Dược sĩ Lan (Ca sáng)',
    amount: 185000,
    time: '09:15',
    status: 'PENDING',
  },
  {
    id: 'EXP-002',
    title: 'Bảo trì máy in hóa đơn nhiệt quầy 01',
    requestor: 'Kỹ thuật viên chi nhánh',
    amount: 350000,
    time: '11:30',
    status: 'PENDING',
  },
];

export const PendingExpensesCard: React.FC = () => {
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>(defaultExpenses);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  const handleApprove = (id: string, title: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e))
    );
    setStatusMsg(`Đã duyệt chi "${title}" và ký xác nhận điện tử HSM.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleReject = (id: string, title: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED' } : e))
    );
    setStatusMsg(`Đã từ chối phiếu chi "${title}".`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const pendingList = expenses.filter((e) => e.status === 'PENDING');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-700">
            <Wallet size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Duyệt chi &amp; Quản trị Két tiền mặt
            </h2>
            <p className="text-xs text-slate-500">
              Quyền hạn Chủ nhà thuốc — Phê duyệt chi quỹ trực tiếp bằng chữ ký số
            </p>
          </div>
        </div>

        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
          {pendingList.length} phiếu chờ xử lý
        </span>
      </div>

      {statusMsg && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium">
          ✓ {statusMsg}
        </div>
      )}

      <div className="mt-4">
        {pendingList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Không có khoản chi tiền mặt nào đang chờ duyệt. Quỹ két tiền mặt đang cân đối.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.requestor}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock size={11} /> {item.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-display text-sm font-bold text-rose-600">
                    -{money.format(item.amount)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id, item.title)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
                      title="Duyệt chi và xác thực chữ ký số"
                    >
                      <ShieldCheck size={13} />
                      <span>Duyệt ký HSM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(item.id, item.title)}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                      title="Từ chối yêu cầu chi"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
