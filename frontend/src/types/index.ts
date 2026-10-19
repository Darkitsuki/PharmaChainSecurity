/**
 * Canonical RBAC Roles matching backend domain (Rule 04).
 */
export type UserRole = 'OWNER' | 'SALES' | 'WAREHOUSE';

export interface CurrentUser {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: string;
  branchName: string;
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
  isActive?: boolean;
}

export interface CreateDrugPayload {
  drugCode: string;
  name: string;
  activeIngredient?: string | null;
  unit: string;
  price: number;
}

export interface UpdateDrugPayload {
  name: string;
  activeIngredient?: string | null;
  unit: string;
  price: number;
  isActive: boolean;
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
  status?: 'COMPLETED' | 'CANCELLED';
  cancelledById?: string | null;
  cancelledByName?: string | null;
  cancelledDate?: string | null;
  cancelReason?: string | null;
}

export interface CheckoutResponse {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  hashValueSha256: string;
  customerId?: string | null;
  customerName?: string | null;
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
  status?: 'VALID' | 'REVOKED';
  revokedAt?: string | null;
  revokedReason?: string | null;
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
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  status?: 'COMPLETED' | 'CANCELLED';
  cancelledById?: string | null;
  cancelledByName?: string | null;
  cancelledDate?: string | null;
  cancelReason?: string | null;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  branchId: string | null;
  totalSpent: number;
  points: number;
  isActive: boolean;
  createdDate: string;
}

export interface CreateCustomerPayload {
  fullName: string;
  phoneNumber: string;
  customerCode?: string;
  email?: string;
  address?: string;
}

export interface StockAdjustmentPayload {
  drugId: string;
  batchId: string;
  newQuantity: number;
  reason: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  isActive: boolean;
  createdDate: string;
}

export interface CreateSupplierPayload {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  taxCode?: string;
}

export interface GoodsReceiptItem {
  id: string;
  receiptId: string;
  drugId: string;
  drugCode: string;
  drugName: string;
  batchId: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  importPrice: number;
  subTotal: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNo: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  warehouseStaffId: string;
  warehouseStaffName: string | null;
  totalAmount: number;
  note: string | null;
  status: string;
  createdDate: string;
  items: GoodsReceiptItem[];
}

export interface CreateGoodsReceiptItemPayload {
  drugId: string;
  batchNo: string;
  expiryDate: string;
  mfgDate?: string | null;
  quantity: number;
  importPrice: number;
}

export interface CreateGoodsReceiptPayload {
  supplierId: string;
  note?: string;
  items: CreateGoodsReceiptItemPayload[];
}

export interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  createdDate: string;
}

export interface CreateStaffPayload {
  username: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: 'SALES' | 'WAREHOUSE';
}

export interface TopDrugReportItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface DailySalesItem {
  date: string;
  revenue: number;
  invoiceCount: number;
}

export interface SalesSummaryReport {
  totalRevenue: number;
  totalInvoices: number;
  todayRevenue: number;
  todayInvoices: number;
  monthRevenue: number;
  monthInvoices: number;
  topSellingDrugs: TopDrugReportItem[];
  dailySales: DailySalesItem[];
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  branchId: string | null;
  totalSpent: number;
  points: number;
  isActive: boolean;
  createdDate: string;
}

export interface CreateCustomerPayload {
  fullName: string;
  phoneNumber: string;
  customerCode?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface Branch {
  id: string;
  branchName: string;
  address: string | null;
  activeUsersCount: number;
  totalInvoicesCount: number;
}

export interface CreateBranchPayload {
  id: string;
  branchName: string;
  address?: string;
}

export interface UpdateBranchPayload {
  branchName: string;
  address?: string;
}

// -------------------------------------------------------------
// Returns & Refunds (Package P1.1)
// -------------------------------------------------------------
export interface ReturnItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  batchId: string;
  batchNo: string;
  quantity: number;
  refundPrice: number;
  subTotal: number;
  actionType: 'RESTOCK' | 'DISCARD';
}

export interface ReturnOrder {
  id: string;
  returnNo: string;
  invoiceId: string;
  invoiceNo: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  customerId: string | null;
  customerName: string | null;
  totalRefundAmount: number;
  reason: string;
  status: 'COMPLETED' | 'REJECTED';
  createdDate: string;
  items: ReturnItem[];
}

export interface CreateReturnItemPayload {
  drugId: string;
  batchId: string;
  quantity: number;
  refundPrice: number;
  actionType: 'RESTOCK' | 'DISCARD';
}

export interface CreateReturnPayload {
  invoiceId: string;
  reason: string;
  items: CreateReturnItemPayload[];
}

export interface ReturnableInvoiceItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  batchId: string;
  batchNo: string;
  originalQuantity: number;
  returnedQuantity: number;
  availableToReturnQuantity: number;
  unitPrice: number;
}

export interface ReturnableInvoice {
  invoiceId: string;
  invoiceNumber: string;
  createdDate: string;
  totalAmount: number;
  branchId: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  items: ReturnableInvoiceItem[];
}

export type InventoryAuditStatus = 'DANG_KIEM' | 'CAN_BANG' | 'DA_HUY';

export interface InventoryAudit {
  id: string;
  code: string;
  branchId: string;
  createdById: string;
  createdByName: string;
  reconciledById: string | null;
  reconciledByName: string | null;
  status: InventoryAuditStatus;
  note: string | null;
  createdAt: string;
  reconciledAt: string | null;
  totalItems: number;
  discrepantItems: number;
}

export interface InventoryAuditItem {
  id: string;
  inventoryId: string;
  drugId: string;
  drugCode: string;
  drugName: string;
  unit: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  systemQuantity: number;
  actualQuantity: number;
  differenceQuantity: number;
  unitPrice: number;
  differenceValue: number;
  reason: string | null;
}

export interface InventoryAuditDetail extends InventoryAudit {
  items: InventoryAuditItem[];
}

export interface CreateInventoryAuditPayload {
  note?: string;
}

export interface UpdateAuditItemEntry {
  itemId: string;
  actualQuantity: number;
  reason?: string;
}

export interface UpdateAuditItemsPayload {
  items: UpdateAuditItemEntry[];
}

export interface ReconcileAuditPayload {
  reason?: string;
}

export type StockTransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface StockTransfer {
  id: string;
  transferNo: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  createdById: string;
  createdByName: string;
  shippedById: string | null;
  shippedByName: string | null;
  receivedById: string | null;
  receivedByName: string | null;
  status: StockTransferStatus;
  totalItemsCount: number;
  totalQuantity: number;
  shippedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdDate: string;
}

export interface StockTransferItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  unit: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  notes: string | null;
}

export interface StockTransferDetail extends StockTransfer {
  items: StockTransferItem[];
}

export interface CreateStockTransferItemPayload {
  drugId: string;
  batchId: string;
  quantity: number;
  notes?: string;
}

export interface CreateStockTransferPayload {
  toBranchId: string;
  notes?: string;
  items: CreateStockTransferItemPayload[];
}



