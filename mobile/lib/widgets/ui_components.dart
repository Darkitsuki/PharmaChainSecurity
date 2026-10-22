import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class Panel extends StatelessWidget {
  const Panel(
      {super.key,
      required this.child,
      this.padding = const EdgeInsets.all(18)});
  final Widget child;
  final EdgeInsetsGeometry padding;
  @override
  Widget build(BuildContext context) => Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.line)),
      child: child);
}

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.label, {super.key, this.warning = false});
  final String label;
  final bool warning;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
          color: warning ? const Color(0xFFFFF1E8) : AppColors.mint,
          borderRadius: BorderRadius.circular(8)),
      child: Text(label,
          style: TextStyle(
              color: warning ? const Color(0xFF9C482B) : AppColors.forest,
              fontWeight: FontWeight.w700,
              fontSize: 11)));
}

class PreviewNotice extends StatelessWidget {
  const PreviewNotice({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
      padding: EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Row(children: [
        Icon(Icons.science_outlined, size: 17, color: AppColors.coral),
        SizedBox(width: 8),
        Expanded(
            child: Text('NGHIỆP VỤ MẪU · Chỉ xác thực đã kết nối API; dữ liệu bên dưới là minh họa',
                style: TextStyle(fontSize: 11, color: AppColors.muted)))
      ]));
}

class PageHeading extends StatelessWidget {
  const PageHeading(this.title, this.subtitle, {super.key, this.action});
  final String title, subtitle;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(subtitle,
            style: const TextStyle(color: AppColors.muted, height: 1.5)),
        if (action != null) ...[const SizedBox(height: 14), action!]
      ]));
}

class StatCard extends StatelessWidget {
  const StatCard(this.label, this.value, this.icon,
      {super.key, this.caption = 'Dữ liệu minh họa'});
  final String label, value, caption;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Panel(
      padding: const EdgeInsets.all(15),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: AppColors.forest, size: 22),
        const SizedBox(height: 12),
        Text(label,
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 6),
        Text(value,
            style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(caption,
            style: const TextStyle(color: AppColors.muted, fontSize: 10))
      ]));
}

class StatsGrid extends StatelessWidget {
  const StatsGrid({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) =>
      LayoutBuilder(builder: (context, constraints) {
        final columns = constraints.maxWidth >= 850 ? 4 : 2;
        final width = (constraints.maxWidth - (columns - 1) * 12) / columns;
        return Wrap(
            spacing: 12,
            runSpacing: 12,
            children: children
                .map((child) => SizedBox(width: width, child: child))
                .toList());
      });
}

class SearchBox extends StatelessWidget {
  const SearchBox({super.key, required this.hint, required this.onChanged});
  final String hint;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) => TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
          hintText: hint, prefixIcon: const Icon(Icons.search)));
}

class EmptyResults extends StatelessWidget {
  const EmptyResults({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
      padding: EdgeInsets.symmetric(vertical: 36),
      child: Column(children: [
        Icon(Icons.search_off, size: 36, color: AppColors.muted),
        SizedBox(height: 12),
        Text('Không tìm thấy dữ liệu phù hợp.')
      ]));
}

void showPreviewForm(BuildContext context, String title, List<String> fields) {
  showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
              20, 24, 20, 24 + MediaQuery.viewInsetsOf(sheetContext).bottom),
          child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                const Text(
                    'Biểu mẫu xem trước. Chưa lưu dữ liệu hoặc thực hiện nghiệp vụ.',
                    style: TextStyle(color: AppColors.muted)),
                const SizedBox(height: 20),
                for (final field in fields)
                  Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: TextField(
                          decoration: InputDecoration(labelText: field))),
                const FilledButton(
                    onPressed: null, child: Text('Lưu · Chưa kết nối')),
                const SizedBox(height: 8),
                TextButton(
                    onPressed: () => Navigator.pop(sheetContext),
                    child: const Text('Đóng bản xem trước'))
              ])));
}

void showRecordDetails(
    BuildContext context, String title, List<String> details) {
  showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      builder: (sheetContext) => SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                const StatusBadge('Dữ liệu minh họa'),
                for (final detail in details)
                  Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(detail, style: const TextStyle(height: 1.5))),
                const SizedBox(height: 24),
                OutlinedButton(
                    onPressed: () => Navigator.pop(sheetContext),
                    child: const Text('Đóng'))
              ])));
}
