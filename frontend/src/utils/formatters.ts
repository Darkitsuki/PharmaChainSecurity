// Shared Vietnamese presentation formats; authoritative amounts still come from the API.
export const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const quantity = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
export const calendarDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const clockTime = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
export const dateTime = {
  format: (value: Date | number) => `${calendarDate.format(value)} ${clockTime.format(value)}`,
};
