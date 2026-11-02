export interface PurchaseOrderItem {
  drugId: string; drugName: string; quantity: number; estimatedUnitPrice: number;
  subTotal: number; receivedQuantity: number; notes: string | null;
}
export interface PurchaseOrder {
  id: string; orderNo: string; branchId: string; supplierId: string; supplierName: string;
  createdBy: string; creatorName: string; approvedBy: string | null; approverName: string | null;
  totalEstimatedAmount: number; status: string; approvedDate: string | null;
  expectedDeliveryDate: string | null; notes: string | null; createdDate: string;
  items: PurchaseOrderItem[];
  receipts: { id: string; receiptNo: string; createdDate: string; status: string }[];
}
export const purchaseOrderStatuses: Record<string, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối',
  ORDERED: 'Đã đặt hàng', RECEIVED: 'Đã nhận đủ', CANCELLED: 'Đã hủy',
};
