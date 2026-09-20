namespace PharmaSecure.Domain.Entities;

public sealed class User : EntityBase<string>
{
    private readonly List<Invoice> invoices = [];

    private User()
    {
    }

    public User(
        string username,
        string passwordHash,
        string roleId,
        string branchId,
        string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        Username = string.IsNullOrWhiteSpace(username) ? throw new ArgumentException("Username is required.", nameof(username)) : username;
        PasswordHash = string.IsNullOrWhiteSpace(passwordHash) ? throw new ArgumentException("Password hash is required.", nameof(passwordHash)) : passwordHash;
        RoleId = string.IsNullOrWhiteSpace(roleId) ? throw new ArgumentException("Role ID is required.", nameof(roleId)) : roleId;
        BranchId = string.IsNullOrWhiteSpace(branchId) ? throw new ArgumentException("Branch ID is required.", nameof(branchId)) : branchId;
        IsActive = true;
    }

    public string Username { get; private set; } = null!;

    public string PasswordHash { get; private set; } = null!;

    public string RoleId { get; private set; } = null!;

    public string BranchId { get; private set; } = null!;

    public bool IsActive { get; private set; }

    public Role Role { get; private set; } = null!;

    public Branch Branch { get; private set; } = null!;

    public IReadOnlyCollection<Invoice> Invoices => invoices;
}