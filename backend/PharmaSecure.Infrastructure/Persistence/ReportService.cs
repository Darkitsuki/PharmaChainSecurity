using System.Data;
using Oracle.ManagedDataAccess.Client;
using PharmaSecure.Application.Features.Reports;
using PharmaSecure.Application.Interfaces;

namespace PharmaSecure.Infrastructure.Persistence;

public sealed class ReportService : IReportService
{
    private readonly IUnitOfWork unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
    }

    public async Task<SalesSummaryReportResponse> GetSalesSummaryAsync(
        string branchId,
        int days = 7,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(branchId))
            throw new ArgumentException("Branch ID is required.", nameof(branchId));

        if (days <= 0 || days > 365)
            days = 7;

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var intervalStart = now.Date.AddDays(-days);

        await unitOfWork.BeginTransactionAsync(branchId, cancellationToken);
        try
        {
            decimal totalRevenue = 0;
            int totalInvoices = 0;
            decimal todayRevenue = 0;
            int todayInvoices = 0;
            decimal monthRevenue = 0;
            int monthInvoices = 0;

            // 1. Tổng doanh số toàn thời gian của chi nhánh
            await using (var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                cmd.BindByName = true;
                cmd.CommandText = "SELECT NVL(SUM(TotalAmount), 0), COUNT(*) FROM INVOICES WHERE BranchId = :branchId";
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    totalRevenue = reader.GetDecimal(0);
                    totalInvoices = Convert.ToInt32(reader.GetValue(1));
                }
            }

            // 2. Doanh số hôm nay
            await using (var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                cmd.BindByName = true;
                cmd.CommandText = "SELECT NVL(SUM(TotalAmount), 0), COUNT(*) FROM INVOICES WHERE BranchId = :branchId AND CreatedDate >= :todayStart";
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                cmd.Parameters.Add("todayStart", OracleDbType.TimeStamp).Value = todayStart;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    todayRevenue = reader.GetDecimal(0);
                    todayInvoices = Convert.ToInt32(reader.GetValue(1));
                }
            }

            // 3. Doanh số tháng này
            await using (var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                cmd.BindByName = true;
                cmd.CommandText = "SELECT NVL(SUM(TotalAmount), 0), COUNT(*) FROM INVOICES WHERE BranchId = :branchId AND CreatedDate >= :monthStart";
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                cmd.Parameters.Add("monthStart", OracleDbType.TimeStamp).Value = monthStart;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    monthRevenue = reader.GetDecimal(0);
                    monthInvoices = Convert.ToInt32(reader.GetValue(1));
                }
            }

            // 4. Top 5 thuốc bán chạy nhất
            var topSellingDrugs = new List<TopDrugReportItem>();
            await using (var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                cmd.BindByName = true;
                cmd.CommandText = """
                    SELECT item.DrugId, d.DrugCode, d.Name, NVL(SUM(item.Quantity), 0), NVL(SUM(item.SubTotal), 0)
                    FROM INVOICE_ITEMS item
                    JOIN INVOICES inv ON item.InvoiceId = inv.id
                    JOIN DRUGS d ON item.DrugId = d.id
                    WHERE inv.BranchId = :branchId
                    GROUP BY item.DrugId, d.DrugCode, d.Name
                    ORDER BY SUM(item.Quantity) DESC
                    FETCH FIRST 5 ROWS ONLY
                    """;
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    topSellingDrugs.Add(new TopDrugReportItem(
                        reader.GetString(0),
                        reader.GetString(1),
                        reader.GetString(2),
                        Convert.ToInt32(reader.GetValue(3)),
                        reader.GetDecimal(4)));
                }
            }

            // 5. Thống kê theo ngày
            var dailySales = new List<DailySalesItem>();
            await using (var cmd = (OracleCommand)unitOfWork.Connection.CreateCommand())
            {
                cmd.Transaction = (OracleTransaction)unitOfWork.Transaction!;
                cmd.BindByName = true;
                cmd.CommandText = """
                    SELECT TO_CHAR(CreatedDate, 'YYYY-MM-DD'), NVL(SUM(TotalAmount), 0), COUNT(*)
                    FROM INVOICES
                    WHERE BranchId = :branchId AND CreatedDate >= :intervalStart
                    GROUP BY TO_CHAR(CreatedDate, 'YYYY-MM-DD')
                    ORDER BY TO_CHAR(CreatedDate, 'YYYY-MM-DD') ASC
                    """;
                cmd.Parameters.Add("branchId", OracleDbType.Varchar2, 50).Value = branchId;
                cmd.Parameters.Add("intervalStart", OracleDbType.TimeStamp).Value = intervalStart;

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    dailySales.Add(new DailySalesItem(
                        reader.GetString(0),
                        reader.GetDecimal(1),
                        Convert.ToInt32(reader.GetValue(2))));
                }
            }

            await unitOfWork.CommitAsync(cancellationToken);

            return new SalesSummaryReportResponse(
                totalRevenue,
                totalInvoices,
                todayRevenue,
                todayInvoices,
                monthRevenue,
                monthInvoices,
                topSellingDrugs,
                dailySales);
        }
        catch
        {
            await unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
