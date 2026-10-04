using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Security;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Catalog;

public class DrugsControllerTests
{
    private readonly Mock<IDrugQueryService> drugQueryServiceMock = new();

    private DrugsController CreateController(string? branchId = "branch-01", string role = "OWNER")
    {
        var controller = new DrugsController(drugQueryServiceMock.Object);
        var claims = new List<Claim>();
        if (!string.IsNullOrWhiteSpace(branchId))
            claims.Add(new Claim("BranchId", branchId));
        if (!string.IsNullOrWhiteSpace(role))
            claims.Add(new Claim(ClaimTypes.Role, role));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    [Fact]
    public async Task CreateAsync_WhenValid_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateDrugRequest("THUOC005", "Berberin 100mg", "Berberin", "Lọ", 20000m);
        var created = new DrugResponse("dr-005", "THUOC005", "Berberin 100mg", "Berberin", "Lọ", 20000m, true);
        drugQueryServiceMock.Setup(s => s.CreateDrugAsync("branch-01", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<DrugResponse>(createdAtResult.Value);
        Assert.Equal("dr-005", returned.DrugId);
        Assert.Equal("THUOC005", returned.DrugCode);
    }

    [Fact]
    public async Task CreateAsync_WhenDuplicateCode_ReturnsConflictProblem()
    {
        // Arrange
        var request = new CreateDrugRequest("THUOC001", "Paracetamol 500mg", null, "Hộp", 35000m);
        drugQueryServiceMock.Setup(s => s.CreateDrugAsync("branch-01", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Thuốc có mã 'THUOC001' đã tồn tại trong hệ thống."));

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenMissingDrugCodeOrName_ReturnsBadRequestProblem()
    {
        // Arrange
        var request = new CreateDrugRequest("", "Paracetamol", null, "Hộp", 35000m);
        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenNegativePrice_ReturnsBadRequestProblem()
    {
        // Arrange
        var request = new CreateDrugRequest("THUOC999", "Thuoc test", null, "Hộp", -1000m);
        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_ReturnsOkWithUpdatedDrug()
    {
        // Arrange
        var request = new UpdateDrugRequest("Paracetamol 500mg Extra", "Paracetamol", "Hộp", 40000m, true);
        var updated = new DrugResponse("dr-001", "THUOC001", "Paracetamol 500mg Extra", "Paracetamol", "Hộp", 40000m, true);
        drugQueryServiceMock.Setup(s => s.UpdateDrugAsync("branch-01", "dr-001", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateAsync("dr-001", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<DrugResponse>(okResult.Value);
        Assert.Equal(40000m, returned.Price);
        Assert.Equal("Paracetamol 500mg Extra", returned.Name);
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsNotFoundProblem()
    {
        // Arrange
        var request = new UpdateDrugRequest("Thuoc khong ton tai", null, "Hộp", 50000m, true);
        drugQueryServiceMock.Setup(s => s.UpdateDrugAsync("branch-01", "dr-not-found", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DrugResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateAsync("dr-not-found", request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, details.Status);
    }

    [Fact]
    public async Task DeactivateAsync_WhenExists_ReturnsNoContent()
    {
        // Arrange
        drugQueryServiceMock.Setup(s => s.DeactivateDrugAsync("branch-01", "dr-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var controller = CreateController();

        // Act
        var result = await controller.DeactivateAsync("dr-001");

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeactivateAsync_WhenNotFound_ReturnsNotFoundProblem()
    {
        // Arrange
        drugQueryServiceMock.Setup(s => s.DeactivateDrugAsync("branch-01", "dr-not-found", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var controller = CreateController();

        // Act
        var result = await controller.DeactivateAsync("dr-not-found");

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, details.Status);
    }
}
