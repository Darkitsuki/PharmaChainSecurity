namespace PharmaSecure.Domain.Enums;

/// <summary>
/// Canonical RBAC operational roles for PharmaSecure (Rule 04 baseline).
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Pharmacy Owner / Branch Owner - manages branch operations, staff, expenses, and oversight.
    /// </summary>
    OWNER = 1,

    /// <summary>
    /// Sales Staff - handles customer dispensing, sales orders, invoices, and checkout.
    /// </summary>
    SALES = 2,

    /// <summary>
    /// Warehouse Staff - handles inventory receiving, stock counting, and inbound/outbound logging.
    /// </summary>
    WAREHOUSE = 3
}
