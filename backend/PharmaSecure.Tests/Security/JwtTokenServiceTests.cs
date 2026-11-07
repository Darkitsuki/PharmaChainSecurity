using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Options;
using PharmaSecure.Domain.Enums;
using PharmaSecure.Infrastructure.Security;
using Xunit;

namespace PharmaSecure.Tests.Security;

public sealed class JwtTokenServiceTests
{
    private static JwtTokenService CreateService() => new(Options.Create(new JwtOptions
    {
        SecretKey = new string('s', 40),
        Issuer = "PharmaSecureTests",
        Audience = "PharmaSecureTests",
        ExpiryMinutes = 60
    }));

    [Fact]
    public void GenerateToken_ForOwner_KeepsHomeBranchAndUsesSelectedActiveBranch()
    {
        var result = CreateService().GenerateTokenWithJti(
            "owner-1", "owner", UserRole.OWNER, "branch-b", "password-hash", "branch-a");

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);

        Assert.Equal("branch-a", token.Claims.Single(claim => claim.Type == "HomeBranchId").Value);
        Assert.Equal("branch-b", token.Claims.Single(claim => claim.Type == "BranchId").Value);
        Assert.Equal(result.Jti, token.Claims.Single(claim => claim.Type == JwtRegisteredClaimNames.Jti).Value);
    }

    [Fact]
    public void GenerateToken_WithoutExplicitHomeBranch_UsesActiveBranchForBothClaims()
    {
        var result = CreateService().GenerateTokenWithJti(
            "sales-1", "sales", UserRole.SALES, "branch-a", "password-hash");

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);

        Assert.Equal("branch-a", token.Claims.Single(claim => claim.Type == "HomeBranchId").Value);
        Assert.Equal("branch-a", token.Claims.Single(claim => claim.Type == "BranchId").Value);
    }
}
