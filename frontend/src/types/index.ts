/**
 * Canonical RBAC Roles matching backend domain (Rule 04).
 */
export type UserRole = 'OWNER' | 'SALES' | 'WAREHOUSE';

export interface CurrentUser {
  userId: string;
  username: string;
  role: UserRole;
  branchId: string;
}

export interface ApiProblemDetails {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: CurrentUser;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface Drug {
  drugId: string;
  drugCode: string;
  name: string;
  activeIngredient: string | null;
  unit: string;
  price: number;
}

export interface DrugBatch {
  batchId: string;
  drugId: string;
  batchNo: string;
  mfgDate: string | null;
  expiryDate: string;
  stockQuantity: number;
}

export interface InventoryRow {
  branchId: string;
  drugId: string;
  batchId: string;
  quantity: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  createdDate: string;
  totalAmount: number;
  branchId: string;
  cashierId: string;
}

export interface CheckoutResponse {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  hashValueSha256: string;
}

export interface InvoiceVerificationResult {
  invoiceId: string;
  invoiceNumber: string;
  isValid: boolean;
  calculatedHashSha256: string;
  storedHashSha256: string;
  certificateSerial: string;
  signedAt: string;
  message: string;
}

export interface InventoryAlert {
  branchId: string;
  drugId: string;
  drugCode: string;
  drugName: string;
  batchId: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
}

export interface InvoiceItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface InvoiceSignature {
  hashValueSha256: string;
  signatureData: string;
  certificateSerial: string;
  signedAt: string;
}

export interface InvoiceDetail {
  invoiceId: string;
  invoiceNumber: string;
  createdDate: string;
  totalAmount: number;
  branchId: string;
  cashierId: string;
  items: InvoiceItem[];
  signature: InvoiceSignature | null;
}

export interface StockAdjustmentPayload {
  drugId: string;
  batchId: string;
  newQuantity: number;
  reason: string;
}

