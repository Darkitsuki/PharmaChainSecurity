export interface DateRangeValue { from: string; to: string }

export function DateRangeFilter({ value, onChange }: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  return <div className="flex max-w-full flex-wrap items-center gap-2">
    <label className="flex items-center gap-2 text-xs text-slate-500">Từ
      <input aria-label="Từ ngày" type="date" value={value.from}
        onChange={e => onChange({ ...value, from: e.target.value })}
        className="min-w-0 rounded-lg border border-line bg-white px-2 py-2 text-sm text-ink" />
    </label>
    <label className="flex items-center gap-2 text-xs text-slate-500">Đến
      <input aria-label="Đến ngày" type="date" min={value.from || undefined} value={value.to}
        onChange={e => onChange({ ...value, to: e.target.value })}
        className="min-w-0 rounded-lg border border-line bg-white px-2 py-2 text-sm text-ink" />
    </label>
    {(value.from || value.to) && <button type="button" className="px-2 text-sm font-semibold text-forest" onClick={() => onChange({ from: '', to: '' })}>Xóa ngày</button>}
  </div>;
}

export function withinDateRange(timestamp: string, range: DateRangeValue) {
  const day = new Date(timestamp).toLocaleDateString('sv-SE');
  return (!range.from || day >= range.from) && (!range.to || day <= range.to);
}
