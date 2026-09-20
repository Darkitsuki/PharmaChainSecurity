using PharmaSecure.Domain.Enums;

namespace PharmaSecure.Domain.Entities;

public sealed class Role : EntityBase<string>
{
    private readonly List<User> users = [];

    private Role()
    {
    }

    public Role(UserRole code, string name, string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        Code = code;
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Role name is required.", nameof(name)) : name;
    }

    public UserRole Code { get; private set; }

    public string Name { get; private set; } = null!;

    public IReadOnlyCollection<User> Users => users;
}