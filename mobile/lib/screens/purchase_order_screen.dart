import 'package:flutter/material.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';
import '../data/models/order_model.dart';
import '../services/drug_service.dart';
import '../services/order_service.dart';
import '../widgets/ui_components.dart';

class PurchaseOrderScreen extends StatefulWidget {
  const PurchaseOrderScreen({
    super.key,
    this.session,
    this.user,
    this.orderService,
    this.drugService,
  });

  final AuthSession? session;
  final AuthUser? user;
  final OrderService? orderService;
  final DrugService? drugService;

  @override
  State<PurchaseOrderScreen> createState() => _PurchaseOrderScreenState();
}

class _PurchaseOrderScreenState extends State<PurchaseOrderScreen> {
  late final OrderService _orderService;
  late final DrugService _drugService;

  String _filter = 'ALL';
  String _searchQuery = '';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _orderService = widget.orderService ??
        OrderService(
          api: widget.session?.api,
          tokenProvider: () => widget.session?.token,
          defaultBranchId: widget.user?.branchId,
        );
    _drugService = widget.drugService ??
        DrugService(
          api: widget.session?.api,
          tokenProvider: () => widget.session?.token,
        );

    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      await _orderService.fetchPurchaseOrders();
    } catch (_) {
      // Offline fallback
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<PurchaseOrderSummary> get _filteredOrders {
    final list = _orderService.purchaseOrders;
    return list.where((order) {
      if (_filter != 'ALL' && order.status != _filter) return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchNo = order.orderNo.toLowerCase().contains(q);
        final matchSup = order.supplierName.toLowerCase().contains(q);
        if (!matchNo && !matchSup) return false;
      }
      return true;
    }).toList();
  }

  void _openCreateOrderModal({PurchaseOrderSummary? template}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CreatePurchaseOrderModal(
        orderService: _orderService,
        drugService: _drugService,
        user: widget.user,
        template: template,
        onCreated: (newOrder) {
          setState(() {});
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Lập đơn đặt hàng thành công! Mã đơn: ${newOrder.orderNo} (Chờ duyệt)',
              ),
              backgroundColor: AppColors.forest,
            ),
          );
        },
      ),
    );
  }

  void _showOrderDetails(PurchaseOrderSummary order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final isRejected = order.status == 'REJECTED';
        final isApproved = order.status == 'APPROVED';
        final isWarehouse = widget.user?.role == 'WAREHOUSE';

        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.mint,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.assignment_outlined,
                          color: AppColors.forest, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(order.orderNo,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 17)),
                          const SizedBox(height: 4),
                          _buildStatusBadge(order.status),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Panel(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _detailRow('Nhà cung cấp', order.supplierName.isNotEmpty ? order.supplierName : 'Chưa rõ'),
                      _detailRow('Người lập đơn', order.creatorName.isNotEmpty ? order.creatorName : order.createdBy),
                      _detailRow(
                        'Ngày lập',
                        '${order.createdDate.day.toString().padLeft(2, '0')}/${order.createdDate.month.toString().padLeft(2, '0')}/${order.createdDate.year}',
                      ),
                      if (order.approvedDate != null)
                        _detailRow(
                          'Ngày phê duyệt',
                          '${order.approvedDate!.day.toString().padLeft(2, '0')}/${order.approvedDate!.month.toString().padLeft(2, '0')}/${order.approvedDate!.year} (${order.approverName ?? 'Chủ nhà thuốc'})',
                        ),
                      if (order.expectedDeliveryDate != null)
                        _detailRow(
                          'Dự kiến giao hàng',
                          '${order.expectedDeliveryDate!.day.toString().padLeft(2, '0')}/${order.expectedDeliveryDate!.month.toString().padLeft(2, '0')}/${order.expectedDeliveryDate!.year}',
                        ),
                      _detailRow(
                        'Tổng chi phí ước tính',
                        money(order.totalEstimatedAmount.toInt()),
                        color: AppColors.forest,
                      ),
                      if (order.notes != null && order.notes!.isNotEmpty)
                        _detailRow('Ghi chú / Phản hồi', order.notes!, color: isRejected ? AppColors.coral : null),
                    ],
                  ),
                ),
                if (order.items.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text('Danh sách dược phẩm trong đơn:',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 10),
                  ...order.items.map((item) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.drugName.isNotEmpty ? item.drugName : item.drugId,
                                  style: const TextStyle(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${item.quantity} x ${money(item.estimatedUnitPrice.toInt())}',
                                    style: const TextStyle(color: AppColors.muted, fontSize: 13),
                                  ),
                                  Text(
                                    money(item.subTotal.toInt()),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.forest),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      )),
                ],
                const SizedBox(height: 24),
                if (isRejected && isWarehouse)
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: AppColors.forest),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Lập đơn thay thế'),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _openCreateOrderModal(template: order);
                    },
                  ),
                if (isApproved && isWarehouse)
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: AppColors.forest),
                    icon: const Icon(Icons.send_outlined),
                    label: const Text('Xác nhận đã đặt NCC'),
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      Navigator.pop(ctx);
                      try {
                        await _orderService.markOrderPlaced(order.id);
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('Đã cập nhật trạng thái: ĐÃ ĐẶT NCC'),
                            backgroundColor: AppColors.forest,
                          ),
                        );
                      } catch (e) {
                        messenger.showSnackBar(
                          SnackBar(content: Text('Lỗi: $e'), backgroundColor: AppColors.coral),
                        );
                      }
                    },
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _detailRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: color ?? AppColors.forest,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return switch (status.toUpperCase()) {
      'PENDING' => const StatusBadge('Chờ duyệt', warning: true),
      'APPROVED' => const StatusBadge('Đã duyệt'),
      'REJECTED' => const StatusBadge('Đã từ chối', warning: true),
      'ORDERED' => const StatusBadge('Đã đặt NCC'),
      'RECEIVED' => const StatusBadge('Đã nhận hàng'),
      'CANCELLED' => const StatusBadge('Đã hủy', warning: true),
      _ => StatusBadge(status),
    };
  }

  @override
  Widget build(BuildContext context) {
    final orders = _filteredOrders;
    final branchName = widget.user?.branchName ?? 'Chi nhánh Quận 1';

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          PageHeading(
            'Đơn đặt mua hàng',
            '$branchName · B2B Purchase Orders đặt hàng từ xa',
            action: FilledButton.icon(
              icon: const Icon(Icons.add),
              label: const Text('Lập đơn đặt hàng'),
              onPressed: () => _openCreateOrderModal(),
            ),
          ),
          StatsGrid(
            children: [
              StatCard('Tổng đơn mua', '${_orderService.purchaseOrders.length}',
                  Icons.receipt_long_outlined,
                  caption: 'Toàn chi nhánh'),
              StatCard(
                'Chờ duyệt',
                '${_orderService.purchaseOrders.where((o) => o.status == 'PENDING').length}',
                Icons.hourglass_top_outlined,
                caption: 'Chờ Chủ duyệt',
              ),
              StatCard(
                'Đã duyệt',
                '${_orderService.purchaseOrders.where((o) => o.status == 'APPROVED').length}',
                Icons.check_circle_outline,
                caption: 'Sẵn sàng đặt NCC',
              ),
            ],
          ),
          const SizedBox(height: 20),
          SearchBox(
            hint: 'Tìm theo mã đơn hoặc tên nhà cung cấp...',
            onChanged: (q) => setState(() => _searchQuery = q),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip('Tất cả', 'ALL'),
                const SizedBox(width: 8),
                _filterChip('Chờ duyệt', 'PENDING'),
                const SizedBox(width: 8),
                _filterChip('Đã duyệt', 'APPROVED'),
                const SizedBox(width: 8),
                _filterChip('Đã từ chối', 'REJECTED'),
                const SizedBox(width: 8),
                _filterChip('Đã đặt NCC', 'ORDERED'),
                const SizedBox(width: 8),
                _filterChip('Đã nhận hàng', 'RECEIVED'),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('${orders.length} đơn đặt hàng',
              style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const SizedBox(height: 12),
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              ),
            )
          else if (orders.isEmpty)
            const EmptyResults()
          else
            for (final order in orders)
              _buildOrderCard(order),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    return ChoiceChip(
      label: Text(label),
      selected: _filter == value,
      onSelected: (_) => setState(() => _filter = value),
    );
  }

  Widget _buildOrderCard(PurchaseOrderSummary order) {
    final dateStr =
        '${order.createdDate.day.toString().padLeft(2, '0')}/${order.createdDate.month.toString().padLeft(2, '0')}/${order.createdDate.year}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showOrderDetails(order),
        child: Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.mint,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.assignment_outlined,
                        color: AppColors.forest),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.orderNo,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 15)),
                        const SizedBox(height: 4),
                        Text(
                          order.supplierName.isNotEmpty
                              ? order.supplierName
                              : 'Nhà cung cấp: ${order.supplierId}',
                          style: const TextStyle(
                              color: AppColors.muted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(order.status),
                ],
              ),
              const Divider(height: 24),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text('Ngày lập: $dateStr',
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 12)),
                  Text(
                    money(order.totalEstimatedAmount.toInt()),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: AppColors.forest,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreatePurchaseOrderModal extends StatefulWidget {
  const _CreatePurchaseOrderModal({
    required this.orderService,
    required this.drugService,
    this.user,
    this.template,
    required this.onCreated,
  });

  final OrderService orderService;
  final DrugService drugService;
  final AuthUser? user;
  final PurchaseOrderSummary? template;
  final void Function(PurchaseOrderSummary newOrder) onCreated;

  @override
  State<_CreatePurchaseOrderModal> createState() =>
      _CreatePurchaseOrderModalState();
}

class _CreatePurchaseOrderModalState extends State<_CreatePurchaseOrderModal> {
  List<SupplierModel> _suppliers = [];
  SupplierModel? _selectedSupplier;

  List<DrugModel> _availableDrugs = [];
  DrugModel? _selectedDrug;

  final _qtyController = TextEditingController(text: '100');
  final _priceController = TextEditingController(text: '30000');
  final _lineNotesController = TextEditingController();
  final _orderNotesController = TextEditingController();

  DateTime? _expectedDeliveryDate;
  final List<PurchaseOrderLineInput> _items = [];
  final Map<String, String> _drugNames = {};

  bool _isLoadingSuppliers = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadInitData();
  }

  @override
  void dispose() {
    _qtyController.dispose();
    _priceController.dispose();
    _lineNotesController.dispose();
    _orderNotesController.dispose();
    super.dispose();
  }

  Future<void> _loadInitData() async {
    try {
      final sups = await widget.orderService.fetchSuppliers();
      final drugs = await widget.drugService.getDrugs(pageSize: 100);

      if (mounted) {
        setState(() {
          _suppliers = sups;
          _availableDrugs = drugs;
          for (final d in drugs) {
            _drugNames[d.drugId] = d.name;
          }

          // Set default supplier
          if (widget.template != null) {
            _selectedSupplier = sups.firstWhere(
              (s) => s.id == widget.template!.supplierId,
              orElse: () => sups.isNotEmpty ? sups.first : null as dynamic,
            );
            _orderNotesController.text =
                'Lập lại đơn thay thế cho ${widget.template!.orderNo}';
          } else if (sups.isNotEmpty) {
            _selectedSupplier = sups.first;
          }

          if (drugs.isNotEmpty) {
            _selectedDrug = drugs.first;
            _priceController.text = _selectedDrug!.price > 0
                ? _selectedDrug!.price.toInt().toString()
                : '30000';
          }

          _isLoadingSuppliers = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSuppliers = false);
    }
  }

  void _addItem() {
    if (_selectedDrug == null) return;

    final qty = int.tryParse(_qtyController.text.trim()) ?? 0;
    final price = double.tryParse(_priceController.text.trim()) ?? 0.0;

    if (qty <= 0) {
      setState(() => _errorMessage = 'Số lượng đặt mua phải lớn hơn 0.');
      return;
    }

    if (price < 1000) {
      setState(
          () => _errorMessage = 'Đơn giá ước tính phải từ 1.000 VNĐ trở lên.');
      return;
    }

    final drugId = _selectedDrug!.drugId;
    if (_items.any((i) => i.drugId == drugId)) {
      setState(() => _errorMessage =
          'Thuốc "${_selectedDrug!.name}" đã có trong danh sách đơn.');
      return;
    }

    setState(() {
      _errorMessage = null;
      _items.add(PurchaseOrderLineInput(
        drugId: drugId,
        quantity: qty,
        estimatedUnitPrice: price.roundToDouble(),
        notes: _lineNotesController.text.trim().isNotEmpty
            ? _lineNotesController.text.trim()
            : null,
      ));
      _drugNames[drugId] = _selectedDrug!.name;
      _lineNotesController.clear();
    });
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  double get _totalEstimatedAmount =>
      _items.fold(0.0, (sum, i) => sum + i.quantity * i.estimatedUnitPrice);

  Future<void> _submitOrder() async {
    if (_selectedSupplier == null) {
      setState(() => _errorMessage = 'Vui lòng chọn Nhà cung cấp.');
      return;
    }

    if (_items.isEmpty) {
      setState(() => _errorMessage =
          'Đơn mua cần có ít nhất 1 mặt hàng dược phẩm.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final newOrder = await widget.orderService.createPurchaseOrder(
        supplierId: _selectedSupplier!.id,
        expectedDeliveryDate: _expectedDeliveryDate,
        notes: _orderNotesController.text.trim().isNotEmpty
            ? _orderNotesController.text.trim()
            : null,
        items: _items,
      );

      if (mounted) {
        Navigator.pop(context);
        widget.onCreated(newOrder);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: _isLoadingSuppliers
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              ),
            )
          : SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Lập Đơn Đặt Mua Hàng',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEBEE),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                            color: AppColors.coral,
                            fontWeight: FontWeight.w600,
                            fontSize: 13),
                      ),
                    ),
                  // Supplier selection
                  DropdownButtonFormField<SupplierModel>(
                    isExpanded: true,
                    initialValue: _selectedSupplier,
                    decoration: const InputDecoration(
                      labelText: 'Nhà cung cấp dược phẩm *',
                      prefixIcon: Icon(Icons.local_shipping_outlined),
                    ),
                    items: _suppliers
                        .map((s) => DropdownMenuItem(
                              value: s,
                              child: Text(
                                s.supplierName,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedSupplier = val),
                  ),
                  const SizedBox(height: 14),
                  // Order notes
                  TextField(
                    controller: _orderNotesController,
                    decoration: const InputDecoration(
                      labelText: 'Ghi chú đơn đặt hàng',
                      hintText: 'Nhập ghi chú cho đơn đặt hàng (tối đa 500 ký tự)',
                      prefixIcon: Icon(Icons.notes_outlined),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Divider(),
                  const SizedBox(height: 8),
                  const Text('Thêm dược phẩm vào đơn:',
                      style:
                          TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 12),
                  // Drug dropdown
                  DropdownButtonFormField<DrugModel>(
                    isExpanded: true,
                    initialValue: _selectedDrug,
                    decoration: const InputDecoration(
                      labelText: 'Chọn thuốc *',
                      prefixIcon: Icon(Icons.medication_outlined),
                    ),
                    items: _availableDrugs
                        .map((d) => DropdownMenuItem(
                              value: d,
                              child: Text('${d.name} (${d.unit})',
                                  overflow: TextOverflow.ellipsis),
                            ))
                        .toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedDrug = val;
                        if (val != null && val.price > 0) {
                          _priceController.text = val.price.toInt().toString();
                        }
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _qtyController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Số lượng đặt *',
                            prefixIcon: Icon(Icons.numbers),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _priceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Đơn giá dự kiến (VNĐ) *',
                            prefixIcon: Icon(Icons.attach_money),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _addItem,
                    icon: const Icon(Icons.add_shopping_cart),
                    label: const Text('Thêm mặt hàng này vào đơn'),
                  ),
                  const SizedBox(height: 16),
                  // Added items list
                  if (_items.isNotEmpty) ...[
                    const Text('Các mặt hàng đã chọn:',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                    const SizedBox(height: 8),
                    ..._items.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final item = entry.value;
                      final name = _drugNames[item.drugId] ?? item.drugId;
                      final sub = item.quantity * item.estimatedUnitPrice;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: ListTile(
                          dense: true,
                          title: Text(name,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                              '${item.quantity} x ${money(item.estimatedUnitPrice.toInt())} = ${money(sub.toInt())}'),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: AppColors.coral),
                            onPressed: () => _removeItem(idx),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tổng chi phí dự kiến:',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w800)),
                        Text(
                          money(_totalEstimatedAmount.toInt()),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.forest),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: _isSubmitting || _items.isEmpty
                        ? null
                        : _submitOrder,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.send_outlined),
                    label: Text(
                      _isSubmitting
                          ? 'Đang gửi đơn duyệt...'
                          : 'Gửi đơn đặt hàng',
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
