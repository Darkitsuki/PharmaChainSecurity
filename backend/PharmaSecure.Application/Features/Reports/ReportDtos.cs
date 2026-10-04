namespace PharmaSecure.Application.Features.Reports;

public sealed record TopDrugReportItem(
    string DrugId,
    string DrugCode,
    string DrugName,
    int TotalQuantitySold,
    decimal TotalRevenue);

public sealed record DailySalesItem(
    string Date,
    decimal Revenue,
    int InvoiceCount);

public sealed record SalesSummaryReportResponse(
    decimal TotalRevenue,
    int TotalInvoices,
    decimal TodayRevenue,
    int TodayInvoices,
    decimal MonthRevenue,
    int MonthInvoices,
    IReadOnlyList<TopDrugReportItem> TopSellingDrugs,
    IReadOnlyList<DailySalesItem> DailySales);
