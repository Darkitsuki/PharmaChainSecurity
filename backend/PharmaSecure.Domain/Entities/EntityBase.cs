namespace PharmaSecure.Domain.Entities;

/// <summary>
/// Base class for all domain entities providing immutable identity and equality semantics.
/// </summary>
/// <typeparam name="TId">The type of the primary key identifier.</typeparam>
public abstract class EntityBase<TId> where TId : notnull
{
    public TId Id { get; protected set; } = default!;

    public DateTime CreatedAtUtc { get; protected set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; protected set; }

    public override bool Equals(object? obj)
    {
        if (obj is not EntityBase<TId> other)
            return false;

        if (ReferenceEquals(this, other))
            return true;

        if (GetType() != other.GetType())
            return false;

        return EqualityComparer<TId>.Default.Equals(Id, other.Id);
    }

    public override int GetHashCode()
    {
        return EqualityComparer<TId>.Default.GetHashCode(Id);
    }

    public static bool operator ==(EntityBase<TId>? left, EntityBase<TId>? right)
    {
        if (left is null && right is null) return true;
        if (left is null || right is null) return false;
        return left.Equals(right);
    }

    public static bool operator !=(EntityBase<TId>? left, EntityBase<TId>? right)
    {
        return !(left == right);
    }
}
