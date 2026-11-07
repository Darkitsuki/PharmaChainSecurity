using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Procurement;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Procurement;

public class SuppliersControllerTests
{
    private readonly Mock<ISupplierService> supplierServiceMock = new();

    private SuppliersController CreateController()
    {
        var controller = new SuppliersController(supplierServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task GetAllAsync_WhenCalled_ReturnsOkWithSupplierList()
    {
        // Arrange
        var suppliers = new List<SupplierResponse>
        {
            new("sup-1", "DHG", "Duoc Hau Giang", "Nguyen Van A", "0901234567", "dhg@test.vn", "Can Tho", "1800156801", true, DateTime.UtcNow),
            new("sup-2", "TRA", "Traphaco", "Tran Thi B", "0907654321", "tra@test.vn", "Ha Noi", "0100108656", true, DateTime.UtcNow)
        };
        supplierServiceMock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(suppliers);

        var controller = CreateController();

        // Act
        var result = await controller.GetAllAsync();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<SupplierResponse>>(okResult.Value);
        Assert.Equal(2, returned.Count);
    }

    [Fact]
    public async Task GetByIdAsync_WhenExists_ReturnsOkWithSupplier()
    {
        // Arrange
        var supplier = new SupplierResponse("sup-1", "DHG", "Duoc Hau Giang", "Nguyen Van A", "0901234567", null, null, null, true, DateTime.UtcNow);
        supplierServiceMock.Setup(s => s.GetByIdAsync("sup-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("sup-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<SupplierResponse>(okResult.Value);
        Assert.Equal("DHG", returned.SupplierCode);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNotFoundProblem()
    {
        // Arrange
        supplierServiceMock.Setup(s => s.GetByIdAsync("non-existent", It.IsAny<CancellationToken>()))
            .ReturnsAsync((SupplierResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("non-existent");

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status404NotFound, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenValid_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateSupplierRequest("DHG", "Duoc Hau Giang", "Nguyen Van A", "0901234567", null, null, null);
        var created = new SupplierResponse("sup-new", "DHG", "Duoc Hau Giang", "Nguyen Van A", "0901234567", null, null, null, true, DateTime.UtcNow);
        supplierServiceMock.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<SupplierResponse>(createdAtResult.Value);
        Assert.Equal("sup-new", returned.Id);
        await MvcResultTestHelper.ExecuteCreatedResultAsync(
            controller, createdAtResult, "Create", "/api/v1/suppliers", "https://localhost/api/v1/suppliers/sup-new");
    }

    [Fact]
    public async Task CreateAsync_WhenDuplicateCode_ReturnsConflictProblem()
    {
        // Arrange
        var request = new CreateSupplierRequest("DHG", "Duoc Hau Giang", null, null, null, null, null);
        supplierServiceMock.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Mã nhà cung cấp đã tồn tại"));

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, details.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenMissingName_ReturnsBadRequestProblem()
    {
        // Arrange
        var request = new CreateSupplierRequest("DHG", "", null, null, null, null, null);
        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var problemResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ProblemDetails>(problemResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_ReturnsUpdatedSupplier()
    {
        var request = new UpdateSupplierRequest("Dược Hậu Giang", "Nguyễn Văn A", "0901234567", "dhg@test.vn", "Cần Thơ", "1800156801");
        var updated = new SupplierResponse("sup-1", "DHG", request.SupplierName, request.ContactPerson, request.PhoneNumber, request.Email, request.Address, request.TaxCode, true, DateTime.UtcNow);
        supplierServiceMock.Setup(service => service.UpdateAsync("sup-1", request, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateController().UpdateAsync("sup-1", request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal("Dược Hậu Giang", Assert.IsType<SupplierResponse>(ok.Value).SupplierName);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenValid_ReturnsUpdatedStatus()
    {
        var request = new UpdateSupplierStatusRequest(false);
        var updated = new SupplierResponse("sup-1", "DHG", "Dược Hậu Giang", null, null, null, null, null, false, DateTime.UtcNow);
        supplierServiceMock.Setup(service => service.UpdateStatusAsync("sup-1", false, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateController().UpdateStatusAsync("sup-1", request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.False(Assert.IsType<SupplierResponse>(ok.Value).IsActive);
    }

    [Theory]
    [InlineData(nameof(SuppliersController.UpdateAsync))]
    [InlineData(nameof(SuppliersController.UpdateStatusAsync))]
    public void SupplierWriteActions_RequireOwnerRole(string actionName)
    {
        var method = typeof(SuppliersController).GetMethod(actionName)!;
        var authorize = Assert.Single(method.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>());
        Assert.Equal("OWNER", authorize.Roles);
    }
}
