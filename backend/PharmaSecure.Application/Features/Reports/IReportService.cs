namespace PharmaSecure.Application.Features.Reports;

public interface IReportService
{
    Task<SalesSummaryReportResponse> GetSalesSummaryAsync(string branchId, int days = 7, CancellationToken cancellationToken = default);
}
