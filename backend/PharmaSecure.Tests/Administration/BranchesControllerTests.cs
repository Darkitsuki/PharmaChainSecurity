using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmaSecure.Application.Features.Branches;
using PharmaSecure.WebApi.Controllers;
using Xunit;

namespace PharmaSecure.Tests.Administration;

public class BranchesControllerTests
{
    private readonly Mock<IBranchService> branchServiceMock = new();

    private BranchesController CreateController()
    {
        var controller = new BranchesController(branchServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task GetAll_WhenCalled_ReturnsOkWithBranchList()
    {
        // Arrange
        var branches = new List<BranchResponse>
        {
            new("br-01", "Chi nhánh 1", "123 Lê Lợi", 5, 120),
            new("br-02", "Chi nhánh 2", "456 Nguyễn Huệ", 3, 45)
        };
        branchServiceMock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(branches);

        var controller = CreateController();

        // Act
        var result = await controller.GetAllAsync();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedBranches = Assert.IsAssignableFrom<IReadOnlyList<BranchResponse>>(okResult.Value);
        Assert.Equal(2, returnedBranches.Count);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOkWithBranch()
    {
        // Arrange
        var branch = new BranchResponse("br-01", "Chi nhánh 1", "123 Lê Lợi", 5, 120);
        branchServiceMock.Setup(s => s.GetByIdAsync("br-01", It.IsAny<CancellationToken>()))
            .ReturnsAsync(branch);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("br-01");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<BranchResponse>(okResult.Value);
        Assert.Equal("br-01", returned.Id);
        Assert.Equal("Chi nhánh 1", returned.BranchName);
    }

    [Fact]
    public async Task GetById_WhenNotExists_ReturnsNotFound()
    {
        // Arrange
        branchServiceMock.Setup(s => s.GetByIdAsync("br-999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((BranchResponse?)null);

        var controller = CreateController();

        // Act
        var result = await controller.GetByIdAsync("br-999");

        // Assert
        var notFound = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public async Task Create_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateBranchRequest("br-03", "Chi nhánh 3", "789 Trần Hưng Đạo");
        var created = new BranchResponse("br-03", "Chi nhánh 3", "789 Trần Hưng Đạo", 0, 0);

        branchServiceMock.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(StatusCodes.Status201Created, createdResult.StatusCode);
        var returned = Assert.IsType<BranchResponse>(createdResult.Value);
        Assert.Equal("br-03", returned.Id);
    }

    [Fact]
    public async Task Create_WithExistingId_ReturnsConflict()
    {
        // Arrange
        var request = new CreateBranchRequest("br-01", "Chi nhánh 1 trùng", "123 Lê Lợi");
        branchServiceMock.Setup(s => s.CreateAsync(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Chi nhánh đã tồn tại."));

        var controller = CreateController();

        // Act
        var result = await controller.CreateAsync(request);

        // Assert
        var conflictResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, conflictResult.StatusCode);
    }

    [Fact]
    public async Task Update_WithValidRequest_ReturnsOkWithUpdatedBranch()
    {
        // Arrange
        var request = new UpdateBranchRequest("Chi nhánh 1 Mới", "999 Lê Lợi");
        var updated = new BranchResponse("br-01", "Chi nhánh 1 Mới", "999 Lê Lợi", 5, 120);

        branchServiceMock.Setup(s => s.UpdateAsync("br-01", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var controller = CreateController();

        // Act
        var result = await controller.UpdateAsync("br-01", request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<BranchResponse>(okResult.Value);
        Assert.Equal("Chi nhánh 1 Mới", returned.BranchName);
    }
}
