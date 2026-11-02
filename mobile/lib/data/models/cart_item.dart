import 'drug_model.dart';

class CartItem {
  CartItem({
    required this.drug,
    this.batch,
    this.quantity = 1,
  });

  final DrugModel drug;
  DrugBatchModel? batch;
  int quantity;

  double get subtotal => drug.price * quantity;
}

