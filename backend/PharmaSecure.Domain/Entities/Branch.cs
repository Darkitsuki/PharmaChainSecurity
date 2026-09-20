namespace PharmaSecure.Domain.Entities;

public sealed class Branch : EntityBase<string>
{
    private readonly List<User> users = [];
    private readonly List<Inventory> inventories = [];
    private readonly List<Invoice> invoices = [];

    private Branch()
    {
    }

    public Branch(string name, string? address = null, string? id = null)
    {
        Id = id ?? Guid.NewGuid().ToString("D");
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Branch name is required.", nameof(name)) : name;
        Address = address;
    }

    public string Name { get; private set; } = null!;

    public string? Address { get; private set; }

    public IReadOnlyCollection<User> Users => users;

    public IReadOnlyCollection<Inventory> Inventories => inventories;

    public IReadOnlyCollection<Invoice> Invoices => invoices;
}