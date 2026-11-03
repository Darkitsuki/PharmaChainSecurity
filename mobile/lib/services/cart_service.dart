import 'package:flutter/foundation.dart';
import '../data/models/cart_item.dart';
import '../data/models/drug_model.dart';

class CartService extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get totalQuantity => _items.fold(0, (sum, i) => sum + i.quantity);

  double get totalPrice => _items.fold(0.0, (sum, i) => sum + i.subtotal);

  bool get isEmpty => _items.isEmpty;

  bool get hasPrescriptionItems => _items.any((i) => i.drug.prescriptionRequired);

  void addItem(DrugModel drug, {DrugBatchModel? batch, int quantity = 1}) {
    final existingIndex = _items.indexWhere((i) => i.drug.drugId == drug.drugId);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
      if (batch != null) {
        _items[existingIndex].batch = batch;
      }
    } else {
      _items.add(CartItem(
        drug: drug,
        batch: batch,
        quantity: quantity,
      ));
    }
    notifyListeners();
  }

  void updateQuantity(CartItem item, int quantity) {
    final index = _items.indexOf(item);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void removeItem(CartItem item) {
    if (_items.remove(item)) {
      notifyListeners();
    }
  }

  void clear() {
    if (_items.isNotEmpty) {
      _items.clear();
      notifyListeners();
    }
  }
}

