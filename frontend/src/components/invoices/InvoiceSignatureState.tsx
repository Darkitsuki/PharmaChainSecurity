import type { Invoice, InvoiceDetail, InvoiceVerificationResult } from '../../types';

export type VerificationAttempt = { result?: InvoiceVerificationResult; error?: string };

// Stored VALID means an active signature, not a successful cryptographic check.
export function signatureState(invoice: Invoice | InvoiceDetail, attempt?: VerificationAttempt) {
  const signature = 'signature' in invoice ? invoice.signature : undefined;
  const storedStatus = 'signatureStatus' in invoice ? invoice.signatureStatus : signature?.status;
  if (invoice.status === 'CANCELLED' || storedStatus === 'REVOKED' || attempt?.result?.verificationStatus === 'REVOKED')
    return { label: 'Đã thu hồi', tone: 'text-slate-600 bg-slate-100' };
  if (attempt?.error || attempt?.result?.verificationStatus === 'UNAVAILABLE')
    return { label: 'Không thể kiểm tra', tone: 'text-amber-800 bg-amber-50' };
  if (attempt?.result?.verificationStatus === 'MISSING' || storedStatus === 'MISSING' || signature === null)
    return { label: 'Chưa có chữ ký', tone: 'text-slate-600 bg-slate-100' };
  if (attempt?.result)
    return attempt.result.isValid
      ? { label: 'Đã kiểm tra hợp lệ', tone: 'text-emerald-800 bg-emerald-50' }
      : { label: 'Chữ ký không hợp lệ', tone: 'text-rose-800 bg-rose-50' };
  if (invoice.lastVerifiedAt)
    return { label: 'Đã kiểm tra hợp lệ (lịch sử)', tone: 'text-emerald-800 bg-emerald-50' };
  return { label: signature || storedStatus === 'VALID' ? 'Đã ký · Chưa kiểm tra' : 'Chưa có thông tin chữ ký', tone: 'text-slate-600 bg-slate-100' };
}

export function InvoiceSignatureState({ invoice, attempt }: { invoice: Invoice | InvoiceDetail; attempt?: VerificationAttempt }) {
  const state = signatureState(invoice, attempt);
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${state.tone}`}>{state.label}</span>;
}
