using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PharmaSecure.Application.Features.Reports;
using PharmaSecure.Application.Interfaces;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Administration;

public class ReportsControllerTests
{
    private readonly Mock<IReportService> reportServiceMock = new();
    private readonly Mock<ICurrentUserContext> userContextMock = new();
    private readonly Mock<ILogger<ReportsController>> loggerMock = new();

    private const string CurrentBranchId = "br-00000000-0000-0000-0000-000000000001";

    private ReportsController CreateController()
    {
        userContextMock.Setup(u => u.BranchId).Returns(CurrentBranchId);

        var controller = new ReportsController(
            reportServiceMock.Object,
            userContextMock.Object,
            loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    [Fact]
    public async Task GetSalesSummary_WhenValidDays_ReturnsOkWithReport()
    {
        // Arrange
        var topDrugs = new List<TopDrugReportItem>
        {
            new("dr-1", "PARA500", "Paracetamol 500mg", 120, 240000m),
            new("dr-2", "AMOX500", "Amoxicillin 500mg", 45, 225000m)
        };

        var dailySales = new List<DailySalesItem>
        {
            new("2026-10-04", 465000m, 5),
            new("2026-10-03", 310000m, 4)
        };

        var report = new SalesSummaryReportResponse(
            TotalRevenue: 15500000m,
            TotalInvoices: 142,
            TodayRevenue: 465000m,
            TodayInvoices: 5,
            MonthRevenue: 8500000m,
            MonthInvoices: 82,
            TopSellingDrugs: topDrugs,
            DailySales: dailySales);

        reportServiceMock.Setup(s => s.GetSalesSummaryAsync(CurrentBranchId, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);

        var controller = CreateController();

        // Act
        var result = await controller.GetSalesSummary(7, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<SalesSummaryReportResponse>(okResult.Value);
        Assert.Equal(15500000m, returned.TotalRevenue);
        Assert.Equal(465000m, returned.TodayRevenue);
        Assert.Equal(2, returned.TopSellingDrugs.Count);
        Assert.Equal(2, returned.DailySales.Count);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(366)]
    public async Task GetSalesSummary_WhenInvalidDays_ReturnsBadRequest(int days)
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.GetSalesSummary(days, CancellationToken.None);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(badRequestResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
        Assert.Equal("Invalid days parameter", problem.Title);
    }
}
